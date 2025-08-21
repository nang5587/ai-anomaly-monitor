import { atom } from 'jotai';
import { FlyToInterpolator, WebMercatorViewport } from 'deck.gl';
import {
    getNodes,
    getAnomalies,
    getAllAnomalies,
    getFilterOptions,
} from '@/services/dataService';

import type {
    LocationNode,
    AnalyzedTrip,
    FilterOptions,
    PaginatedTripsResponse,
    AnomalyType,
} from '../types/data';

import { MergeTrip, Tab } from '@/components/visual/SupplyChainDashboard';
import { fetchRouteGeometry } from '@/services/mapboxService';
import { fetchEpcHistory, type EventHistory } from '@/services/historyService';

export const formatUnixTimestamp = (timestamp: number | string): string => {
    if (!timestamp || timestamp === 0) return 'N/A';
    const date = new Date(Number(timestamp) * 1000);
    const formatter = new Intl.DateTimeFormat('sv-SE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    return formatter.format(date);
};

export interface MapViewState {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
    transitionDuration?: number | 'auto';
    transitionInterpolator?: any;
}

type RouteGeometry = {
    path: [number, number][];
};

type RouteGeometryMap = Record<string, RouteGeometry>;

export const selectedFileIdAtom = atom<number | null>(null);
export const selectedFactoryNameAtom = atom<string | null>(null);
export const timeRangeAtom = atom<[number, number] | null>(null);
// export const allAnomalyTripsAtom = atom(async (get) => {
//     const fileId = get(selectedFileIdAtom);
//     const geometries = get(routeGeometriesAtom);

//     if (!fileId || !geometries) {
//         return [];
//     }

//     try {
//         const anomaliesData = await getAllAnomalies({ fileId });
//         return mergeAndGenerateTimestamps(anomaliesData, geometries);
//     } catch (error) {
//         console.error(`[allAnomalyTripsAtom] 데이터 로딩 실패:`, error);
//         return [];
//     }
// });

export const activeTabAtom = atom<Tab>('heatmap');
export const appliedFiltersAtom = atom<Record<string, any>>({});
export const selectedObjectAtom = atom<MergeTrip | LocationNode | null>(null);
export const nodesAtom = atom<LocationNode[]>([]);
export const filterOptionsAtom = atom<FilterOptions | null>(null);
export const tripsAtom = atom<MergeTrip[]>([]);
export const isLoadingAtom = atom<boolean>(false);
export const nextCursorAtom = atom<string | null>(null);
export const isFetchingMoreAtom = atom<boolean>(false);

const INITIAL_VIEW_STATE: MapViewState = {
    longitude: 127.9,
    latitude: 36.5,
    zoom: 8,
    pitch: 60,
    bearing: 0,
    transitionDuration: 0
};
export const mapViewStateAtom = atom<MapViewState>(INITIAL_VIEW_STATE);
export const routeGeometriesAtom = atom<RouteGeometryMap>({});
export const mergeAndGenerateTimestamps = (tripsFromApi: AnalyzedTrip[], geometries: RouteGeometryMap | null): MergeTrip[] => {
    if (!tripsFromApi) return [];

    return tripsFromApi.map(trip => {
        const roadIdKey = trip.roadId ? String(trip.roadId) : '';
        const geometry = geometries?.[roadIdKey];

        const finalPath = geometry?.path || (trip.from?.coord && trip.to?.coord ? [trip.from.coord, trip.to.coord] : []);

        const startTime = trip.from?.eventTime;
        const endTime = trip.to?.eventTime;
        let finalTimestamps: number[] = [];

        if (startTime != null && endTime != null && finalPath.length > 1) {
            const duration = endTime - startTime;
            if (duration > 0) {
                const totalSegments = finalPath.length - 1;
                finalTimestamps = finalPath.map((point, index) => {
                    const progress = index / totalSegments;
                    return startTime + (duration * progress);
                });
            } else {
                finalTimestamps = [startTime, endTime];
            }
        }

        return {
            ...trip,
            path: finalPath,
            timestamps: finalTimestamps,
        };
    });
};

export const fetchGeometriesAndMergeTrips = async (
    tripsFromApi: AnalyzedTrip[],
    cacheGet: <Value>(atom: import('jotai').Atom<Value>) => Value,
    cacheSet: <Value, Result>(atom: import('jotai').WritableAtom<Value, [any], Result>, ...args: [any]) => Result
): Promise<MergeTrip[]> => {
    if (!tripsFromApi || tripsFromApi.length === 0) return [];

    const currentCache = cacheGet(routeGeometriesAtom);
    const tripsToFetch = tripsFromApi.filter(trip => !currentCache[trip.roadId]);

    if (tripsToFetch.length > 0) {
        const geometryPromises = tripsToFetch.map(async (trip) => {
            if (!trip.from?.coord || !trip.to?.coord) {
                return { roadId: trip.roadId, path: null };
            }
            const path = await fetchRouteGeometry(trip.from.coord, trip.to.coord);
            return { roadId: trip.roadId, path };
        });
        const newGeometries = await Promise.all(geometryPromises);
        const updatedCache = { ...currentCache };
        newGeometries.forEach(geom => {
            if (geom.path) {
                updatedCache[geom.roadId] = { path: geom.path };
            }
        });
        cacheSet(routeGeometriesAtom, updatedCache);
    }

    const finalCache = cacheGet(routeGeometriesAtom);
    return tripsFromApi.map(trip => {
        const geometry = finalCache[trip.roadId];
        const finalPath = geometry?.path || (trip.from?.coord && trip.to?.coord ? [trip.from.coord, trip.to.coord] : []);
        const startTime = trip.from?.eventTime;
        const endTime = trip.to?.eventTime;
        let finalTimestamps: number[] = [];
        if (startTime != null && endTime != null && finalPath.length > 1) {
            const duration = endTime - startTime;
            const totalSegments = finalPath.length - 1;
            finalTimestamps = finalPath.map((_, index) => startTime + (duration * (index / totalSegments)));
        }

        return {
            ...trip,
            path: finalPath,
            timestamps: finalTimestamps,
        };
    });
};

const fullEpcEventHistoryAtom = atom<EventHistory[]>([]);
export const epcFullJourneyDataAtom = atom((get) => {
    const historyAsTrips = get(epcHistoryAsTripsAtom);
    if (historyAsTrips.length === 0) return null;
    const fullPath = historyAsTrips.flatMap(trip => trip.path || []);
    const fullTimestamps = historyAsTrips.flatMap(trip => trip.timestamps || []);
    return {
        path: fullPath,
        timestamps: fullTimestamps
    };
});


const epcHistoryAsTripsAtom = atom<MergeTrip[]>((get) => {
    const history = get(fullEpcEventHistoryAtom);
    const nodes = get(nodesAtom);
    const geometries = get(routeGeometriesAtom);
    if (history.length < 2 || nodes.length === 0) return [];

    const nodesMap = new Map(nodes.map(node => [node.scanLocation, node]));
    const trips: MergeTrip[] = [];

    for (let i = 0; i < history.length - 1; i++) {
        const fromEvent = history[i];
        const toEvent = history[i + 1];
        const fromNode = nodesMap.get(fromEvent.scanLocation);
        const toNode = nodesMap.get(toEvent.scanLocation);
        if (!fromNode || !toNode) continue;

        const roadId = fromEvent.eventId * 10000 + toEvent.eventId;
        const geometry = geometries[roadId];
        const path = geometry?.path || [fromNode.coord, toNode.coord];

        const startTime = new Date(fromEvent.eventTime).getTime() / 1000;
        const endTime = new Date(toEvent.eventTime).getTime() / 1000;
        const duration = endTime - startTime;
        const timestamps = path.map((_, index) => startTime + (duration * (index / (path.length - 1))));

        trips.push({
            roadId,
            from: { ...fromEvent, coord: fromNode.coord, eventTime: startTime },
            to: { ...toEvent, coord: toNode.coord, eventTime: endTime },
            epcCode: fromEvent.epcCode,
            productName: "Product Name", 
            epcLot: "EPC Lot", 
            eventType: toEvent.eventType,
            anomalyTypeList: toEvent.anomalyTypeList as AnomalyType[],
            path,
            timestamps
        });
    }
    return trips;
});

export const fullEpcHistoryAtom = atom<EventHistory[]>([]);

export const epcFullTripHistoryAtom = atom<MergeTrip[]>([]);

const convertHistoryToTrips = (history: EventHistory[], nodesMap: Map<string, LocationNode>): MergeTrip[] => {
    if (history.length < 2) return [];
    const trips: MergeTrip[] = [];
    for (let i = 0; i < history.length - 1; i++) {
        const fromEvent = history[i];
        const toEvent = history[i + 1];
        const fromNode = nodesMap.get(fromEvent.scanLocation);
        const toNode = nodesMap.get(toEvent.scanLocation);
        if (!fromNode || !toNode) continue;

        trips.push({
            roadId: fromEvent.eventId * 10000 + toEvent.eventId,
            from: { ...fromEvent, coord: fromNode.coord, eventTime: new Date(fromEvent.eventTime).getTime() / 1000 },
            to: { ...toEvent, coord: toNode.coord, eventTime: new Date(toEvent.eventTime).getTime() / 1000 },
            epcCode: fromEvent.epcCode,
            productName: "Product Name",
            epcLot: "EPC Lot",
            eventType: toEvent.eventType,
            anomalyTypeList: toEvent.anomalyTypeList as AnomalyType[],
        });
    }
    return trips;
};

export const loadInitialDataAtom = atom(null, async (get, set) => {
    const fileId = get(selectedFileIdAtom);
    if (!fileId) return;
    set(isLoadingAtom, true);
    try {
        const [nodesData, anomaliesData] = await Promise.all([
            getNodes(),
            getAllAnomalies({ fileId })
        ]);
        set(nodesAtom, nodesData);
        set(allAnomalyTripsAtom, anomaliesData);
    } catch (error) {
        console.error("초기 데이터 로딩 실패:", error);
    } finally {
        set(isLoadingAtom, false);
    }
});

export const loadTripsDataAtom = atom(null, async (get, set) => {
    const fileId = get(selectedFileIdAtom);
    if (!fileId) {
        set(tripsAtom, []);
        return;
    }
    set(isLoadingAtom, true);

    const currentTab = get(activeTabAtom);
    const currentFilters = get(appliedFiltersAtom);
    const fetchFunction = getAnomalies;
    const params = { ...currentFilters, fileId, limit: 50 };

    try {
        const response = await fetchFunction(params);
        const mergedTrips = await fetchGeometriesAndMergeTrips(response.data, get, set);
        set(tripsAtom, mergedTrips);
        set(nextCursorAtom, response.nextCursor);
    } catch (error) {
        console.error(`${currentTab} 데이터 로딩 실패:`, error);
        set(tripsAtom, []);
    } finally {
        set(isLoadingAtom, false);
    }
});

export const loadMoreTripsAtom = atom(null, async (get, set) => {
    const fileId = get(selectedFileIdAtom);
    const nextCursor = get(nextCursorAtom);
    if (!fileId || !nextCursor || get(isFetchingMoreAtom)) return;

    set(isFetchingMoreAtom, true);

    const currentTab = get(activeTabAtom);
    const currentFilters = get(appliedFiltersAtom);
    const fetchFunction = getAnomalies;
    const params = { ...currentFilters, fileId, limit: 50, cursor: nextCursor };

    try {
        const response = await fetchFunction(params);
        if (!response?.data?.length) {
            set(nextCursorAtom, null);
            return;
        }
        const newMergedTrips = await fetchGeometriesAndMergeTrips(response.data, get, set);

        set(tripsAtom, prevTrips => [...prevTrips, ...newMergedTrips]);
        set(nextCursorAtom, response.nextCursor);
    } catch (error) {
        console.error("추가 데이터 로딩 실패:", error);
    } finally {
        set(isFetchingMoreAtom, false);
    }
});

type FlyToOptions = Partial<Pick<MapViewState, 'longitude' | 'latitude' | 'zoom' | 'pitch' | 'bearing'>>;
export const flyToLocationAtom = atom(
    null,
    (get, set, location: FlyToOptions) => {
        const currentViewState = get(mapViewStateAtom);
        set(mapViewStateAtom, {
            ...currentViewState,
            longitude: location.longitude ?? currentViewState.longitude,
            latitude: location.latitude ?? currentViewState.latitude,
            zoom: location.zoom ?? 14,
            pitch: location.pitch ?? 50,
            bearing: location.bearing ?? 0,
            transitionDuration: 2000,
            transitionInterpolator: new FlyToInterpolator({ speed: 1.5 }),
        });
    }
);

export const epcDupTargetAtom = atom<string | null>(null);

export const epcDupListAtom = atom<MergeTrip[]>((get) => {
    const targetEpc = get(epcDupTargetAtom);
    const allTrips = get(tripsAtom);
    if (!targetEpc) {
        return [];
    }
    return allTrips.filter(trip => trip.epcCode === targetEpc);
});

export const anomalyFilterAtom = atom<AnomalyType | null>(null);

export const resetAnomalyFilterAtom = atom(
    null,
    (get, set) => {
        set(anomalyFilterAtom, null);
    }
);


export const selectTripAndFocusAtom = atom(
    null,
    async (get, set, trip: MergeTrip | null) => {
        const currentViewState = get(mapViewStateAtom);

        if (trip === null) {
            set(selectedObjectAtom, null);
            set(epcFullTripHistoryAtom, []);
            set(timeRangeAtom, null);
            return;
        }

        set(selectedObjectAtom, trip);
        set(isLoadingAtom, true);

        try {
            const nodes = get(nodesAtom);
            const nodesMap = new Map(nodes.map(n => [n.scanLocation, n]));

            const history = await fetchEpcHistory(trip);
            const historyAsTripsForPath = convertHistoryToTrips(history, nodesMap);

            const currentCache = get(routeGeometriesAtom);
            const tripsToFetch = historyAsTripsForPath.filter(t => !currentCache[t.roadId]);

            if (tripsToFetch.length > 0) {
                const geometryPromises = tripsToFetch.map(async (t) => {
                    const path = await fetchRouteGeometry(t.from.coord, t.to.coord);
                    return { roadId: t.roadId, path };
                });
                const newGeometries = await Promise.all(geometryPromises);
                const updatedCache = { ...currentCache };
                newGeometries.forEach(geom => { if (geom.path) updatedCache[geom.roadId] = { path: geom.path }; });
                set(routeGeometriesAtom, updatedCache);
            }

            const finalCache = get(routeGeometriesAtom);
            const finalHistoryTrips = historyAsTripsForPath.map(t => {
                const path = finalCache[t.roadId]?.path || [t.from.coord, t.to.coord];
                const startTime = t.from.eventTime;
                const endTime = t.to.eventTime;
                const duration = endTime - startTime;

                const timestamps = (path.length > 1 && duration > 0)
                    ? path.map((_, index) => startTime + (duration * (index / (path.length - 1))))
                    : [startTime, endTime];

                return { ...t, path, timestamps };
            });

            set(epcFullTripHistoryAtom, finalHistoryTrips);

            if (finalHistoryTrips.length > 0) {
                const allCoords = finalHistoryTrips.flatMap(t => t.path || []);
                const allTimestamps = finalHistoryTrips.flatMap(t => t.timestamps || []);

                if (allCoords.length > 0) {
                    const bounds: [[number, number], [number, number]] = allCoords.reduce(
                        (acc, coord) => [
                            [Math.min(acc[0][0], coord[0]), Math.min(acc[0][1], coord[1])],
                            [Math.max(acc[1][0], coord[0]), Math.max(acc[1][1], coord[1])],
                        ],
                        [[Infinity, Infinity], [-Infinity, -Infinity]]
                    );

                    const viewport = new WebMercatorViewport({
                        ...currentViewState,
                        width: window.innerWidth,
                        height: window.innerHeight,
                    });

                    const { longitude, latitude, zoom } = viewport.fitBounds(bounds, {
                        padding: { top: 80, bottom: window.innerHeight * 0.33 + 40, left: 40, right: 40 }
                    });

                    set(mapViewStateAtom, {
                        ...currentViewState,
                        longitude, latitude, zoom,
                        pitch: 50, bearing: 0,
                        transitionDuration: 2000,
                        transitionInterpolator: new FlyToInterpolator({ speed: 1.5 }),
                    });
                }
                if (allTimestamps.length > 0) {
                    set(timeRangeAtom, [Math.min(...allTimestamps), Math.max(...allTimestamps)]);
                }
            }
        } catch (error) {
            console.error("EPC 전체 이력 처리 실패:", error);
            set(epcFullTripHistoryAtom, []);
        } finally {
            set(isLoadingAtom, false);
        }
    }
);

export const visibleTripsAtom = atom<MergeTrip[]>((get) => {
    const selected = get(selectedObjectAtom);
    const fullHistoryTrips = get(epcHistoryAsTripsAtom);
    const allAnomalyTrips = get(allAnomalyTripsAtom);

    if (selected && fullHistoryTrips.length > 0) {
        return fullHistoryTrips;
    }

    return allAnomalyTrips;
});

let prevSelectedObject: any = undefined;
export const spySelectedObjectAtom = atom(
    (get) => {
        const currentSelectedObject = get(selectedObjectAtom);
        if (prevSelectedObject !== currentSelectedObject) {
            console.groupCollapsed(`🕵️ SPY: selectedObjectAtom 변경!`);
            console.log('이전 값:', prevSelectedObject);
            console.log('새로운 값:', currentSelectedObject);
            console.log('호출 스택 추적:');
            console.trace();
            console.groupEnd();
            prevSelectedObject = currentSelectedObject;
        }
        return currentSelectedObject;
    }
);

export const replayTriggerAtom = atom(0);

export const allAnomalyTripsAtom = atom<MergeTrip[]>([]);

export const loadAllAnomaliesAtom = atom(null, async (get, set) => {
    const fileId = get(selectedFileIdAtom);
    if (!fileId) return;
    set(isLoadingAtom, true);
    try {
        const allAnomaliesData = await getAllAnomalies({ fileId });
        set(allAnomalyTripsAtom, allAnomaliesData);
    } catch (error) {
        console.error("모든 이상 경로 데이터 로딩 실패:", error);
    } finally {
        set(isLoadingAtom, false);
    }
});


export const tripsForSelectedNodeAtom = atom((get) => {
    const allTrips = get(allAnomalyTripsAtom);
    const selected = get(selectedObjectAtom);

    if (selected && 'coord' in selected && !('roadId' in selected)) {
        const nodeLocation = (selected as LocationNode).scanLocation;
        return allTrips.filter(trip =>
            trip.from.scanLocation === nodeLocation || trip.to.scanLocation === nodeLocation
        );
    }
    return [];
});

export const selectTripAndSwitchToFlowmapAtom = atom(
    null,
    (_get, set, trip: MergeTrip) => {
        set(selectTripAndFocusAtom, trip);
        set(activeTabAtom, 'anomalies');
    }
);