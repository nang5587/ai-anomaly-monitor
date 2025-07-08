'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DeckGL, { FlyToInterpolator } from 'deck.gl';

import { LineLayer, ScatterplotLayer } from '@deck.gl/layers';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { TripsLayer } from '@deck.gl/geo-layers';

import { OBJLoader } from '@loaders.gl/obj';
import { parseSync } from '@loaders.gl/core';
import { default as ReactMapGL, Marker } from 'react-map-gl';

import type { PickingInfo } from '@deck.gl/core';

import {
    getNodes,
    getAnomalies, // 초기 데이터는 이상 징후만 로드
    type Node,
    type AnalyzedTrip,
    type AnomalyType
} from './data';
import { cubeModel, factoryBuildingModel } from './models';

import TutorialOverlay from './TutorialOverlay';
import TimeSlider from './TimeSlider';
import AnomalyList from './AnomalyList';
import DetailsPanel from './DetailsPanel';
import MapLegend from './MapLegend';
import AnomalySearch from './AnomalySearch';
import AnomalyFilter from './AnomalyFilter';

import { getNodeColor, getAnomalyColor } from '../visual/colorUtils';
import { NodeIcon, getIconAltitude } from '../visual/icons';

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

// const minTime = Math.min(...analyzedTrips.map(t => t.timestamps[0])); // analyzedTrips 중 시작 시점
// const maxTime = Math.max(...analyzedTrips.map(t => t.timestamps[1])); // analyzedTrips 중 마지막 시점

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
    const [nodes, setNodes] = useState<Node[]>([]);
    const [analyzedTrips, setAnalyzedTrips] = useState<AnalyzedTrip[]>([]);
    const [isLoading, setIsLoading] = useState(true);


    const [showTutorial, setShowTutorial] = useState(true); // 튜토리얼 표시 여부용
    const [viewState, setViewState] = useState<any>(INITIAL_VIEW_STATE); // 카메라 상태 갱신용
    const [currentTime, setCurrentTime] = useState(0); // TripsLayer에서 경로 애니메이션 표시용
    const [hoverInfo, setHoverInfo] = useState<PickingInfo | null>(null); // 마우스로 마커나 선 위에 올렸을 때 표시할 툴팁 정보 저장
    const [hoveredType, setHoveredType] = useState<string | null>(null); // MapLegend에 마우스를 올렸을 때 해당 노드 타입 표시
    const [visibleTypes, setVisibleTypes] = useState<Record<string, boolean>>({
        Factory: true, WMS: true, LogiHub: true, Wholesaler: true, Reseller: true,
    });
    const [isPlaying, setIsPlaying] = useState(true); // TripsLayer 애니메이션 재생 여부
    const [pulseRadius, setPulseRadius] = useState(0); // 이상 노드에 퍼지는 원의 반경
    const [selectedObject, setSelectedObject] = useState<AnalyzedTrip | Node | null>(null); // DetailsPanel에서 상세 정보를 보여줌

    useEffect(() => {
        async function loadData() {
            try {
                const [nodesData, tripsData] = await Promise.all([getNodes(), getAnomalies()]);
                setNodes(nodesData);
                setAnalyzedTrips(tripsData);
            } catch (error) {
                console.error("지도 데이터 로딩 실패:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    // ✨ 4. 데이터 로딩 후 minTime, maxTime 계산 및 currentTime 초기화
    const { minTime, maxTime } = useMemo(() => {
        if (analyzedTrips.length === 0) return { minTime: 0, maxTime: 0 };
        const startTimes = analyzedTrips.map(t => t.timestamps[0]);
        const endTimes = analyzedTrips.map(t => t.timestamps[1]);
        return {
            minTime: Math.min(...startTimes),
            maxTime: Math.max(...endTimes)
        };
    }, [analyzedTrips]);

    useEffect(() => {
        // 데이터가 로드되어 minTime이 유효한 값으로 설정되면, currentTime을 초기화
        if (minTime > 0) {
            setCurrentTime(minTime);
        }
    }, [minTime]);

    // 정적 선 : 각 트립의 시작점 ~ 끝점
    const staticLines = useMemo(() => {
        return analyzedTrips.map(trip => ({ ...trip, source: trip.path[0], target: trip.path[1] }));
    }, [analyzedTrips]);

    // 튜토리얼 자동으로 숨김 (5초)
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowTutorial(false);
        }, 5000); // 5000ms = 5초

        // 컴포넌트가 언마운트되거나, 이 useEffect가 다시 실행되기 전에 타이머를 정리
        return () => clearTimeout(timer);
    }, []);

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

    const nodeMap = useMemo(() => new Map<string, Node>(nodes.map(n => [n.hubType, n])), [nodes]);
    
    // 툴팁 렌더링 함수
    const renderTooltip = ({ object }: PickingInfo) => {
        if (!object) return null;

        const isNode = 'coordinates' in object;

        if (isNode) {
            const node = object as Node;
            return {
                html: `
                    <div style="background: rgba(0, 0, 0, 0.8); color: white; padding: 10px; border-radius: 5px;">
                        <strong>${node.scanLocation}</strong>
                        <div>타입: ${node.businessStep}</div>
                    </div>
                `,
                style: { pointerEvents: 'none' }
            };
        } else {
            const trip = object as AnalyzedTrip;
            return {
                html: `
                    <div style="background: rgba(0, 0, 0, 0.8); color: white; padding: 10px; border-radius: 5px;">
                        <div><strong>상품: ${trip.productName}</strong></div>
                        <div>출발: ${nodeMap.get(trip.from)?.scanLocation}</div>
                        <div>도착: ${nodeMap.get(trip.to)?.scanLocation}</div>
                        ${trip.anomaly ? `<div><strong>이상 유형: ${trip.anomaly}</strong></div>` : ''}
                    </div>
                `,
                style: { pointerEvents: 'none' }
            };
        }
    };
    // 이상 탐지된 트립만 필터링
    const anomalyList = useMemo(() => analyzedTrips.filter(t => t.anomaly), [analyzedTrips]);

    // AnomalyList 항목 클릭 시 해당 경로를 중앙에 보여주는 함수
    const handleCaseClick = (trip: AnalyzedTrip) => {
        // 1. 해당 경로의 중심으로 카메라 이동
        const [x1, y1] = trip.path[0];
        const [x2, y2] = trip.path[1];
        const newViewState = {
            ...viewState,
            longitude: (x1 + x2) / 2,
            latitude: (y1 + y2) / 2,
            zoom: 11,
            pitch: 45,
            transitionDuration: 1500,
            transitionInterpolator: new FlyToInterpolator(),
        };

        setViewState(newViewState);

        // 2. 상세 보기 패널
        setSelectedObject(trip);

        // 3. 시간 슬라이더를 이벤트 발생 시점으로 이동
        setCurrentTime(trip.timestamps[0]);
    };

    // 노드 분류
    const factoryNodes = useMemo(() => nodes.filter(node => node.businessStep === 'Factory'), [nodes]);
    const otherNodes = useMemo(() => nodes.filter(node => node.businessStep !== 'Factory'), [nodes]);
    // const visibleOtherTypes = Object.keys(OTHER_MODEL_MAPPING).filter(type => visibleTypes[type as Node['type']]);


    // 공장이 아닌 노드 레이어 생성
    const otherMeshLayers = Object.keys(OTHER_MODEL_MAPPING).map(type => {
        const filteredNodes = otherNodes.filter(node => node.businessStep === type);
        if (filteredNodes.length === 0) return null;

        return new SimpleMeshLayer<Node>({
            id: `mesh-layer-${type}`,
            data: filteredNodes,
            mesh: OTHER_MODEL_MAPPING[type],
            getPosition: d => d.coordinates,
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
            getPosition: d => d.coordinates,
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
        analyzedTrips.forEach(trip => {
            if (trip.anomaly) {
                ids.add(trip.from);
                ids.add(trip.to);
            }
        });
        return Array.from(ids);
    }, [analyzedTrips]);
    // 위변조 관련 노드 데이터만 필터링
    const anomalyNodes = useMemo(() => nodes.filter(node => anomalyNodeIds.includes(node.hubType)), [nodes, anomalyNodeIds]);

    if (isLoading) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center text-white">
                <p>지도 데이터를 불러오는 중입니다...</p>
            </div>
        );
    }

    // 전체 레이어 목록
    const layers = [
        // 1. 정적 연결선 레이어
        new LineLayer<AnalyzedTrip>({
            id: 'static-supply-lines',
            data: staticLines,
            getSourcePosition: d => d.path[0],
            getTargetPosition: d => d.path[1],
            getColor: d => {
                const isSelected = selectedObject && 'path' in selectedObject && selectedObject.id === d.id;
                if (selectedObject && !isSelected) return [128, 128, 128, 20]; // 선택된 것 외에는 더 흐리게
                switch (d.anomaly) {
                    case 'jump': return [223, 190, 239];
                    case 'evtOrderErr': return [253, 220, 179];
                    case 'epcFake': return [255, 192, 210];
                    case 'epcDup': return [255, 248, 203];
                    case 'locErr': return [202, 232, 255];
                    default: return [200, 255, 220];
                }
            },
            getWidth: d => {
                const isSelected = selectedObject && 'path' in selectedObject && selectedObject.id === d.id;
                return isSelected ? 5 : 2;
            }, // 선택된 선은 더 굵게
            pickable: true,
            onHover: info => setHoverInfo(info),
            onClick: info => setSelectedObject(info.object as AnalyzedTrip),
        }),
        // 2. 예상 경로 (위조 탐지)
        new LineLayer<AnalyzedTrip>({
            id: 'expected-path-lines',
            data: staticLines.filter(d => d.anomaly === 'locErr'),
            getSourcePosition: d => (d.anomaly as any).expectedPath[0],
            getTargetPosition: d => (d.anomaly as any).expectedPath[1],
            getColor: [150, 150, 150, 200],
            getWidth: 2,
        }),
        // 3. 이상 노드 pulse
        new ScatterplotLayer({
            id: 'pulse-layer',
            data: anomalyNodes,
            getPosition: d => d.coordinates,
            getRadius: pulseRadius,
            getFillColor: [255, 99, 132, 255 - (pulseRadius / 1000) * 255], // 점점 투명해짐
            stroked: false,
            pickable: false,
        }),
        // 4. 건물 레이어
        ...otherMeshLayers,
        ...factoryLayers,
        // 5. 동적 연결선 레이어
        new TripsLayer<AnalyzedTrip>({
            id: 'trips-layer',
            data: analyzedTrips,

            // [데이터 방어] 경로 데이터가 유효한지 확인합니다.
            // path가 배열이고, 두 개의 좌표를 포함하는지 체크합니다.
            getPath: d => (Array.isArray(d.path) && d.path.length === 2 ? d.path : []),

            // [핵심 수정] 타임스탬프 데이터가 유효한 숫자인지 확인하고 변환합니다.
            // 문자열로 된 숫자가 들어와도 `Number()`로 변환하여 에러를 방지합니다.
            getTimestamps: d => {
                if (!d.timestamps || !Array.isArray(d.timestamps) || d.timestamps.length !== 2) {
                    return [0, 0]; // 데이터가 잘못되면 렌더링하지 않음
                }
                // 항상 [시작, 종료] 순서를 유지하고 숫자로 변환
                const start = Number(d.timestamps[0]);
                const end = Number(d.timestamps[1]);
                return start < end ? [start, end] : [end, start];
            },

            // [데이터 방어] 색상 접근자 함수에도 방어 코드를 추가합니다.
            getColor: d => {
                if (d.anomaly && typeof d.anomaly === 'object' && 'type' in d.anomaly) {
                    return getAnomalyColor(d.anomaly as AnomalyType) || [255, 0, 0];
                }
                return [0, 255, 127]; // 정상
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
                {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}

                {/* DeckGL + Mapbox */}
                <DeckGL
                    layers={layers} viewState={viewState}
                    onClick={info => !info.object && setSelectedObject(null)}
                    onViewStateChange={({ viewState: newViewState }) => {
                        setViewState(newViewState);
                    }}
                    controller={true}
                    getTooltip={renderTooltip}
                >
                    <ReactMapGL mapboxAccessToken={MAPBOX_ACCESS_TOKEN} mapStyle="mapbox://styles/mapbox/dark-v11"
                        onLoad={e => {
                            const map = e.target;
                            map.setPaintProperty('background', 'background-color', '#000000');
                            map.setPaintProperty('water', 'fill-color', '#000000');
                        }}
                    >
                        {/* 마커 아이콘 */}
                        {nodes.filter(node => visibleTypes[node.businessStep]).map(node => (
                            <Marker key={`marker-${node.hubType}`} longitude={node.coordinates[0]} latitude={node.coordinates[1]} pitchAlignment="viewport" rotationAlignment="map" altitude={getIconAltitude(node)}
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

                {/* 툴팁 */}
                {/* {renderTooltip()} */}

                {/* 왼쪽 패널 */}
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '20px',
                    width: '300px',
                    maxHeight: 'calc(100vh - 220px)',
                    zIndex: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                }}>
                    <AnomalySearch />
                    <AnomalyFilter />
                    <AnomalyList
                        anomalies={anomalyList}
                        onCaseClick={handleCaseClick}
                        selectedObjectId={
                            selectedObject 
                                ? ('id' in selectedObject ? selectedObject.id : selectedObject.hubType) 
                                : null
                        }
                        nodeMap={nodeMap}
                    />
                </div>

                {/* 상세 패널 */}
                <DetailsPanel
                    selectedObject={selectedObject}
                    onClose={() => setSelectedObject(null)}
                />

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