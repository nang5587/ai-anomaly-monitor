'use client'
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
    nodesAtom,
    visibleTripsAtom, // 상세 경로가 병합된 trips 데이터 아톰
    selectedObjectAtom,
    mapViewStateAtom,
    timeRangeAtom,
    epcDupTargetAtom,
    anomalyFilterAtom,
    selectTripAndFocusAtom,
    spySelectedObjectAtom,
    type MapViewState
} from '@/stores/mapDataAtoms';

import { tutorialSeenAtom } from '@/stores/uiAtoms';

// Deck.gl 및 기타 라이브러리 import
import type { Color } from 'deck.gl';
import DeckGL, { FlyToInterpolator } from 'deck.gl';
import { PathLayer, ScatterplotLayer, IconLayer } from '@deck.gl/layers';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { WebMercatorViewport } from '@deck.gl/core';
import { OBJLoader } from '@loaders.gl/obj';
import { parseSync } from '@loaders.gl/core';
import { default as ReactMapGL, Marker, ViewState, } from 'react-map-gl';
import type { PickingInfo } from '@deck.gl/core';

import { type LocationNode, type AnalyzedTrip } from '../../types/data';
import { cubeModel, factoryBuildingModel } from './models';

import TutorialOverlay from './TutorialOverlay';
import TimeSlider from './TimeSlider';
import MapLegend from './MapLegend';

import { getNodeColor, getAnomalyColor, getAnomalyName } from '../../types/colorUtils';
import { NodeIcon, getIconAltitude } from '../visual/icons';
import { toast } from 'sonner';
import { MergeTrip } from './SupplyChainDashboard';

// Mapbox 액세스 토큰
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// 애니메이션 설정
const ANIMATION_SPEED = 200; // 속도 조절
const TARGET_ANIMATION_DURATION_SECONDS = 15;

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
    useAtomValue(spySelectedObjectAtom); //⭐ 디버깅용


    const nodes = useAtomValue(nodesAtom);
    const trips = useAtomValue(visibleTripsAtom,);
    const anomalyFilter = useAtomValue(anomalyFilterAtom);
    const [selectedObject, setSelectedObject] = useAtom(selectedObjectAtom);
    const [viewState, setViewState] = useAtom(mapViewStateAtom); // 지도 뷰 상태도 Jotai로 관리
    const timeRange = useAtomValue(timeRangeAtom);

    const [epcDupTarget, setEpcDupTarget] = useAtom(epcDupTargetAtom);
    const [hasSeenTutorial, setHasSeenTutorial] = useAtom(tutorialSeenAtom);

    // 이 컴포넌트 내에서만 사용하는 로컬 상태는 그대로 유지합니다.
    const [currentTime, setCurrentTime] = useState(0);
    const [hoverInfo, setHoverInfo] = useState<PickingInfo | null>(null);
    const [hoveredType, setHoveredType] = useState<string | null>(null);
    const [visibleTypes, setVisibleTypes] = useState<Record<string, boolean>>({ Factory: true, WMS: true, LogiHub: true, Wholesaler: true, Reseller: true, POS: true });
    const [isPlaying, setIsPlaying] = useState(true);
    const [pulseRadius, setPulseRadius] = useState(0);

    const selectTripAndFocus = useSetAtom(selectTripAndFocusAtom);

    const validTrips = useMemo(() => {
        if (!trips) return [];
        let filtered = trips.filter(trip => trip && trip.from?.coord && trip.to?.coord);
        if (anomalyFilter) {
            filtered = filtered.filter(trip =>
                trip.anomalyTypeList?.includes(anomalyFilter)
            );
        }

        return filtered;
    }, [trips, anomalyFilter]);

    // 전체 시간 범위
    const globalTimeRange = useMemo(() => {
        if (!validTrips || validTrips.length === 0) {
            return { minTime: 0, maxTime: 1 };
        }
        const startTimes = validTrips.map(t => t.from.eventTime);
        const endTimes = validTrips.map(t => t.to.eventTime);
        return { minTime: Math.min(...startTimes), maxTime: Math.max(...endTimes) };
    }, [validTrips]);

    const activeTimeRange = useMemo(() => {
        if (timeRange) {
            return { minTime: timeRange[0], maxTime: timeRange[1] };
        }

        if (epcDupTarget) {
            const dupTrips = validTrips.filter(t => t.epcCode === epcDupTarget);
            if (dupTrips.length > 0) {
                const startTimes = dupTrips.map(t => t.from.eventTime);
                const endTimes = dupTrips.map(t => t.to.eventTime);
                return { minTime: Math.min(...startTimes), maxTime: Math.max(...endTimes) };
            }
        }
        return globalTimeRange;
    }, [timeRange, epcDupTarget, validTrips, globalTimeRange]);

    const dynamicAnimationSpeed = useMemo(() => {
        const totalDuration = activeTimeRange.maxTime - activeTimeRange.minTime;

        // 시간 범위가 없거나 0이면 애니메이션을 진행하지 않음
        if (totalDuration <= 0) {
            return 0;
        }

        // 60fps를 기준으로, 목표 시간(초) 동안 총 몇 프레임이 필요한지 계산
        const totalFrames = TARGET_ANIMATION_DURATION_SECONDS * 60;

        // 프레임당 증가시켜야 할 시간 = 전체 시간 / 전체 프레임 수
        return totalDuration / totalFrames;

    }, [activeTimeRange]);

    // 🕒 애니메이션 시간
    useEffect(() => {
        // timeRange가 설정되면 (즉, trip이 선택되면), 애니메이션 시작 시간을 그에 맞게 설정합니다.
        if (timeRange) {
            setCurrentTime(timeRange[0]);
            setIsPlaying(true);
        } else {
            // 선택이 해제되면 (timeRange가 null이 되면), 전체 시간 범위의 처음으로 리셋합니다.
            setCurrentTime(globalTimeRange.minTime);
            setIsPlaying(true);
        }
    }, [timeRange, globalTimeRange.minTime]);

    useEffect(() => {
        // 선택이 해제되면 EPC 복제 모드도 해제
        if (!selectedObject) {
            setEpcDupTarget(null);
            setIsPlaying(true);
            return;
        }

        // Trip이 선택된 경우, EPC 복제 모드인지 확인하고 상태를 설정
        // if ('from' in selectedObject) {
        //     const trip = selectedObject as MergeTrip;
        //     const hasEpcDup = trip.anomalyTypeList?.includes('clone');

        //     if (hasEpcDup) {
        //         setEpcDupTarget(trip.epcCode);
        //     } else {
        //         setEpcDupTarget(null);
        //     }
        // }
        // // Node가 선택된 경우, EPC 복제 모드를 해제하고 애니메이션을 멈춤
        // else if ('coord' in selectedObject) {
        //     setEpcDupTarget(null);
        //     setIsPlaying(false);
        // }
        if ('roadId' in selectedObject) {
            const trip = selectedObject as MergeTrip;
            const hasCloneAnomaly = trip.anomalyTypeList?.includes('clone');

            // 복제 이상이 있으면 EPC 복제 모드 활성화, 아니면 해제
            setEpcDupTarget(hasCloneAnomaly ? trip.epcCode : null);
            setIsPlaying(true);
        }
        // Node가 선택된 경우, EPC 복제 모드를 해제하고 애니메이션을 멈춤
        else if ('coord' in selectedObject) {
            setEpcDupTarget(null);
            setIsPlaying(false);
        }
        // `viewState`와 `animateCameraAlongTrip` 등 불필요한 의존성 제거
    }, [selectedObject, setEpcDupTarget, setIsPlaying]);

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
        if (!isPlaying || activeTimeRange.minTime >= activeTimeRange.maxTime || dynamicAnimationSpeed === 0) {
            return;
        }

        let animationFrame: number;

        const animate = () => {
            setCurrentTime(prevTime => {
                if (!isPlaying || prevTime >= activeTimeRange.maxTime) {
                    setIsPlaying(false); // 재생 중지
                    return activeTimeRange.maxTime;
                }
                const nextTime = prevTime + dynamicAnimationSpeed;

                if (nextTime >= activeTimeRange.maxTime) {
                    setIsPlaying(false);
                    return activeTimeRange.maxTime;
                }

                return nextTime;
            });
            if (isPlaying) {
                animationFrame = requestAnimationFrame(animate);
            }
        };
        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [isPlaying, activeTimeRange, setIsPlaying, dynamicAnimationSpeed]);

    // 이상 노드 pulse 효과
    useEffect(() => {
        let animationFrame: number;
        const animatePulse = () => {
            setPulseRadius(r => (r > 1000 ? 0 : r + 20));
            animationFrame = requestAnimationFrame(animatePulse);
        };
        if (selectedObject && 'roadId' in selectedObject) {
            animationFrame = requestAnimationFrame(animatePulse);
        } else {
            // 선택이 해제되면 펄스 반경을 0으로 리셋합니다.
            setPulseRadius(0);
        }
        animationFrame = requestAnimationFrame(animatePulse);
        return () => cancelAnimationFrame(animationFrame);
    }, []);

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

    const handleTogglePlay = () => {
        if (!isPlaying && currentTime >= activeTimeRange.maxTime) {
            // 시간을 맨 처음으로 되돌리고 재생을 시작합니다.
            setCurrentTime(activeTimeRange.minTime);
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
    const otherMeshLayers = useMemo(() => {
        return Object.keys(OTHER_MODEL_MAPPING).map(type => {
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
                onClick: info => {
                    console.log("🖱️ MeshLayer 클릭됨. Node로 선택 설정:", info.object);
                    setSelectedObject(info.object as LocationNode)
                    return true;
                },
                material
            });
        }).filter(Boolean);
    }, [otherNodes, setHoverInfo, setSelectedObject]);

    // 공장 레이어
    const factoryLayers = useMemo(() => [
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
            onClick: info => {
                console.log("🖱️ MeshLayer 클릭됨. Node로 선택 설정:", info.object);
                setSelectedObject(info.object as LocationNode)
                return true;
            },
            material
        }),
    ], [factoryNodes, setHoverInfo, setSelectedObject]);

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

    const handleLayerClick = useCallback((info: PickingInfo) => {
        if (info.object) {
            // useSetAtom으로 가져온 함수는 참조가 안정적이므로 의존성 배열에 추가해도 안전합니다.
            selectTripAndFocus(info.object as MergeTrip);
        }
    }, [selectTripAndFocus]);

    const { staticPathData, cloneMarkerCoords, otherDynamicTrips, pulseData } = useMemo(() => {
        const selectedTrip = (selectedObject && 'roadId' in selectedObject) ? selectedObject as MergeTrip : null;

        let sPathData: MergeTrip[] = [];
        let cMarkerCoords: [number, number, number][] = [];
        let pData: [number, number][] = [];
        const ICON_ALTITUDE = 500;

        if (selectedTrip) {
            if (selectedTrip.anomalyTypeList.includes('clone')) {
                const targetEpc = selectedTrip.epcCode;
                sPathData = validTrips.filter(trip => trip.epcCode === targetEpc);
                cMarkerCoords = sPathData.map(trip => [...(trip.to.coord as [number, number]), ICON_ALTITUDE]);
            } else {
                sPathData = [selectedTrip];
            }
            pData = [selectedTrip?.to.coord as [number, number]];

            // ✨ 선택된 객체가 있으면, otherDynamicTrips는 비웁니다.
            return {
                staticPathData: sPathData,
                cloneMarkerCoords: cMarkerCoords,
                otherDynamicTrips: [], // 선택 시 다른 애니메이션은 멈춤
                pulseData: pData
            };

        } else {
            // ✨ 선택된 객체가 없으면,
            // 1. staticPathData는 모든 경로를 희미하게 보여줍니다.
            sPathData = validTrips;

            // 2. otherDynamicTrips는 "도매상->소매상" 경로를 제외한 나머지 경로만 포함합니다.
            const dynamic = validTrips.filter(trip =>
                !(trip.from.businessStep === 'Wholesaler' && trip.to.businessStep === 'Reseller')
            );

            return {
                staticPathData: sPathData,
                cloneMarkerCoords: [],
                otherDynamicTrips: dynamic,
                pulseData: []
            };
        }
    }, [selectedObject, validTrips]);

    const wholesalerJourneys = useMemo(() => {
        if (!trips || trips.length === 0 || !nodes || nodes.length === 0) {
            return [];
        }

        // 1. 출발지가 'Wholesaler'이고 도착지가 'Reseller'인 Trip만 필터링합니다.
        const deliveryTrips = trips.filter(trip =>
            trip.from.businessStep === 'Wholesaler' &&
            trip.to.businessStep === 'Reseller'
        );

        // 2. 필터링된 Trip들을 출발지 이름(scanLocation)으로 그룹화합니다.
        const tripsByWholesaler = deliveryTrips.reduce((acc, trip) => {
            const key = trip.from.scanLocation;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(trip);
            return acc;
        }, {} as Record<string, AnalyzedTrip[]>);

        // 3. 그룹화된 Trip들을 Journey 객체로 변환합니다.
        const processedJourneys = Object.values(tripsByWholesaler).map(wholesalerTrips => {
            // 각 운행 그룹 내에서, 도착 시간을 기준으로 방문 순서를 정렬합니다.
            const sortedTrips = wholesalerTrips.sort((a, b) => a.to.eventTime - b.to.eventTime);

            const path: [number, number][] = [];
            const timestamps: number[] = [];

            if (sortedTrips.length > 0) {
                const startingPoint = sortedTrips[0].from; // 모든 트립의 출발지는 동일합니다.

                // 경로의 시작은 도매점입니다.
                path.push(startingPoint.coord as [number, number]);
                timestamps.push(startingPoint.eventTime);

                // 정렬된 순서대로 각 소매점(도착지)을 경로에 추가합니다.
                sortedTrips.forEach(trip => {
                    path.push(trip.to.coord as [number, number]);
                    timestamps.push(trip.to.eventTime);
                });
            }

            return {
                journeyId: sortedTrips[0] ? `journey-${sortedTrips[0].from.scanLocation}` : 'unknown',
                path: path,
                timestamps: timestamps,
                trips: sortedTrips, // 원본 trip 정보
            };
        });

        return processedJourneys;
    }, [trips, nodes]);

    // 전체 레이어 목록
    const layers = useMemo(() => {
        const selectedTrip = (selectedObject && 'roadId' in selectedObject) ? selectedObject as MergeTrip : null;

        const showJourneys = !selectedTrip;

        return [
            // 1. 정적 연결선 레이어
            new PathLayer<MergeTrip>({
                id: 'static-supply-lines',
                data: staticPathData,
                widthMinPixels: 5,
                getPath: d => d.path || [d.from.coord, d.to.coord],
                getColor: d => {
                    if (selectedTrip) {
                        // if (d.anomalyTypeList.includes('clone')) {
                        //     return [252, 243, 207, 200];
                        // }
                        if (d.anomalyTypeList.length > 0) {
                            return [255, 0, 0, 255];
                        }
                        return [0, 255, 127, 255];
                    }
                    return d.anomalyTypeList.length > 0 ? [255, 64, 64, 10] : [0, 255, 127, 10];
                },
                pickable: true,
                onHover: info => setHoverInfo(info),
                onClick: handleLayerClick,
                updateTriggers: {
                    getColor: [selectedObject],
                },
            }),
            new IconLayer<[number, number]>({
                id: 'clone-icon-layer', // ID 변경
                data: cloneMarkerCoords,
                iconAtlas: '/icons/clone-alert.png', // public 폴더 기준 경로
                iconMapping: {
                    marker: { x: 0, y: 0, width: 50, height: 50, mask: false }
                },
                getIcon: d => 'marker',
                sizeUnits: 'pixels',
                getSize: 35, // 아이콘 크기를 48px로 설정
                getPosition: d => d,
                getColor: d => [255, 64, 64, 255], // 경고를 의미하는 빨간색
            }),
            // 2. 이상 노드 pulse
            new ScatterplotLayer({
                id: 'pulse-layer',
                // data: anomalyNodes,
                data: pulseData,
                getPosition: d => d,
                getRadius: pulseRadius,
                getFillColor: [255, 99, 132, 255 - (pulseRadius / 1000) * 255], // 점점 투명해짐
                stroked: false,
                pickable: false,
                updateTriggers: {
                    getRadius: [pulseData],
                    getFillColor: [pulseData],
                },
            }),
            // 4. 건물 레이어
            ...otherMeshLayers,
            ...factoryLayers,
            // 5. 동적 연결선 레이어
            new TripsLayer({
                id: 'wholesaler-journeys-layer',
                data: wholesalerJourneys,
                visible: showJourneys, // 선택된 객체가 없을 때만 보이도록 설정
                getPath: d => d.path,
                getTimestamps: d => d.timestamps,
                getColor: [255, 64, 64], // 주황색 계열로 구분
                opacity: 0.8,
                widthMinPixels: 5,
                rounded: true,
                trailLength: 100, // 꼬리 길이를 짧게 하여 트럭처럼 보이게
                currentTime,
            }),

            // ✨ 5-2. 나머지 개별 경로 애니메이션 레이어
            new TripsLayer<MergeTrip>({
                id: 'other-trips-layer',
                data: otherDynamicTrips, // "도매상->소매상"이 제외된 데이터
                visible: showJourneys, // 선택된 객체가 없을 때만 보이도록 설정
                getPath: d => d.path || [d.from.coord, d.to.coord],
                getTimestamps: d => d.timestamps || [d.from.eventTime, d.to.eventTime],
                getColor: d => d.anomalyTypeList.length > 0 ? [255, 64, 64] : [0, 255, 127],
                opacity: 0.8,
                widthMinPixels: 5,
                rounded: true,
                trailLength: 100, // 꼬리 길이를 길게 하여 흐름처럼 보이게
                currentTime,
            }),
        ];
    }, [
        staticPathData, cloneMarkerCoords, otherDynamicTrips, pulseData, wholesalerJourneys,// 안정적인 계산 결과
        selectedObject, currentTime, anomalyNodes, // 필요한 상태값
        factoryLayers, otherMeshLayers, handleLayerClick, setHoverInfo // 안정적인 레이어 및 핸들러
    ]);

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
                    onClick={info => {
                        console.log("🖱️ DeckGL 배경 클릭됨. info 객체:", info);
                        // ✨ 클릭된 위치에 레이어가 없고(즉, 빈 공간을 클릭했고),
                        // ✨ 클릭된 객체도 없을 때만 선택을 해제합니다.
                        if (!info.layer && !info.object) {
                            console.log(" -> 조건 만족! 선택 해제 실행.");
                            selectTripAndFocus(null);
                        }
                    }}
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
                                    console.log("🖱️ Marker 클릭됨. Node로 선택 설정:", node);
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
                    minTime={activeTimeRange.minTime}
                    maxTime={activeTimeRange.maxTime}
                    currentTime={currentTime}
                    isPlaying={isPlaying}
                    onChange={setCurrentTime}
                    onTogglePlay={handleTogglePlay}
                    anomalies={anomalyList}
                    onMarkerClick={(trip) => selectTripAndFocus(trip)}
                />
            </div>
        </>
    );
};