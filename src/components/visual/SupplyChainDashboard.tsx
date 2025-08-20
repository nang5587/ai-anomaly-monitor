'use client'
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { Filter } from 'lucide-react';

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
    loadMoreTripsAtom,
    anomalyFilterAtom,
    resetAnomalyFilterAtom,
    selectTripAndFocusAtom,
} from '@/stores/mapDataAtoms';

import type { LocationNode, AnalyzedTrip } from '../../types/data';

import { SupplyChainMap } from './SupplyChainMap';
import { HeatmapView } from './HeatmapView';

import AnomalyList from './AnomalyList';
import { DetailPanel } from './DetailPanel';
import FilterPanel from './FilterPanel';
import AnomalyFilterTabs from './AnomalyFilterTabs';

export type Tab = 'anomalies' | 'heatmap';
export type MergeTrip = AnalyzedTrip & { path?: [number, number][]; timestamps?: number[] };

const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: isActive ? 'bold' : 'normal',
    color: isActive ? '#FFFFFF' : '#AAAAAA',
    backgroundColor: 'transparent',
    border: 'none',
    borderTop: isActive ? '2px solid #3399FF' : '2px solid transparent',
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
    const loadMore = useSetAtom(loadMoreTripsAtom);
    const resetAnomalyFilter = useSetAtom(resetAnomalyFilterAtom);
    const selectTripAndFocus = useSetAtom(selectTripAndFocusAtom);

    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const isTripSelected = useMemo(() => selectedObject && 'roadId' in selectedObject, [selectedObject]);

    useEffect(() => {
        const fileIdFromUrl = searchParams.get('fileId');
        if (fileIdFromUrl) {
            console.log(`페이지 로드: fileId(${fileIdFromUrl})로 데이터 로딩 시작`);
            const fileId = Number(fileIdFromUrl);
            setSelectedFileId(fileId);
            loadInitialData();
            loadTrips();
        } else {
            console.warn("URL에 fileId가 없어 초기 데이터를 로드할 수 없습니다.");
        }
    }, []);

    useEffect(() => {
        resetAnomalyFilter();
    }, [activeTab, appliedFilters, resetAnomalyFilter]);

    useEffect(() => {
        if (activeTab === 'heatmap') {
            return;
        }
        loadTrips();
    }, [activeTab, appliedFilters, loadTrips]);

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
            overflow: 'hidden', // 추가: 자식 요소가 넘치지 않도록
        }}>
            {/* ▼▼▼▼▼ [핵심 수정 1] 지도와 디테일 패널을 감싸는 컨테이너 추가 ▼▼▼▼▼ */}
            <div
                className={`absolute top-0 left-0 w-full h-full bg-[#1A1A1A] transition-all duration-500 ease-in-out overflow-y-auto ${isTripSelected ? 'z-20' : 'z-0'}`}
            >
                {/* 지도 영역 */}
                <div className={`w-full transition-all duration-500 ease-in-out flex-shrink-0 ${isTripSelected ? 'h-2/3' : 'h-full'}`}>
                    {activeTab === 'heatmap' ? (
                        <Suspense fallback={<div>...</div>}>
                            <HeatmapView />
                        </Suspense>
                    ) : (
                        <SupplyChainMap />
                    )}
                </div>
                <div
                    className={`w-full bg-[#1A1A1A] border-t border-white/20 transition-all duration-500 ease-in-out ${isTripSelected ? 'h-1/3 p-6' : 'h-0'}`}
                >
                    {isTripSelected && (
                        <DetailPanel
                            selectedTrip={selectedObject as MergeTrip}
                            onClose={() => selectTripAndFocus(null)}
                        />
                    )}
                </div>
            </div>

            <div
                className={`absolute top-0 left-0 h-full transition-opacity duration-500 ease-in-out ${isTripSelected ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
                {(activeTab === 'anomalies') && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: 'calc((100vw) / 2)', 
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                }}>
                    <AnomalyFilterTabs disabled={isLoading} />
                </div>
            )}

                {/* 필터 패널 */}
                <div style={{
                    position: 'absolute', top: '20px', left: '30px', width: '350px',
                    height: 'calc(100vh - 200px)', zIndex: 4,
                    transform: showFilterPanel ? 'translateX(-6%)' : 'translateX(-120%)',
                    transition: 'transform 0.3s ease-in-out',
                }}>
                    <FilterPanel
                        options={filterOptions}
                        onApplyFilters={handleApplyFilters}
                        isFiltering={isLoading}
                        onClose={() => setShowFilterPanel(false)}
                    />
                </div>

                {/* 좌측 사이드바 */}
                <div style={{
                    position: 'absolute', top: '0px', left: '20px', zIndex: 3,
                    display: 'flex', flexDirection: 'column', gap: '15px',
                }}>
                    <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className='bg-[#000000] rounded-b-[25px]'>
                        <div className='flex whitespace-nowrap'>
                            {/* 탭 버튼들: 'all' 탭이 없으므로 'anomalies'로 대체합니다. */}
                            <button style={tabButtonStyle(activeTab === 'anomalies')} onClick={() => setActiveTab('anomalies')}>이상 흐름 분석</button>
                            <button style={tabButtonStyle(activeTab === 'heatmap')} onClick={() => setActiveTab('heatmap')}>이상 발생 밀집도</button>
                        </div>
                        {activeTab === 'anomalies' && ( // 'anomalies' 탭일 때 필터 버튼 표시
                            <button
                                onClick={() => setShowFilterPanel(prev => !prev)}
                                className="px-4 cursor-pointer"
                            >
                                <Filter className="w-5 h-5 text-white" />
                            </button>
                        )}
                    </div>

                    {activeTab === 'anomalies' && ( // 'anomalies' 탭일 때만 리스트 표시
                        <div style={{
                            width: '340px', height: 'calc(100vh - 240px)', // 높이값 조정
                            minHeight: 0, background: 'linear-gradient(145deg, #2A2A2A, #1E1E1E)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)', borderRadius: '25px',
                            display: 'flex', flexDirection: 'column',
                        }}>
                            <div style={{ flex: 1, minHeight: 0 }}>
                                <AnomalyList
                                    anomalies={filteredTrips}
                                    onCaseClick={(trip) => selectTripAndFocus(trip)}
                                    selectedObjectId={selectedObject && 'roadId' in selectedObject ? selectedObject.roadId : null}
                                />
                            </div>
                            <div className="bg-[rgba(40,40,40)] rounded-b-lg flex-shrink-0 p-4 text-center text-sm font-noto-400 text-white">
                                <p className="mb-2">현재 {filteredTrips.length}개의 이상 징후 표시 중</p>
                                {nextCursor && (
                                    <button onClick={() => loadMore()} disabled={isFetchingMore} className="w-full bg-gray-600 hover:bg-gray-500 rounded-lg p-2 disabled:bg-gray-800 transition-colors">
                                        {isFetchingMore ? '로딩 중...' : '더 보기'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 로딩 인디케이터는 최상위에 유지 */}
            {isLoading && !isFetchingMore && (
                <div className="w-full h-full bg-black bg-opacity-70 flex items-center justify-center text-white absolute z-50">
                    <p>경로 목록을 불러오는 중입니다...</p>
                </div>
            )}
        </div>
    );
};