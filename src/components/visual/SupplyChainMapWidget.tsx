'use client'
import React, { useMemo, useState, useEffect } from 'react';
import DeckGL from 'deck.gl';

import { LineLayer, ScatterplotLayer } from '@deck.gl/layers';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { TripsLayer } from '@deck.gl/geo-layers';

import { OBJLoader } from '@loaders.gl/obj';
import { parseSync } from '@loaders.gl/core';
import Map from 'react-map-gl';

import { nodes, analyzedTrips, Node, AnalyzedTrip } from './data';
import { cubeModel, factoryBuildingModel } from './models';
import { getNodeColor } from '../visual/colorUtils';
import { useScroll } from 'framer-motion';

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibmFuZzU1ODciLCJhIjoiY21jYnFnZ2RiMDhkNDJybmNwOGZ4ZmwxMCJ9.OBoc45r9z0yM1EpqNuffpQ';

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
    minTime: number;
    maxTime: number;
    onWidgetClick: () => void;
};

export const SupplyChainMapWidget: React.FC<SupplyChainMapWidgetProps> = ({ minTime, maxTime, onWidgetClick }) => {
    const [currentTime, setCurrentTime] = useState<number>(minTime)

    useEffect(() => {
        // 부모로부터 받은 minTime, maxTime이 유효하지 않으면 애니메이션을 시작하지 않음
        if (minTime === Infinity || maxTime === -Infinity) return;

        const DURATION = 5000; // 5초
        const startTime = Date.now();
        let animationFrame: number;

        const animate = () => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / DURATION, 1);
            const newTime = minTime + (maxTime - minTime) * progress;
            setCurrentTime(newTime);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        setCurrentTime(minTime);
        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);

    }, [minTime, maxTime]);

    const staticLines = useMemo(() => {
        return analyzedTrips.map(trip => ({ ...trip, source: trip.path[0], target: trip.path[1] }));
    }, []);

    const factoryNodes = nodes.filter(node => node.type === 'Factory');
    const otherNodes = nodes.filter(node => node.type !== 'Factory');

    // 메쉬 레이어들 (상호작용 제거)
    const otherMeshLayers = Object.keys(OTHER_MODEL_MAPPING).map(type => {
        const filteredNodes = otherNodes.filter(node => node.type === type);
        if (filteredNodes.length === 0) return null;

        return new SimpleMeshLayer<Node>({
            id: `widget-mesh-layer-${type}`,
            data: filteredNodes,
            mesh: OTHER_MODEL_MAPPING[type],
            getPosition: d => d.coordinates,
            getColor: d => getNodeColor(d.type),
            getOrientation: [-90, 0, 0],
            sizeScale: 50,
            getTranslation: [0, 0, 50],
            pickable: false, // 위젯에서는 클릭/호버 비활성화
            material
        });
    }).filter(Boolean);

    const factoryLayers = [
        new SimpleMeshLayer<Node>({
            id: 'widget-factory-building-layer',
            data: factoryNodes,
            mesh: parsedFactoryBuildingModel,
            getPosition: d => d.coordinates,
            getColor: d => getNodeColor(d.type),
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
        new LineLayer({
            id: 'widget-static-supply-lines',
            data: staticLines,
            getSourcePosition: d => d.path[0],
            getTargetPosition: d => d.path[1],
            getColor: d => { // anomalyType에 따른 색상만 유지
                switch (d.anomaly?.type) {
                    case 'jump': return [223, 190, 239];
                    case 'evtOrderErr': return [253, 220, 179];
                    case 'epcFake': return [255, 192, 210];
                    case 'epcDup': return [255, 248, 203];
                    case 'locErr': return [202, 232, 255];
                    default: return [220, 220, 228];
                }
            },
            getWidth: 1, // 얇은 선으로 고정
            pickable: false, // 위젯에서는 클릭/호버 비활성화
        }),
        // 경로 위조 '예상 경로' 레이어
        new LineLayer({
            id: 'widget-expected-path-lines',
            data: staticLines.filter(d => d.anomaly?.type === 'locErr'),
            getSourcePosition: d => (d.anomaly as any).expectedPath[0],
            getTargetPosition: d => (d.anomaly as any).expectedPath[1],
            getColor: [150, 150, 150, 200],
            getWidth: 1,
        }),
        // 건물 및 굴뚝 레이어
        ...otherMeshLayers,
        ...factoryLayers,
        // 동적 이동 애니메이션 레이어
        new TripsLayer<AnalyzedTrip>({
            id: 'widget-trips-layer',
            data: analyzedTrips,
            getPath: d => d.path,
            getTimestamps: d => d.anomaly?.type === 'evtOrderErr' ? [d.timestamps[1], d.timestamps[0]] : d.timestamps,
            getColor: d => {
                switch (d.anomaly?.type) {
                    case 'jump': return [114, 46, 209];
                    case 'evtOrderErr': return [250, 140, 22];
                    case 'epcFake': return [255, 7, 58];
                    case 'epcDup': return [255, 235, 59];
                    case 'locErr': return [24, 144, 255];
                    default: return [144, 238, 144]; // 정상 이동
                }
            },
            opacity: 0.8,
            widthMinPixels: 4,
            rounded: true,
            trailLength: 180,
            currentTime, // 부모로부터 받은 currentTime 사용
        }),
    ];

    return (
        <div onClick={onWidgetClick} style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' }}>
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
                        map.setPaintProperty('background', 'background-color', '#000000');
                        map.setPaintProperty('water', 'fill-color', '#000000');
                    }}
                />
            </DeckGL>
        </div>
    );
};