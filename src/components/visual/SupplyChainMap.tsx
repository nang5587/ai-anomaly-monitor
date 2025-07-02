'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DeckGL, { FlyToInterpolator } from 'deck.gl';

import { LineLayer, ScatterplotLayer } from '@deck.gl/layers';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { TripsLayer } from '@deck.gl/geo-layers';

import { OBJLoader } from '@loaders.gl/obj';
import { parseSync } from '@loaders.gl/core';
import Map, { Marker } from 'react-map-gl';
import * as d3 from 'd3-ease';

import type { PickingInfo } from '@deck.gl/core';

import { nodes, analyzedTrips, Node, AnalyzedTrip, AnomalyType } from './data';
import { cubeModel, factoryBuildingModel } from './models';

import TimeSlider from './TimeSlider';

import AnomalyList from './AnomalyList';
import DetailsPanel from './DetailsPanel';
import MapLegend from './MapLegend';
import AnomalySearch from './AnomalySearch';
import AnomalyFilter from './AnomalyFilter';
import { getNodeColor, getAnomalyColor } from '../visual/colorUtils';
import { NodeIcon, getIconAltitude } from '../visual/icons';

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibmFuZzU1ODciLCJhIjoiY21jYnFnZ2RiMDhkNDJybmNwOGZ4ZmwxMCJ9.OBoc45r9z0yM1EpqNuffpQ';

const INITIAL_VIEW_STATE = {
    longitude: 127.9,
    latitude: 36.5,
    zoom: 6.5,
    pitch: 60,
    bearing: 0,
};

const ANIMATION_SPEED = 1;
const minTime = Math.min(...analyzedTrips.map(t => t.timestamps[0]));
const maxTime = Math.max(...analyzedTrips.map(t => t.timestamps[1]));

// 분리된 모델들을 미리 파싱합니다.
const parsedCubeModel = parseSync(cubeModel, OBJLoader);
const parsedFactoryBuildingModel = parseSync(factoryBuildingModel, OBJLoader);

// 공장을 제외한 나머지 노드들의 모델 매핑
const OTHER_MODEL_MAPPING: Record<string, any> = {
    WMS: parsedCubeModel,
    LogiHub: parsedCubeModel,
    Wholesaler: parsedCubeModel,
    Reseller: parsedCubeModel,
};

// 건물 빛나게 하는 거
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
    const [viewState, setViewState] = useState<any>(INITIAL_VIEW_STATE);
    const [currentTime, setCurrentTime] = useState(minTime);
    const [hoverInfo, setHoverInfo] = useState<PickingInfo | null>(null);

    const [hoveredType, setHoveredType] = useState<Node['type'] | null>(null);
    const [visibleTypes, setVisibleTypes] = useState<Record<Node['type'], boolean>>({
        Factory: true, WMS: true, LogiHub: true, Wholesaler: true, Reseller: true,
    });

    const [isPlaying, setIsPlaying] = useState(true);
    const [pulseRadius, setPulseRadius] = useState(0);

    const [selectedObject, setSelectedObject] = useState<AnalyzedTrip | Node | null>(null);

    const staticLines = useMemo(() => {
        // 각 trip에서 시작 좌표와 끝 좌표를 추출합니다.
        return analyzedTrips.map(trip => ({
            ...trip,
            source: trip.path[0],
            target: trip.path[1],
        }));
    }, [analyzedTrips]);

    useEffect(() => {
        let animationFrame: number;

        // isPlaying이 true일 때만 애니메이션을 실행합니다.
        if (isPlaying) {
            const animate = () => {
                setCurrentTime(time => {
                    const nextTime = time + ANIMATION_SPEED;
                    return nextTime > maxTime ? minTime : nextTime;
                });
                animationFrame = requestAnimationFrame(animate);
            };
            animationFrame = requestAnimationFrame(animate);
        }

        // isPlaying이 false로 바뀌거나, 컴포넌트가 언마운트될 때 애니메이션을 정리합니다.
        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, [isPlaying]);

    // pulse 효과
    useEffect(() => {
        let animationFrame: number;
        const animatePulse = () => {
            setPulseRadius(r => (r > 1000 ? 0 : r + 20));
            animationFrame = requestAnimationFrame(animatePulse);
        };
        animationFrame = requestAnimationFrame(animatePulse);
        return () => cancelAnimationFrame(animationFrame);
    }, []);

    const renderTooltip = useCallback(() => {
        if (!hoverInfo || !hoverInfo.object) return null;
        const { object, x, y } = hoverInfo;
        const isNode = 'coordinates' in object;

        return (
            <div style={{
                position: 'absolute', left: x, top: y, background: 'rgba(0, 0, 0, 0.8)',
                color: 'white', padding: '10px', borderRadius: '5px', pointerEvents: 'none', zIndex: 10
            }}>
                {isNode ? (
                    <>
                        <div><strong>{(object as Node).name}</strong></div>
                        <div>타입: {(object as Node).type}</div>
                    </>
                ) : (
                    <>
                        <div><strong>경로: {(object as AnalyzedTrip).product}</strong></div>
                        <div>출발: {(object as AnalyzedTrip).from}</div>
                        <div>도착: {(object as AnalyzedTrip).to}</div>
                    </>
                )}
            </div>
        );
    }, [hoverInfo]);

    const anomalyList = useMemo(() => analyzedTrips.filter(t => t.anomaly), [analyzedTrips]);

    // AnomalyList 항목 클릭 시 실행될 핸들러 함수 정의
    const handleCaseClick = (trip: AnalyzedTrip) => {
        // 1. 해당 경로의 중심으로 카메라 이동
        const [x1, y1] = trip.path[0];
        const [x2, y2] = trip.path[1];
        const newViewState = {
            ...viewState, // 기존의 bearing, pitch 등은 유지
            longitude: (x1 + x2) / 2,
            latitude: (y1 + y2) / 2,
            zoom: 10,
            pitch: 45,
            // ✨ 여기에 전환 관련 속성들을 추가합니다.
            transitionDuration: 1500,
            transitionInterpolator: new FlyToInterpolator(),
        };

        // ✨ 만들어진 새로운 viewState 객체로 상태를 업데이트합니다.
        setViewState(newViewState);

        // 2. 해당 경로 하이라이트
        setSelectedObject(trip);

        // 3. 시간 슬라이더를 이벤트 발생 시점으로 이동
        setCurrentTime(trip.timestamps[0]);
    };

    // 노드 데이터를 공장과 그 외로 분리
    const factoryNodes = nodes.filter(node => node.type === 'Factory');
    const otherNodes = nodes.filter(node => node.type !== 'Factory');
    const visibleOtherTypes = Object.keys(OTHER_MODEL_MAPPING).filter(type => visibleTypes[type as Node['type']]);

    // 공장이 아닌 다른 노드들의 메쉬 레이어 생성
    const otherMeshLayers = Object.keys(OTHER_MODEL_MAPPING).map(type => {
        const filteredNodes = otherNodes.filter(node => node.type === type);
        if (filteredNodes.length === 0) return null;

        return new SimpleMeshLayer<Node>({
            id: `mesh-layer-${type}`,
            data: filteredNodes,
            mesh: OTHER_MODEL_MAPPING[type],
            getPosition: d => d.coordinates,
            getColor: d => getNodeColor(d.type),
            getOrientation: [-90, 0, 0], // 모델을 바로 세움
            sizeScale: 50,
            getTranslation: [0, 0, 50], // 모델의 바닥을 지면에 맞춤
            pickable: true,
            onHover: info => setHoverInfo(info),
            onClick: info => setSelectedObject(info.object as Node),
            material
        });
    }).filter(Boolean);

    // 공장 레이어 생성 (본체 + 굴뚝)
    const factoryLayers = [
        new SimpleMeshLayer<Node>({
            id: 'factory-building-layer',
            data: factoryNodes,
            mesh: parsedFactoryBuildingModel,
            getPosition: d => d.coordinates,
            getColor: d => getNodeColor(d.type),
            getOrientation: [-90, 180, 0], // 모델을 세우고 180도 회전
            sizeScale: 50,
            getTranslation: [0, 0, 50], // 건물 바닥을 지면에 맞춤 (지붕 높이: Z=100)
            pickable: true,
            onHover: info => setHoverInfo(info),
            onClick: info => setSelectedObject(info.object as Node),
            material
        }),
    ];

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
    const anomalyNodes = nodes.filter(node => anomalyNodeIds.includes(node.id));

    // 모든 레이어를 합침
    const layers = [
        // --- 5-1. 정적 연결선 레이어 (LineLayer) ---
        new LineLayer<AnalyzedTrip>({
            id: 'static-supply-lines',
            data: staticLines,
            getSourcePosition: d => d.path[0],
            getTargetPosition: d => d.path[1],
            // anomalyType에 따라 색상 변경
            getColor: d => {
                const isSelected = selectedObject && 'path' in selectedObject && selectedObject.id === d.id;
                if (selectedObject && !isSelected) return [128, 128, 128, 20]; // 선택된 것 외에는 더 흐리게

                switch (d.anomaly?.type) {
                    case 'SPACE_JUMP':   // Vivid Purple (#722ed1)
                        return [114, 46, 209];
                    case 'CLONE':        // Lemon Yellow (#ffeb3b)
                        return [255, 235, 59];
                    case 'ORDER_ERROR':  // Strong Orange (#fa8c16)
                        return [250, 140, 22];
                    case 'PATH_FAKE':    // Alert Red (#cf1322)
                        return [207, 19, 34];
                    default:             // Light Lime Green (#90ee90)
                        return [100, 100, 110];
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
        // --- 5-2. 경로 위조 시 '예상 경로'를 보여주는 추가 LineLayer ---
        new LineLayer<AnalyzedTrip>({
            id: 'expected-path-lines',
            data: staticLines.filter(d => d.anomaly?.type === 'PATH_FAKE'),
            getSourcePosition: d => (d.anomaly as any).expectedPath[0],
            getTargetPosition: d => (d.anomaly as any).expectedPath[1],
            getColor: [150, 150, 150, 200],
            getWidth: 2,
        }),
        new ScatterplotLayer({
            id: 'pulse-layer',
            data: anomalyNodes,
            getPosition: d => d.coordinates,
            getRadius: pulseRadius,
            getFillColor: [255, 99, 132, 255 - (pulseRadius / 1000) * 255], // 점점 투명해짐
            stroked: false,
            pickable: false,
        }),
        // --- 5-4. 건물 및 굴뚝 레이어들 (이전과 동일) ---
        ...otherMeshLayers,
        ...factoryLayers,
        // --- 5-5. 동적 이동 애니메이션 레이어 (TripsLayer) ---
        new TripsLayer<AnalyzedTrip>({
            id: 'trips-layer',
            data: analyzedTrips, // 데이터 소스 변경
            getPath: d => d.path,
            getTimestamps: d => d.anomaly?.type === 'ORDER_ERROR' ? [d.timestamps[1], d.timestamps[0]] : d.timestamps,
            // anomalyType에 따라 색상 변경
            getColor: d => {
                switch (d.anomaly?.type) {
                    case 'SPACE_JUMP':   // Vivid Purple (#722ed1)
                        return [114, 46, 209];
                    case 'CLONE':        // Lemon Yellow (#ffeb3b)
                        return [255, 235, 59];
                    case 'ORDER_ERROR':  // Strong Orange (#fa8c16)
                        return [250, 140, 22];
                    case 'PATH_FAKE':    // Alert Red (#cf1322)
                        return [207, 19, 34];
                    default:             // Light Lime Green (#90ee90)
                        return [144, 238, 144];
                }
            },
            opacity: 0.8, widthMinPixels: 5, rounded: true,
            trailLength: 180, currentTime,
        }),
    ];

    return (
        <>
            <style jsx global>{`
                .map-marker { transform: translate(-50%, -100%); z-index: 1; cursor: pointer; }
                /* 아이콘만 담을 것이므로 원형으로 변경 */
                .speech-bubble { 
                    position: relative; 
                    background: #333; /* 어두운 배경색 */
                    width: 32px; /* 너비 고정 */
                    height: 32px; /* 높이 고정 */
                    border-radius: 50%; /* 원형으로 만듦 */
                    padding: 6px; /* 아이콘과 테두리 사이 여백 */
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                }
            `}</style>
            <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
                <DeckGL
                    layers={layers} viewState={viewState}
                    onClick={info => !info.object && setSelectedObject(null)}
                    onViewStateChange={({ viewState: newViewState }) => {
                        setViewState(newViewState);
                    }}
                    controller={true}
                >
                    <Map mapboxAccessToken={MAPBOX_ACCESS_TOKEN} mapStyle="mapbox://styles/mapbox/dark-v11"
                        onLoad={e => {
                            const map = e.target;
                            map.setPaintProperty('background', 'background-color', '#000000');
                            map.setPaintProperty('water', 'fill-color', '#000000');
                        }}
                    >
                        {nodes.filter(node => visibleTypes[node.type]).map(node => (
                            <Marker key={`marker-${node.name}`} longitude={node.coordinates[0]} latitude={node.coordinates[1]} pitchAlignment="viewport" rotationAlignment="map" altitude={getIconAltitude(node)}
                                onClick={(e) => {
                                    e.originalEvent.stopPropagation();
                                    setSelectedObject(node);
                                }}
                            >
                                <div className="map-marker">
                                    <div className="speech-bubble">
                                        <NodeIcon type={node.type} />
                                    </div>
                                </div>
                            </Marker>
                        ))}
                    </Map>
                </DeckGL>

                {renderTooltip()}

                <div style={{
                    position: 'absolute',
                    top: '80px',
                    left: '20px',
                    width: '300px',
                    maxHeight: 'calc(100vh - 180px)', // 상하단 여백 50px씩 확보
                    zIndex: 3,

                    // Flexbox 레이아웃 설정
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px', // 컴포넌트 사이의 간격
                }}>
                    <AnomalySearch />
                    <AnomalyFilter />
                    <AnomalyList
                        anomalies={anomalyList}
                        onCaseClick={handleCaseClick}
                        selectedObjectId={selectedObject?.id ?? null}
                    />
                </div>

                <DetailsPanel
                    selectedObject={selectedObject}
                    onClose={() => setSelectedObject(null)}
                />

                <MapLegend
                    onHover={setHoveredType}
                    onToggleVisibility={(type) => {
                        setVisibleTypes(prev => ({ ...prev, [type]: !prev[type] }))
                    }}
                    visibleTypes={visibleTypes}
                />

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