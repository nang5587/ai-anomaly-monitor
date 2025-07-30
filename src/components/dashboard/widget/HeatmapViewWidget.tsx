'use client'
import React, { useMemo } from 'react';
import DeckGL, { Color } from 'deck.gl';
import { Map as ReactMapGL } from 'react-map-gl';

import { useAtomValue } from 'jotai';
import { nodesAtom, allAnomalyTripsAtom } from '@/stores/mapDataAtoms';

// 타입 및 유틸리티 함수 import
import { getNodes, getTrips, type AnalyzedTrip, type LocationNode, anomalyCodeToNameMap, type AnomalyType } from '../../../types/data';
import { type EventTypeStats, type NodeWithEventStats, type StatValue } from '@/types/map';
import { StackedColumnLayer } from '../../visual/StackedColumnLayer'; // HeatmapView에서 사용하던 레이어

import { ANOMALY_TYPE_COLORS } from '@/types/colorUtils';
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
type HeatmapViewWidgetProps = {
    onWidgetClick: () => void;
    showLegend: boolean; // 이런 UI 관련 prop은 유지 가능
};

export const HeatmapViewWidget: React.FC<HeatmapViewWidgetProps> = ({ showLegend = false, onWidgetClick }) => {
    const nodes = useAtomValue(nodesAtom);
    const trips = useAtomValue(allAnomalyTripsAtom)
    
    // HeatmapView의 핵심 로직: 데이터를 props로 받아 통계를 계산합니다.
    const nodesWithStats = useMemo((): NodeWithEventStats[] => {
        if (!trips || !nodes || nodes.length === 0) return [];

        const statsMap = new Map<string, Record<string, number>>();

        trips.forEach(trip => {
            if (!trip.anomalyTypeList || trip.anomalyTypeList.length === 0) return;
            const locations = [trip.from.scanLocation, trip.to.scanLocation];
            locations.forEach(location => {
                if (!location) return;
                if (!statsMap.has(location)) {
                    statsMap.set(location, {});
                }
                const locationStats = statsMap.get(location)!;
                trip.anomalyTypeList.forEach(anomalyType => {
                    locationStats[anomalyType] = (locationStats[anomalyType] || 0) + 1;
                });
            });
        });

        // ✨ 3. map과 filter를 결합하여 타입을 만족시키는 객체만 생성합니다.
        //    Array.prototype.reduce를 사용하면 더 깔끔합니다.
        return nodes.reduce((acc: NodeWithEventStats[], node) => {
            const stats = statsMap.get(node.scanLocation);

            // 통계가 있는 노드만 변환합니다.
            if (stats) {
                const totalCount = Object.values(stats).reduce((sum, count) => sum + count, 0);

                let dominantType = '';
                let dominantCount = 0;
                Object.entries(stats).forEach(([type, count]) => {
                    if (count > dominantCount) {
                        dominantType = type;
                        dominantCount = count;
                    }
                });

                // NodeWithEventStats 타입에 맞는 객체를 생성하여 acc 배열에 추가
                acc.push({
                    ...node,
                    totalEventCount: totalCount,
                    hasAnomaly: true,
                    // eventTypeStats는 { [key: string]: { count: number; hasAnomaly: boolean } } 형태여야 합니다.
                    eventTypeStats: Object.fromEntries(
                        Object.entries(stats).map(([type, count]) => [type, { count, hasAnomaly: true }])
                    ),
                    dominantEventType: dominantType,
                    dominantEventCount: dominantCount,
                });
            }

            return acc;
        }, []); // 초기값은 빈 NodeWithEventStats 배열

    }, [trips, nodes]);

    // 데이터 로딩 상태 처리
    if (!nodes || nodes.length === 0 || !trips) {
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
            radius: 40,
            // getSegmentColor: (d: any) => ANOMALY_TYPE_COLORS[d.key as AnomalyType] || [200, 200, 200],
            zoom: WIDGET_VIEW_STATE.zoom,
            getElevationScale: 250,
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