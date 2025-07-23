'use client'
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
    nodesAtom,
    tripsAtom, // 상세 경로가 병합된 trips 데이터 아톰
    selectedObjectAtom,
    mapViewStateAtom,
    epcDupTargetAtom,
    // flyToLocationAtom,
    type MapViewState
} from '@/stores/mapDataAtoms';

import { tutorialSeenAtom } from '@/stores/uiAtoms';

// Deck.gl 및 기타 라이브러리 import
import type { Color } from 'deck.gl';
import DeckGL, { FlyToInterpolator } from 'deck.gl';
import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { WebMercatorViewport } from '@deck.gl/core';
import { OBJLoader } from '@loaders.gl/obj';
import { parseSync } from '@loaders.gl/core';
import { default as ReactMapGL, Marker, ViewState, } from 'react-map-gl';
import type { PickingInfo } from '@deck.gl/core';

import { type LocationNode, type AnalyzedTrip } from './data';
import { cubeModel, factoryBuildingModel } from './models';

import TutorialOverlay from './TutorialOverlay';
import TimeSlider from './TimeSlider';
import MapLegend from './MapLegend';

import { getNodeColor, getAnomalyColor, getAnomalyName } from '../visual/colorUtils';
import { NodeIcon, getIconAltitude } from '../visual/icons';
import { toast } from 'sonner';
import { MergeTrip } from './SupplyChainDashboard';

// Mapbox 액세스 토큰
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// 초기 지도 뷰 상태 (지도 시작 위치 및 시야 각도)
const INITIAL_VIEW_STATE = {
    longitude: 127.9,
    latitude: 36.5,
    zoom: 7,
    pitch: 60,
    bearing: 0,
};

// 애니메이션 설정
const ANIMATION_SPEED = 0.2; // 속도 조절

// 3D 모델 파싱 (DeckGL에서 사용할 수 있도록 준비)
const parsedCubeModel = parseSync(cubeModel, OBJLoader);
const parsedFactoryBuildingModel = parseSync(factoryBuildingModel, OBJLoader);

// 공장이 아닌 노드 타입에 매핑할 모델
const OTHER_MODEL_MAPPING: Record<string, any> = {
    WMS: parsedCubeModel,
    LogiHub: parsedCubeModel,
    Wholesaler: parsedCubeModel,
    Reseller: parsedCubeModel,
};

// 3D 모델 반짝임 효과용 재질 설정
const material = {
    ambient: 0.9,
    diffuse: 0.6,
    shininess: 128,
    specularColor: [255, 255, 255]
} satisfies {
    ambient: number;
    diffuse: number;
    shininess: number;
    specularColor: [number, number, number];
};

export const SupplyChainMap: React.FC = () => {
    const nodes = useAtomValue(nodesAtom);
    const analyzedTrips = useAtomValue(tripsAtom); // 상세 경로가 포함된 데이터
    // const flyTo = useSetAtom(flyToLocationAtom);
    const [selectedObject, setSelectedObject] = useAtom(selectedObjectAtom);
    const [viewState, setViewState] = useAtom(mapViewStateAtom); // 지도 뷰 상태도 Jotai로 관리
    const setEpcDupTarget = useSetAtom(epcDupTargetAtom);

    const [hasSeenTutorial, setHasSeenTutorial] = useAtom(tutorialSeenAtom);

    // 이 컴포넌트 내에서만 사용하는 로컬 상태는 그대로 유지합니다.
    const [currentTime, setCurrentTime] = useState(0);
    const [hoverInfo, setHoverInfo] = useState<PickingInfo | null>(null);
    const [hoveredType, setHoveredType] = useState<string | null>(null);
    const [visibleTypes, setVisibleTypes] = useState<Record<string, boolean>>({ Factory: true, WMS: true, LogiHub: true, Wholesaler: true, Reseller: true, POS: true });
    const [isPlaying, setIsPlaying] = useState(true);
    const [pulseRadius, setPulseRadius] = useState(0);

    const cameraAnimationRef = useRef<number | null>(null); // 카메라 애니메이션 제어를 위함

    const validTrips = useMemo(() => {
        if (!analyzedTrips) return [];
        return analyzedTrips.filter(trip => trip && trip.from?.coord && trip.to?.coord);
    }, [analyzedTrips]);

    // 전체 시간 범위
    const globalTimeRange = useMemo(() => {
        if (!validTrips || validTrips.length === 0) {
            return { minTime: 0, maxTime: 1 };
        }
        const startTimes = validTrips.map(t => t.from.eventTime);
        const endTimes = validTrips.map(t => t.to.eventTime);
        return { minTime: Math.min(...startTimes), maxTime: Math.max(...endTimes) };
    }, [validTrips]);

    const { minTime: activeMinTime, maxTime: activeMaxTime } = useMemo(() => {
        if (selectedObject && 'from' in selectedObject) {
            // Trip이 선택되었다면, 해당 Trip의 시간을 활성 시간 범위로 사용합니다.
            const trip = selectedObject as MergeTrip;
            return { minTime: trip.from.eventTime, maxTime: trip.to.eventTime };
        }
        // 아무것도 선택되지 않았다면, 전역 시간 범위를 사용합니다.
        return globalTimeRange;
    }, [selectedObject, globalTimeRange]);

    // 선택된 오브젝트의 경로를 따라서 카메라 이동시키는 함수
    const animateCameraAlongTrip = useCallback((trip: MergeTrip, initialViewState: MapViewState) => {
        if (cameraAnimationRef.current) {
            cancelAnimationFrame(cameraAnimationRef.current);
        }

        const { timestamps, path } = trip;
        if (!timestamps || !path || timestamps.length < 2) return;

        // --- 1. 경로 단순화 (Path Simplification) ---
        // 너무 촘촘한 좌표들을 제거하여 부드러운 카메라 경로를 생성합니다.
        const simplifiedPath: [number, number][] = [path[0]];
        const simplifiedTimestamps: number[] = [timestamps[0]];
        const MIN_DISTANCE = 0.1;

        for (let i = 1; i < path.length; i++) {
            const prevPoint = simplifiedPath[simplifiedPath.length - 1];
            const currentPoint = path[i];
            const distance = Math.sqrt(
                Math.pow(currentPoint[0] - prevPoint[0], 2) +
                Math.pow(currentPoint[1] - prevPoint[1], 2)
            );

            // 마지막 점이거나, 이전 점에서 충분히 멀리 떨어져 있을 때만 경로에 추가
            if (i === path.length - 1 || distance > MIN_DISTANCE) {
                simplifiedPath.push(currentPoint);
                simplifiedTimestamps.push(timestamps[i]);
            }
        }

        const startTime = simplifiedTimestamps[0];
        const endTime = simplifiedTimestamps[simplifiedTimestamps.length - 1];
        const duration = endTime - startTime;
        if (duration <= 0) return;

        let previousBearing = initialViewState.bearing;

        const animate = (time: number) => {
            setViewState(currentVs => {
                const progress = Math.min((time - startTime) / duration, 1);
                const currentTimestamp = startTime + duration * progress;

                let segmentIndex = simplifiedTimestamps.findIndex(t => t >= currentTimestamp) - 1;
                if (segmentIndex < 0) segmentIndex = 0;
                if (segmentIndex >= simplifiedPath.length - 1) segmentIndex = simplifiedPath.length - 2;

                const startPoint = simplifiedPath[segmentIndex];
                const endPoint = simplifiedPath[segmentIndex + 1];
                const segmentStartTime = simplifiedTimestamps[segmentIndex];
                const segmentEndTime = simplifiedTimestamps[segmentIndex + 1];
                const segmentDuration = segmentEndTime - segmentStartTime;
                const segmentProgress = segmentDuration > 0 ? (currentTimestamp - segmentStartTime) / segmentDuration : 0;

                const longitude = startPoint[0] * (1 - segmentProgress) + endPoint[0] * segmentProgress;
                const latitude = startPoint[1] * (1 - segmentProgress) + endPoint[1] * segmentProgress;

                // --- 2. 미리 보기(Look-Ahead) 및 부드러운 회전 ---
                let bearing = previousBearing;
                const lookAheadIndex = Math.min(segmentIndex + 2, simplifiedPath.length - 1); // 2단계 앞을 미리 봄
                const lookAheadPoint = simplifiedPath[lookAheadIndex];

                const viewport = new WebMercatorViewport(currentVs);

                if (progress < 1) {
                    cameraAnimationRef.current = requestAnimationFrame(() => animate(currentTimestamp + ANIMATION_SPEED * 5));
                } else {
                    cameraAnimationRef.current = null;
                }

                return {
                    ...currentVs,
                    longitude,
                    latitude,
                    zoom: 10, // 줌을 조금 더 멀리해서 전체 경로를 보기 쉽게
                    pitch: 60, // pitch를 조금 낮춰서 덜 어지럽게
                    bearing,
                    transitionDuration: 50, // 프레임 간 전환을 더 부드럽게
                };
            });
        };
        cameraAnimationRef.current = requestAnimationFrame(() => animate(startTime));

    }, [setViewState, cameraAnimationRef]);


    useEffect(() => {
        if (activeMinTime > 0) {
            setCurrentTime(activeMinTime);
        } else {
            setCurrentTime(0); // 데이터가 없을 때 초기화
        }
    }, [activeMinTime]);

    // 튜토리얼 자동으로 숨김 (5초)
    useEffect(() => {
        // 만약 튜토리얼이 아직 보여지고 있다면 (한 번도 안 봤다면)
        if (!hasSeenTutorial) {
            const timer = setTimeout(() => {
                setHasSeenTutorial(true);
            }, 5000); // 5초

            return () => clearTimeout(timer);
        }
    }, [hasSeenTutorial, setHasSeenTutorial]);

    // 애니메이션 재생 타이머
    useEffect(() => {
        if (!isPlaying || activeMinTime >= activeMaxTime) {
            return;
        }

        let animationFrame: number;

        const animate = () => {
            setCurrentTime(prevTime => {
                const nextTime = prevTime + ANIMATION_SPEED;

                // 다음 시간이 maxTime을 넘어서는지 확인
                if (nextTime >= activeMaxTime) {
                    // maxTime을 넘어서면, 재생을 멈추고 시간을 maxTime으로 고정
                    setIsPlaying(false);
                    return activeMaxTime;
                }

                // 아직 maxTime에 도달하지 않았으면 계속 진행
                return nextTime;
            });
            // isPlaying이 true일 때만 다음 프레임을 요청하도록 조건 추가 (더 안전함)
            animationFrame = requestAnimationFrame(animate);
        };

        // 애니메이션 시작
        animationFrame = requestAnimationFrame(animate);

        // 클린업 함수: 컴포넌트가 언마운트되거나, isPlaying이 false로 바뀌면 애니메이션 중지
        return () => cancelAnimationFrame(animationFrame);

    }, [isPlaying, activeMinTime, activeMaxTime, setIsPlaying]);

    // 이상 노드 pulse 효과
    useEffect(() => {
        let animationFrame: number;
        const animatePulse = () => {
            setPulseRadius(r => (r > 1000 ? 0 : r + 20));
            animationFrame = requestAnimationFrame(animatePulse);
        };
        animationFrame = requestAnimationFrame(animatePulse);
        return () => cancelAnimationFrame(animationFrame);
    }, []);

    const nodeMap = useMemo(() => {
        if (!nodes) {
            return new Map<string, LocationNode>();
        }
        return new Map<string, LocationNode>(nodes.map(n => [n.hubType, n]));
    }, [nodes]);

    // 툴팁 렌더링 함수
    const renderTooltip = ({ object }: PickingInfo) => {
        if (!object) {
            return null;
        }

        // 공통 스타일: 모든 툴팁에 적용될 기본 디자인
        const baseTooltipStyle = {
            position: 'absolute',
            padding: '12px',
            background: 'rgba(40, 40, 40)', // 어두운 배경색
            color: '#f8f8f2', // 밝은 글자색
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(6px)',
            fontFamily: '"Noto Sans KR", sans-serif', // Noto Sans KR 폰트 우선 적용
            fontSize: '14px',
            lineHeight: '1.6',
            maxWidth: '250px',
            pointerEvents: 'none', // 마우스 이벤트가 툴팁에 막히지 않도록 함
            zIndex: '10',
        };

        const isNode = 'coord' in object;

        if (isNode) {
            const node = object as LocationNode;
            return {
                html: `
                    <div style="font-weight: semi-bold; font-size: 16px; margin-bottom: 4px;">${node.scanLocation}</div>
                    <div><span style="color: rgba(111,131,175);">타입:</span> ${node.businessStep}</div>
                `,
                style: baseTooltipStyle
            };
        } else {
            const trip = object as AnalyzedTrip;

            // ✨ 1. 대표 이상 유형 코드를 가져옵니다. (배열의 첫 번째 항목)
            const representativeAnomaly = trip.anomalyTypeList && trip.anomalyTypeList.length > 0 ? trip.anomalyTypeList[0] : null;

            // ✨ 2. 대표 이상 유형이 있을 때만 툴팁에 표시할 HTML 라인을 만듭니다.
            const anomalyLine = representativeAnomaly
                ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); color: #FFFFFF; font-weight: semi-bold;">
                    이상 유형: ${getAnomalyName(representativeAnomaly)}
                    ${trip.anomalyTypeList.length > 1 ? ` 외 ${trip.anomalyTypeList.length - 1}건` : ''}
                </div>`
                : '';

            return {
                html: `
                    <div style="font-weight: semi-bold; font-size: 16px; color: #FFFFFF; margin-bottom: 8px;">${trip.productName}</div>
                    <div style="font-size: 13px;">
                        <div style="margin-bottom: 4px;"><span style="color: rgba(111,131,175);">출발:</span> ${trip.from.scanLocation}</div>
                        <div><span style="color: rgba(111,131,175);">도착:</span> ${trip.to.scanLocation}</div>
                    </div>
                    ${anomalyLine}
                `,
                style: baseTooltipStyle
            };
        }
    };

    // 이상 탐지된 트립만 필터링
    const anomalyList = useMemo(() => validTrips.filter(t => t.anomalyTypeList && t.anomalyTypeList.length > 0), [validTrips]);

    // 카메라 이동
    useEffect(() => {
        // 이전 카메라 애니메이션이 있다면 중지
        if (cameraAnimationRef.current) {
            cancelAnimationFrame(cameraAnimationRef.current);
            cameraAnimationRef.current = null;
        }

        if (!selectedObject) {
            setEpcDupTarget(null); // EPC 복제 모드 해제
            return;
        }

        // --- Trip 선택 시 로직 ---
        if ('from' in selectedObject) {
            const trip = selectedObject as MergeTrip;
            if (!trip.from?.coord || !trip.to?.coord) return;

            const anomalyType = trip.anomalyTypeList?.[0];

            // 1. 타임 슬라이더의 현재 시간을 trip의 시작 시간으로 설정
            // setCurrentTime(trip.from.eventTime);
            // 2. 애니메이션 레이어가 보이도록 재생 상태로 만듦
            // setIsPlaying(true);

            if (anomalyType === 'epcDup') {
                // EPC 복제 모드 진입
                setEpcDupTarget(trip.epcCode);
                // 간단히 중간 지점으로 이동
                setViewState({
                    ...viewState,
                    longitude: trip.to.coord[0],
                    latitude: trip.to.coord[1],
                    zoom: 16,
                    transitionDuration: 1000,
                    transitionInterpolator: new FlyToInterpolator(),
                });
            } else {
                setEpcDupTarget(null);
                animateCameraAlongTrip(trip, viewState);
            }
        }
        // --- Node 선택 시 로직 ---
        else if ('coord' in selectedObject) {
            setEpcDupTarget(null); // EPC 복제 모드 해제
            const node = selectedObject as LocationNode;
            setViewState({
                ...viewState,
                longitude: node.coord[0],
                latitude: node.coord[1],
                zoom: 17,
                transitionDuration: 1500,
                transitionInterpolator: new FlyToInterpolator({ speed: 1.5 }),
            });
        }

    }, [selectedObject, setViewState, setEpcDupTarget, animateCameraAlongTrip]);

    // AnomalyList 항목 클릭 시 해당 경로를 중앙에 보여주는 함수
    const handleCaseClick = (trip: MergeTrip) => {
        setCurrentTime(trip.from.eventTime);
        setIsPlaying(true);
        setSelectedObject(trip);
    };

    const handleTogglePlay = () => {
        // 만약 애니메이션이 끝난 상태(또는 거의 끝난 상태)에서 재생 버튼을 누른다면,
        if (currentTime >= activeMaxTime - ANIMATION_SPEED) {
            // 시간을 맨 처음으로 되돌리고 재생을 시작합니다.
            setCurrentTime(activeMinTime);
            setIsPlaying(true);
        } else {
            // 그 외의 경우에는 단순히 재생/일시정지 상태만 토글합니다.
            setIsPlaying(prev => !prev);
        }
    };

    // 노드 분류
    const factoryNodes = useMemo(() => {
        if (!nodes) return [];
        return nodes.filter(node => node.businessStep === 'Factory');
    }, [nodes]);
    const otherNodes = useMemo(() => {
        if (!nodes) return [];
        return nodes.filter(node => node.businessStep !== 'Factory');
    }, [nodes]);


    // 공장이 아닌 노드 레이어 생성
    const otherMeshLayers = Object.keys(OTHER_MODEL_MAPPING).map(type => {
        const filteredNodes = otherNodes.filter(node => node.businessStep === type);
        if (filteredNodes.length === 0) return null;

        return new SimpleMeshLayer<LocationNode>({
            id: `mesh-layer-${type}`,
            data: filteredNodes,
            mesh: OTHER_MODEL_MAPPING[type],
            getPosition: d => d.coord,
            getColor: d => getNodeColor(d.businessStep),
            getOrientation: [-90, 0, 0],
            sizeScale: 50,
            getTranslation: [0, 0, 50],
            pickable: true,
            onHover: info => setHoverInfo(info),
            onClick: info => setSelectedObject(info.object as LocationNode),
            material
        });
    }).filter(Boolean);

    // 공장 레이어
    const factoryLayers = [
        new SimpleMeshLayer<LocationNode>({
            id: 'factory-building-layer',
            data: factoryNodes,
            mesh: parsedFactoryBuildingModel,
            getPosition: d => d.coord,
            getColor: d => getNodeColor(d.businessStep),
            getOrientation: [-90, 180, 0],
            sizeScale: 50,
            getTranslation: [0, 0, 50],
            pickable: true,
            onHover: info => setHoverInfo(info),
            onClick: info => setSelectedObject(info.object as LocationNode),
            material
        }),
    ];

    // 이상 발생 노드 ID 목록
    const anomalyNodeIds = useMemo(() => {
        const ids = new Set<string>();
        validTrips.forEach(trip => {
            if (trip.anomalyTypeList && trip.anomalyTypeList.length > 0) {
                ids.add(trip.from.scanLocation);
                ids.add(trip.to.scanLocation);
            }
        });
        return Array.from(ids);
    }, [validTrips]);

    // 위변조 관련 노드 데이터만 필터링
    const anomalyNodes = useMemo(() => {
        if (!nodes) return [];
        return nodes.filter(node => anomalyNodeIds.includes(node.scanLocation));
    }, [nodes, anomalyNodeIds]);

    // 전체 레이어 목록
    const layers = useMemo(() => {
        const selectedTrip = (selectedObject && 'roadId' in selectedObject) ? selectedObject as AnalyzedTrip : null;

        return [
            // 1. 정적 연결선 레이어
            new PathLayer<MergeTrip>({
                id: 'static-supply-lines',
                data: validTrips,
                widthMinPixels: 5,
                getPath: d => d.path || [d.from.coord, d.to.coord],
                getColor: d => {
                    const isSelected = selectedObject && 'roadId' in selectedObject && selectedObject.roadId === d.roadId;
                    const representativeAnomaly = d.anomalyTypeList && d.anomalyTypeList.length > 0 ? d.anomalyTypeList[0] : null;
                    const baseColor = representativeAnomaly ? [255, 64, 64] : [0, 255, 127];

                    if (selectedTrip) {
                        // 무언가 선택되었다면
                        if (isSelected) {
                            // 선택된 경로는 흰색으로 강조
                            return baseColor as Color;
                        } else {
                            // 나머지 경로는 매우 투명하게 처리
                            return [...baseColor, 15] as Color;
                        }
                    }

                    // 아무것도 선택되지 않았을 때는 기본 색상으로 표시
                    return [...baseColor, 50] as Color;
                },
                pickable: true,
                onHover: info => setHoverInfo(info),
                onClick: info => {
                    const trip = info.object as MergeTrip;
                    // 1. 상태를 먼저 설정하고
                    setCurrentTime(trip.from.eventTime);
                    setIsPlaying(true);
                    // 2. 그 다음에 selectedObject를 설정합니다.
                    setSelectedObject(trip);
                },
            }),
            // 3. 이상 노드 pulse
            new ScatterplotLayer({
                id: 'pulse-layer',
                data: anomalyNodes,
                getPosition: d => d.coord,
                getRadius: pulseRadius,
                getFillColor: [255, 99, 132, 255 - (pulseRadius / 1000) * 255], // 점점 투명해짐
                stroked: false,
                pickable: false,
            }),
            // 4. 건물 레이어
            ...otherMeshLayers,
            ...factoryLayers,
            // 5. 동적 연결선 레이어
            new TripsLayer<MergeTrip>({
                id: 'trips-layer',
                data: validTrips,
                getPath: d => d.path || [d.from.coord, d.to.coord],
                getTimestamps: d => d.timestamps || [d.from.eventTime, d.to.eventTime],

                getColor: d => {
                    const representativeAnomaly = d.anomalyTypeList && d.anomalyTypeList.length > 0 ? d.anomalyTypeList[0] : null;
                    if (representativeAnomaly) {
                        return [255, 64, 64];
                    }
                    return [0, 255, 127];
                },
                opacity: 0.8,
                widthMinPixels: 5,
                rounded: true,
                trailLength: 180,
                currentTime,
            }),
        ];
    }, [validTrips, selectedObject, currentTime, anomalyNodes, pulseRadius, factoryNodes, otherNodes]);

    //최종 렌더링
    return (
        <>
            {/* 지도 위 오버레이 스타일 */}
            <style jsx global>{`
                .map-marker { transform: translate(-50%, -100%); z-index: 1; cursor: pointer; }
                .speech-bubble { 
                    position: relative; 
                    background: #333;
                    width: 32px; 
                    height: 32px; 
                    border-radius: 50%; 
                    padding: 6px;
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                }
            `}</style>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {!hasSeenTutorial && (
                    <TutorialOverlay
                        onClose={() => setHasSeenTutorial(true)} // X 버튼을 눌러도 닫히도록 설정
                    />
                )}

                {/* DeckGL + Mapbox */}
                <DeckGL
                    layers={layers} viewState={viewState}
                    onClick={info => !info.object && setSelectedObject(null)}
                    onViewStateChange={({ viewState: newViewState }) => {
                        setViewState(newViewState as MapViewState);
                    }}
                    controller={true}
                    getTooltip={renderTooltip}
                >
                    <ReactMapGL mapboxAccessToken={MAPBOX_ACCESS_TOKEN} mapStyle="mapbox://styles/mapbox/dark-v11"
                        onLoad={e => {
                            const map = e.target;

                            // ✨ 안전한 스타일 변경 로직
                            const setMapStyle = () => {
                                // isStyleLoaded()로 스타일이 준비되었는지 확인
                                if (map.isStyleLoaded()) {
                                    // 'background' 레이어가 존재하는지 확인 후 색상 변경
                                    if (map.getLayer('background')) {
                                        map.setPaintProperty('background', 'background-color', '#000000');
                                    }
                                    // 'water' 레이어가 존재하는지 확인 후 색상 변경
                                    if (map.getLayer('water')) {
                                        map.setPaintProperty('water', 'fill-color', '#000000');
                                    }
                                } else {
                                    // 스타일이 아직 로드되지 않았다면, 'styledata' 이벤트를 기다렸다가 다시 시도
                                    map.once('styledata', setMapStyle);
                                }
                            };

                            setMapStyle(); // 최초 시도
                        }}
                    >
                        {/* 마커 아이콘 */}
                        {nodes && nodes.filter(node => visibleTypes[node.businessStep]).map(node => (
                            <Marker key={`marker-${node.hubType}`} longitude={node.coord[0]} latitude={node.coord[1]} pitchAlignment="viewport" rotationAlignment="map" altitude={getIconAltitude(node)}
                                onClick={(e) => {
                                    e.originalEvent.stopPropagation();
                                    setSelectedObject(node);
                                }}
                            >
                                <div className="map-marker">
                                    <div className="speech-bubble">
                                        <NodeIcon type={node.businessStep} />
                                    </div>
                                </div>
                            </Marker>
                        ))}
                    </ReactMapGL>
                </DeckGL>

                {/* 범례 및 필터 */}
                <MapLegend
                    onHover={setHoveredType}
                    onToggleVisibility={(type) => {
                        setVisibleTypes(prev => ({ ...prev, [type]: !prev[type] }))
                    }}
                    visibleTypes={visibleTypes}
                />

                {/* 시간 슬라이더 */}
                <TimeSlider
                    minTime={activeMinTime}
                    maxTime={activeMaxTime}
                    currentTime={currentTime}
                    isPlaying={isPlaying}
                    onChange={setCurrentTime}
                    onTogglePlay={handleTogglePlay}
                    anomalies={anomalyList}
                    onMarkerClick={handleCaseClick}
                />
            </div>
        </>
    );
};