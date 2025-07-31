import { atom, WritableAtom } from 'jotai';
import { FlyToInterpolator } from 'deck.gl';
import {
    getNodes,
    getAnomalies,
    getTrips,
    getFilterOptions,
    getAllAnomalies,
    type LocationNode,
    type AnalyzedTrip,
    type FilterOptions,
    type PaginatedTripsResponse,
    type AnomalyType,
} from '../types/data';

import { MergeTrip, Tab } from '@/components/visual/SupplyChainDashboard';

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

async function fetchMapboxRoute(start: [number, number], end: [number, number]): Promise<[number, number][] | null> {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.join(',')};${end.join(',')}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Mapbox API 에러: ${response.statusText}`);
        const data = await response.json();
        console.log('✅ Mapbox 경로 탐색 성공!');
        if (data.routes && data.routes.length > 0) {
            return data.routes[0].geometry.coordinates;
        }
        return null;
    } catch (error) {
        console.error("Mapbox 경로 탐색 실패:", error);
        return null;
    }
}

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

/**
 * 현재 분석 대상인 파일의 ID를 저장하는 아톰.
 */
export const selectedFileIdAtom = atom<number | null>(null);
// export const selectedFileIdAtom = atom<number | null>(1); //⚠️ 백 연동 시 지우고 위에 코드 사용
export const selectedFactoryNameAtom = atom<string | null>(null);

/**
 * 시간 필터링을 위한 시간 범위 [시작, 끝]을 저장하는 아톰.
 */
export const timeRangeAtom = atom<[number, number] | null>(null);

/**
 * '모든' 이상 징후 Trip 데이터를 저장합니다.
 * React.Suspense와 함께 사용해야 합니다.
 */

export const allAnomalyTripsAtom = atom<MergeTrip[] | null>(null);

export const loadAllAnomalyTripsAtom = atom(
    null, // 이 아톰은 값을 가지지 않습니다 (쓰기 전용).
    async (get, set) => {
        // 중복 로딩 방지: 이미 데이터가 있으면 실행하지 않음
        if (get(allAnomalyTripsAtom) !== null) {
            // 필요하다면 fileId가 바뀌었을 때 강제로 다시 로드하는 로직을 추가할 수 있습니다.
            // set(allAnomalyTripsAtom, null); // 강제 리로드용
            return;
        }

        const fileId = get(selectedFileIdAtom);
        // ✨ geometries는 여기서 한 번만 가져옵니다.
        const geometries = get(routeGeometriesAtom); 

        if (!fileId || !geometries) {
            console.warn("allAnomalyTripsAtom 로딩: fileId 또는 geometries 준비 안 됨");
            set(allAnomalyTripsAtom, []); // 준비 안됐으면 빈 배열로 설정
            return;
        }

        try {
            const anomaliesData = await getAllAnomalies({ fileId });
            
            // ✨ 이제 set 함수는 올바른 타입이므로 mergeAndGenerateTimestamps에 전달할 수 있습니다.
            const mergedTrips = await mergeAndGenerateTimestamps(anomaliesData, geometries, set);
            
            // ✨ 최종적으로 allAnomalyTripsAtom의 상태를 업데이트합니다.
            set(allAnomalyTripsAtom, mergedTrips);
        } catch (error) {
            console.error(`[loadAllAnomalyTripsAtom] 데이터 로딩 실패:`, error);
            set(allAnomalyTripsAtom, []); // 에러 시 빈 배열로 설정
        }
    }
);

// --- 상태(State) 아톰 정의 ---
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
    transitionDuration: 0 // 초기 전환 효과는 없음
};
export const mapViewStateAtom = atom<MapViewState>(INITIAL_VIEW_STATE);
export const routeGeometriesAtom = atom<RouteGeometryMap | null>(null);

export const mergeAndGenerateTimestamps = async (
    tripsFromApi: AnalyzedTrip[],
    geometries: RouteGeometryMap | null,
    set: (atom: WritableAtom<any, any[], any>, update: any) => void // Jotai의 set 함수 타입
): Promise<MergeTrip[]> => {
    if (!tripsFromApi) return [];

    const tripPromises = tripsFromApi.map(async trip => {
        const roadIdKey = trip.roadId ? String(trip.roadId) : '';
        let finalPath = geometries?.[roadIdKey]?.path;

        if (!finalPath && trip.from?.coord && trip.to?.coord) {
            const apiPath = await fetchMapboxRoute(trip.from.coord, trip.to.coord);
            if (apiPath) {
                finalPath = apiPath;
                // 가져온 경로를 캐시에 업데이트
                set(routeGeometriesAtom, (prev: RouteGeometryMap | null) => ({
                    ...prev,
                    [roadIdKey]: { path: apiPath },
                }));
            }
        }

        if (!finalPath) {
            finalPath = (trip.from?.coord && trip.to?.coord) ? [trip.from.coord, trip.to.coord] : [];
        }

        // --- (타임스탬프 생성 로직은 그대로) ---
        const startTime = trip.from?.eventTime;
        const endTime = trip.to?.eventTime;
        let finalTimestamps: number[] = [];
        if (startTime != null && endTime != null && finalPath.length > 1) {
            const duration = endTime - startTime;
            if (duration > 0) {
                const totalSegments = finalPath.length - 1;
                finalTimestamps = finalPath.map((point, index) => startTime + (duration * (index / totalSegments)));
            } else {
                finalTimestamps = [startTime, endTime];
            }
        }

        return { ...trip, path: finalPath, timestamps: finalTimestamps };
    });

    return Promise.all(tripPromises);
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

// export const loadInitialDataAtom = atom(null, async (get, set) => {
//     try {
//         const [nodesData, filterOptionsData] = await Promise.all([
//             getNodes(),
//             getFilterOptions()
//         ]);
//         set(nodesAtom, nodesData);
//         set(filterOptionsAtom, filterOptionsData);
//     } catch (error) {
//         console.error("초기 데이터(노드, 필터) 로딩 실패:", error);
//     }
// });

export const loadInitialDataAtom = atom(null, async (get, set) => {
    const fileId = get(selectedFileIdAtom);

    // ✨ 2. fileId가 없으면 데이터 로딩을 중단합니다.
    //    (SupplyChainDashboard에서 fileId를 먼저 설정해주므로 이 경우는 거의 없습니다.)
    if (!fileId) {
        console.warn("loadInitialDataAtom: fileId가 설정되지 않아 데이터 로딩을 중단합니다.");
        return;
    }

    set(isLoadingAtom, true);
    try {
        await Promise.all([
            set(loadRouteGeometriesAtom),
            set(loadAllAnomalyTripsAtom),
            getNodes().then(data => set(nodesAtom, data)),
            getFilterOptions({ fileId: fileId }).then(data => set(filterOptionsAtom, data)),
        ]);
    } catch (error) {
        console.error("초기 공통 데이터 로딩 실패:", error);
    } finally {
        set(isLoadingAtom, false);
    }
});

// ✨ 2. 탭이나 필터가 변경될 때 Trip 데이터를 로드하는 액션
export const loadTripsDataAtom = atom(null, async (get, set) => {
    const fileId = get(selectedFileIdAtom);
    if (!fileId) {
        set(tripsAtom, []);
        return;
    }

    set(isLoadingAtom, true);
    // set(selectedObjectAtom, null);

    if (!get(routeGeometriesAtom)) {
        await set(loadRouteGeometriesAtom);
    }
    const geometries = get(routeGeometriesAtom);
    const currentTab = get(activeTabAtom);
    const currentFilters = get(appliedFiltersAtom);

    const fetchFunction = currentTab === 'anomalies' ? getAnomalies : getTrips;
    const params = { ...currentFilters, fileId, limit: 50, cursor: null };

    try {
        const response = await fetchFunction(params);
        // ✨ await 및 set 전달
        const mergedTrips = await mergeAndGenerateTimestamps(response.data, geometries, set);
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
    const fileId = get(selectedFileIdAtom);
    const nextCursor = get(nextCursorAtom);

    if (fileId === null || !nextCursor || get(isFetchingMoreAtom)) return;

    const isFetching = get(isFetchingMoreAtom);
    if (isFetching || !nextCursor) return;

    set(isFetchingMoreAtom, true);

    const geometries = get(routeGeometriesAtom);
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

        // ✨ 3. 수정된 헬퍼 함수를 사용하여 병합 및 타임스탬프 생성
        const newMergedTrips = await mergeAndGenerateTimestamps(response.data, geometries, set);
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

// --- 이상 유형 필터 상태 ---
export const anomalyFilterAtom = atom<AnomalyType | null>(null);

// ✨ anomalyFilterAtom을 null로 리셋하는 쓰기 전용 atom 추가
export const resetAnomalyFilterAtom = atom(
    null, // 읽기 전용 값 (사용 안 함)
    (get, set) => {
        // 이 atom이 호출되면, anomalyFilterAtom의 값을 null로 설정합니다.
        set(anomalyFilterAtom, null);
    }
);




// ===================================================================
// ✨ 2. 데이터 불일치 문제를 해결하는 핵심 액션 아톰
// ===================================================================

/**
 * [신규] 히트맵/디테일에서 Trip 선택 시, 모든 관련 상태를 업데이트하고 뷰를 전환하는 액션 아톰.
 * 데이터 불일치 문제를 해결하는 핵심 로직을 포함합니다.
 */
export const selectTripAndFocusAtom = atom(
    null,
    (get, set, trip: MergeTrip | null) => {
        if (trip === null) {
            console.log("🚀 selectTripAndFocusAtom이 'null'로 호출됨 (선택 해제)");
            // console.log("🚀 selectTripAndFocusAtom triggered for deselection (null)");
            set(selectedObjectAtom, null);
            set(timeRangeAtom, null);
            // set(mapViewStateAtom, INITIAL_VIEW_STATE); // 👈 초기 뷰로 돌리고 싶다면 이 코드 사용
            return;
        } else {
            console.log("🚀 selectTripAndFocusAtom이 Trip 객체로 호출됨:", trip);
        }

        const currentTab = get(activeTabAtom);
        set(selectedObjectAtom, trip);

        // 현재 탭이 'heatmap'일 경우에만 'all'로 전환
        if (currentTab === 'heatmap') {
            set(activeTabAtom, 'all');
        }

        // 2. 시간 필터 설정
        if (trip.timestamps && trip.timestamps.length > 0) {
            const startTime = trip.timestamps[0];
            const endTime = trip.timestamps[trip.timestamps.length - 1];
            set(timeRangeAtom, [startTime, endTime]);
        }

        // 3. 카메라 이동
        if (trip.path && trip.path.length > 1) {
            const lastIndex = trip.path.length - 1;
            const destination = trip.path[lastIndex];

            const newLocation = {
                longitude: destination[0], // 마지막 좌표의 경도
                latitude: destination[1],  // 마지막 좌표의 위도
                zoom: 14,
            };
            set(flyToLocationAtom, newLocation);
        }

        // 4. [핵심] 페이지네이션된 `tripsAtom`에 선택된 trip이 없으면 주입
        const currentTrips = get(tripsAtom);
        const isTripInList = currentTrips.some(t => t.roadId === trip.roadId);

        if (!isTripInList) {
            // 즉각적인 UI 반응을 위해 선택된 trip을 바로 목록 맨 앞에 추가
            set(tripsAtom, [trip]);
            // 백그라운드에서 첫 페이지 데이터를 다시 로드하여 목록을 완성
            (async () => {
                const fileId = get(selectedFileIdAtom);
                if (!fileId) return;

                const geometries = get(routeGeometriesAtom);
                const filters = get(appliedFiltersAtom);
                const fetchFunc = get(activeTabAtom) === 'anomalies' ? getAnomalies : getTrips;

                try {
                    const response = await fetchFunc({ ...filters, fileId, limit: 50, cursor: null });
                    const fetchedTrips = await mergeAndGenerateTimestamps(response.data, geometries, set);
                    // 중복 방지를 위해 선택된 trip을 제외하고 합침
                    const otherTrips = fetchedTrips.filter(t => t.roadId !== trip.roadId);
                    set(tripsAtom, [trip, ...otherTrips]);
                    set(nextCursorAtom, response.nextCursor);
                } catch (e) { console.error(e); }
            })();
        }
    }
);

export const visibleTripsAtom = atom((get) => {
    const allTrips = get(tripsAtom); // 페이지네이션된 전체 Trip 목록
    const selected = get(selectedObjectAtom);

    // 선택된 객체가 없거나, Trip이 선택된 경우에는 모든 Trip을 보여줍니다.
    if (!selected || 'roadId' in selected) {
        return allTrips;
    }

    // ✨ 노드가 선택된 경우, 해당 노드를 경유하는 Trip만 필터링합니다.
    if ('coord' in selected) {
        const nodeLocation = selected.scanLocation;
        return allTrips.filter(trip =>
            trip.from.scanLocation === nodeLocation || trip.to.scanLocation === nodeLocation
        );
    }

    return allTrips; // 기본적으로 모든 Trip 반환
});

let prevSelectedObject: any = undefined;
export const spySelectedObjectAtom = atom(
    (get) => {
        const currentSelectedObject = get(selectedObjectAtom);
        // 값이 실제로 변경되었을 때만 로그를 남깁니다.
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