'use client'
import React, { useMemo, useState, useEffect } from 'react';
import DeckGL, { type Color } from 'deck.gl';

import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { TripsLayer } from '@deck.gl/geo-layers';

import { OBJLoader } from '@loaders.gl/obj';
import { parseSync } from '@loaders.gl/core';
import Map from 'react-map-gl';

import { type LocationNode, type AnalyzedTrip } from '../../../types/data';
import { type MergeTrip } from '../../visual/SupplyChainDashboard';
import { cubeModel, factoryBuildingModel } from '../../visual/models';
import { getNodeColor, getAnomalyColor } from '../../../types/colorUtils';

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// 위젯용 View State는 고정값으로 사용
const WIDGET_VIEW_STATE = {
    longitude: 127.9,
    latitude: 36,
    zoom: 6.8, // 전체를 조망하기 좋게 살짝 더 줌아웃
    pitch: 10,
    bearing: 0,
};

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

// 모델 파싱 (기존과 동일)
const parsedCubeModel = parseSync(cubeModel, OBJLoader);
const parsedFactoryBuildingModel = parseSync(factoryBuildingModel, OBJLoader);
const OTHER_MODEL_MAPPING: Record<string, any> = {
    WMS: parsedCubeModel,
    LogiHub: parsedCubeModel,
    Wholesaler: parsedCubeModel,
    Reseller: parsedCubeModel,
};

type SupplyChainMapWidgetProps = {
    nodes: LocationNode[];
    analyzedTrips: AnalyzedTrip[];
    minTime: number;
    maxTime: number;
    onWidgetClick: () => void;
};

export const SupplyChainMapWidget: React.FC<SupplyChainMapWidgetProps> = ({ nodes, analyzedTrips, minTime, maxTime, onWidgetClick }) => {
    const [currentTime, setCurrentTime] = useState<number>(minTime);

    useEffect(() => {
        if (minTime === Infinity || maxTime === -Infinity || minTime >= maxTime) {
            setCurrentTime(minTime); // 시간 초기화
            return;
        }

        let animationFrame: number;

        const animate = () => {
            setCurrentTime(time => {
                const newTime = time + 1; // 또는 적절한 ANIMATION_SPEED

                // maxTime에 도달하면 애니메이션을 멈춤
                if (newTime >= maxTime) {
                    cancelAnimationFrame(animationFrame);
                    return maxTime;
                }

                animationFrame = requestAnimationFrame(animate);
                return newTime;
            });
        };

        // 애니메이션 시작
        setCurrentTime(minTime); // 항상 minTime부터 시작
        animationFrame = requestAnimationFrame(animate);

        // 클린업 함수: minTime, maxTime이 변경되어 재실행될 때 이전 애니메이션을 정리
        return () => cancelAnimationFrame(animationFrame);

    }, [minTime, maxTime]);

    const validTrips = useMemo(() => {
        if (!analyzedTrips) return [];
        return analyzedTrips.filter(trip => trip && trip.from?.coord && trip.to?.coord);
    }, [analyzedTrips]);

    const factoryNodes = useMemo(() => nodes.filter(node => node.businessStep === 'Factory'), [nodes]);
    const otherNodes = useMemo(() => nodes.filter(node => node.businessStep !== 'Factory'), [nodes]);

    // ✨ 5. 데이터가 로드되지 않았을 경우를 대비한 로딩 상태 처리
    if (nodes.length === 0 || analyzedTrips.length === 0) {
        return (
            <div className="w-full h-full rounded-3xl bg-neutral-900 flex items-center justify-center">
                <p className="text-neutral-500">지도 로딩 중...</p>
            </div>
        );
    }

    // 메쉬 레이어들 (상호작용 제거)
    const otherMeshLayers = Object.keys(OTHER_MODEL_MAPPING).map(type => {
        const filteredNodes = otherNodes.filter(node => node.businessStep === type);
        if (filteredNodes.length === 0) return null;

        return new SimpleMeshLayer<LocationNode>({
            id: `widget-mesh-layer-${type}`,
            data: filteredNodes,
            mesh: OTHER_MODEL_MAPPING[type],
            getPosition: d => d.coord,
            getColor: d => getNodeColor(d.businessStep),
            getOrientation: [-90, 0, 0],
            sizeScale: 50,
            getTranslation: [0, 0, 50],
            pickable: false, // 위젯에서는 클릭/호버 비활성화
            material
        });
    }).filter(Boolean);

    const factoryLayers = [
        new SimpleMeshLayer<LocationNode>({
            id: 'widget-factory-building-layer',
            data: factoryNodes,
            mesh: parsedFactoryBuildingModel,
            getPosition: d => d.coord,
            getColor: d => getNodeColor(d.businessStep),
            getOrientation: [-90, 180, 0],
            sizeScale: 50,
            getTranslation: [0, 0, 50],
            pickable: false, // 위젯에서는 클릭/호버 비활성화
            material
        }),
    ];

    // 모든 레이어를 합침
    const layers = [
        // 정적 연결선 레이어 (선택 하이라이트 로직 제거)
        new PathLayer<MergeTrip>({
            id: 'widget-static-paths',
            data: validTrips,
            getPath: d => d.path || [d.from.coord, d.to.coord],
            getColor: d => {
                // ✨ 수정: trip.anomalyType -> trip.anomalyTypeList
                const representativeAnomaly = d.anomalyTypeList && d.anomalyTypeList.length > 0 ? d.anomalyTypeList[0] : null;
                if (representativeAnomaly) {
                    return [255, 64, 64, 30] as Color;
                }
                return [255, 255, 255, 30];
            },
            widthMinPixels: 3,
        }),
        // 건물 및 굴뚝 레이어
        ...otherMeshLayers,
        ...factoryLayers,
        // 동적 이동 애니메이션 레이어
        new TripsLayer<MergeTrip>({
            id: 'widget-trips-layer',
            data: validTrips,
            getPath: d => d.path || [d.from.coord, d.to.coord],
            getTimestamps: d => d.timestamps || [d.from.eventTime, d.to.eventTime],
            getColor: d => {
                const representativeAnomaly = d.anomalyTypeList && d.anomalyTypeList.length > 0 ? d.anomalyTypeList[0] : null;
                // 대표 이상 유형이 있으면 해당 색상을, 없으면 기본 초록색을 반환
                return representativeAnomaly ? [255, 64, 64] as Color : [0, 255, 127];
            },
            widthMinPixels: 3,
            capRounded: true,
            jointRounded: true,
            trailLength: 180,
            currentTime,
        }),
    ];

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                cursor: 'pointer',
            }}
            onClick={onWidgetClick}
        >
            <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' }}>
                <DeckGL
                    layers={layers}
                    initialViewState={WIDGET_VIEW_STATE}
                    controller={false} // 지도 컨트롤(줌, 이동) 비활성화
                >
                    <Map
                        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
                        mapStyle="mapbox://styles/mapbox/dark-v11"
                        // 배경을 완전히 검게 만들어 DeckGL과 자연스럽게 어울리게 함
                        onLoad={e => {
                            const map = e.target;

                            const setCustomColors = () => {
                                // 레이어가 존재하는지 한번 더 확인하여 에러를 원천 봉쇄합니다.
                                if (map.getLayer('background')) {
                                    map.setPaintProperty('background', 'background-color', '#000000');
                                }
                                if (map.getLayer('water')) {
                                    map.setPaintProperty('water', 'fill-color', '#000000');
                                }
                            };

                            // 맵이 완전히 유휴 상태가 되면(모든 소스 로드 및 렌더링 완료) 이벤트를 실행합니다.
                            // 'once'를 사용하여 이 리스너가 단 한 번만 실행되도록 보장합니다.
                            map.once('idle', setCustomColors);
                        }}
                    />
                </DeckGL>
            </div>
        </div>
    );
};