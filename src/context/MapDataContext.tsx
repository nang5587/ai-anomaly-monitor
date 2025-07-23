// src/context/MapDataContext.tsx
'use client'
import { createContext, useContext, useState } from 'react';
import type { LocationNode, AnalyzedTrip, FilterOptions } from '../components/visual/data'; // 실제 타입을 import하세요
export type TripWithId = AnalyzedTrip & { id: string; path?: [number, number][]; timestamps?: number[] };

// initialData의 타입을 정의합니다. (page.js와 동일한 구조)
interface InitialMapData {
    nodes: LocationNode[]; // 실제 LocationNode 타입으로 변경하세요
    trips: TripWithId[]; // 실제 TripWithId 타입으로 변경하세요
    filterOptions: FilterOptions; // 실제 FilterOptions 타입으로 변경하세요
    nextCursor: string | null;
}

// Context를 생성합니다.
const MapDataContext = createContext<InitialMapData | null>(null);

// 다른 컴포넌트에서 이 Context를 쉽게 사용할 수 있도록 하는 Hook
export const useMapData = () => useContext(MapDataContext);

// 데이터를 Context에 제공하는 Provider 컴포넌트
export function MapDataProvider({ data, children }: { data: InitialMapData, children: React.ReactNode }) {
    return (
        <MapDataContext.Provider value={data}>
            {children}
        </MapDataContext.Provider>
    );
}