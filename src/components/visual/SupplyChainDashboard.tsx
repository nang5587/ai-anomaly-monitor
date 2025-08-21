'use client'
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { Workflow, BarChart4 } from 'lucide-react';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
    nodesAtom,
    tripsAtom,
    selectedFileIdAtom,
    selectedObjectAtom,
    filterOptionsAtom,
    appliedFiltersAtom,
    activeTabAtom,
    isLoadingAtom,
    isFetchingMoreAtom,
    nextCursorAtom,
    loadInitialDataAtom,
    loadTripsDataAtom,
    loadAllAnomaliesAtom,
    loadMoreTripsAtom,
    anomalyFilterAtom,
    resetAnomalyFilterAtom,
    selectTripAndFocusAtom,
    tripsForSelectedNodeAtom,
    selectTripAndSwitchToFlowmapAtom,
} from '@/stores/mapDataAtoms';

import type { LocationNode, AnalyzedTrip } from '../../types/data';

import { SupplyChainMap } from './SupplyChainMap';
import { HeatmapView } from './HeatmapView';

import { DetailPanel } from './DetailPanel';
import { NodeTripListPanel } from './NodeTripListPanel';
import FilterPanel from './FilterPanel';
import AnomalyFilterTabs from './AnomalyFilterTabs';
import { FullScreenAnomalyList } from './FullScreenAnomalyList';

export type Tab = 'anomalies' | 'heatmap';
export type MergeTrip = AnalyzedTrip & { path?: [number, number][]; timestamps?: number[] };

const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 50px',
    fontSize: '16px',
    fontWeight: 'normal',
    color: isActive ? '#FFFFFF' : '#AAAAAA',
    backgroundColor: 'transparent',
    border: 'none',
    borderTop: isActive ? '2px solid #8ec5ff' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
});

export const SupplyChainDashboard: React.FC = () => {
    const searchParams = useSearchParams();
    const trips = useAtomValue(tripsAtom);
    const selectedAnomalyFilter = useAtomValue(anomalyFilterAtom);
    const filterOptions = useAtomValue(filterOptionsAtom);
    const nextCursor = useAtomValue(nextCursorAtom);
    const isLoading = useAtomValue(isLoadingAtom);
    const isFetchingMore = useAtomValue(isFetchingMoreAtom);

    const [activeTab, setActiveTab] = useAtom(activeTabAtom);
    const [selectedObject, setSelectedObject] = useAtom(selectedObjectAtom);
    const [appliedFilters, setAppliedFilters] = useAtom(appliedFiltersAtom);

    const setSelectedFileId = useSetAtom(selectedFileIdAtom);
    const loadInitialData = useSetAtom(loadInitialDataAtom);
    const loadTrips = useSetAtom(loadTripsDataAtom);
    const loadAllAnomalies = useSetAtom(loadAllAnomaliesAtom);
    const loadMore = useSetAtom(loadMoreTripsAtom);
    const resetAnomalyFilter = useSetAtom(resetAnomalyFilterAtom);
    const selectTripAndFocus = useSetAtom(selectTripAndFocusAtom);

    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const isTripSelected = useMemo(() => selectedObject && 'roadId' in selectedObject, [selectedObject]);
    const isNodeSelected = useMemo(() => selectedObject && 'scanLocation' in selectedObject && !('roadId' in selectedObject), [selectedObject]);

    const isObjectSelected = useMemo(() => selectedObject !== null, [selectedObject]);
    const selectedTrip = useMemo(() => (selectedObject && 'roadId' in selectedObject) ? selectedObject : null, [selectedObject]);
    const selectedNode = useMemo(() => (selectedObject && 'scanLocation' in selectedObject && !('roadId' in selectedObject)) ? selectedObject : null, [selectedObject]);

    useEffect(() => {
        const fileIdFromUrl = searchParams.get('fileId');
        if (fileIdFromUrl) {
            console.log(`페이지 로드: fileId(${fileIdFromUrl})로 데이터 로딩 시작`);
            const fileId = Number(fileIdFromUrl);
            setSelectedFileId(fileId);
            loadInitialData();
            loadTrips();
            loadAllAnomalies();
        } else {
            console.warn("URL에 fileId가 없어 초기 데이터를 로드할 수 없습니다.");
        }
    }, []);

    useEffect(() => {
        resetAnomalyFilter();
    }, [activeTab, appliedFilters, resetAnomalyFilter]);

    useEffect(() => {
        if (activeTab === 'heatmap') {
            setSelectedObject(null);
            return;
        }
        loadTrips();
    }, [activeTab, appliedFilters]);

    const filteredTrips = useMemo(() => {
        if (!selectedAnomalyFilter) {
            return trips;
        }
        return trips.filter(trip =>
            trip.anomalyTypeList?.includes(selectedAnomalyFilter)
        );
    }, [trips, selectedAnomalyFilter]);

    const handleApplyFilters = (filters: Record<string, any>) => {
        setAppliedFilters(filters);
        setShowFilterPanel(false);
    };

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: '#1A1A1A'
        }}>
            <header
                className="absolute top-0 left-0 w-full z-30 pointer-events-none"
            >
                <div className="w-fit mx-auto bg-black/60 backdrop-blur-sm rounded-lg flex pointer-events-auto">
                    <button style={tabButtonStyle(activeTab === 'anomalies')} onClick={() => setActiveTab('anomalies')} className="flex items-center gap-2"><Workflow size={16} />이상 흐름 분석</button>
                    <button style={tabButtonStyle(activeTab === 'heatmap')} onClick={() => setActiveTab('heatmap')} className="flex items-center gap-2"><BarChart4 size={16} />이상 발생 밀집도</button>
                </div>
            </header>
            <div
                className={`absolute inset-0 transition-opacity duration-300 bg-[rgba(40,40,40)]
            ${isObjectSelected ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
                {activeTab === 'anomalies' ? (
                    <FullScreenAnomalyList />
                ) : (
                    <div className="w-full h-full">
                        <Suspense fallback={
                            <div className="w-full h-full bg-black bg-opacity-70 flex items-center justify-center text-white">
                                <p>히트맵 데이터를 불러오는 중입니다...</p>
                            </div>
                        }>
                            <HeatmapView />
                        </Suspense>
                    </div>
                )}
            </div>
            <div
                className={`absolute inset-0 w-full h-full flex flex-col transition-opacity duration-300 overflow-y-auto
            ${isObjectSelected ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                <div className="h-2/3">
                    {activeTab === 'heatmap' ? (
                        <Suspense fallback={
                            <div className="w-full h-full bg-black bg-opacity-70 flex items-center justify-center text-white">
                                <p>히트맵 데이터를 불러오는 중입니다...</p>
                            </div>
                        }>
                            <HeatmapView />
                        </Suspense>
                    ) : (
                        <SupplyChainMap />
                    )}
                </div>

                <div className="h-1/3 bg-[#1A1A1A] border-t border-white/20">
                    {selectedTrip && (
                        <DetailPanel
                            selectedTrip={selectedTrip}
                            onClose={() => setSelectedObject(null)}
                        />
                    )}
                    {selectedNode && activeTab === 'heatmap' && (
                        <NodeTripListPanel />
                    )}
                </div>
            </div>
        </div>
    );
}