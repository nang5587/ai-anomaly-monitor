import { atom } from 'jotai';
import { FlyToInterpolator } from 'deck.gl';
import { v4 as uuidv4 } from 'uuid';
import {
    getNodes,
    getAnomalies,
    getTrips,
    // getFilterOptions,
    type Node,
    type AnalyzedTrip,
    // type FilterOptions,
    type PaginatedTripsResponse,
} from '@/components/visual/data';

import { TripWithId, Tab } from '@/components/visual/SupplyChainDashboard';

export interface MapViewState {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
    transitionDuration?: number | 'auto';
    transitionInterpolator?: any; // 실제로는 더 구체적인 타입 지정 가능
}

type RouteGeometry = {
    path: [number, number][];
};
type RouteGeometryMap = Record<string, RouteGeometry>;

// --- 상태(State) 아톰 정의 ---
export const activeTabAtom = atom<Tab>('all');
export const appliedFiltersAtom = atom<Record<string, any>>({});
export const selectedObjectAtom = atom<TripWithId | Node | null>(null);
export const nodesAtom = atom<Node[]>([]);
// export const filterOptionsAtom = atom<FilterOptions | null>(null);
export const tripsAtom = atom<TripWithId[]>([]);
export const isLoadingAtom = atom<boolean>(true);
export const nextCursorAtom = atom<string | null>(null);
export const isFetchingMoreAtom = atom<boolean>(false);

const INITIAL_VIEW_STATE: MapViewState = {
    longitude: 127.9,
    latitude: 36.5,
    zoom: 6.5,
    pitch: 60,
    bearing: 0,
    transitionDuration: 0 // 초기 전환 효과는 없음
};
export const mapViewStateAtom = atom<MapViewState>(INITIAL_VIEW_STATE);
export const routeGeometriesAtom = atom<RouteGeometryMap | null>(null);

export const mergeAndGenerateTimestamps = (tripsFromApi: AnalyzedTrip[], geometries: RouteGeometryMap | null): TripWithId[] => {
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
            id: uuidv4(),
            path: finalPath,
            timestamps: finalTimestamps,
        };
    });
};

// --- 액션(Action) 아톰 정의 ---
export const loadRouteGeometriesAtom = atom(null, async (get, set) => {
    if (get(routeGeometriesAtom)) return;
    try {
        const response = await fetch('/static/all-routes-geometry.json');
        if (!response.ok) throw new Error('Failed to fetch route geometries');
        const data = await response.json();
        set(routeGeometriesAtom, data);
        console.log("상세 경로 데이터 로딩 성공!");
    } catch (error) {
        console.error("상세 경로 데이터 로딩 실패:", error);
    }
});

export const loadInitialDataAtom = atom(null, async (get, set) => {
    try {
        const nodesData = await getNodes();
        set(nodesAtom, nodesData);
    } catch (error) {
        console.error("초기 데이터(노드, 필터) 로딩 실패:", error);
    }
});

// ✨ 2. 탭이나 필터가 변경될 때 Trip 데이터를 로드하는 액션
export const loadTripsDataAtom = atom(null, async (get, set) => {
    set(isLoadingAtom, true);
    set(selectedObjectAtom, null);

    if (!get(routeGeometriesAtom)) {
        await set(loadRouteGeometriesAtom);
    }
    const geometries = get(routeGeometriesAtom);
    const currentTab = get(activeTabAtom);
    const currentFilters = get(appliedFiltersAtom);

    const fetchFunction = currentTab === 'anomalies' ? getAnomalies : getTrips;
    const params = { ...currentFilters, limit: 50, cursor: null };

    try {
        const response = await fetchFunction(params);
        // ✨ 3. 수정된 헬퍼 함수를 사용하여 병합 및 타임스탬프 생성
        const mergedTrips = mergeAndGenerateTimestamps(response.data, geometries);

        set(tripsAtom, mergedTrips);
        set(nextCursorAtom, response.nextCursor);

    } catch (error) {
        console.error(`${currentTab} 데이터 로딩 실패:`, error);
        set(tripsAtom, []);
    } finally {
        set(isLoadingAtom, false);
    }
});


// '더 보기' 액션
export const loadMoreTripsAtom = atom(null, async (get, set) => {
    const nextCursor = get(nextCursorAtom);
    const isFetching = get(isFetchingMoreAtom);
    if (isFetching || !nextCursor) return;

    set(isFetchingMoreAtom, true);

    const geometries = get(routeGeometriesAtom);
    const currentTab = get(activeTabAtom);
    const currentFilters = get(appliedFiltersAtom);
    const fetchFunction = currentTab === 'anomalies' ? getAnomalies : getTrips;
    const params = { ...currentFilters, limit: 50, cursor: nextCursor };

    try {
        const response = await fetchFunction(params);
        if (!response?.data?.length) {
            set(nextCursorAtom, null);
            return;
        }

        // ✨ 3. 수정된 헬퍼 함수를 사용하여 병합 및 타임스탬프 생성
        const newMergedTrips = mergeAndGenerateTimestamps(response.data, geometries);

        set(tripsAtom, prevTrips => [...prevTrips, ...newMergedTrips]);
        set(nextCursorAtom, response.nextCursor);
    } catch (error) {
        console.error("추가 데이터 로딩 실패:", error);
    } finally {
        set(isFetchingMoreAtom, false);
    }
});

// (선택사항) 특정 위치로 날아가는 효과를 주는 쓰기 전용 액션 아톰
export const flyToLocationAtom = atom(
    null,
    (get, set, location: { longitude: number, latitude: number, zoom?: number }) => {
        set(mapViewStateAtom, (prevViewState: MapViewState) => ({
            ...prevViewState,
            longitude: location.longitude,
            latitude: location.latitude,
            zoom: location.zoom || 12, // zoom 값이 없으면 기본값 12
            pitch: 50,
            bearing: 0,
            transitionDuration: 2000, // 2초 동안 날아가는 애니메이션
            transitionInterpolator: new FlyToInterpolator(),
        }));
    }
);