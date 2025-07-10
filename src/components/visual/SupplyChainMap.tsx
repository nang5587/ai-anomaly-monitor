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
import MapLegend from './MapLegend';

import { getNodeColor, getAnomalyColor, getAnomalyName } from '../visual/colorUtils';
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

type TripWithId = AnalyzedTrip & { id: string };

interface SupplyChainMapProps {
    nodes: Node[];
    analyzedTrips: TripWithId[];
    selectedObject: TripWithId | Node | null;
    onObjectSelect: (object: TripWithId | Node | null) => void;
}

export const SupplyChainMap: React.FC<SupplyChainMapProps> = ({
    nodes,
    analyzedTrips,
    selectedObject,
    onObjectSelect
}) => {
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


    const validTrips = useMemo(() => {
        if (!analyzedTrips) return [];
        // from/to 객체와 그 안의 coord 속성이 유효한지 확인합니다.
        return analyzedTrips.filter(trip =>
            trip && trip.from?.coord && trip.to?.coord
        );
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

            // 이상 유형이 있을 때만 해당 라인을 추가
            const anomalyLine = trip.anomaly
                ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); color: #FFFFFF; font-weight: semi-bold;">
                        이상 유형: ${getAnomalyName(trip.anomaly)}
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
    const anomalyList = useMemo(() => validTrips.filter(t => t.anomaly), [validTrips]);

    useEffect(() => {
        // 선택된 객체가 없으면 아무것도 하지 않고 종료합니다.
        if (!selectedObject) return;

        // 1. 선택된 객체가 'Trip' 타입일 경우 (from, to 속성으로 확인)
        if ('from' in selectedObject && 'to' in selectedObject) {
            const trip = selectedObject;
            // 출발지와 도착지 좌표가 유효한지 확인
            if (!trip.from?.coord || !trip.to?.coord) return;

            const [x1, y1] = trip.from.coord;
            const [x2, y2] = trip.to.coord;

            // 두 지점의 중간 지점을 계산합니다.
            const longitude = (x1 + x2) / 2;
            const latitude = (y1 + y2) / 2;

            // setViewState를 호출하여 카메라를 이동시킵니다.
            setViewState((currentViewState: any) => ({
                ...currentViewState,
                longitude,
                latitude,
                zoom: 10, // trip을 보여주기에 적절한 줌 레벨 (조정 가능)
                pitch: 45,
                transitionDuration: 1500, // 1.5초 동안 부드럽게 이동
                transitionInterpolator: new FlyToInterpolator(), // 날아가는 효과
            }));
        }
        // 2. 선택된 객체가 'Node' 타입일 경우 (coord 속성으로 확인)
        else if ('coord' in selectedObject) {
            const node = selectedObject;
            // setViewState를 호출하여 카메라를 이동시킵니다.
            setViewState((currentViewState: any) => ({
                ...currentViewState,
                longitude: node.coord[0],
                latitude: node.coord[1],
                zoom: 13, // node를 보여주기에 적절한 줌 레벨 (조정 가능)
                pitch: 60,
                transitionDuration: 1500,
                transitionInterpolator: new FlyToInterpolator(),
            }));
        }

    }, [selectedObject]);

    // AnomalyList 항목 클릭 시 해당 경로를 중앙에 보여주는 함수
    // 
    const handleCaseClick = (trip: TripWithId) => {
        // 1. 상세 보기 패널 업데이트 (이 부분은 유지)
        onObjectSelect(trip);

        // 2. 시간 슬라이더를 이벤트 발생 시점으로 이동 (이 부분은 유지)
        setCurrentTime(trip.from.eventTime);

        // 3. 카메라 이동 로직은 위에서 추가한 useEffect가 처리하므로, 여기서는 제거해도 됩니다.
        /*
        const [x1, y1] = trip.from.coord;
        const [x2, y2] = trip.to.coord;
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
        */
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
            onClick: info => onObjectSelect(info.object as Node),
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
            onClick: info => onObjectSelect(info.object as Node),
            material
        }),
    ];

    // 이상 발생 노드 ID 목록
    const anomalyNodeIds = useMemo(() => {
        const ids = new Set<string>();
        validTrips.forEach(trip => {
            if (trip.anomaly) {
                ids.add(trip.from.scanLocation);
                ids.add(trip.to.scanLocation);
            }
        });
        return Array.from(ids);
    }, [validTrips]);

    // 위변조 관련 노드 데이터만 필터링
    const anomalyNodes = useMemo(() => {
        if (!nodes) return [];
        return nodes.filter(node => anomalyNodeIds.includes(node.hubType));
    }, [nodes, anomalyNodeIds]);

    // 전체 레이어 목록
    const layers = [
        // 1. 정적 연결선 레이어
        new LineLayer<TripWithId>({
            id: 'static-supply-lines',
            data: validTrips,
            getSourcePosition: d => d.from.coord,
            getTargetPosition: d => d.to.coord,
            getColor: d => {
                // 👇 getColor에서도 동일한 로직 적용
                let isSelected = false;
                // selectedObject가 존재하고, 'id' 속성을 가지고 있으며, 그 id가 현재 라인의 id와 같은지 확인
                if (selectedObject && 'id' in selectedObject) {
                    isSelected = selectedObject.id === d.id;
                }

                if (selectedObject && !isSelected) return [128, 128, 128, 20];
                
                if (d.anomaly) {
                    const color = getAnomalyColor(d.anomaly);
                    return isSelected ? [255, 255, 255, 255] : [...color, 200];
                }
                return isSelected ? [0, 255, 127, 255] : [0, 255, 127, 50];
            },
            getWidth: d => {
                let isSelected = false;
                if (selectedObject && 'id' in selectedObject) {
                    isSelected = selectedObject.id === d.id;
                }
                return isSelected ? 5 : 2;
            },
            pickable: true,
            onHover: info => setHoverInfo(info),
            onClick: info => onObjectSelect(info.object as TripWithId),
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

            // [데이터 방어] 경로 데이터가 유효한지 확인합니다.
            // path가 배열이고, 두 개의 좌표를 포함하는지 체크합니다.
            getPath: d => [d.from.coord, d.to.coord],
            getTimestamps: d => [d.from.eventTime, d.to.eventTime],

            getColor: d => {
                console.log('Trip ID:', d.id, 'Anomaly Value:', d.anomaly, 'Type:', typeof d.anomaly);

                if (d.anomaly) {
                    return getAnomalyColor(d.anomaly);
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
                {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}

                {/* DeckGL + Mapbox */}
                <DeckGL
                    layers={layers} viewState={viewState}
                    onClick={info => !info.object && onObjectSelect(null)}
                    onViewStateChange={({ viewState: newViewState }) => {
                        setViewState(newViewState);
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
                                    onObjectSelect(node);
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