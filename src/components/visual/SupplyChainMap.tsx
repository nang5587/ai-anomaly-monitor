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

// import { nodes, trips, Node, Trip } from './data';
import { nodes, analyzedTrips, Node, AnalyzedTrip, AnomalyType } from './data';
import { cubeModel, factoryBuildingModel } from './models';

import TimeSlider from './TimeSlider';

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

const getNodeColor = (type: Node['type']): [number, number, number, number] => { // 반환 타입에 number 추가
    const alpha = 100; // 투명도 값 (0 ~ 255)
    switch (type) {
        case 'Factory': return [0, 255, 255, alpha];     // 네온 시안 (아쿠아 블루)
        case 'WMS': return [255, 0, 255, alpha];         // 네온 마젠타 (형광 보라핑크)
        case 'LogiHub': return [186, 255, 0, alpha];     // 네온 라임 옐로우
        case 'Wholesaler': return [0, 255, 128, alpha];  // 형광 에메랄드 민트
        case 'Reseller': return [255, 64, 128, alpha];   // 네온 코랄 핑크
        default: return [180, 180, 180, alpha];
    }
};

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

// ✨ 2. 아이콘을 표시할 고도(altitude)를 계산하는 함수를 만듭니다.
const getIconAltitude = (node: Node): number => {
    const BUILDING_TOP_Z = 100; // 건물 지붕 높이
    const CHIMNEY_MODEL_HEIGHT = 2.5;
    const SIZE_SCALE = 50;

    return BUILDING_TOP_Z;
};

const NodeIcon: React.FC<{ type: Node['type'] }> = ({ type }) => {
    const style = { width: '70%', height: '70%', fill: 'white' };
    switch (type) {
        // 굴뚝이 있는 공장 아이콘
        case 'Factory':
            return (
                <svg viewBox="0 0 24 24" style={style}>
                    <path d="M19 7h-1V5h-4v2h-4V5H6v2H5c-1.1 0-2 .9-2 2v11h18V9c0-1.1-.9-2-2-2zm-9 11H6v-4h4v4zm6 0h-4v-4h4v4z" />
                </svg>
            );

        // 여러 개의 상자가 쌓인 창고(Warehouse) 아이콘
        case 'WMS':
            return (
                <svg viewBox="0 0 24 24" style={style}>
                    <path d="M20 7V5h-4v2h4zm-6 2V7h-4v2h4zM4 9h4V7H4v2zm16 4v-2h-4v2h4zm-6 0v-2h-4v2h4zM4 13h4v-2H4v2zm16 4v-2h-4v2h4zm-6 0v-2h-4v2h4zM4 17h4v-2H4v2z" />
                </svg>
            );

        // 여러 갈래로 퍼져나가는 물류 허브 아이콘
        case 'LogiHub':
            return (
                <svg viewBox="0 0 24 24" style={style}>
                    <path d="M20 18h-4v-2h4v2zm-6-2h-4v-2h4v2zm-6-2H4v-2h4v2zM20 8h-4V6h4v2zm-6 0h-4V6h4v2zM4 8h4V6H4v2z" />
                </svg>
            );

        // 상점 건물을 형상화한 도매점(Wholesaler) 아이콘
        case 'Wholesaler':
            return (
                <svg viewBox="0 0 24 24" style={style}>
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 18H4v-4h4v4zm0-6H4v-4h4v4zm6 6h-4v-4h4v4zm0-6h-4v-4h4v4zm6 6h-4v-4h4v4zm0-6h-4v-4h4v4z" />
                </svg>
            );

        // 태그(가격표) 모양의 리셀러(Reseller) 아이콘
        case 'Reseller':
            return (
                <svg viewBox="0 0 24 24" style={style}>
                    <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.22-1.05-.59-1.42zM13 20.01L4 11V4h7l9 9-7 7.01z" /><circle cx="6.5" cy="6.5" r="1.5" />
                </svg>
            );

        default:
            return null;
    }
};

interface MapLegendProps {
    onHover: (type: Node['type'] | null) => void;
    onToggleVisibility: (type: Node['type']) => void;
    visibleTypes: Record<Node['type'], boolean>;
}

const LEGEND_TYPES: Node['type'][] = ['Factory', 'WMS', 'LogiHub', 'Wholesaler', 'Reseller'];

const MapLegend: React.FC<MapLegendProps> = ({ onHover, onToggleVisibility, visibleTypes }) => {
    return (
        <div style={{
            position: 'absolute',
            top: '50px',
            right: '20px',
            background: 'rgba(40, 40, 40)',
            backdropFilter: 'blur(10px)',
            borderRadius: '25px',
            padding: '20px',
            color: '#E0E0E0',
            fontFamily: 'Inter, sans-serif',
            width: '180px',
            zIndex: 2,
        }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#FFFFFF', paddingBottom: '10px' }}
            >Legend</h3>
            {LEGEND_TYPES.map(type => {
                const [r, g, b] = getNodeColor(type);
                const isVisible = visibleTypes[type];

                return (
                    <div
                        key={type}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '12px',
                            cursor: 'pointer',
                            opacity: isVisible ? 1 : 0.4,
                            transition: 'opacity 0.2s, transform 0.2s',
                            willChange: 'opacity, transform',
                        }}
                        onMouseEnter={() => onHover(type)}
                        onMouseLeave={() => onHover(null)}
                        onClick={() => onToggleVisibility(type)}
                    >
                        <div style={{
                            width: '28px',
                            height: '28px',
                            minWidth: '28px',
                            borderRadius: '20%',
                            backgroundColor: `rgb(60, 60, 60)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '12px', // Increased spacing
                            transition: 'all 0.2s ease-out',
                        }}>
                            <NodeIcon type={type} />
                        </div>
                        <span style={{
                            fontSize: '13px', // Slightly larger font
                            color: isVisible ? '#E0E0E0' : '#888888', // Better contrast
                            textDecoration: isVisible ? 'none' : 'line-through',
                            transition: 'color 0.2s, text-decoration 0.2s',
                        }}>
                            {type}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

interface AnomalyListProps {
    anomalies: AnalyzedTrip[];
    onCaseClick: (trip: AnalyzedTrip) => void;
    selectedTripId: string | null;
}

// 위변조 타입을 한글로 변환하는 헬퍼 함수
const getAnomalyName = (type?: AnomalyType) => {
    switch (type) {
        case 'SPACE_JUMP': return '시공간 점프';
        case 'CLONE': return '제품 복제';
        case 'ORDER_ERROR': return '이벤트 순서 오류';
        case 'PATH_FAKE': return '경로 위조';
        default: return '알 수 없는 오류';
    }
};

const getAnomalyColor = (type?: AnomalyType): [number, number, number] => {
    switch (type) {
        case 'SPACE_JUMP': return [199, 21, 133];   // 보라/마젠타 계열 (DeepPink)
        case 'CLONE': return [255, 215, 0];       // 노랑/골드 계열 (Gold)
        case 'ORDER_ERROR': return [255, 140, 0];  // 주황 계열 (DarkOrange)
        case 'PATH_FAKE': return [220, 20, 60];    // 빨강 계열 (Crimson)
        default: return [128, 128, 128];             // 회색 (기본값)
    }
};

const AnomalySearch: React.FC = () => {
    return (
        <div style={{
            fontFamily: 'Inter, sans-serif',
            background: 'rgba(40, 40, 40)',
            borderRadius: '25px',
            padding: '20px',
        }}>
            <h3 style={{
                fontSize: '18px', margin: '0 0 15px 0', color: '#FFFFFF',
            }}>
                Search
            </h3>
            <input
                type="text"
                placeholder="Search by EPC or LotID..."
                style={{
                    width: '100%', padding: '6px 12px', background: 'rgba(20, 22, 25)',
                    border: '1px solid #757575', borderRadius: '25px', color: '#E0E0E0',
                    fontSize: '14px', marginBottom: '15px', boxSizing: 'border-box'
                }}
            />
        </div>
    );
};

const AnomalyFilter: React.FC = () => {
    const buttonStyle: React.CSSProperties = {
        flex: 1, padding: '8px 10px', border: '1px solid #757575',
        borderRadius: '25px', color: '#E0E0E0', fontSize: '13px', cursor: 'pointer',
        textAlign: 'center',
    };

    return (
        <div style={{
            fontFamily: 'Inter, sans-serif',
            background: 'rgba(40, 40, 40)',
            borderRadius: '25px',
            padding: '20px',
        }}>
            <h3 style={{
                fontSize: '18px', margin: '0 0 15px 0', color: '#FFFFFF', fontWeight: 600,
            }}>
                Filter by
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={buttonStyle} className='whitespace-nowrap'>Time Range ▼</button>
                    <button style={buttonStyle} className='whitespace-nowrap'>Location ▼</button>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={buttonStyle} className='whitespace-nowrap'>Event Type ▼</button>
                    <button style={buttonStyle} className='whitespace-nowrap'>Anomaly Type ▼</button>
                </div>
            </div>
        </div>
    );
};


const AnomalyList: React.FC<AnomalyListProps> = ({ anomalies, onCaseClick, selectedTripId }) => {
    const listTopPosition = 50 + 120 + 15 + 140 + 15;
    return (
        <div style={{
            flex: 1,
            minHeight: 0,
            background: 'rgba(40, 40, 40)', // 기존 배경색
            borderRadius: '25px',
            color: '#FFFFFF',
            fontFamily: 'Inter, sans-serif',
            zIndex: 2,

            display: 'flex',       // Flexbox 레이아웃 사용
            flexDirection: 'column', // 아이템을 세로로 정렬
        }}
        >
            <h3 style={{
                margin: 0,
                padding: '20px', // 헤더 패딩 증가
                fontSize: '18px',
                flexShrink: 0,     // 헤더는 줄어들지 않도록 설정
            }}>
                Anomaly List</h3>

            {/* ✅ 스크롤 가능한 콘텐츠 영역 */}
            <div style={{
                overflowY: 'auto',      // 내용이 넘칠 경우 세로 스크롤 생성
                flex: 1,
                padding: '10px 15px',   // 안쪽 여백 (상하 10px, 좌우 15px)
            }}
                className="hide-scrollbar"
            >
                {anomalies.map(trip => {
                    // ✅ 1. 현재 trip의 이상 타입에 맞는 색상을 가져옵니다.
                    const [r, g, b] = getAnomalyColor(trip.anomaly?.type);
                    const isSelected = selectedTripId === trip.id;

                    return (
                        <div
                            key={trip.id}
                            onClick={() => onCaseClick(trip)}
                            style={{
                                padding: '12px 15px',
                                // border: `1px solid ${isSelected ? `rgb(${r}, ${g}, ${b})` : '#555'}`, // 선택 시 테두리 색상도 변경
                                borderRadius: '12px',
                                marginBottom: '10px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                            }}
                            onMouseEnter={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.borderColor = '#777';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderColor = '#555';
                                }
                            }}
                        >
                            {/* ✅ 2. 이상 타입 뱃지 스타일 적용 */}
                            <div style={{
                                display: 'inline-block', // 뱃지 크기가 내용에 맞게 조절되도록
                                padding: '4px 10px',     // 뱃지 내부 여백
                                background: `rgba(${r}, ${g}, ${b}, 0.1)`, // 투명도를 준 배경색
                                color: `rgb(${r}, ${g}, ${b}, 0.8)`,
                                borderRadius: '12px',      // 둥근 모서리 (Pill 모양)
                                fontWeight: '600',
                                fontSize: '13px',
                                marginBottom: '10px',
                            }}>
                                {getAnomalyName(trip.anomaly?.type)}
                            </div>
                            <div style={{ fontSize: '13px', color: '#ccc', marginBottom: '4px' }}>
                                {trip.from} → {trip.to}
                            </div>
                            <div style={{ fontSize: '13px', color: '#ccc' }}>
                                Product: {trip.product}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
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
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
    const [pulseRadius, setPulseRadius] = useState(0);

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

    // ✨ 5. AnomalyList 항목 클릭 시 실행될 핸들러 함수 정의
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
        setSelectedTripId(trip.id);

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
            // _lighting: 'phong',
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
                if (selectedTripId && d.id !== selectedTripId) return [128, 128, 128, 20]; // 선택된 것 외에는 더 흐리게
                switch (d.anomaly?.type) {
                    case 'SPACE_JUMP': return [199, 21, 133, 255]; // 보라
                    case 'CLONE': return [255, 215, 0, 255]; // 노랑
                    case 'ORDER_ERROR': return [255, 140, 0, 255]; // 주황
                    case 'PATH_FAKE': return [220, 20, 60, 255]; // 빨강
                    default: return [128, 128, 128, 80]; // 정상
                }
            },
            getWidth: d => (selectedTripId === d.id ? 5 : 2), // 선택된 선은 더 굵게
            pickable: true,
            onHover: info => setHoverInfo(info),
            onClick: info => setSelectedTripId((info.object as AnalyzedTrip).id),
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
            getFillColor: [255, 0, 0, 255 - (pulseRadius / 1000) * 255], // 점점 투명해짐
            stroked: false,
            pickable: false,
            // 펄스가 건물 아래에 깔리도록 렌더링 순서 조정
            // (이 설정이 없다면, 다른 레이어들보다 뒤에 추가하여 렌더링 순서를 맞춥니다)
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
                    case 'SPACE_JUMP': return [199, 21, 133, 255];
                    case 'CLONE': return [255, 215, 0, 255];
                    case 'ORDER_ERROR': return [255, 140, 0, 255];
                    case 'PATH_FAKE': return [220, 20, 60, 255];
                    default: return [0, 255, 128, 255]; // 정상은 밝은 민트색으로 변경하여 구분
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
                    onClick={info => !info.object && setSelectedTripId(null)}
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
                    top: '50px',
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
                        selectedTripId={selectedTripId}
                    />
                </div>

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
                />
            </div>
        </>
    );
};