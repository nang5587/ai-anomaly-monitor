'use client'
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useSearchParams } from 'next/navigation';
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
import {
    nodesAtom,
    visibleTripsAtom,
    replayTriggerAtom,
    loadInitialDataAtom,
    loadTripsDataAtom, // ✨ trips 로딩 액션 import
    selectedFileIdAtom,
} from '@/stores/mapDataAtoms';
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const TARGET_ANIMATION_DURATION_SECONDS = 15;
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
    onWidgetClick: () => void;
};

const getTripColor = (trip: MergeTrip, options: { opacity: number }): Color => {
    const isAnomalous = trip.anomalyTypeList && trip.anomalyTypeList.length > 0;
    return isAnomalous ? [255, 64, 64, options.opacity] : [255, 255, 255, options.opacity];
};
const getTripAnimationColor = (trip: MergeTrip): Color => {
    const isAnomalous = trip.anomalyTypeList && trip.anomalyTypeList.length > 0;
    return isAnomalous ? [255, 64, 64] : [0, 255, 127]; // 초록색 대신 흰색으로 변경해도 좋습니다.
};

export const SupplyChainMapWidget: React.FC<SupplyChainMapWidgetProps> = ({ onWidgetClick }) => {
    const searchParams = useSearchParams();
    const loadInitialData = useSetAtom(loadInitialDataAtom);
    const loadTrips = useSetAtom(loadTripsDataAtom); // ✨ trips 로딩 액션 추가
    const setSelectedFileId = useSetAtom(selectedFileIdAtom);

    const nodes = useAtomValue(nodesAtom);
    const analyzedTrips = useAtomValue(visibleTripsAtom);
    const replayTrigger = useAtomValue(replayTriggerAtom);

    useEffect(() => {
        const fileIdFromUrl = searchParams.get('fileId');
        if (fileIdFromUrl) {
            const fileId = Number(fileIdFromUrl);
            setSelectedFileId(fileId);

            // 초기 데이터(노드)와 함께 Trip 데이터도 로딩합니다.
            loadInitialData();
            loadTrips(); // ✨ 이 호출이 핵심입니다!
        }
    }, [searchParams, setSelectedFileId, loadInitialData, loadTrips]);

    const { minTime, maxTime } = useMemo(() => {
        if (!analyzedTrips || analyzedTrips.length === 0) {
            return { minTime: 0, maxTime: 1 };
        }
        const startTimes = analyzedTrips.map(t => t.from.eventTime);
        const endTimes = analyzedTrips.map(t => t.to.eventTime);
        return { minTime: Math.min(...startTimes), maxTime: Math.max(...endTimes) };
    }, [analyzedTrips]);

    const [currentTime, setCurrentTime] = useState<number>(minTime);
    const animationFrameRef = useRef<number>();

    const animationSpeed = useMemo(() => {
        const totalDuration = maxTime - minTime;
        if (totalDuration <= 0) return 0;
        const totalFrames = TARGET_ANIMATION_DURATION_SECONDS * 60; // 60fps 기준
        return totalDuration / totalFrames;
    }, [minTime, maxTime]);

    // ✨ 4. 안정적인 애니메이션을 위한 useEffect 수정
    useEffect(() => {
        // 애니메이션을 시작할 조건이 아니면 중단
        if (animationSpeed === 0) {
            setCurrentTime(minTime);
            return;
        }

        const animate = () => {
            setCurrentTime(time => {
                const newTime = time + animationSpeed;
                if (newTime >= maxTime) {
                    // 애니메이션이 끝나면 처음부터 다시 시작
                    return minTime;
                }
                return newTime;
            });
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        setCurrentTime(minTime); // 시간 초기화
        animationFrameRef.current = requestAnimationFrame(animate);

        // 클린업 함수
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [minTime, maxTime, animationSpeed]);

    useEffect(() => {
        setCurrentTime(minTime);
    }, [replayTrigger, minTime]);

    const factoryNodes = useMemo(() => nodes.filter(node => node.businessStep === 'Factory'), [nodes]);
    const otherNodes = useMemo(() => nodes.filter(node => node.businessStep !== 'Factory'), [nodes]);

    if (nodes.length === 0 || !Array.isArray(analyzedTrips)) {
        return (
            <div className="w-full h-full rounded-3xl bg-neutral-900 flex items-center justify-center">
                <p className="text-neutral-500">지도 로딩 중...</p>
            </div>
        );
    }

    // 데이터 로딩은 끝났지만, 실제 데이터가 0건일 때의 처리
    if (analyzedTrips.length === 0) {
        return (
            <div className="w-full h-full rounded-3xl bg-neutral-900 flex items-center justify-center">
                <p className="text-neutral-500">표시할 경로 데이터가 없습니다.</p>
            </div>
        )
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
            data: analyzedTrips,
            getPath: d => d.path || [d.from.coord, d.to.coord],
            getColor: d => getTripColor(d, { opacity: 30 }),
            widthMinPixels: 3,
        }),
        // 건물 및 굴뚝 레이어
        ...otherMeshLayers,
        ...factoryLayers,
        // 동적 이동 애니메이션 레이어
        new TripsLayer<MergeTrip>({
            id: 'widget-trips-layer',
            data: analyzedTrips,
            getPath: d => d.path || [d.from.coord, d.to.coord],
            getTimestamps: d => d.timestamps || [d.from.eventTime, d.to.eventTime],
            getColor: d => getTripAnimationColor(d),
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
                        onLoad={e => {
                            const map = e.target;
                            const setMapStyle = () => {
                                if (map.isStyleLoaded()) {
                                    if (map.getLayer('background')) {
                                        map.setPaintProperty('background', 'background-color', '#000000');
                                    }
                                    if (map.getLayer('water')) {
                                        map.setPaintProperty('water', 'fill-color', '#000000');
                                    }
                                } else {
                                    map.once('styledata', setMapStyle);
                                }
                            };
                            setMapStyle();
                        }}
                    />
                </DeckGL>
            </div>
        </div>
    );
};