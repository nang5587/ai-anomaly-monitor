// zustand
import { create } from 'zustand';
import { type LocationNode, type AnalyzedTrip } from '../types/data'; // 실제 타입 경로 확인

// --- 타입 정의 ---
type TripWithId = AnalyzedTrip & { id: string; path?: [number, number][] }; // ✨ path 속성 추가
type RouteGeometry = { path: [number, number][] };
type RouteGeometryMap = Record<string, RouteGeometry>;

// --- 스토어 상태 타입 정의 ---
interface MapState {
    nodes: LocationNode[];
    trips: TripWithId[];
    routeGeometries: RouteGeometryMap | null;
    selectedObject: TripWithId | LocationNode | null;
    isLoading: boolean;

    // ✨ "병합된 최종 데이터"를 저장할 상태 추가
    tripsWithDetailedPaths: TripWithId[];

    // --- 액션 정의 ---
    setNodes: (nodes: LocationNode[]) => void;
    setTrips: (trips: TripWithId[]) => void;
    setSelectedObject: (object: TripWithId | LocationNode | null) => void;
    loadRouteGeometries: () => Promise<void>; // ✨ 상세 경로 로딩 액션
}

// --- Zustand 스토어 생성 ---
export const useMapStore = create<MapState>((set, get) => ({
    // --- 초기 상태 ---
    nodes: [],
    trips: [],
    routeGeometries: null,
    selectedObject: null,
    isLoading: true,
    tripsWithDetailedPaths: [],

    // --- 액션 구현 ---
    setNodes: (nodes) => set({ nodes }),

    // trips 데이터가 업데이트될 때마다, 상세 경로와 자동으로 병합
    setTrips: (trips) => {
        const geometries = get().routeGeometries;
        const tripsWithPaths = trips.map(trip => {
            // roadId를 사용해 상세 경로를 찾음
            const detailedPath = geometries?.[trip.roadId]?.path;

            return {
                ...trip,
                // 상세 경로가 있으면 사용, 없으면 시작-끝점으로 직선 경로 생성 (안전장치)
                path: detailedPath || (trip.from?.coord && trip.to?.coord ? [trip.from.coord, trip.to.coord] : [])
            };
        });

        set({ trips, tripsWithDetailedPaths: tripsWithPaths });
    },

    setSelectedObject: (object) => set({ selectedObject: object }),

    // 상세 경로 JSON 파일을 fetch하는 액션
    loadRouteGeometries: async () => {
        if (get().routeGeometries) return; // 이미 로드했다면 다시 실행 안 함

        try {
            const response = await fetch('/static/all-routes-geometry.json');
            const data: RouteGeometryMap = await response.json();

            set({ routeGeometries: data });

            // 상세 경로 로드가 완료된 후, 기존 trips 데이터를 다시 병합하여 화면을 갱신
            get().setTrips(get().trips);

            console.log("상세 경로 데이터 로딩 성공!");
        } catch (error) {
            console.error("상세 경로 데이터 로딩 실패:", error);
        }
    },
}));