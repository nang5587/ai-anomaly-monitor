import { create } from 'zustand';
import { type LocationNode, type AnalyzedTrip } from '../types/data'; 

type TripWithId = AnalyzedTrip & { id: string; path?: [number, number][] }; 
type RouteGeometry = { path: [number, number][] };
type RouteGeometryMap = Record<string, RouteGeometry>;

interface MapState {
    nodes: LocationNode[];
    trips: TripWithId[];
    routeGeometries: RouteGeometryMap | null;
    selectedObject: TripWithId | LocationNode | null;
    isLoading: boolean;
    tripsWithDetailedPaths: TripWithId[];
    setNodes: (nodes: LocationNode[]) => void;
    setTrips: (trips: TripWithId[]) => void;
    setSelectedObject: (object: TripWithId | LocationNode | null) => void;
    loadRouteGeometries: () => Promise<void>;
}

export const useMapStore = create<MapState>((set, get) => ({
    nodes: [],
    trips: [],
    routeGeometries: null,
    selectedObject: null,
    isLoading: true,
    tripsWithDetailedPaths: [],
    setNodes: (nodes) => set({ nodes }),
    setTrips: (trips) => {
        const geometries = get().routeGeometries;
        const tripsWithPaths = trips.map(trip => {
            const detailedPath = geometries?.[trip.roadId]?.path;

            return {
                ...trip,
                path: detailedPath || (trip.from?.coord && trip.to?.coord ? [trip.from.coord, trip.to.coord] : [])
            };
        });

        set({ trips, tripsWithDetailedPaths: tripsWithPaths });
    },

    setSelectedObject: (object) => set({ selectedObject: object }),

    loadRouteGeometries: async () => {
        if (get().routeGeometries) return; 

        try {
            const response = await fetch('/static/all-routes-geometry.json');
            const data: RouteGeometryMap = await response.json();

            set({ routeGeometries: data });
            get().setTrips(get().trips);

            console.log("상세 경로 데이터 로딩 성공!");
        } catch (error) {
            console.error("상세 경로 데이터 로딩 실패:", error);
        }
    },
}));