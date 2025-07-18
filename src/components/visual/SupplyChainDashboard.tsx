'use client'
import React, { useState, useEffect, useCallback } from 'react';

import { Filter } from 'lucide-react';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
    nodesAtom,
    tripsAtom,
    selectedObjectAtom,
    filterOptionsAtom,
    appliedFiltersAtom,
    activeTabAtom,
    isLoadingAtom,
    isFetchingMoreAtom,
    nextCursorAtom,
    loadInitialDataAtom,
    loadTripsDataAtom,
    loadMoreTripsAtom
} from '@/stores/mapDataAtoms';

import type { Node, AnalyzedTrip } from './data';

import { SupplyChainMap } from './SupplyChainMap';
import { HeatmapView } from './HeatmapView';

// --- 하위 컴포넌트 import ---
import AnomalyList from './AnomalyList';
import DetailsPanel from './DetailsPanel';
import FilterPanel from './FilterPanel';
import TripList from './TripList';

// 탭 타입 정의 : anomalies는 이상 탐지 리스트, all은 전체 운송 목록
export type Tab = 'anomalies' | 'all' | 'heatmap';
export type TripWithId = AnalyzedTrip & { id: string; path?: [number, number][]; timestamps?: number[] };

// 탭 버튼 스타일
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
    // --- Jotai 스토어에서 가져온 상태 관리 ---
    // const nodes = useAtomValue(nodesAtom);
    const trips = useAtomValue(tripsAtom);
    const filterOptions = useAtomValue(filterOptionsAtom);
    const nextCursor = useAtomValue(nextCursorAtom);
    const isLoading = useAtomValue(isLoadingAtom);
    const isFetchingMore = useAtomValue(isFetchingMoreAtom);

    // 읽고 쓰기가 모두 필요한 상태
    const [activeTab, setActiveTab] = useAtom(activeTabAtom);
    const [selectedObject, setSelectedObject] = useAtom(selectedObjectAtom);
    const [appliedFilters, setAppliedFilters] = useAtom(appliedFiltersAtom);

    // 액션(쓰기 전용) 아톰
    const loadInitialData = useSetAtom(loadInitialDataAtom);
    const loadTrips = useSetAtom(loadTripsDataAtom);
    const loadMore = useSetAtom(loadMoreTripsAtom);

    // 필터 패널 표시 여부는 이 컴포넌트의 로컬 상태로 유지하는 것이 적합합니다.
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    // 이상징후 히트맵만 잘 보이게 상태 관리
    const [isHighlightMode, setIsHighlightMode] = useState(false);

    // 히트맵에 쓰일 
    const [isAllDataLoaded, setIsAllDataLoaded] = useState(false);

    // 컴포넌트 마운트 시 초기 데이터(노드, 필터옵션) 로드
    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    // 탭이나 필터가 변경될 때마다 Trip 데이터 로드
    useEffect(() => {
        if (activeTab === 'heatmap') {
            return; // 함수를 즉시 종료
        }

        loadTrips();
    }, [activeTab, appliedFilters, loadTrips]);


    const handleApplyFilters = (filters: Record<string, any>) => {
        setAppliedFilters(filters);
        setShowFilterPanel(false);
    };

    const handleTabClick = (tab: Tab) => {
        // activeTabAtom의 값을 변경하면, 위의 useEffect가 자동으로 트리거됩니다.
        setActiveTab(tab);
    };

    return (
        <div style={{
            position: 'relative',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
        }}>

            {!isLoading && (
                activeTab === 'heatmap' ? (
                    <>
                        <HeatmapView isHighlightMode={isHighlightMode} />
                        <div style={{ position: 'absolute', top: '80px', left: '20px', zIndex: 5 }} >
                            <label className='cursor-pointer'>
                                <input
                                    type="checkbox"
                                    checked={isHighlightMode}
                                    onChange={(e) => setIsHighlightMode(e.target.checked)}
                                />
                                <span className='font-noto-400 text-white pl-2'>이상 징후만 강조하기</span>
                            </label>
                        </div>
                    </>
                ) : (
                    <SupplyChainMap />
                )
            )}

            {/* <SupplyChainMap /> */}

            {isLoading && !isFetchingMore && (
                <div className="w-full h-full bg-black bg-opacity-70 flex items-center justify-center text-white absolute z-50">
                    <p>데이터를 불러오는 중입니다...</p>
                </div>
            )}

            {activeTab !== 'heatmap' && (
                <>
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '30px',
                        width: '320px',
                        height: 'calc(100vh - 200px)',
                        zIndex: 4, // 리스트 패널보다 위에 위치
                        transform: showFilterPanel ? 'translateX(-6%)' : 'translateX(-120%)',
                        transition: 'transform 0.3s ease-in-out',
                        display: activeTab === 'all' ? 'block' : 'none', // '전체' 탭에서만 활성화
                    }}>
                        <FilterPanel
                            options={filterOptions}
                            onApplyFilters={handleApplyFilters}
                            isFiltering={isLoading}
                            onClose={() => setShowFilterPanel(false)}
                        />
                    </div>

                </>
            )}
            <div style={{
                position: 'absolute',
                top: '0px',
                left: '20px',
                zIndex: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
            }}>
                {/* 탭 UI */}
                <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className='bg-[#000000] rounded-b-[25px]'>
                    <div className='flex whitespace-nowrap'>
                        <button style={tabButtonStyle(activeTab === 'all')} onClick={() => setActiveTab('all')}>전체 이력 추적</button>
                        <button style={tabButtonStyle(activeTab === 'anomalies')} onClick={() => setActiveTab('anomalies')}>이상 징후 분석</button>
                        <button style={tabButtonStyle(activeTab === 'heatmap')} onClick={() => setActiveTab('heatmap')}>이벤트 히트맵</button>
                    </div>
                    {activeTab === 'all' && (
                        <button
                            onClick={() => setShowFilterPanel(prev => !prev)}
                            className="px-4 cursor-pointer"
                            aria-label="필터 열기/닫기"
                        >
                            <Filter className="w-5 h-5 text-white" />
                        </button>
                    )}
                </div>

                {/* 2. 리스트 콘텐츠 영역 */}
                {activeTab !== 'heatmap' && (
                    <>
                        <div style={{
                            width: '300px',
                            height: 'calc(100vh - 250px)',
                            // flex: 1, // 남은 공간을 모두 차지
                            minHeight: 0,
                            background: 'linear-gradient(145deg, #2A2A2A, #1E1E1E)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            borderRadius: '25px',
                            display: 'flex',
                            flexDirection: 'column',
                        }}>
                            {activeTab === 'anomalies' && (
                                <>
                                    <div style={{ flex: 1, minHeight: 0 }}>
                                        <AnomalyList
                                            anomalies={trips}
                                            onCaseClick={(trip) => setSelectedObject(trip)}
                                            selectedObjectId={selectedObject && 'id' in selectedObject ? selectedObject.id : null}
                                        />
                                    </div>
                                    <div className="bg-[rgba(40,40,40)] rounded-b-[25px] flex-shrink-0 p-4 text-center text-white text-xs border-t border-white/10">
                                        <p className="mb-2">현재 {trips.length}개의 이상 징후 표시 중</p>
                                        {nextCursor && (
                                            <button onClick={loadMore} disabled={isFetchingMore} className="w-full bg-[rgba(111,131,175)] hover:bg-[rgba(101,121,165)] rounded-lg p-2 disabled:bg-gray-800 transition-colors">
                                                {isFetchingMore ? '로딩 중...' : '더 보기'}
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}

                            {activeTab === 'all' && (
                                <>
                                    {/* 리스트 본문 */}
                                    <div style={{ flex: 1, minHeight: 0 }}>
                                        <TripList
                                            trips={trips}
                                            onCaseClick={(trip) => setSelectedObject(trip)}
                                            selectedObjectId={selectedObject && 'id' in selectedObject ? selectedObject.id : null}
                                        />
                                    </div>

                                    {/* '더 보기' 버튼 (푸터) */}
                                    <div className="bg-[rgba(40,40,40)] rounded-b-[25px] flex-shrink-0 p-4 text-center text-white text-xs border-t border-white/10">
                                        <p className="mb-2">현재 {trips.length}개의 경로 표시 중</p>
                                        {nextCursor && (
                                            <button onClick={loadMore} disabled={isFetchingMore} className="w-full bg-[rgba(111,131,175)] hover:bg-[rgba(101,121,165)] rounded-lg p-2 disabled:bg-gray-800 transition-colors">
                                                {isFetchingMore ? '로딩 중...' : '더 보기'}
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>


                    </>
                )}

            </div>

            {activeTab !== 'heatmap' && (
                <DetailsPanel
                    selectedObject={selectedObject}
                    onClose={() => setSelectedObject(null)}
                />
            )}

        </div>
    );
};