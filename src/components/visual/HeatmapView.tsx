'use client'
import React, { useMemo, useState, useEffect } from 'react';
import type { PickingInfo, Color } from 'deck.gl';

import { useAtom, useAtomValue } from 'jotai';

// 타입 임포트
import { getTrips, getNodes, type AnalyzedTrip, type LocationNode, anomalyCodeToNameMap, type AnomalyType } from './data';
import { HeatmapViewProps, type EventTypeStats, type NodeWithEventStats, type StatValue } from '@/types/map';
import {
    mapViewStateAtom,
    selectedObjectAtom,
    type MapViewState
} from '@/stores/mapDataAtoms';

import DeckGL from 'deck.gl';
import { ColumnLayer } from '@deck.gl/layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { default as ReactMapGL } from 'react-map-gl';

import { StackedColumnLayer } from './StackedColumnLayer';

import DetailsPanel from './DetailsPanel';

// 이벤트 타입별 색상 정의
const ANOMALY_TYPE_COLORS: Record<AnomalyType, Color> = {
    'jump': [215, 189, 226],   // 시공간 점프
    'evtOrderErr': [250, 215, 160], // 이벤트 순서 오류
    'epcFake': [245, 183, 177],   // EPC 위조
    'epcDup': [252, 243, 207],   // EPC 복제
    'locErr': [169, 204, 227]    // 경로 위조
};
const DEFAULT_COLOR: Color = [201, 203, 207];

// Mapbox 액세스 토큰
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;


export const HeatmapView: React.FC<HeatmapViewProps> = ({ isHighlightMode }) => {
    const [localNodes, setLocalNodes] = useState<LocationNode[]>([]);
    const [localTrips, setLocalTrips] = useState<AnalyzedTrip[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [viewState, setViewState] = useAtom(mapViewStateAtom);
    const [selectedObject, setSelectedObject] = useAtom(selectedObjectAtom);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [nodesData, tripsResponse] = await Promise.all([
                    getNodes(),
                    getTrips()
                ]);
                setLocalNodes(nodesData);
                setLocalTrips(tripsResponse.data);
            } catch (error) {
                console.error("Failed to fetch data for Heatmap:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const nodesWithStats = useMemo((): NodeWithEventStats[] => {
        if (!localTrips.length || !localNodes.length) return [];

        const locationStats = new Map<string, {
            total: number;
            eventTypeStats: EventTypeStats;
        }>();

        localTrips.forEach(trip => {
            // 이 Trip에 anomaly가 없으면 히트맵 집계에서 제외합니다.
            if (!trip.anomalyTypeList || trip.anomalyTypeList.length === 0) {
                return;
            }

            // 3. anomalyTypeList에 있는 각 anomaly를 하나의 이벤트로 간주합니다.
            trip.anomalyTypeList.forEach(anomalyType => {
                // 이벤트가 발생한 위치들을 배열로 만듭니다. (중복 제거)
                const affectedLocations = [...new Set([trip.from.scanLocation, trip.to.scanLocation])];

                affectedLocations.forEach(location => {
                    if (!location) return; // 위치 정보가 없으면 건너뜁니다.

                    // 4. 해당 위치의 통계 객체를 가져오거나 새로 생성합니다.
                    let stats = locationStats.get(location);
                    if (!stats) {
                        stats = {
                            total: 0,
                            // EventTypeStats 초기화
                            eventTypeStats: {},
                        };
                        locationStats.set(location, stats);
                    }

                    // 5. 통계를 업데이트합니다.
                    stats.total += 1;

                    // AnomalyType을 이벤트 타입으로 사용하여 카운트를 올립니다.
                    const eventType = anomalyType;
                    if (!stats.eventTypeStats[eventType]) {
                        stats.eventTypeStats[eventType] = {
                            count: 0,
                            hasAnomaly: true, // 이 뷰의 모든 이벤트는 Anomaly입니다.
                        };
                    }
                    stats.eventTypeStats[eventType].count += 1;
                });
            });
        });

        const mappedNodes = localNodes.map(node => { // 1. 먼저 map을 실행하여 중간 배열을 만듭니다.
            const stats = locationStats.get(node.scanLocation);

            if (!stats) {
                return null; // 통계가 없으면 null을 반환합니다.
            }

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

        // 2. filter를 사용하여 null 값을 제거하고 타입을 확정합니다.
        return mappedNodes.filter(
            (node): node is NodeWithEventStats => node !== null
        ); // null 값을 제거하고 타입 가드를 적용합니다.

    }, [localTrips, localNodes]);
    console.log('🚀 Final Processed Data (nodesWithStats):', nodesWithStats);

    const handleClick = (info: PickingInfo) => {
        if (info.object) setSelectedObject(info.object);
    };

    // HeatmapView.tsx의 renderTooltip 함수

    const renderTooltip = (info: PickingInfo) => {
        if (!info.object) {
            return null;
        }

        // 1. 참고용 코드에서 가져온 기본 스타일 객체를 정의합니다.
        const baseTooltipStyle = {
            position: 'absolute',
            padding: '12px',
            background: 'rgba(40, 40, 40, 0.95)', // 투명도를 약간 주어 backdrop-filter 효과를 살립니다.
            color: '#f8f8f2',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)', // Safari 호환성을 위해 추가
            fontFamily: '"Noto Sans KR", sans-serif',
            fontSize: '14px',
            lineHeight: '1.6',
            maxWidth: '280px', // 최대 너비를 약간 늘려 내용이 잘 보이도록 합니다.
            pointerEvents: 'none' as const, // 타입을 명확히 해줍니다.
            zIndex: '10',
        };

        // 2. 기존 로직은 그대로 유지합니다.
        const node = info.object as NodeWithEventStats;
        const eventTypesList = (Object.entries(node.eventTypeStats) as [string, StatValue][])
            .sort((a, b) => b[1].count - a[1].count)
            .map(([type, stats]) =>
                // 내부 스타일은 그대로 유지하거나 필요에 따라 수정합니다.
                `<div style="display: flex; justify-content: space-between; margin: 2px 0;">
                <span style="color: rgb(${(ANOMALY_TYPE_COLORS[type as AnomalyType] || DEFAULT_COLOR).join(',')}); font-weight: 500;">${anomalyCodeToNameMap[type as AnomalyType] || type}</span>
                <span>${stats.count}건</span>
            </div>`
            ).join('');

        // 3. 반환하는 객체의 html과 style을 수정합니다.
        return {
            // HTML 구조는 그대로 유지합니다.
            html: `
            <div>
                <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px; color: #ffffff;">${node.scanLocation}</div>
                <div style="margin-bottom: 8px;">총 이상 징후: <span style="color: #ff6384; font-weight: bold;">${node.totalEventCount}</span>건</div>
                <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 8px;">
                    <div style="font-size: 14px; margin-bottom: 4px; color: rgba(255,255,255,0.7);">타입별 상세:</div>
                    ${eventTypesList}
                </div>
            </div>
        `,
            // style 속성에 위에서 정의한 baseTooltipStyle 객체를 전달합니다.
            style: baseTooltipStyle
        };
    };

    const layers = useMemo(() => [
        new StackedColumnLayer({
            id: 'stacked-column-layer',
            data: nodesWithStats,
            pickable: true,
            isHighlightMode: isHighlightMode,
            zoom: viewState.zoom,
            radius: 120,
            getElevationScale: 250,
            updateTriggers: {
                isHighlightMode: [isHighlightMode],
                zoom: [viewState.zoom] // 줌 레벨이 변경될 때 레이어가 다시 렌더링되도록 함
            },
        }),
        // 투명한 ScatterplotLayer는 제거 (ColumnLayer가 이미 pickable)
    ], [nodesWithStats, isHighlightMode, viewState.zoom],);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}>
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    zIndex: 20,
                    fontSize: '1.2rem'
                }}>
                    데이터 로딩 중...
                </div>
            )}

            <DeckGL
                layers={layers}
                viewState={viewState}
                onViewStateChange={({ viewState: newViewState }) => {
                    setViewState(newViewState as MapViewState);
                }}
                onClick={handleClick}
                controller={true}
                getTooltip={renderTooltip}
            >
                <ReactMapGL
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

            {/* 범례 */}
            <div
                style={{ position: 'absolute', top: '10px', right: '20px', zIndex: 10 }}
                className="bg-[rgba(40,40,40)] rounded-2xl p-6 text-white w-48 shadow-lg backdrop-blur-sm"
            >
                <h3 className="text-sm font-bold mb-3">이벤트 타입별 분류</h3>
                <div className="space-y-2">
                    {Object.entries(ANOMALY_TYPE_COLORS).map(([type, color]) => (
                        <div key={type} className="flex items-center">
                            <div className="w-4 h-4 rounded mr-3" style={{ backgroundColor: `rgb(${color.join(',')})` }} />
                            <span className="text-xs">{anomalyCodeToNameMap[type as AnomalyType]}</span>
                        </div>
                    ))}
                </div>
                <div className="border-t border-white/20 mt-3 pt-3 text-xs text-gray-300">
                    <p>• 높이: 총 이상 징후 수</p>
                    <p>• 색상: 이상 징후 타입 비율</p>
                </div>
            </div>

            {/* 상세 패널 */}
            <DetailsPanel
                selectedObject={selectedObject}
                onClose={() => setSelectedObject(null)}
            />
        </div>
    );
};