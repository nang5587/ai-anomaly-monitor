'use client'
import React, { useState, useEffect, useCallback } from 'react';

import { v4 as uuidv4 } from 'uuid';
import { Filter } from 'lucide-react';

import {
    getNodes,
    getAnomalies,
    getTrips,
    getFilterOptions,
    type Node,
    type AnalyzedTrip,
    type FilterOptions,
    type PaginatedTripsResponse,
} from './data';

import { SupplyChainMap } from './SupplyChainMap'; // 리팩토링된 맵 컴포넌트
import AnomalyList from './AnomalyList';
import DetailsPanel from './DetailsPanel';
import FilterPanel from './FilterPanel';
import TripList from './TripList';

// 탭 타입 정의
type Tab = 'anomalies' | 'all';



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

type TripWithId = AnalyzedTrip & { id: string };



export const SupplyChainDashboard: React.FC = () => {
    // --- 상태 관리 ---
    const [activeTab, setActiveTab] = useState<Tab>('anomalies');
    const [nodes, setNodes] = useState<Node[]>([]);

    const [trips, setTrips] = useState<TripWithId[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [selectedObject, setSelectedObject] = useState<TripWithId | Node | null>(null);

    // --- 필터 ---
    const [isFetchingMore, setIsFetchingMore] = useState(false); // '더 보기' 버튼 로딩 상태
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null); // 필터 옵션 목록
    const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({}); // 현재 적용된 필터
    const [nextCursor, setNextCursor] = useState<string | null>(null); // 다음 페이지 커서
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    useEffect(() => {
        getNodes().then(setNodes).catch(error => console.error("노드 데이터 로딩 실패:", error));
        getFilterOptions().then(setFilterOptions).catch(error => console.error("필터 옵션 로딩 실패:", error));
    }, []);

    // --- 데이터 로딩 ---
    // 1. 노드 데이터는 처음에 한 번만 로드합니다.
    useEffect(() => {
        getNodes().then(setNodes).catch(error => console.error("노드 데이터 로딩 실패:", error));
        getFilterOptions().then(setFilterOptions).catch(error => console.error("필터 옵션 로딩 실패:", error));
    }, []);

    // 2. 탭이 바뀌거나 필터가 적용될 때마다 해당 탭에 맞는 Trip 데이터를 로드합니다.
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setSelectedObject(null);

            // 탭에 따라 사용할 API 함수를 동적으로 결정
            const fetchFunction: (params?: Record<string, any>) => Promise<PaginatedTripsResponse> =
                activeTab === 'anomalies' ? getAnomalies : getTrips;

            // 페이지네이션 파라미터 설정 (초기 로딩 시 50개)
            const params = { ...appliedFilters, limit: 50, cursor: null };

            try {
                const response = await fetchFunction(params);
                // 데이터를 받자마자 고유 ID를 부여
                const tripsWithId = response.data.map(trip => ({ ...trip, id: uuidv4() }));

                setTrips(tripsWithId);
                setNextCursor(response.nextCursor);
            } catch (error) {
                console.error(`${activeTab} 데이터 로딩 실패:`, error);
                setTrips([]); // 에러 발생 시 목록 비우기
                setNextCursor(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [activeTab, appliedFilters]);

    const handleLoadMore = useCallback(async () => {
        if (!nextCursor || isFetchingMore) return;

        setIsFetchingMore(true);
        try {
            const fetchFunction: (params?: Record<string, any>) => Promise<PaginatedTripsResponse> =
                activeTab === 'anomalies' ? getAnomalies : getTrips;

            // 페이지네이션 파라미터 설정 (더 보기 시 50개)
            const params = { ...appliedFilters, cursor: nextCursor, limit: 50 };
            const response = await fetchFunction(params);

            const newTripsWithId = response.data.map(trip => ({ ...trip, id: uuidv4() }));

            // 새로 받아온 데이터를 기존 목록 뒤에 추가
            setTrips(prev => [...prev, ...newTripsWithId]);
            setNextCursor(response.nextCursor);
        } catch (error) {
            console.error("추가 데이터 로딩 실패:", error);
        } finally {
            setIsFetchingMore(false);
        }
    }, [nextCursor, appliedFilters, isFetchingMore, activeTab]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
            {isLoading && (
                <div className="w-full h-full bg-black bg-opacity-70 flex items-center justify-center text-white absolute z-50">
                    <p>데이터를 불러오는 중입니다...</p>
                </div>
            )}

            {/* 지도 및 관련 UI 컴포넌트들 */}
            <SupplyChainMap
                nodes={nodes}
                analyzedTrips={trips}
                selectedObject={selectedObject}
                onObjectSelect={setSelectedObject}
            />

            {/* ✨ 필터 패널: showFilterPanel 상태에 따라 나타나거나 사라짐 */}
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
                    onApplyFilters={(filters) => {
                        setAppliedFilters(filters);
                        // 필터 적용 후 자동으로 닫아주는 UX 개선
                        setShowFilterPanel(false);
                    }}
                    isFiltering={isLoading}
                    onClose={() => setShowFilterPanel(false)}
                />
            </div>

            <div style={{
                position: 'absolute',
                top: '0px',
                width: '300px',
                left: '20px',
                height: 'calc(100vh - 200px)',
                zIndex: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
            }}>
                {/* 탭 UI */}
                <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className='bg-[#000000] rounded-b-[25px] pr-4'>
                    <div className='flex whitespace-nowrap'>
                        <button style={tabButtonStyle(activeTab === 'anomalies')} onClick={() => setActiveTab('anomalies')}>이상 징후 분석</button>
                        <button style={tabButtonStyle(activeTab === 'all')} onClick={() => setActiveTab('all')}>전체 이력 추적</button>
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
                <div style={{
                    flex: 1, // 남은 공간을 모두 차지
                    minHeight: 0,
                    background: 'linear-gradient(145deg, #2A2A2A, #1E1E1E)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    borderRadius: '25px',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    {activeTab === 'anomalies' && (
                        <>
                            <AnomalyList
                                anomalies={trips}
                                onCaseClick={(trip) => setSelectedObject(trip)}
                                selectedObjectId={selectedObject && 'id' in selectedObject ? selectedObject.id : null}
                            />
                            <div className="bg-[rgba(40,40,40)] rounded-b-[25px] flex-shrink-0 p-4 text-center text-white text-xs border-t border-white/10">
                                <p className="mb-2">현재 {trips.length}개의 이상 징후 표시 중</p>
                                {nextCursor && (
                                    <button onClick={handleLoadMore} disabled={isFetchingMore} className="w-full bg-[rgba(111,131,175)] hover:bg-[rgba(101,121,165)] rounded-lg p-2 disabled:bg-gray-800 transition-colors">
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
                                    <button onClick={handleLoadMore} disabled={isFetchingMore} className="w-full bg-[rgba(111,131,175)] hover:bg-[rgba(101,121,165)] rounded-lg p-2 disabled:bg-gray-800 transition-colors">
                                        {isFetchingMore ? '로딩 중...' : '더 보기'}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <DetailsPanel
                selectedObject={selectedObject}
                onClose={() => setSelectedObject(null)}
            />
        </div>
    );
};