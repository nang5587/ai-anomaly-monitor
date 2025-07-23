import { atom } from 'jotai';
import { FlyToInterpolator } from 'deck.gl';
import {
    getNodes,
    getAnomalies,
    getTrips,
    getFilterOptions,
    type LocationNode,
    type AnalyzedTrip,
    type FilterOptions,
    type PaginatedTripsResponse,
} from '@/components/visual/data';

import { MergeTrip, Tab } from '@/components/visual/SupplyChainDashboard';

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
export const selectedObjectAtom = atom<MergeTrip | LocationNode | null>(null);
export const nodesAtom = atom<LocationNode[]>([]);
export const filterOptionsAtom = atom<FilterOptions | null>(null);
export const tripsAtom = atom<AnalyzedTrip[]>([]);
export const isLoadingAtom = atom<boolean>(false);
export const nextCursorAtom = atom<string | null>(null);
export const isFetchingMoreAtom = atom<boolean>(false);

const INITIAL_VIEW_STATE: MapViewState = {
    longitude: 127.9,
    latitude: 36.5,
    zoom: 10,
    pitch: 60,
    bearing: 0,
    transitionDuration: 0 // 초기 전환 효과는 없음
};
export const mapViewStateAtom = atom<MapViewState>(INITIAL_VIEW_STATE);
export const routeGeometriesAtom = atom<RouteGeometryMap | null>(null);

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
        const [nodesData, filterOptionsData] = await Promise.all([
            getNodes(),
            getFilterOptions()
        ]);
        set(nodesAtom, nodesData);
        set(filterOptionsAtom, filterOptionsData);
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



// 특정 위치로 날아가는 효과를 주는 쓰기 전용 액션 아톰
type FlyToOptions = Partial<Pick<MapViewState, 'longitude' | 'latitude' | 'zoom' | 'pitch' | 'bearing'>>;
export const flyToLocationAtom = atom(
    null,
    (get, set, location: FlyToOptions) => {
        const currentViewState = get(mapViewStateAtom);
        set(mapViewStateAtom, {
            ...currentViewState,
            longitude: location.longitude ?? currentViewState.longitude,
            latitude: location.latitude ?? currentViewState.latitude,
            zoom: location.zoom ?? 17,
            pitch: location.pitch ?? 50, // 기본 pitch
            bearing: location.bearing ?? 0, // 기본 bearing
            transitionDuration: 2000, // 전환 시간을 2초로 늘림
            transitionInterpolator: new FlyToInterpolator({ speed: 1.5 }),
        });
    }
);

// --- EPC 복제 기능 관련 아톰 ---

// 1. 사용자가 클릭한 EPC 복제 Trip의 epcCode를 저장하는 아톰
export const epcDupTargetAtom = atom<string | null>(null);

// 2. epcDupTargetAtom이 설정되면, 해당하는 모든 Trip 목록을 파생시키는 읽기 전용 아톰
export const epcDupListAtom = atom<MergeTrip[]>((get) => {
    const targetEpc = get(epcDupTargetAtom);
    const allTrips = get(tripsAtom);

    // 타겟 EPC 코드가 없으면 빈 배열 반환
    if (!targetEpc) {
        return [];
    }

    // 전체 Trip 목록에서 동일한 epcCode를 가진 Trip들만 필터링
    return allTrips.filter(trip => trip.epcCode === targetEpc);
});