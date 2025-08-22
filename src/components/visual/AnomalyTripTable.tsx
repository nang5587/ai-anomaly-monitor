'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AnomalyType } from '@/types/data';
import { MergeTrip } from '@/context/MapDataContext';
import { getAnomalyName } from '@/types/colorUtils';
import { ArrowUpDown } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';

type SortKey = 'productName' | 'epcCode' | 'from' | 'to' | 'anomalyType' | 'eventTime' | 'anomaly';
type SortDirection = 'asc' | 'desc';

const ANOMALY_PERCENTAGE_THRESHOLD = parseInt(process.env.NEXT_PUBLIC_ANOMALY_THRESHOLD || '50', 10);

interface AnomalyTripTableProps {
    trips: MergeTrip[];
    onRowClick: (trip: MergeTrip) => void;
    isLoading?: boolean;
    itemsPerPage?: number; 
}

export const AnomalyTripTable: React.FC<AnomalyTripTableProps> = ({
    trips,
    onRowClick,
    isLoading = false,
    itemsPerPage = 15,
}) => {
    const [activeFilter, setActiveFilter] = useState<string>('전체');
    const [sortKey, setSortKey] = useState<SortKey>('eventTime');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [currentPage, setCurrentPage] = useState(1);

    const processedTrips = useMemo(() => {
        let filtered = [...trips];
        if (activeFilter !== '전체') {
            const filterKeyMap: Record<string, AnomalyType | 'other'> = {
                '위조': 'fake', '변조': 'tamper', '복제': 'clone', 'AI탐지': 'other'
            };
            const filterKey = filterKeyMap[activeFilter];
            if (filterKey === 'other') {
                filtered = trips.filter(trip => trip.anomaly >= ANOMALY_PERCENTAGE_THRESHOLD);
            } else if (filterKey) {
                filtered = trips.filter(trip => trip.anomalyTypeList.includes(filterKey as AnomalyType));
            }
        }
        filtered.sort((a, b) => {
            let valA: string | number, valB: string | number;
            switch (sortKey) {
                case 'productName': valA = a.productName; valB = b.productName; break;
                case 'epcCode': valA = a.epcCode; valB = b.epcCode; break;
                case 'from': valA = a.from.scanLocation; valB = b.from.scanLocation; break;
                case 'to': valA = a.to.scanLocation; valB = b.to.scanLocation; break;
                case 'anomalyType':
                    valA = a.anomalyTypeList.length > 0 ? getAnomalyName(a.anomalyTypeList[0]) : '';
                    valB = b.anomalyTypeList.length > 0 ? getAnomalyName(b.anomalyTypeList[0]) : '';
                    break;
                case 'anomaly': valA = a.anomaly; valB = b.anomaly; break;
                default: valA = a.to.eventTime; valB = b.to.eventTime; break;
            }
            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
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
        const startIndex = (currentPage - 1) * itemsPerPage;
        return processedTrips.slice(startIndex, startIndex + itemsPerPage);
    }, [processedTrips, currentPage, itemsPerPage]);

    const totalPages = useMemo(() => Math.ceil(processedTrips.length / itemsPerPage), [processedTrips, itemsPerPage]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const headers = [
        { key: 'eventTime', label: '발생 시간' }, { key: 'productName', label: '상품명' },
        { key: 'epcCode', label: 'EPC 코드' }, { key: 'from', label: '출발지' },
        { key: 'to', label: '도착지' }, { key: 'anomalyType', label: '이상 유형' },
        { key: 'anomaly', label: 'AI 탐지율' },
    ];

    return (
        <div className="w-full h-full flex flex-col pb-20">
            <div className="flex-shrink-0 mb-4 p-1 flex items-center gap-1 bg-[#2A2A2A] rounded-lg w-fit">
                {['전체', '위조', '변조', '복제', 'AI탐지'].map(filter => (
                    <button key={filter} onClick={() => setActiveFilter(filter)}
                        className={`px-4 py-2 rounded-md text-sm transition-colors cursor-pointer ${activeFilter === filter ? 'bg-[rgba(111,131,175)] text-white shadow-md border-2 border-blue-300' : 'bg-[#2A2A2A] text-gray-300/70 hover:bg-gray-600'}`}
                    >{filter}</button>
                ))}
            </div>

            <div className="text-white mb-2 text-sm">총 {processedTrips.length}개의 결과</div>
            <div className="flex-grow rounded-lg border border-white/20 flex flex-col font-noto-400">
                <div className="flex-grow">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="sticky top-0 bg-[#2A2A2A] text-gray-400">
                            <tr>
                                {headers.map(header => (
                                    <th key={header.key} className="p-4 font-normal cursor-pointer hover:bg-white/20" onClick={() => handleSort(header.key as SortKey)}>
                                        <div className="flex items-center gap-1 text-white whitespace-nowrap">{header.label}<ArrowUpDown size={12} /></div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 bg-[#1E1E1E]">
                            {paginatedTrips.map(trip => (
                                <tr key={trip.roadId} onClick={() => onRowClick(trip)} className="hover:bg-white/20 cursor-pointer transition-colors">
                                    <td className="p-4 whitespace-nowrap">{new Date(trip.to.eventTime * 1000).toLocaleString('ko-KR')}</td>
                                    <td className="p-4 whitespace-nowrap">{trip.productName}</td>
                                    <td className="p-4 font-lato whitespace-nowrap">{trip.epcCode}</td>
                                    <td className="p-4 whitespace-nowrap">{trip.from.scanLocation}</td>
                                    <td className="p-4 whitespace-nowrap">{trip.to.scanLocation}</td>
                                    <td className="p-4">
                                        {trip.anomalyTypeList && trip.anomalyTypeList.length > 0 ? (
                                            <span className="px-2 py-1 text-[#FF9945] text-xs">{trip.anomalyTypeList.map(getAnomalyName).join(', ')}</span>
                                        ) : (<span className="px-2 py-1 text-xs">-</span>)}
                                    </td>
                                    <td className={`p-4 font-normal ${trip.anomaly >= ANOMALY_PERCENTAGE_THRESHOLD ? 'text-[#FF9945]' : ''}`}>
                                        {trip.anomaly}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {processedTrips.length === 0 && !isLoading && <div className="text-center py-20 text-gray-500">해당하는 데이터가 없습니다.</div>}
                    {isLoading && <div className="text-center py-20 text-gray-500">데이터를 불러오는 중...</div>}
                </div>
                {totalPages > 1 && (
                    <div className="bg-[rgba(40,40,40)] flex-shrink-0 p-4 flex justify-center items-center">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                )}
            </div>
        </div>
    );
};