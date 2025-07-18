'use client'
import React, { useMemo, useState, useRef } from 'react';
import type { PickingInfo } from 'deck.gl';

import { useAtom, useAtomValue } from 'jotai';
import {
    nodesAtom,
    tripsAtom,
    mapViewStateAtom,
    type MapViewState
} from '@/stores/mapDataAtoms';

import DeckGL from 'deck.gl';
import { HeatmapLayer } from '@deck.gl/aggregation-layers'; // 히트맵 레이어
import { ScatterplotLayer } from '@deck.gl/layers';
import { default as ReactMapGL } from 'react-map-gl';

import { type TripWithId } from './SupplyChainDashboard';
import { type Node, type AnalyzedTrip } from './data';

// Mapbox 액세스 토큰
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface HeatmapViewProps {
    isHighlightMode: boolean;
}

type NodeWithEventStats = Node & {
    totalEventCount: number; // 전체 이벤트 건수
    hasAnomaly: boolean;     // 이상 징후 포함 여부
};

export const HeatmapView: React.FC<HeatmapViewProps> = ({ isHighlightMode }) => {
    const nodes = useAtomValue(nodesAtom);
    const currentTrips = useAtomValue(tripsAtom);
    const [viewState, setViewState] = useAtom(mapViewStateAtom); // 지도 시점은 다른 맵과 공유될 수 있습니다.
    const allTripsRef = useRef<TripWithId[]>([]); // 가장 긴 데이터를 기억할 저장소 역할

    const tripsForHeatmap = useMemo(() => {
        if (currentTrips && currentTrips.length > allTripsRef.current.length) {
            allTripsRef.current = currentTrips;
        }
        
        return allTripsRef.current;
    }, [currentTrips]);

    const nodesWithStats = useMemo((): NodeWithEventStats[] => {
        if (!Array.isArray(tripsForHeatmap) || !Array.isArray(nodes)) {
            return [];
        }

        const eventCounts = new Map<string, { total: number, hasAnomaly: boolean }>();

        tripsForHeatmap.forEach(trip => {
            if (!trip || !trip.from?.scanLocation || !trip.to?.scanLocation) return;

            const locations = [trip.from.scanLocation, trip.to.scanLocation];
            const isAnomaly = trip.anomalyTypeList && trip.anomalyTypeList.length > 0;

            locations.forEach(loc => {
                const stats = eventCounts.get(loc) || { total: 0, hasAnomaly: false };
                stats.total += 1;
                if (isAnomaly) {
                    stats.hasAnomaly = true;
                }
                eventCounts.set(loc, stats);
            });
        });

        if (eventCounts.size === 0) return [];

        return nodes
            .map(node => {
                const stats = eventCounts.get(node.scanLocation);
                // 이벤트가 발생한 노드만 반환
                return stats ? {
                    ...node,
                    totalEventCount: stats.total,
                    hasAnomaly: stats.hasAnomaly
                } : null;
            })
            .filter((node): node is NodeWithEventStats => node !== null);
    }, [tripsForHeatmap, nodes]);

    const renderTooltip = (info: PickingInfo) => {
        if (info.layer?.id !== 'scatterplot-layer-picking' || !info.object) {
            return null;
        }
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

        // const node = info.object as AnomalyNodeWithCount;
        const node = info.object as NodeWithEventStats;
        const anomalyText = node.hasAnomaly
            ? `<div style="color: #ff6384; font-weight: bold; margin-top: 4px;">(이상 징후 포함)</div>`
            : '';
        return {
            html: `
                    <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">${node.scanLocation}</div>
                    <div>전체 이벤트<span style="color: #ff6384; font-size: 1.1em; font-weight: bold;">${node.totalEventCount}</span> 건</div>
                    ${anomalyText}
            `,
            style: {
                ...baseTooltipStyle,
                pointerEvents: 'none',
                zIndex: '10',
            }
        };
    };

    const layers = useMemo(() => [
        new HeatmapLayer({
            id: 'heatmap-layer-visual',
            data: nodesWithStats,
            getPosition: d => d.coord,
            radiusPixels: 70,
            getWeight: (d: NodeWithEventStats) => {
                if (isHighlightMode) {
                    // 강조 모드 ON: 이상 징후가 있는 노드만 가중치를 갖고, 나머지는 0
                    return d.hasAnomaly ? d.totalEventCount : 0;
                }
                // 강조 모드 OFF: 모든 노드가 자신의 전체 이벤트 건수를 가중치로 가짐
                return d.totalEventCount;
            },

            // ✨ updateTriggers 추가: isHighlightMode가 바뀔 때 getWeight를 다시 계산하도록 함
            updateTriggers: {
                getWeight: [isHighlightMode],
            },
        }),
        new ScatterplotLayer({
            id: 'scatterplot-layer-picking',
            data: nodesWithStats,
            getPosition: d => d.coord,
            getFillColor: [0, 0, 0, 0],
            getLineColor: [0, 0, 0, 0],
            pickable: true,
            radiusMinPixels: 30,
        }),
    ], [nodesWithStats, isHighlightMode]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}>

            <DeckGL
                layers={layers}
                viewState={viewState}
                onViewStateChange={({ viewState: newViewState }) => {
                    // 사용자가 지도를 움직이면 전역 상태를 업데이트합니다.
                    setViewState(newViewState as MapViewState);
                }}
                controller={true} // 사용자가 지도를 확대/축소/회전할 수 있도록 허용
                getTooltip={renderTooltip}
            >
                <ReactMapGL
                    mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
                    mapStyle="mapbox://styles/mapbox/dark-v11"
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
                />
            </DeckGL>
        </div>
    );
};