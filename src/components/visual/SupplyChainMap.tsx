'use client'
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
    nodesAtom,
    visibleTripsAtom,
    epcFullTripHistoryAtom,
    selectedObjectAtom,
    mapViewStateAtom,
    timeRangeAtom,
    epcDupTargetAtom,
    selectTripAndFocusAtom,
    type MapViewState
} from '@/stores/mapDataAtoms';

import { tutorialSeenAtom } from '@/stores/uiAtoms';

import type { Color } from 'deck.gl';
import DeckGL, { FlyToInterpolator } from 'deck.gl';
import { PathLayer, ScatterplotLayer, IconLayer } from '@deck.gl/layers';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { PathStyleExtension } from '@deck.gl/extensions'
import { WebMercatorViewport } from '@deck.gl/core';
import { OBJLoader } from '@loaders.gl/obj';
import { parseSync } from '@loaders.gl/core';
import { default as ReactMapGL, Marker, ViewState, } from 'react-map-gl';
import type { PickingInfo } from '@deck.gl/core';

import { type LocationNode, type AnalyzedTrip } from '../../types/data';
import { cubeModel, factoryBuildingModel } from './models';

import TutorialOverlay from './TutorialOverlay';
import TimeSlider from './TimeSlider';
import MapLegend from './MapLegend';

import { getNodeColor, getAnomalyColor, getAnomalyName } from '../../types/colorUtils';
import { NodeIcon, getIconAltitude } from '../visual/icons';
import { toast } from 'sonner';
import { MergeTrip } from './SupplyChainDashboard';

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const TARGET_ANIMATION_DURATION_SECONDS = 15;
const parsedCubeModel = parseSync(cubeModel, OBJLoader);
const parsedFactoryBuildingModel = parseSync(factoryBuildingModel, OBJLoader);

const OTHER_MODEL_MAPPING: Record<string, any> = {
    WMS: parsedCubeModel,
    LogiHub: parsedCubeModel,
    Wholesaler: parsedCubeModel,
    Reseller: parsedCubeModel,
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

export const SupplyChainMap: React.FC = () => {
    const nodes = useAtomValue(nodesAtom);
    const tripsToDisplay = useAtomValue(epcFullTripHistoryAtom);
    const [selectedObject, setSelectedObject] = useAtom(selectedObjectAtom);
    const [viewState, setViewState] = useAtom(mapViewStateAtom);
    const timeRange = useAtomValue(timeRangeAtom);

    const [epcDupTarget, setEpcDupTarget] = useAtom(epcDupTargetAtom);
    const [hasSeenTutorial, setHasSeenTutorial] = useAtom(tutorialSeenAtom);

    const [currentTime, setCurrentTime] = useState(0);
    const [hoverInfo, setHoverInfo] = useState<PickingInfo | null>(null);
    const [hoveredType, setHoveredType] = useState<string | null>(null);
    const [visibleTypes, setVisibleTypes] = useState<Record<string, boolean>>({ Factory: true, WMS: true, LogiHub: true, Wholesaler: true, Reseller: true, POS: true });
    const [isPlaying, setIsPlaying] = useState(true);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [pulseRadius, setPulseRadius] = useState(0);

    const selectTripAndFocus = useSetAtom(selectTripAndFocusAtom);

    const activeTimeRange = useMemo(() => {
        if (timeRange) return { minTime: timeRange[0], maxTime: timeRange[1] };
        if (tripsToDisplay && tripsToDisplay.length > 0) {
            const startTimes = tripsToDisplay.map(t => t.from.eventTime);
            const endTimes = tripsToDisplay.map(t => t.to.eventTime);
            return { minTime: Math.min(...startTimes), maxTime: Math.max(...endTimes) };
        }
        return { minTime: 0, maxTime: 1 };
    }, [timeRange, tripsToDisplay]);

    const dynamicAnimationSpeed = useMemo(() => {
        const totalDuration = activeTimeRange.maxTime - activeTimeRange.minTime;
        if (totalDuration <= 0) {
            return 0;
        }
        const totalFrames = TARGET_ANIMATION_DURATION_SECONDS * 60;
        return totalDuration / totalFrames;
    }, [activeTimeRange]);

    useEffect(() => {
        const startTime = timeRange ? timeRange[0] : activeTimeRange.minTime;
        setCurrentTime(startTime);
        setIsPlaying(true);
    }, [timeRange, activeTimeRange.minTime]);

    useEffect(() => {
        if (!selectedObject) {
            setEpcDupTarget(null);
            setIsPlaying(true);
            return;
        }
        if ('roadId' in selectedObject) {
            const trip = selectedObject as MergeTrip;
            const hasCloneAnomaly = trip.anomalyTypeList?.includes('clone');
            setEpcDupTarget(hasCloneAnomaly ? trip.epcCode : null);
            setIsPlaying(true);
        }
        else if ('coord' in selectedObject) {
            setEpcDupTarget(null);
            setIsPlaying(false);
        }
    }, [selectedObject, setEpcDupTarget, setIsPlaying]);

    useEffect(() => {
        if (!hasSeenTutorial) {
            const timer = setTimeout(() => {
                setHasSeenTutorial(true);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [hasSeenTutorial, setHasSeenTutorial]);

    useEffect(() => {
        if (!isPlaying || activeTimeRange.minTime >= activeTimeRange.maxTime || dynamicAnimationSpeed === 0) {
            return;
        }
        let animationFrame: number;
        const animate = () => {
            setCurrentTime(prevTime => {
                if (!isPlaying || prevTime >= activeTimeRange.maxTime) {
                    setIsPlaying(false); // 재생 중지
                    return activeTimeRange.maxTime;
                }
                const nextTime = prevTime + (dynamicAnimationSpeed * playbackSpeed);
                if (nextTime >= activeTimeRange.maxTime) {
                    setIsPlaying(false);
                    return activeTimeRange.maxTime;
                }
                return nextTime;
            });
            if (isPlaying) {
                animationFrame = requestAnimationFrame(animate);
            }
        };
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [isPlaying, activeTimeRange, setIsPlaying, dynamicAnimationSpeed, playbackSpeed]);

    useEffect(() => {
        let animationFrame: number;
        const animatePulse = () => {
            setPulseRadius(r => (r > 1000 ? 0 : r + 20));
            animationFrame = requestAnimationFrame(animatePulse);
        };
        if (selectedObject && 'roadId' in selectedObject) {
            animationFrame = requestAnimationFrame(animatePulse);
        } else {
            setPulseRadius(0);
        }
        animationFrame = requestAnimationFrame(animatePulse);
        return () => cancelAnimationFrame(animationFrame);
    }, []);

    const renderTooltip = ({ object }: PickingInfo) => {
        if (!object) {
            return null;
        }
        const baseTooltipStyle = {
            position: 'absolute',
            padding: '12px',
            background: 'rgba(40, 40, 40)',
            color: '#f8f8f2',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(6px)',
            fontFamily: '"Noto Sans KR", sans-serif',
            fontSize: '14px',
            lineHeight: '1.6',
            maxWidth: '250px',
            pointerEvents: 'none',
            zIndex: '10',
        };
        const isNode = 'coord' in object;
        if (isNode) {
            const node = object as LocationNode;
            return {
                html: `
                    <div style="font-weight: semi-bold; font-size: 16px; margin-bottom: 4px;">${node.scanLocation}</div>
                    <div><span style="color: rgba(111,131,175);">타입:</span> ${node.businessStep}</div>
                `,
                style: baseTooltipStyle
            };
        } else {
            const trip = object as AnalyzedTrip;
            const representativeAnomaly = trip.anomalyTypeList && trip.anomalyTypeList.length > 0 ? trip.anomalyTypeList[0] : null;
            const anomalyLine = representativeAnomaly
                ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); color: #FFFFFF; font-weight: semi-bold;">
                    이상 유형: ${getAnomalyName(representativeAnomaly)}
                    ${trip.anomalyTypeList.length > 1 ? ` 외 ${trip.anomalyTypeList.length - 1}건` : ''}
                </div>`
                : '';
            return {
                html: `
                    <div style="font-weight: semi-bold; font-size: 16px; color: #FFFFFF; margin-bottom: 8px;">${trip.productName}</div>
                    <div style="font-size: 13px;">
                        <div style="margin-bottom: 4px;"><span style="color: rgba(111,131,175);">출발:</span> ${trip.from.scanLocation}</div>
                        <div><span style="color: rgba(111,131,175);">도착:</span> ${trip.to.scanLocation}</div>
                    </div>
                    ${anomalyLine}
                `,
                style: baseTooltipStyle
            };
        }
    };

    const anomalyList = useMemo(() => tripsToDisplay.filter(t => t.anomalyTypeList && t.anomalyTypeList.length > 0), [tripsToDisplay]);

    const handleTogglePlay = () => {
        if (!isPlaying && currentTime >= activeTimeRange.maxTime) {
            setCurrentTime(activeTimeRange.minTime);
            setIsPlaying(true);
        } else {
            setIsPlaying(prev => !prev);
        }
    };

    const handleLayerClick = useCallback((info: PickingInfo) => {
        if (info.object) {
            selectTripAndFocus(info.object as MergeTrip);
        }
    }, [selectTripAndFocus]);


    const selectedTrip = useMemo(() => (selectedObject && 'roadId' in selectedObject) ? selectedObject as MergeTrip : null, [selectedObject]);

    const journeyMarkers = useMemo(() => {
        if (!selectedTrip || tripsToDisplay.length === 0) return null;
        const startNode = tripsToDisplay[0].from;
        const endNode = tripsToDisplay[tripsToDisplay.length - 1].to;
        return { start: { coord: startNode.coord }, end: { coord: endNode.coord } };
    }, [selectedTrip, tripsToDisplay]);

    const cloneDestinationMarkers = useMemo(() => {
        if (!selectedTrip || !selectedTrip.anomalyTypeList?.includes('clone')) return [];
        return tripsToDisplay.filter(t => t.roadId !== selectedTrip.roadId);
    }, [selectedTrip, tripsToDisplay]);

    const layers = useMemo(() => {
        return [
            new PathLayer<MergeTrip>({
                id: 'path-solid-background-layer',
                data: tripsToDisplay,
                getPath: d => d.path || [d.from.coord, d.to.coord],
                getColor: [200, 200, 200, 80],
                getWidth: 8,
                widthMinPixels: 8,
                getPolygonOffset: ({ layerIndex }) => [0, -layerIndex * 100 - 20]
            }),
            // new PathLayer<MergeTrip>({
            //     id: 'path-dashed-foreground-layer',
            //     data: tripsToDisplay,
            //     getPath: d => d.path || [d.from.coord, d.to.coord],
            //     getColor: [200, 200, 200, 255],
            //     getWidth: 8,
            //     widthMinPixels: 8,
            //     // @ts-ignore
            //     getDashArray: [3, 3],
            //     // @ts-ignore
            //     dashJustified: true,
            //     extensions: [new PathStyleExtension({ dash: true })],
            //     getPolygonOffset: ({ layerIndex }) => [0, -layerIndex * 100 - 10]
            // }),
            new TripsLayer<MergeTrip>({
                id: 'main-trips-layer',
                data: tripsToDisplay,
                getPath: d => d.path || [d.from.coord, d.to.coord],
                getTimestamps: d => d.timestamps || [d.from.eventTime, d.to.eventTime],
                getColor: d => d.anomalyTypeList.length > 0 ? [0, 123, 255, 120] : [60, 150, 255, 120],
                opacity: 1,
                getWidth: 8,
                widthMinPixels: 8,
                rounded: true,
                trailLength: 10000,
                currentTime,
                pickable: true,
                onHover: info => setHoverInfo(info),
                onClick: handleLayerClick,
                getPolygonOffset: ({ layerIndex }) => [0, -layerIndex * 100]
            }),
        ];
    }, [
        selectedTrip,
        currentTime,
        handleLayerClick,
        setHoverInfo
    ]);

    return (
        <>
            <style jsx global>{`
                .map-marker { transform: translate(-50%, -100%); z-index: 1; cursor: pointer; }
                .speech-bubble { 
                    position: relative; 
                    background: #333;
                    width: 32px; 
                    height: 32px; 
                    border-radius: 50%; 
                    padding: 6px;
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                }
                .path-marker-label {
                    min-width: 50px;
                    padding: 6px 10px;
                    border-radius: 20px;
                    color: white;
                    font-size: 14px;
                    font-weight: bold;
                    text-align: center;
                    transform: translate(-50%, -120%); 
                    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
                    pointer-events: none;
                }
                .clone-marker { background-color: #dc3545; border: 2px solid #fff; }
                .start-marker {
                    background-color: #6c757d;
                    border: 2px solid #fff;
                }
                .end-marker {
                    background-color: #007bff;
                    border: 2px solid #fff;
                }
            `}</style>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {!hasSeenTutorial && (
                    <TutorialOverlay
                        onClose={() => setHasSeenTutorial(true)}
                    />
                )}
                <DeckGL
                    layers={layers} viewState={viewState}
                    onClick={info => {
                        if (!info.layer && !info.object) {
                            selectTripAndFocus(null);
                        }
                    }}
                    onViewStateChange={({ viewState: newViewState }) => {
                        setViewState(newViewState as MapViewState);
                    }}
                    controller={true}
                    getTooltip={renderTooltip}
                >
                    <ReactMapGL mapboxAccessToken={MAPBOX_ACCESS_TOKEN} mapStyle="mapbox://styles/mapbox/dark-v11"
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
                    >
                        {nodes && nodes.filter(node => visibleTypes[node.businessStep]).map(node => (
                            <Marker key={`marker-${node.hubType}`} longitude={node.coord[0]} latitude={node.coord[1]} pitchAlignment="viewport" rotationAlignment="map" altitude={getIconAltitude(node)}
                                onClick={(e) => {
                                    e.originalEvent.stopPropagation();
                                    setSelectedObject(node);
                                }}
                            >
                                <div className="map-marker">
                                    <div className="speech-bubble">
                                        <NodeIcon type={node.businessStep} />
                                    </div>
                                </div>
                            </Marker>
                        ))}
                        {journeyMarkers && (
                            <>
                                <Marker
                                    key="journey-start-marker"
                                    longitude={journeyMarkers.start.coord[0]}
                                    latitude={journeyMarkers.start.coord[1]}
                                    pitchAlignment="viewport"
                                >
                                    <div className="path-marker-label start-marker">
                                        출발
                                    </div>
                                </Marker>
                                <Marker
                                    key="journey-end-marker"
                                    longitude={journeyMarkers.end.coord[0]}
                                    latitude={journeyMarkers.end.coord[1]}
                                    pitchAlignment="viewport"
                                >
                                    <div className="path-marker-label end-marker">
                                        도착
                                    </div>
                                </Marker>
                            </>
                        )}
                        {cloneDestinationMarkers.length > 0 && cloneDestinationMarkers.map((trip, index) => (
                            <Marker
                                key={`clone-dest-marker-${trip.roadId}-${index}`}
                                longitude={trip.to.coord[0]}
                                latitude={trip.to.coord[1]}
                                pitchAlignment="viewport"
                            >
                                <div className="path-marker-label clone-marker">
                                    복제
                                </div>
                            </Marker>
                        ))}
                    </ReactMapGL>
                </DeckGL>
                <MapLegend
                    onHover={setHoveredType}
                    onToggleVisibility={(type) => {
                        setVisibleTypes(prev => ({ ...prev, [type]: !prev[type] }))
                    }}
                    visibleTypes={visibleTypes}
                />
                <TimeSlider
                    minTime={activeTimeRange.minTime}
                    maxTime={activeTimeRange.maxTime}
                    currentTime={currentTime}
                    isPlaying={isPlaying}
                    onChange={setCurrentTime}
                    onTogglePlay={handleTogglePlay}
                    anomalies={anomalyList}
                    onMarkerClick={(trip) => selectTripAndFocus(trip)}
                    playbackSpeed={playbackSpeed}
                    onPlaybackSpeedChange={setPlaybackSpeed}
                />
            </div>
        </>
    );
};