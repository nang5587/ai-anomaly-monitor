'use client'
import { createContext, useContext, useState } from 'react';
import type { LocationNode, AnalyzedTrip, FilterOptions } from '../types/data';
export type MergeTrip = AnalyzedTrip & { path?: [number, number][]; timestamps?: number[] };

interface InitialMapData {
    nodes: LocationNode[]; 
    trips: MergeTrip[];
    filterOptions: FilterOptions; 
    nextCursor: string | null;
}

const MapDataContext = createContext<InitialMapData | null>(null);

export const useMapData = () => useContext(MapDataContext);

export function MapDataProvider({ data, children }: { data: InitialMapData, children: React.ReactNode }) {
    return (
        <MapDataContext.Provider value={data}>
            {children}
        </MapDataContext.Provider>
    );
}