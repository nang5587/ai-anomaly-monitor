import { atom } from 'jotai';
import { FlyToInterpolator, WebMercatorViewport } from 'deck.gl';
import {
    getNodes,
    getAnomalies,
    getTrips,
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

export const loadInitialDataAtom = atom(null, async (get, set) => {
    const fileId = get(selectedFileIdAtom);
    if (!fileId) return;

    set(isLoadingAtom, true);
    try {
        await Promise.all([
            getNodes().then(data => set(nodesAtom, data)),
            getFilterOptions({ fileId }).then(data => set(filterOptionsAtom, data)),
        ]);
    } catch (error) {
        console.error("초기 공통 데이터 로딩 실패:", error);
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
    const fetchFunction = currentTab === 'anomalies' ? getAnomalies : getTrips;
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
    const fetchFunction = currentTab === 'anomalies' ? getAnomalies : getTrips;
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
    (get, set, trip: MergeTrip | null) => {
        const currentViewState = get(mapViewStateAtom);

        if (trip === null) {
            set(selectedObjectAtom, null);
            set(timeRangeAtom, null);
            return;
        }

        const currentTab = get(activeTabAtom);
        set(selectedObjectAtom, trip);

        if (currentTab === 'heatmap') {
            set(activeTabAtom, 'anomalies');
        }

        if (trip.timestamps && trip.timestamps.length > 0) {
            const startTime = trip.timestamps[0];
            const endTime = trip.timestamps[trip.timestamps.length - 1];
            set(timeRangeAtom, [startTime, endTime]);
        }

        const allCoords = trip.path || [trip.from.coord, trip.to.coord];
        if (allCoords && allCoords.length > 0) {
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
                padding: 200
            });

            set(mapViewStateAtom, {
                ...currentViewState,
                longitude,
                latitude,
                zoom,
                pitch: 50,
                bearing: 0,
                transitionDuration: 2000,
                transitionInterpolator: new FlyToInterpolator({ speed: 1.5 }),
            });
        }

        const currentTrips = get(tripsAtom);
        const isTripInList = currentTrips.some(t => t.roadId === trip.roadId);

        if (!isTripInList) {
            set(tripsAtom, [trip]);
            (async () => {
                const fileId = get(selectedFileIdAtom);
                if (!fileId) return;

                const geometries = get(routeGeometriesAtom);
                const filters = get(appliedFiltersAtom);
                const fetchFunc = get(activeTabAtom) === 'anomalies' ? getAnomalies : getTrips;

                try {
                    const response = await fetchFunc({ ...filters, fileId, limit: 50 });
                    const fetchedTrips = mergeAndGenerateTimestamps(response.data, geometries);
                    const otherTrips = fetchedTrips.filter(t => t.roadId !== trip.roadId);
                    set(tripsAtom, [trip, ...otherTrips]);
                    set(nextCursorAtom, response.nextCursor);
                } catch (e) { console.error(e); }
            })();
        }
    }
);

export const visibleTripsAtom = atom((get) => {
    const allTrips = get(tripsAtom);
    const selected = get(selectedObjectAtom);
    if (!selected || 'roadId' in selected) {
        return allTrips;
    }
    if ('coord' in selected) {
        const nodeLocation = selected.scanLocation;
        return allTrips.filter(trip =>
            trip.from.scanLocation === nodeLocation || trip.to.scanLocation === nodeLocation
        );
    }
    return allTrips;
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
    if (!fileId) {
        set(allAnomalyTripsAtom, []);
        return;
    }

    try {
        const allAnomaliesData = await getAllAnomalies({ fileId });
        const mergedTrips = await fetchGeometriesAndMergeTrips(allAnomaliesData, get, set);
        set(allAnomalyTripsAtom, mergedTrips);
    } catch (error) {
        console.error("모든 이상 경로 데이터 로딩 실패:", error);
        set(allAnomalyTripsAtom, []);
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