import { atom } from 'jotai';
import { v4 as uuidv4 } from 'uuid';
import {    
    getNodes,
    getAnomalies,
    getTrips,
    getFilterOptions,
    type Node,
    type AnalyzedTrip,
    type FilterOptions,
    type PaginatedTripsResponse, } from '@/components/visual/data';

import { TripWithId, Tab } from '@/components/visual/SupplyChainDashboard';
// --- 상태(State) 아톰 정의 ---
export const nodesAtom = atom<Node[]>([]);
export const tripsAtom = atom<TripWithId[]>([]);
export const selectedObjectAtom = atom<TripWithId | Node | null>(null);
export const filterOptionsAtom = atom<FilterOptions | null>(null);
export const appliedFiltersAtom = atom<Record<string, any>>({});
export const activeTabAtom = atom<Tab>('anomalies');
export const isLoadingAtom = atom<boolean>(true);
export const nextCursorAtom = atom<string | null>(null);
export const isFetchingMoreAtom = atom<boolean>(false);

// --- 액션(Action) 아톰 정의 ---

// ✨ 1. 초기 데이터(노드, 필터 옵션)를 로드하는 액션
export const loadInitialDataAtom = atom(null, async (get, set) => {
    // getNodes, getFilterOptions API 호출이 여기서 일어남
    try {
        const nodesData = await getNodes();
        const filterOptionsData = await getFilterOptions();
        set(nodesAtom, nodesData);
        set(filterOptionsAtom, filterOptionsData);
    } catch (error) {
        console.error("초기 데이터 로딩 실패:", error);
    }
});

// ✨ 2. 탭이나 필터가 변경될 때 Trip 데이터를 로드하는 액션
export const loadTripsDataAtom = atom(null, async (get, set) => {
    set(isLoadingAtom, true);
    set(selectedObjectAtom, null); // 선택된 객체 초기화

    const currentTab = get(activeTabAtom);
    const currentFilters = get(appliedFiltersAtom);
    
    const fetchFunction = currentTab === 'anomalies' ? getAnomalies : getTrips;
    const params = { ...currentFilters, limit: 50, cursor: null };

    try {
        const response = await fetchFunction(params);
        const tripsWithId = response.data.map(trip => ({ ...trip, id: uuidv4() }));
        
        // tripsAtom과 nextCursorAtom 상태를 업데이트
        set(tripsAtom, tripsWithId);
        set(nextCursorAtom, response.nextCursor);
    } catch (error) {
        console.error(`${currentTab} 데이터 로딩 실패:`, error);
        set(tripsAtom, []);
    } finally {
        set(isLoadingAtom, false);
    }
});

// ✨ 3. '더 보기' 액션
export const loadMoreTripsAtom = atom(null, async (get, set) => {
    const nextCursor = get(nextCursorAtom);
    const isFetching = get(isFetchingMoreAtom);

    // 이미 로딩 중이거나 다음 페이지가 없으면 실행하지 않음
    if (isFetching || !nextCursor) return;

    set(isFetchingMoreAtom, true);

    const currentTab = get(activeTabAtom);
    const currentFilters = get(appliedFiltersAtom);
    const fetchFunction = currentTab === 'anomalies' ? getAnomalies : getTrips;
    const params = { ...currentFilters, limit: 50, cursor: nextCursor };

    try {
        const response = await fetchFunction(params);
        const newTripsWithId = response.data.map(trip => ({ ...trip, id: uuidv4() }));
        
        // ✨ 기존 trips 배열 뒤에 새로운 데이터를 추가
        set(tripsAtom, prevTrips => [...prevTrips, ...newTripsWithId]);
        set(nextCursorAtom, response.nextCursor);
    } catch (error) {
        console.error("추가 데이터 로딩 실패:", error);
    } finally {
        set(isFetchingMoreAtom, false);
    }
});