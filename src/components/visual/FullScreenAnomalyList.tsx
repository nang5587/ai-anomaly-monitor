'use-client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
    tripsAtom,
    anomalyFilterAtom,
    selectTripAndFocusAtom,
    nextCursorAtom,
    isFetchingMoreAtom,
    loadMoreTripsAtom,
    isLoadingAtom,
} from '@/stores/mapDataAtoms';
import { MergeTrip } from './SupplyChainDashboard';
import { AnomalyType } from '@/types/data';
import { getAnomalyName } from '@/types/colorUtils';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import AnomalyFilterTabs from './AnomalyFilterTabs';
import { Pagination } from '@/components/ui/Pagination';

type SortKey = 'productName' | 'epcCode' | 'from' | 'to' | 'anomalyType' | 'eventTime';
type SortDirection = 'asc' | 'desc';

export const FullScreenAnomalyList: React.FC = () => {
    const trips = useAtomValue(tripsAtom);
    const selectedAnomalyFilter = useAtomValue(anomalyFilterAtom);
    const nextCursor = useAtomValue(nextCursorAtom);
    const isFetchingMore = useAtomValue(isFetchingMoreAtom);
    const isLoading = useAtomValue(isLoadingAtom);
    const loadMore = useSetAtom(loadMoreTripsAtom);
    const selectTripAndFocus = useSetAtom(selectTripAndFocusAtom);
    const [activeFilter, setActiveFilter] = useState<string>('전체');

    const [sortKey, setSortKey] = useState<SortKey>('eventTime');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;

    const processedTrips = useMemo(() => {
        let filtered = [...trips];
        if (activeFilter !== '전체') {
            const filterKeyMap: Record<string, AnomalyType> = {
                '위조': 'fake',
                '변조': 'tamper',
                '복제': 'clone',
                '신규 유형': 'other'
            };
            const filterKey = filterKeyMap[activeFilter];
            if (filterKey) {
                filtered = trips.filter(trip => trip.anomalyTypeList.includes(filterKey));
            }
        }
        filtered.sort((a, b) => {
            let valA: string | number, valB: string | number;
            switch (sortKey) {
                case 'productName': valA = a.productName; valB = b.productName; break;
                case 'epcCode': valA = a.epcCode; valB = b.epcCode; break;
                case 'from': valA = a.from.scanLocation; valB = b.from.scanLocation; break;
                case 'to': valA = a.to.scanLocation; valB = b.to.scanLocation; break;
                case 'anomalyType': valA = getAnomalyName(a.anomalyTypeList[0]); valB = getAnomalyName(b.anomalyTypeList[0]); break;
                default: valA = a.to.eventTime; valB = b.to.eventTime; break; // 기본 정렬: 최신 이벤트 순
            }
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return filtered;
    }, [trips, activeFilter, sortKey, sortDirection]);

    useEffect(() => {
        setCurrentPage(1);
    }, [processedTrips]);

    const paginatedTrips = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return processedTrips.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [processedTrips, currentPage]);

    const totalPages = useMemo(() => Math.ceil(processedTrips.length / ITEMS_PER_PAGE), [processedTrips]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    // 테이블 헤더 정의
    const headers = [
        { key: 'eventTime', label: '발생 시간' },
        { key: 'productName', label: '상품명' },
        { key: 'epcCode', label: 'EPC 코드' },
        { key: 'from', label: '출발지' },
        { key: 'to', label: '도착지' },
        { key: 'anomalyType', label: '이상 유형' },
    ];

    return (
        <div className="w-full h-full p-8 flex flex-col bg-[#1A1A1A] font-noto-400">
            <header className="flex-shrink-0 mb-10 gap-4 flex justify-between items-center">
                <div className="flex flex-col justify-center gap-1">
                    <h1 className="text-white text-4xl font-vietnam">Anomaly List</h1>
                    <span className="text-[#E0E0E0]">이상 탐지된 경로의 리스트입니다. 항목 선택 시 전체 흐름을 확인할 수 있습니다.</span>
                </div>
            </header>

            <div className="mb-4">
                <div className="flex-shrink-0 mb-4 p-1 flex items-center gap-1 bg-[#2A2A2A] rounded-lg w-fit">
                    {['전체', '위조', '변조', '복제', '신규 유형'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 rounded-md text-sm transition-colors cursor-pointer
                            ${activeFilter === filter
                                    ? 'bg-[rgba(111,131,175)] text-white shadow-md border-2 border-blue-300'
                                    : 'bg-[#2A2A2A] text-gray-300/70 hover:bg-gray-600'
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            <div className="text-white mb-2">총 {processedTrips.length}개의 결과</div>
            <div className="flex-grow rounded-lg border border-white/20 overflow-hidden flex flex-col font-noto-400">
                <div className="flex-grow overflow-y-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="sticky top-0 bg-[#2A2A2A] text-gray-400">
                            <tr>
                                {headers.map(header => (
                                    <th key={header.key} className="p-4 font-normal cursor-pointer hover:bg-white/20" onClick={() => handleSort(header.key as SortKey)}>
                                        <div className="flex items-center gap-1 text-white">
                                            {header.label}
                                            <ArrowUpDown size={12} />
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 bg-[#1E1E1E]">
                            {paginatedTrips.map(trip => (
                                <tr key={trip.roadId} onClick={() => selectTripAndFocus(trip)} className="hover:bg-white/20 cursor-pointer transition-colors">
                                    <td className="p-4 whitespace-nowrap font-normal">{new Date(trip.to.eventTime * 1000).toLocaleString('ko-KR')}</td>
                                    <td className="p-4 font-normal">{trip.productName}</td>
                                    <td className="p-4 font-normal font-lato">{trip.epcCode}</td>
                                    <td className="p-4 font-normal">{trip.from.scanLocation}</td>
                                    <td className="p-4 font-normal">{trip.to.scanLocation}</td>
                                    <td className="p-4 font-normal">
                                        <span className="px-2 py-1 text-orange-400 text-xs">
                                            {trip.anomalyTypeList.map(getAnomalyName).join(', ')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {processedTrips.length === 0 && !isLoading && (
                        <div className="text-center py-20 text-gray-500">해당하는 데이터가 없습니다.</div>
                    )}
                    {isLoading && (
                        <div className="text-center py-20 text-gray-500">데이터를 불러오는 중...</div>
                    )}
                </div>
                <div className="bg-[rgba(40,40,40)] flex-shrink-0 p-4 text-center text-sm flex justify-center items-center">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                    <div>
                    </div>
                </div>
            </div>
        </div>
    );
};