'use client'
import React, { useMemo } from 'react';
import DeckGL, { Color } from 'deck.gl';
import { Map as ReactMapGL } from 'react-map-gl';

// 타입 및 유틸리티 함수 import
import { getNodes, getTrips, type AnalyzedTrip, type LocationNode, anomalyCodeToNameMap, type AnomalyType } from '../../../types/data';
import { type EventTypeStats, type NodeWithEventStats, type StatValue } from '@/types/map';
import { StackedColumnLayer } from '../../visual/StackedColumnLayer'; // HeatmapView에서 사용하던 레이어

// 이벤트 타입별 색상 정의 (HeatmapView와 동일)
const ANOMALY_TYPE_COLORS: Record<AnomalyType, Color> = {
    'fake': [215, 189, 226],
    'tamper': [250, 215, 160],
    'clone': [252, 243, 207],
};
const DEFAULT_COLOR: Color = [201, 203, 207];

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// 위젯용 View State (고정값)
const WIDGET_VIEW_STATE = {
    longitude: 127.9,
    latitude: 36.5,
    zoom: 6.5,
    pitch: 45, // 컬럼이 잘 보이도록 pitch를 줍니다.
    bearing: 0,
};

// Props 타입 정의
type HeatmapWidgetProps = {
    nodes: LocationNode[];
    trips: AnalyzedTrip[];
    showLegend?: boolean; // 범례 표시 여부를 옵션으로 받습니다.
    onWidgetClick: () => void;
};

export const HeatmapViewWidget: React.FC<HeatmapWidgetProps> = ({ nodes, trips, showLegend = false, onWidgetClick }) => {

    // HeatmapView의 핵심 로직: 데이터를 props로 받아 통계를 계산합니다.
    const nodesWithStats = useMemo((): NodeWithEventStats[] => {
        if (!trips.length || !nodes.length) return [];

        const locationStats = new Map<string, { total: number; eventTypeStats: EventTypeStats; }>();

        trips.forEach(trip => {
            if (!trip.anomalyTypeList || trip.anomalyTypeList.length === 0) return;

            trip.anomalyTypeList.forEach(anomalyType => {
                const affectedLocations = [...new Set([trip.from.scanLocation, trip.to.scanLocation])];
                affectedLocations.forEach(location => {
                    if (!location) return;
                    let stats = locationStats.get(location);
                    if (!stats) {
                        stats = { total: 0, eventTypeStats: {} };
                        locationStats.set(location, stats);
                    }
                    stats.total += 1;
                    const eventType = anomalyType;
                    if (!stats.eventTypeStats[eventType]) {
                        stats.eventTypeStats[eventType] = { count: 0, hasAnomaly: true };
                    }
                    stats.eventTypeStats[eventType].count += 1;
                });
            });
        });

        const mappedNodes = nodes.map(node => {
            const stats = locationStats.get(node.scanLocation);
            if (!stats) return null;

            let dominantType = '';
            let dominantCount = 0;
            Object.entries(stats.eventTypeStats).forEach(([type, typeStats]) => {
                if (typeStats.count > dominantCount) {
                    dominantType = type;
                    dominantCount = typeStats.count;
                }
            });

            return {
                ...node,
                totalEventCount: stats.total,
                hasAnomaly: true,
                eventTypeStats: stats.eventTypeStats,
                dominantEventType: dominantType,
                dominantEventCount: dominantCount,
            } as NodeWithEventStats;
        });

        return mappedNodes.filter((node): node is NodeWithEventStats => node !== null);
    }, [trips, nodes]);

    // 데이터가 준비되지 않았을 때 로딩 상태 표시
    if (nodes.length === 0 || trips.length === 0) {
        return (
            <div className="w-full h-full rounded-3xl bg-neutral-900 flex items-center justify-center">
                <p className="text-neutral-500">히트맵 로딩 중...</p>
            </div>
        );
    }

    const layers = [
        new StackedColumnLayer({
            id: 'widget-stacked-column-layer',
            data: nodesWithStats,
            pickable: false, // 위젯에서는 클릭 비활성화
            radius: 120,
            getElevationScale: 250,
            zoom: WIDGET_VIEW_STATE.zoom,
        }),
    ];

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                cursor: 'pointer', // 마우스 커서를 포인터로 변경
            }}
            onClick={onWidgetClick}
        >
            <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' }}>
                <DeckGL
                    layers={layers}
                    initialViewState={WIDGET_VIEW_STATE}
                    controller={false} // 지도 컨트롤 비활성화
                >
                    <ReactMapGL
                        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
                        mapStyle="mapbox://styles/mapbox/dark-v11"
                        onLoad={e => {
                            const map = e.target;
                            const setMapStyle = () => {
                                if (map.isStyleLoaded()) {
                                    if (map.getLayer('background')) map.setPaintProperty('background', 'background-color', '#000000');
                                    if (map.getLayer('water')) map.setPaintProperty('water', 'fill-color', '#000000');
                                } else {
                                    map.once('styledata', setMapStyle);
                                }
                            };
                            setMapStyle();
                        }}
                    />
                </DeckGL>
            </div>

            {/* 범례 (showLegend prop에 따라 조건부 렌더링) */}
            {showLegend && (
                <div
                    style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, fontSize: '10px' }}
                    className="bg-black/50 rounded p-2 text-white w-32 shadow backdrop-blur-sm"
                >
                    <h3 className="text-xs font-bold mb-2">이상 타입</h3>
                    <div className="space-y-1">
                        {Object.entries(ANOMALY_TYPE_COLORS).map(([type, color]) => (
                            <div key={type} className="flex items-center">
                                <div className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: `rgb(${color.join(',')})` }} />
                                <span className="text-xs">{anomalyCodeToNameMap[type as AnomalyType]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};