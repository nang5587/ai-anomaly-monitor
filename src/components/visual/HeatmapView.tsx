'use client'
import React, { useMemo, useEffect } from 'react';
import type { PickingInfo, Color } from 'deck.gl';

import { useAtom, useAtomValue } from 'jotai';

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

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;


export const HeatmapView: React.FC = () => {
    const [viewState, setViewState] = useAtom(mapViewStateAtom);
    const [selectedObject, setSelectedObject] = useAtom(selectedObjectAtom);
    const [hasSeenTutorial, setHasSeenTutorial] = useAtom(tutorialSeenAtom);
    const allAnomalies = useAtomValue(allAnomalyTripsAtom);
    const allNodes = useAtomValue(nodesAtom);

    useEffect(() => {
        if (!hasSeenTutorial) {
            const timer = setTimeout(() => {
                setHasSeenTutorial(true);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [hasSeenTutorial, setHasSeenTutorial]);

    const nodesWithStats = useMemo((): NodeWithEventStats[] => {
        if (!allAnomalies || allAnomalies.length === 0 || !allNodes || allNodes.length === 0) {
            return [];
        }
        const locationStats = new Map<string, {
            total: number;
            eventTypeStats: EventTypeStats;
        }>();

        allAnomalies.forEach(trip => {
            trip.anomalyTypeList.forEach(anomalyType => {
                const affectedLocations = [...new Set([trip.from.scanLocation, trip.to.scanLocation])];

                affectedLocations.forEach(location => {
                    if (!location) return;
                    let stats = locationStats.get(location);
                    if (!stats) {
                        stats = {
                            total: 0,
                            eventTypeStats: {},
                        };
                        locationStats.set(location, stats);
                    }
                    stats.total += 1;
                    const eventType: AnomalyType = anomalyType;
                    if (!stats.eventTypeStats[eventType]) {
                        stats.eventTypeStats[eventType] = {
                            count: 0,
                            hasAnomaly: true,
                        };
                    }
                    stats.eventTypeStats[eventType]!.count += 1;
                });
            });
        });
        const mappedNodes = allNodes.map(node => {
            const stats = locationStats.get(node.scanLocation);
            if (!stats) {
                return null;
            }
            let dominantType: AnomalyType | '' = '';
            let dominantCount = 0;
            Object.entries(stats.eventTypeStats).forEach(([type, typeStats]) => {
                if (typeStats.count > dominantCount) {
                    dominantType = type as AnomalyType;
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
        return mappedNodes.filter(
            (node): node is NodeWithEventStats => node !== null
        );

    }, [allAnomalies, allNodes]);

    const handleClick = (info: PickingInfo) => {
        if (info.object) setSelectedObject(info.object);
    };

    const renderTooltip = (info: PickingInfo) => {
        if (!info.object) {
            return null;
        }

        const baseTooltipStyle = {
            position: 'absolute',
            padding: '12px',
            background: 'rgba(40, 40, 40, 0.95)', 
            color: '#f8f8f2',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)', 
            fontFamily: '"Noto Sans KR", sans-serif',
            fontSize: '14px',
            lineHeight: '1.6',
            maxWidth: '280px', 
            pointerEvents: 'none' as const, 
            zIndex: '10',
        };

        const node = info.object as NodeWithEventStats;
        const eventTypesList = (Object.entries(node.eventTypeStats) as [string, StatValue][])
            .sort((a, b) => b[1].count - a[1].count)
            .map(([type, stats]) =>
                `<div style="display: flex; justify-content: space-between; margin: 2px 0;">
                <span style="color: rgb(${(ANOMALY_TYPE_COLORS[type as AnomalyType] || DEFAULT_COLOR).join(',')}); font-weight: 500;">${anomalyCodeToNameMap[type as AnomalyType] || type}</span>
                <span>${stats.count}건</span>
            </div>`
            ).join('');

        return {
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
                zoom: [viewState.zoom]
            },
        }),
    ]}, [nodesWithStats, viewState.zoom],);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}>
            {!hasSeenTutorial && (
                <TutorialOverlay
                    onClose={() => setHasSeenTutorial(true)}
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
            <div
                style={{ position: 'absolute', top: '10px', right: '20px', zIndex: 10 }}
                className="bg-[rgba(40,40,40)] rounded-xl p-6 text-white w-48 shadow-lg backdrop-blur-sm"
            >
                <h3 className="text-base font-noto-400 mb-3">이벤트 타입별 분류</h3>
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