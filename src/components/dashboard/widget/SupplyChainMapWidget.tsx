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
    loadTripsDataAtom,
    selectedFileIdAtom,
} from '@/stores/mapDataAtoms';
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const TARGET_ANIMATION_DURATION_SECONDS = 15;
const WIDGET_VIEW_STATE = {
    longitude: 127.9,
    latitude: 36,
    zoom: 6.8,
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
    return isAnomalous ? [255, 64, 64] : [0, 255, 127];
};

export const SupplyChainMapWidget: React.FC<SupplyChainMapWidgetProps> = ({ onWidgetClick }) => {
    const searchParams = useSearchParams();
    const loadInitialData = useSetAtom(loadInitialDataAtom);
    const loadTrips = useSetAtom(loadTripsDataAtom);
    const setSelectedFileId = useSetAtom(selectedFileIdAtom);
    const nodes = useAtomValue(nodesAtom);
    const analyzedTrips = useAtomValue(visibleTripsAtom);
    const replayTrigger = useAtomValue(replayTriggerAtom);

    useEffect(() => {
        const fileIdFromUrl = searchParams.get('fileId');
        if (fileIdFromUrl) {
            const fileId = Number(fileIdFromUrl);
            setSelectedFileId(fileId);
            loadInitialData();
            loadTrips();
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
        const totalFrames = TARGET_ANIMATION_DURATION_SECONDS * 60;
        return totalDuration / totalFrames;
    }, [minTime, maxTime]);

    useEffect(() => {
        if (animationSpeed === 0) {
            setCurrentTime(minTime);
            return;
        }

        const animate = () => {
            setCurrentTime(time => {
                const newTime = time + animationSpeed;
                if (newTime >= maxTime) {
                    return minTime;
                }
                return newTime;
            });
            animationFrameRef.current = requestAnimationFrame(animate);
        };
        setCurrentTime(minTime);
        animationFrameRef.current = requestAnimationFrame(animate);

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

    if (analyzedTrips.length === 0) {
        return (
            <div className="w-full h-full rounded-3xl bg-neutral-900 flex items-center justify-center">
                <p className="text-neutral-500">표시할 경로 데이터가 없습니다.</p>
            </div>
        )
    }

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
            pickable: false,
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
            pickable: false,
            material
        }),
    ];

    const layers = [
        new PathLayer<MergeTrip>({
            id: 'widget-static-paths',
            data: analyzedTrips,
            getPath: d => d.path || [d.from.coord, d.to.coord],
            getColor: d => getTripColor(d, { opacity: 30 }),
            widthMinPixels: 3,
        }),
        ...otherMeshLayers,
        ...factoryLayers,
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
                    controller={false}
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