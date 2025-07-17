'use client'
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
    nodesAtom,
    tripsAtom, // 상세 경로가 병합된 trips 데이터 아톰
    selectedObjectAtom,
    mapViewStateAtom,
    flyToLocationAtom,
    type MapViewState
} from '@/stores/mapDataAtoms';

import { tutorialSeenAtom } from '@/stores/uiAtoms';

// Deck.gl 및 기타 라이브러리 import
import DeckGL, { FlyToInterpolator } from 'deck.gl';
import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { OBJLoader } from '@loaders.gl/obj';
import { parseSync } from '@loaders.gl/core';
import { default as ReactMapGL, Marker, ViewState, } from 'react-map-gl';
import type { PickingInfo } from '@deck.gl/core';

import { type Node, type AnalyzedTrip } from './data';
import { cubeModel, factoryBuildingModel } from './models';

import TutorialOverlay from './TutorialOverlay';
import TimeSlider from './TimeSlider';
import MapLegend from './MapLegend';

import { getNodeColor, getAnomalyColor, getAnomalyName } from '../visual/colorUtils';
import { NodeIcon, getIconAltitude } from '../visual/icons';
import { toast } from 'sonner';

import { type TripWithId } from './SupplyChainDashboard';

// Mapbox 액세스 토큰
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// 초기 지도 뷰 상태 (지도 시작 위치 및 시야 각도)
const INITIAL_VIEW_STATE = {
    longitude: 127.9,
    latitude: 36.5,
    zoom: 6.5,
    pitch: 60,
    bearing: 0,
};

// 애니메이션 설정
const ANIMATION_SPEED = 1; // 속도 조절

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
    const flyTo = useSetAtom(flyToLocationAtom);
    const [selectedObject, setSelectedObject] = useAtom(selectedObjectAtom);
    const [viewState, setViewState] = useAtom(mapViewStateAtom); // 지도 뷰 상태도 Jotai로 관리

    const [hasSeenTutorial, setHasSeenTutorial] = useAtom(tutorialSeenAtom);

    // 이 컴포넌트 내에서만 사용하는 로컬 상태는 그대로 유지합니다.
    const [currentTime, setCurrentTime] = useState(0);
    const [hoverInfo, setHoverInfo] = useState<PickingInfo | null>(null);
    const [hoveredType, setHoveredType] = useState<string | null>(null);
    const [visibleTypes, setVisibleTypes] = useState<Record<string, boolean>>({ Factory: true, WMS: true, LogiHub: true, Wholesaler: true, Reseller: true, POS: true });
    const [isPlaying, setIsPlaying] = useState(true);
    const [pulseRadius, setPulseRadius] = useState(0);

    const validTrips = useMemo(() => {
        if (!analyzedTrips) return [];
        return analyzedTrips.filter(trip => trip && trip.from?.coord && trip.to?.coord);
    }, [analyzedTrips]);

    const { minTime, maxTime } = useMemo(() => {
        if (validTrips.length === 0) {
            return { minTime: 0, maxTime: 1 }; // 분모 0 방지
        }
        const startTimes = validTrips.map(t => t.from.eventTime);
        const endTimes = validTrips.map(t => t.to.eventTime);
        return { minTime: Math.min(...startTimes), maxTime: Math.max(...endTimes) };
    }, [validTrips]);

    useEffect(() => {
        if (minTime > 0) {
            setCurrentTime(minTime);
        } else {
            setCurrentTime(0); // 데이터가 없을 때 초기화
        }
    }, [minTime]);

    // 정적 선 : 각 트립의 시작점 ~ 끝점
    const staticLines = useMemo(() => {
        return validTrips.map(trip => ({ ...trip, source: trip.from.coord, target: trip.to.coord }));
    }, [validTrips]);

    // 튜토리얼 자동으로 숨김 (5초)
    useEffect(() => {
        // 만약 튜토리얼이 아직 보여지고 있다면 (한 번도 안 봤다면)
        if (!hasSeenTutorial) {
            const timer = setTimeout(() => {
                // 5초 뒤에 튜토리얼을 봤다는 상태로 변경합니다.
                // 이 setHasSeenTutorial(true) 호출은 Jotai 아톰의 값을 바꾸고,
                // 그 즉시 localStorage의 'tutorialSeen' 값도 true로 업데이트합니다.
                setHasSeenTutorial(true);
            }, 5000); // 5초

            return () => clearTimeout(timer);
        }
    }, [hasSeenTutorial, setHasSeenTutorial]);

    // 애니메이션 재생 타이머
    useEffect(() => {
        if (!isPlaying || minTime >= maxTime) return;
        let animationFrame: number;
        const animate = () => {
            setCurrentTime(time => (time + ANIMATION_SPEED > maxTime ? minTime : time + ANIMATION_SPEED));
            animationFrame = requestAnimationFrame(animate);
        };
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [isPlaying, minTime, maxTime]);

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
            return new Map<string, Node>();
        }
        return new Map<string, Node>(nodes.map(n => [n.hubType, n]));
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
            const node = object as Node;
            return {
                html: `
                    <div style="font-weight: semi-bold; font-size: 16px; margin-bottom: 4px;">${node.scanLocation}</div>
                    <div><span style="color: rgba(111,131,175);">타입:</span> ${node.businessStep}</div>
                `,
                style: baseTooltipStyle
            };
        } else {
            const trip = object as TripWithId;

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

    useEffect(() => {
        if (!selectedObject) return;

        if ('from' in selectedObject) {
            const trip = selectedObject;
            if (!trip.from?.coord || !trip.to?.coord) return;
            const [x1, y1] = trip.from.coord;
            const [x2, y2] = trip.to.coord;

            // 중간 지점으로 날아가는 액션 호출
            flyTo({
                longitude: (x1 + x2) / 2,
                latitude: (y1 + y2) / 2,
                zoom: 10
            });

        } else if ('coord' in selectedObject) {
            const node = selectedObject;

            // 노드 위치로 날아가는 액션 호출
            flyTo({
                longitude: node.coord[0],
                latitude: node.coord[1],
                zoom: 13
            });
        }

    }, [selectedObject, flyTo]);

    // AnomalyList 항목 클릭 시 해당 경로를 중앙에 보여주는 함수
    const handleCaseClick = (trip: TripWithId) => {
        setSelectedObject(trip);
        setCurrentTime(trip.from.eventTime);
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

        return new SimpleMeshLayer<Node>({
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
            onClick: info => setSelectedObject(info.object as Node),
            material
        });
    }).filter(Boolean);

    // 공장 레이어
    const factoryLayers = [
        new SimpleMeshLayer<Node>({
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
            onClick: info => setSelectedObject(info.object as Node),
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
    const layers = [
        // 1. 정적 연결선 레이어
        new PathLayer<TripWithId>({
            id: 'static-supply-lines',
            data: validTrips,
            widthMinPixels: 5,
            getPath: d => d.path || [d.from.coord, d.to.coord],
            getColor: d => {
                // 👇 getColor에서도 동일한 로직 적용
                let isSelected = selectedObject && 'id' in selectedObject && selectedObject.id === d.id;
                if (selectedObject && !isSelected) return [255, 255, 255, 10];

                // ✨ 수정: trip.anomalyType -> trip.anomalyTypeList
                const representativeAnomaly = d.anomalyTypeList && d.anomalyTypeList.length > 0 ? d.anomalyTypeList[0] : null;
                if (representativeAnomaly) {
                    const color = getAnomalyColor(representativeAnomaly);
                    return isSelected ? [255, 255, 255, 255] : [...color, 50];
                }
                return isSelected ? [0, 255, 127, 255] : [0, 255, 127, 50];
            },
            pickable: true,
            onHover: info => setHoverInfo(info),
            onClick: info => setSelectedObject(info.object as TripWithId),
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
        new TripsLayer<TripWithId>({
            id: 'trips-layer',
            data: validTrips,
            getPath: d => d.path || [d.from.coord, d.to.coord],
            getTimestamps: d => d.timestamps || [d.from.eventTime, d.to.eventTime],

            getColor: d => {
                const representativeAnomaly = d.anomalyTypeList && d.anomalyTypeList.length > 0 ? d.anomalyTypeList[0] : null;
                if (representativeAnomaly) {
                    return getAnomalyColor(representativeAnomaly);
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
                    minTime={minTime}
                    maxTime={maxTime}
                    currentTime={currentTime}
                    isPlaying={isPlaying}
                    onChange={setCurrentTime}
                    onTogglePlay={() => setIsPlaying(prev => !prev)}
                    anomalies={anomalyList}
                    onMarkerClick={handleCaseClick}
                />
            </div>
        </>
    );
};