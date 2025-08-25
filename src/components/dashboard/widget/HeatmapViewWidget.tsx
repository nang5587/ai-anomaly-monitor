'use client'
import React, { useMemo } from 'react';
import DeckGL, { Color } from 'deck.gl';
import { Map as ReactMapGL } from 'react-map-gl';

import { useAtomValue } from 'jotai';
import { nodesAtom, allAnomalyTripsAtom } from '@/stores/mapDataAtoms';

import { getNodes, getTrips, type AnalyzedTrip, type LocationNode, anomalyCodeToNameMap, type AnomalyType } from '../../../types/data';
import { type EventTypeStats, type NodeWithEventStats, type StatValue } from '@/types/map';
import { StackedColumnLayer } from '../../visual/StackedColumnLayer';

import { ANOMALY_TYPE_COLORS } from '@/types/colorUtils';
const DEFAULT_COLOR: Color = [201, 203, 207];
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const ANOMALY_THRESHOLD = parseInt(process.env.NEXT_PUBLIC_ANOMALY_THRESHOLD || '70', 10);
const WIDGET_VIEW_STATE = {
    longitude: 127.9,
    latitude: 36.5,
    zoom: 6.5,
    pitch: 45,
    bearing: 0,
};

type HeatmapViewWidgetProps = {
    onWidgetClick: () => void;
    showLegend: boolean;
};

export const HeatmapViewWidget: React.FC<HeatmapViewWidgetProps> = ({ showLegend = false, onWidgetClick }) => {
    const nodes = useAtomValue(nodesAtom);
    const trips = useAtomValue(allAnomalyTripsAtom)
    const nodesWithStats = useMemo((): NodeWithEventStats[] => {
        if (!trips || !nodes || nodes.length === 0) return [];
        const locationStats = new Map<string, {
            total: number;
            eventTypeStats: EventTypeStats;
        }>();
        trips.forEach(trip => {
            const affectedLocations = [...new Set([trip.from.scanLocation, trip.to.scanLocation])];
            const isOtherAnomaly = trip.anomaly >= ANOMALY_THRESHOLD;

            affectedLocations.forEach(location => {
                if (!location) return;
                let stats = locationStats.get(location);
                if (!stats) {
                    stats = { total: 0, eventTypeStats: {} };
                    locationStats.set(location, stats);
                }
                stats.total += 1;
                if (trip.anomalyTypeList) {
                    trip.anomalyTypeList.forEach(anomalyType => {
                        if (!stats.eventTypeStats[anomalyType]) {
                            stats.eventTypeStats[anomalyType] = { count: 0, hasAnomaly: true };
                        }
                        stats.eventTypeStats[anomalyType]!.count += 1;
                    });
                }
                if (isOtherAnomaly) {
                    const otherType: AnomalyType = 'other';
                    if (!stats.eventTypeStats[otherType]) {
                        stats.eventTypeStats[otherType] = { count: 0, hasAnomaly: true };
                    }
                    stats.eventTypeStats[otherType]!.count += 1;
                }
            });
        });
        const mappedNodes = nodes.map(node => {
            const stats = locationStats.get(node.scanLocation);
            if (!stats || stats.total === 0) {
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
    }, [trips, nodes]);

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
            pickable: false,
            radius: 40,
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