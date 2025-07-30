'use client'
import React, { useMemo, useEffect } from 'react';
import type { PickingInfo, Color } from 'deck.gl';

import { useAtom, useAtomValue } from 'jotai';

// 타입 임포트
import { type AnalyzedTrip, type LocationNode, anomalyCodeToNameMap, type AnomalyType } from '../../types/data';
import { type EventTypeStats, type NodeWithEventStats, type StatValue } from '@/types/map';
import {
    mapViewStateAtom,
    selectedObjectAtom,
    allAnomalyTripsAtom,
    type MapViewState,
    nodesAtom,
} from '@/stores/mapDataAtoms';
import { tutorialSeenAtom } from '@/stores/uiAtoms';

import TutorialOverlay from './TutorialOverlay';
import DeckGL from 'deck.gl';
import { default as ReactMapGL } from 'react-map-gl';

import { StackedColumnLayer } from './StackedColumnLayer';

import { ANOMALY_TYPE_COLORS } from '@/types/colorUtils';

const DEFAULT_COLOR: Color = [201, 203, 207];

// Mapbox 액세스 토큰
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;


export const HeatmapView: React.FC = () => {
    const [viewState, setViewState] = useAtom(mapViewStateAtom);
    const [selectedObject, setSelectedObject] = useAtom(selectedObjectAtom);
    const [hasSeenTutorial, setHasSeenTutorial] = useAtom(tutorialSeenAtom);
    const allAnomalies = useAtomValue(allAnomalyTripsAtom);
    const allNodes = useAtomValue(nodesAtom);

    useEffect(() => {
        // 만약 튜토리얼이 아직 보여지고 있다면 (한 번도 안 봤다면)
        if (!hasSeenTutorial) {
            const timer = setTimeout(() => {
                setHasSeenTutorial(true);
            }, 5000); // 5초

            return () => clearTimeout(timer);
        }
    }, [hasSeenTutorial, setHasSeenTutorial]);


    const nodesWithStats = useMemo((): NodeWithEventStats[] => {
        // 1. 의존성 배열의 데이터 소스를 로컬 상태에서 Jotai 아톰 값으로 변경
        if (!allAnomalies || allAnomalies.length === 0 || !allNodes || allNodes.length === 0) {
            return [];
        }

        // 각 위치(scanLocation)별 통계를 저장할 Map
        const locationStats = new Map<string, {
            total: number;
            // EventTypeStats 타입에 맞게 수정
            eventTypeStats: EventTypeStats;
        }>();

        // 2. localTrips -> allAnomalies
        // allAnomalyTripsAtom은 이미 이상 징후만 포함하므로 추가 필터링이 필요 없습니다.
        allAnomalies.forEach(trip => {
            // anomalyTypeList의 각 anomaly를 하나의 이벤트로 간주합니다.
            trip.anomalyTypeList.forEach(anomalyType => {
                // 이벤트가 발생한 위치들을 배열로 만듭니다. (중복 제거)
                const affectedLocations = [...new Set([trip.from.scanLocation, trip.to.scanLocation])];

                affectedLocations.forEach(location => {
                    if (!location) return; // 위치 정보가 없으면 건너뜁니다.

                    // 해당 위치의 통계 객체를 가져오거나 새로 생성합니다.
                    let stats = locationStats.get(location);
                    if (!stats) {
                        stats = {
                            total: 0,
                            eventTypeStats: {}, // EventTypeStats 초기화
                        };
                        locationStats.set(location, stats);
                    }

                    // 통계를 업데이트합니다.
                    stats.total += 1;

                    // AnomalyType을 이벤트 타입으로 사용하여 카운트를 올립니다.
                    const eventType: AnomalyType = anomalyType;
                    if (!stats.eventTypeStats[eventType]) {
                        stats.eventTypeStats[eventType] = {
                            count: 0,
                            hasAnomaly: true, // 이 뷰의 모든 이벤트는 Anomaly입니다.
                        };
                    }
                    stats.eventTypeStats[eventType]!.count += 1;
                });
            });
        });

        // 3. localNodes -> allNodes
        // node 정보와 집계된 통계를 결합합니다.
        const mappedNodes = allNodes.map(node => {
            const stats = locationStats.get(node.scanLocation);

            // 통계가 없는 노드는 히트맵에 표시되지 않도록 null을 반환합니다.
            if (!stats) {
                return null;
            }

            // 가장 빈도가 높은 이상 징후 타입을 찾습니다 (dominant type).
            let dominantType: AnomalyType | '' = '';
            let dominantCount = 0;
            Object.entries(stats.eventTypeStats).forEach(([type, typeStats]) => {
                if (typeStats.count > dominantCount) {
                    dominantType = type as AnomalyType;
                    dominantCount = typeStats.count;
                }
            });

            // 최종적으로 레이어에 전달될 객체를 구성합니다.
            return {
                ...node,
                totalEventCount: stats.total,
                hasAnomaly: true, // 통계가 존재하면 항상 true
                eventTypeStats: stats.eventTypeStats,
                dominantEventType: dominantType,
                dominantEventCount: dominantCount,
            } as NodeWithEventStats;
        });

        // 4. filter를 사용하여 null 값을 제거하고 타입을 확정합니다.
        return mappedNodes.filter(
            (node): node is NodeWithEventStats => node !== null
        );

    }, [allAnomalies, allNodes]);

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

    const layers = useMemo(() => {
        const elevationScale = 17000 / viewState.zoom;
        return [ new StackedColumnLayer({
            id: 'stacked-column-layer',
            data: nodesWithStats,
            pickable: true,
            zoom: viewState.zoom,
            radius: 120,
            getElevationScale: elevationScale,
            updateTriggers: {
                zoom: [viewState.zoom] // 줌 레벨이 변경될 때 레이어가 다시 렌더링되도록 함
            },
        }),
    ]}, [nodesWithStats, viewState.zoom],);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}>
            {!hasSeenTutorial && (
                <TutorialOverlay
                    onClose={() => setHasSeenTutorial(true)} // X 버튼을 눌러도 닫히도록 설정
                />
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

        </div>
    );
};