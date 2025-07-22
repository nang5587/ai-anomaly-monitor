'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react';

import { Filter } from 'lucide-react';


// 1. Jotai 훅: 전역 상태 '설정' 또는 '공유 상태 읽기'에만 사용
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import {
    appliedFiltersAtom,
    activeTabAtom,
    selectedObjectAtom,
    loadTripsDataAtom, // 탭/필터 변경 시 데이터 로딩 트리거
    loadMoreTripsAtom, // '더 보기' 트리거
    tripsAtom as jotaiTripsAtom // 💡 Jotai 상태와 로컬 상태 이름 충돌 방지
} from '@/stores/mapDataAtoms';

// 2. 타입 및 하위 컴포넌트 import
import type { Node, AnalyzedTrip, FilterOptions } from './data';
import { SupplyChainMap } from './SupplyChainMap';
import { HeatmapView } from './HeatmapView';
import AnomalyList from './AnomalyList';
import DetailsPanel from './DetailsPanel';
import FilterPanel from './FilterPanel';
import TripList from './TripList';

// 3. Props 타입 정의
interface DashboardProps {
    initialNodes: Node[];
    initialTrips: TripWithId[];
    initialFilterOptions: FilterOptions | null;
    initialNextCursor: string | null;
}

export type Tab = 'anomalies' | 'all' | 'heatmap';
export type TripWithId = AnalyzedTrip & { id: string; path?: [number, number][]; timestamps?: number[] };

const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({ /* ... 스타일 ... */ });

export const SupplyChainDashboard: React.FC<DashboardProps> = ({
    initialNodes,
    initialTrips,
    initialFilterOptions,
    initialNextCursor,
}) => {

    const isInitialMount = useRef(true);

    // --- 4. UI 렌더링을 위한 로컬 상태(useState) ---
    // 초기값은 서버에서 받은 props로 설정합니다.
    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [trips, setTrips] = useState<TripWithId[]>(initialTrips);
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(initialFilterOptions);
    const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);

    // --- 5. Jotai 상태는 UI 렌더링에 직접 사용하지 않고, 트리거나 공유 상태 관리에만 사용 ---
    const [activeTab, setActiveTab] = useAtom(activeTabAtom);
    const [appliedFilters, setAppliedFilters] = useAtom(appliedFiltersAtom);
    const [selectedObject, setSelectedObject] = useAtom(selectedObjectAtom);

    // Jotai 액션 아톰 (데이터 로딩 트리거용)
    const loadTrips = useSetAtom(loadTripsDataAtom);
    const loadMore = useSetAtom(loadMoreTripsAtom);

    // Jotai 상태가 변경될 때 로컬 상태를 업데이트하기 위한 로직
    // 이렇게 하면 loadTripsDataAtom이 내부적으로 tripsAtom을 업데이트했을 때,
    // 이 컴포넌트의 로컬 상태도 동기화됩니다.
    const jotaiTrips = useAtomValue(jotaiTripsAtom);
    useEffect(() => {
        // Jotai 상태가 변경되면 로컬 상태도 업데이트
        // (단, 초기 렌더링 시에는 props로 받은 값을 우선)
        if (!isInitialMount.current) {
            setTrips(jotaiTrips);
        }
    }, [jotaiTrips]);


    // --- 로컬 상태 (UI 제어용) ---
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [isHighlightMode, setIsHighlightMode] = useState(false);

    // --- 6. 탭/필터 변경 시 Jotai 액션을 호출하는 로직 ---
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (activeTab === 'heatmap') return;

        // Jotai 액션을 호출하면, Jotai 내부 로직이 실행됩니다.
        // 실행 후 tripsAtom이 업데이트되고, 위의 useEffect가 감지하여 로컬 trips 상태를 업데이트합니다.
        loadTrips();

    }, [activeTab, appliedFilters, loadTrips]);


    const handleApplyFilters = (filters: Record<string, any>) => {
        setAppliedFilters(filters);
        setShowFilterPanel(false);
    };

    const handleTabClick = (tab: Tab) => {
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

            {activeTab === 'heatmap' ? (
                <>
                    <HeatmapView isHighlightMode={isHighlightMode} />
                    <div
                        style={{ position: 'absolute', top: '60px', left: '20px', zIndex: 5 }}
                        className='px-6 py-4 flex items-center gap-4'
                    >
                        <span className='font-noto-400 text-white select-none'>이상 징후만 강조하기</span>

                        <button
                            type="button"
                            role="switch"
                            aria-checked={isHighlightMode}
                            onClick={() => setIsHighlightMode(!isHighlightMode)}
                            className={`
                                    relative inline-flex items-center h-6 w-11 flex-shrink-0 cursor-pointer rounded-full 
                                    border-2 border-transparent transition-colors duration-200 ease-in-out 
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgba(111,131,175)]
                                    ${isHighlightMode ? 'bg-[rgba(111,131,175)]' : 'bg-gray-500'}
                                `}
                        >
                            <span className="sr-only">이상 징후 강조 토글</span>
                            <span
                                aria-hidden="true"
                                className={`
                                        pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 
                                        transition duration-200 ease-in-out
                                    `}
                                style={{
                                    transform: isHighlightMode ? 'translateX(1.5rem)' : 'translateX(0.1rem)',
                                }}
                            ></span>
                        </button>
                    </div>

                    <div
                        style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}
                        className="bg-[rgba(40,40,40,0.85)] rounded-lg p-4 text-white w-56 shadow-lg backdrop-blur-sm"
                    >
                        <h3 className="text-sm font-bold mb-2">이벤트 밀도</h3>
                        {/* 색상 그라데이션 바 */}
                        <div
                            className="h-3 rounded-md"
                            style={{
                                // 투명한 파랑 -> 진한 파랑
                                background: 'linear-gradient(to right, rgba(135,206,235), rgba(43,96,121))'
                            }}
                        ></div>
                        {/* 라벨 */}
                        <div className="flex justify-between text-xs mt-1 text-gray-300">
                            <span>낮음</span>
                            <span>높음</span>
                        </div>
                    </div>
                </>
            ) : (
                <SupplyChainMap />
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
                            isFiltering={false}
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
                                        <p className="mb-2">현재 {trips?.length || 0}개의 이상 징후 표시 중</p>
                                        {nextCursor && (
                                            <button onClick={loadMore} disabled={false} className="w-full bg-[rgba(111,131,175)] hover:bg-[rgba(101,121,165)] rounded-lg p-2 disabled:bg-gray-800 transition-colors">
                                                {/* {isFetchingMore ? '로딩 중...' : '더 보기'} */}
                                                '더 보기'
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
                                        <p className="mb-2">현재 {trips?.length || 0}개의 경로 표시 중</p>
                                        {nextCursor && (
                                            <button onClick={loadMore} disabled={false} className="w-full bg-[rgba(111,131,175)] hover:bg-[rgba(101,121,165)] rounded-lg p-2 disabled:bg-gray-800 transition-colors">
                                                '더 보기'
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