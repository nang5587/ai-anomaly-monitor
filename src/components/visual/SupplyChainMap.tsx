'use client'
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
    nodesAtom,
    visibleTripsAtom,
    selectedObjectAtom,
    mapViewStateAtom,
    timeRangeAtom,
    epcDupTargetAtom,
    anomalyFilterAtom,
    selectTripAndFocusAtom,
    spySelectedObjectAtom,
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
    useAtomValue(spySelectedObjectAtom);
    const nodes = useAtomValue(nodesAtom);
    const trips = useAtomValue(visibleTripsAtom,);
    const anomalyFilter = useAtomValue(anomalyFilterAtom);
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

    const validTrips = useMemo(() => {
        if (!trips) return [];
        let filtered = trips.filter(trip => trip && trip.from?.coord && trip.to?.coord);
        if (anomalyFilter) {
            filtered = filtered.filter(trip =>
                trip.anomalyTypeList?.includes(anomalyFilter)
            );
        }

        return filtered;
    }, [trips, anomalyFilter]);

    const globalTimeRange = useMemo(() => {
        if (!validTrips || validTrips.length === 0) {
            return { minTime: 0, maxTime: 1 };
        }
        const startTimes = validTrips.map(t => t.from.eventTime);
        const endTimes = validTrips.map(t => t.to.eventTime);
        return { minTime: Math.min(...startTimes), maxTime: Math.max(...endTimes) };
    }, [validTrips]);

    const activeTimeRange = useMemo(() => {
        if (timeRange) {
            return { minTime: timeRange[0], maxTime: timeRange[1] };
        }

        if (epcDupTarget) {
            const dupTrips = validTrips.filter(t => t.epcCode === epcDupTarget);
            if (dupTrips.length > 0) {
                const startTimes = dupTrips.map(t => t.from.eventTime);
                const endTimes = dupTrips.map(t => t.to.eventTime);
                return { minTime: Math.min(...startTimes), maxTime: Math.max(...endTimes) };
            }
        }
        return globalTimeRange;
    }, [timeRange, epcDupTarget, validTrips, globalTimeRange]);

    const dynamicAnimationSpeed = useMemo(() => {
        const totalDuration = activeTimeRange.maxTime - activeTimeRange.minTime;
        if (totalDuration <= 0) {
            return 0;
        }
        const totalFrames = TARGET_ANIMATION_DURATION_SECONDS * 60;
        return totalDuration / totalFrames;
    }, [activeTimeRange]);

    useEffect(() => {
        if (timeRange) {
            setCurrentTime(timeRange[0]);
            setIsPlaying(true);
        } else {
            setCurrentTime(globalTimeRange.minTime);
            setIsPlaying(true);
        }
    }, [timeRange, globalTimeRange.minTime]);

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

    const anomalyList = useMemo(() => validTrips.filter(t => t.anomalyTypeList && t.anomalyTypeList.length > 0), [validTrips]);

    const handleTogglePlay = () => {
        if (!isPlaying && currentTime >= activeTimeRange.maxTime) {
            setCurrentTime(activeTimeRange.minTime);
            setIsPlaying(true);
        } else {
            setIsPlaying(prev => !prev);
        }
    };

    const factoryNodes = useMemo(() => {
        if (!nodes) return [];
        return nodes.filter(node => node.businessStep === 'Factory');
    }, [nodes]);
    const otherNodes = useMemo(() => {
        if (!nodes) return [];
        return nodes.filter(node => node.businessStep !== 'Factory');
    }, [nodes]);

    const otherMeshLayers = useMemo(() => {
        return Object.keys(OTHER_MODEL_MAPPING).map(type => {
            const filteredNodes = otherNodes.filter(node => node.businessStep === type);
            if (filteredNodes.length === 0) return null;
            return new SimpleMeshLayer<LocationNode>({
                id: `mesh-layer-${type}`,
                data: filteredNodes,
                mesh: OTHER_MODEL_MAPPING[type],
                getPosition: d => d.coord,
                getColor: d => getNodeColor(d.businessStep),
                getOrientation: [-90, 0, 0],
                sizeScale: 50,
                getTranslation: [0, 0, 50],
                pickable: true,
                onHover: info => setHoverInfo(info),
                onClick: info => {
                    setSelectedObject(info.object as LocationNode)
                    return true;
                },
                material
            });
        }).filter(Boolean);
    }, [otherNodes, setHoverInfo, setSelectedObject]);

    const factoryLayers = useMemo(() => [
        new SimpleMeshLayer<LocationNode>({
            id: 'factory-building-layer',
            data: factoryNodes,
            mesh: parsedFactoryBuildingModel,
            getPosition: d => d.coord,
            getColor: d => getNodeColor(d.businessStep),
            getOrientation: [-90, 180, 0],
            sizeScale: 50,
            getTranslation: [0, 0, 50],
            pickable: true,
            onHover: info => setHoverInfo(info),
            onClick: info => {
                setSelectedObject(info.object as LocationNode)
                return true;
            },
            material
        }),
    ], [factoryNodes, setHoverInfo, setSelectedObject]);

    const anomalyNodeIds = useMemo(() => {
        const ids = new Set<string>();
        validTrips.forEach(trip => {
            if (trip.anomalyTypeList && trip.anomalyTypeList.length > 0) {
                ids.add(trip.from.scanLocation);
                ids.add(trip.to.scanLocation);
            }
        });
        return Array.from(ids);
    }, [validTrips]);

    const anomalyNodes = useMemo(() => {
        if (!nodes) return [];
        return nodes.filter(node => anomalyNodeIds.includes(node.scanLocation));
    }, [nodes, anomalyNodeIds]);

    const handleLayerClick = useCallback((info: PickingInfo) => {
        if (info.object) {
            selectTripAndFocus(info.object as MergeTrip);
        }
    }, [selectTripAndFocus]);

    const { staticPathData, cloneMarkerCoords, otherDynamicTrips, pulseData } = useMemo(() => {
        const selectedTrip = (selectedObject && 'roadId' in selectedObject) ? selectedObject as MergeTrip : null;

        let sPathData: MergeTrip[] = [];
        let cMarkerCoords: [number, number, number][] = [];
        let pData: [number, number][] = [];
        const ICON_ALTITUDE = 500;

        if (selectedTrip) {
            if (selectedTrip.anomalyTypeList.includes('clone')) {
                const targetEpc = selectedTrip.epcCode;
                sPathData = validTrips.filter(trip => trip.epcCode === targetEpc);
                cMarkerCoords = sPathData.map(trip => [...(trip.to.coord as [number, number]), ICON_ALTITUDE]);
            } else {
                sPathData = [selectedTrip];
            }
            pData = [selectedTrip?.to.coord as [number, number]];

            return {
                staticPathData: sPathData,
                cloneMarkerCoords: cMarkerCoords,
                otherDynamicTrips: [],
                pulseData: pData
            };

        } else {
            sPathData = validTrips;
            const dynamic = validTrips.filter(trip =>
                !(trip.from.businessStep === 'Wholesaler' && trip.to.businessStep === 'Reseller')
            );
            return {
                staticPathData: sPathData,
                cloneMarkerCoords: [],
                otherDynamicTrips: dynamic,
                pulseData: []
            };
        }
    }, [selectedObject, validTrips]);

    const wholesalerJourneys = useMemo(() => {
        if (!trips || trips.length === 0 || !nodes || nodes.length === 0) {
            return [];
        }
        const deliveryTrips = trips.filter(trip =>
            trip.from.businessStep === 'Wholesaler' &&
            trip.to.businessStep === 'Reseller'
        );
        const tripsByWholesaler = deliveryTrips.reduce((acc, trip) => {
            const key = trip.from.scanLocation;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(trip);
            return acc;
        }, {} as Record<string, AnalyzedTrip[]>);

        const processedJourneys = Object.values(tripsByWholesaler).map(wholesalerTrips => {
            const sortedTrips = wholesalerTrips.sort((a, b) => a.to.eventTime - b.to.eventTime);

            const path: [number, number][] = [];
            const timestamps: number[] = [];

            if (sortedTrips.length > 0) {
                const startingPoint = sortedTrips[0].from;
                path.push(startingPoint.coord as [number, number]);
                timestamps.push(startingPoint.eventTime);
                sortedTrips.forEach(trip => {
                    path.push(trip.to.coord as [number, number]);
                    timestamps.push(trip.to.eventTime);
                });
            }
            return {
                journeyId: sortedTrips[0] ? `journey-${sortedTrips[0].from.scanLocation}` : 'unknown',
                path: path,
                timestamps: timestamps,
                trips: sortedTrips,
            };
        });
        return processedJourneys;
    }, [trips, nodes]);

    const selectedTrip = useMemo(() => {
        if (selectedObject && 'roadId' in selectedObject) {
            return selectedObject as MergeTrip;
        }
        return null;
    }, [selectedObject]);

    const uniqueStaticPaths = useMemo(() => {
        const uniquePaths = new Map<string, MergeTrip>();
        validTrips.forEach(trip => {
            const pathKey = `${trip.from.scanLocation}-${trip.to.scanLocation}`;
            if (!uniquePaths.has(pathKey)) {
                uniquePaths.set(pathKey, trip);
            }
        });
        return Array.from(uniquePaths.values());
    }, [validTrips]);

    const layers = useMemo(() => {
        const selectedTrip = (selectedObject && 'roadId' in selectedObject) ? selectedObject as MergeTrip : null;
        const showJourneys = !selectedTrip;

        let displayTrips: MergeTrip[];
        let displayStaticPaths: MergeTrip[];

        if (selectedTrip) {
            if (selectedTrip.anomalyTypeList?.includes('clone')) {
                const targetEpc = selectedTrip.epcCode;
                displayTrips = validTrips.filter(trip => trip.epcCode === targetEpc);
            } else {
                displayTrips = [selectedTrip];
            }
            displayStaticPaths = displayTrips;
        } else {
            displayTrips = validTrips;
            displayStaticPaths = uniqueStaticPaths;
        }

        return [
            new PathLayer<MergeTrip>({
                id: 'path-solid-background-layer',
                data: displayStaticPaths,
                getPath: d => d.path || [d.from.coord, d.to.coord],
                getColor: [200, 200, 200, 80],
                getWidth: 8,
                widthMinPixels: 8,
            }),
            new PathLayer<MergeTrip>({
                id: 'path-background-layer',
                data: displayStaticPaths,
                getPath: d => d.path || [d.from.coord, d.to.coord],
                getColor: [200, 200, 200, 255],
                getWidth: 8,
                widthMinPixels: 8,
                // @ts-ignore
                getDashArray: [3, 3],
                // @ts-ignore
                dashJustified: true,
                extensions: [new PathStyleExtension({ dash: true })],
            }),
            new TripsLayer<MergeTrip>({
                id: 'main-trips-layer',
                data: displayTrips,
                getPath: d => d.path || [d.from.coord, d.to.coord],
                getTimestamps: d => d.timestamps || [d.from.eventTime, d.to.eventTime],
                getColor: d => d.anomalyTypeList.length > 0 ? [0, 123, 255, 100] : [60, 150, 255, 100],
                opacity: 1,
                getWidth: 8,
                widthMinPixels: 8,
                rounded: true,
                trailLength: 300,
                currentTime,
                pickable: true,
                onHover: info => setHoverInfo(info),
                onClick: handleLayerClick,
            }),
            new IconLayer<[number, number]>({
                id: 'clone-icon-layer',
                data: cloneMarkerCoords,
                iconAtlas: '/icons/clone-alert.png',
                iconMapping: {
                    marker: { x: 0, y: 0, width: 50, height: 50, mask: false }
                },
                getIcon: d => 'marker',
                sizeUnits: 'pixels',
                getSize: 35,
                getPosition: d => d,
                getColor: d => [255, 64, 64, 255],
            }),
            ...otherMeshLayers,
            ...factoryLayers,
            new TripsLayer({
                id: 'wholesaler-journeys-layer',
                data: wholesalerJourneys,
                visible: showJourneys,
                getPath: d => d.path,
                getTimestamps: d => d.timestamps,
                getColor: [0, 123, 255, 100],
                opacity: 1,
                getWidth: 8,
                widthMinPixels: 8,
                rounded: true,
                trailLength: 100,
                currentTime,
            }),
            new TripsLayer<MergeTrip>({
                id: 'other-trips-layer',
                data: otherDynamicTrips,
                visible: showJourneys,
                getPath: d => d.path || [d.from.coord, d.to.coord],
                getTimestamps: d => d.timestamps || [d.from.eventTime, d.to.eventTime],
                getColor: d => d.anomalyTypeList.length > 0 ? [0, 123, 255, 100] : [0, 255, 127, 100],
                opacity: 1,
                getWidth: 8,
                widthMinPixels: 8,
                rounded: true,
                trailLength: 100,
                currentTime,
            }),
        ];
    }, [
        selectedObject,
        validTrips,
        uniqueStaticPaths,
        cloneMarkerCoords,
        otherDynamicTrips,
        pulseData,
        wholesalerJourneys,
        currentTime,
        anomalyNodes,
        factoryLayers,
        otherMeshLayers,
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
                            console.log(" -> 조건 만족! 선택 해제 실행.");
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
                                    console.log("🖱️ Marker 클릭됨. Node로 선택 설정:", node);
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

                        {selectedTrip && (
                            <>
                                <Marker
                                    key="start-marker"
                                    longitude={selectedTrip.from.coord[0]}
                                    latitude={selectedTrip.from.coord[1]}
                                    pitchAlignment="viewport"
                                >
                                    <div className="path-marker-label start-marker">
                                        출발
                                    </div>
                                </Marker>
                                <Marker
                                    key="end-marker"
                                    longitude={selectedTrip.to.coord[0]}
                                    latitude={selectedTrip.to.coord[1]}
                                    pitchAlignment="viewport"
                                >
                                    <div className="path-marker-label end-marker">
                                        도착
                                    </div>
                                </Marker>
                            </>
                        )}
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