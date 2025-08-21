'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
    tripsForSelectedNodeAtom,
    selectTripAndSwitchToFlowmapAtom,
    selectedObjectAtom,
} from '@/stores/mapDataAtoms';
import { MergeTrip } from './SupplyChainDashboard';
import { AnomalyType } from '@/types/data';
import { LocationNode } from '@/types/data';
import { X, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { getAnomalyName } from '@/types/colorUtils';

type SortKey = 'from' | 'to' | 'anomalyType' | 'epc';
type SortDirection = 'asc' | 'desc';

export const NodeTripListPanel = () => {
    const trips = useAtomValue(tripsForSelectedNodeAtom);
    const selectedNode = useAtomValue(selectedObjectAtom) as LocationNode | null;
    const selectTripAndSwitch = useSetAtom(selectTripAndSwitchToFlowmapAtom);
    const setSelectedObject = useSetAtom(selectedObjectAtom);

    const [activeFilter, setActiveFilter] = useState<string>('전체');
    const [sortKey, setSortKey] = useState<SortKey>('from');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

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
            let valA: string, valB: string;
            switch (sortKey) {
                case 'to': valA = a.to.scanLocation; valB = b.to.scanLocation; break;
                case 'anomalyType': valA = getAnomalyName(a.anomalyTypeList[0]); valB = getAnomalyName(b.anomalyTypeList[0]); break;
                case 'epc': valA = a.epcCode; valB = b.epcCode; break;
                default: valA = a.from.scanLocation; valB = b.from.scanLocation; break;
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
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return processedTrips.slice(startIndex, endIndex);
    }, [processedTrips, currentPage]);

    const totalPages = useMemo(() => {
        return Math.ceil(processedTrips.length / ITEMS_PER_PAGE);
    }, [processedTrips]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    if (!selectedNode || !('scanLocation' in selectedNode) || trips.length === 0) {
        return null;
    }

    return (
        <div className="text-gray-200 relative h-full flex flex-col p-6 font-noto-400">
            <button
                onClick={() => setSelectedObject(null)}
                className="absolute top-6 right-6 text-white transition-colors z-20 p-2 rounded-full hover:bg-gray-700 cursor-pointer"
            >
                <X size={20} />
            </button>

            <div className="flex-shrink-0 mb-6">
                <h3 className="text-2xl font-noto-500 mb-2 text-white">{selectedNode.scanLocation}</h3>
                <p className="text-[#E0E0E0]">{selectedNode.businessStep} | 총 {trips.length}개 경로 연관</p>
            </div>

            <hr className="mb-6 border-white/20 flex-shrink-0" />

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

            <div className="flex-grow flex flex-col min-h-0">
                <div className="flex-grow rounded-lg border border-white/20">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-[#2A2A2A] text-gray-400">
                            <tr>
                                {[{ key: 'from', label: '출발지' }, { key: 'to', label: '도착지' }, { key: 'anomalyType', label: '이상 유형' }, { key: 'epc', label: 'EPC 코드' }].map(header => (
                                    <th key={header.key} className="text-white p-3 font-normal cursor-pointer hover:bg-white/20" onClick={() => handleSort(header.key as SortKey)}>
                                        <div className="flex items-center gap-1">
                                            {header.label}
                                            <ArrowUpDown size={12} />
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 bg-[#1E1E1E]">
                            {paginatedTrips.map(trip => (
                                <tr
                                    key={trip.roadId}
                                    onClick={() => selectTripAndSwitch(trip)}
                                    className="hover:bg-white/20 cursor-pointer transition-colors"
                                >
                                    <td className="p-3">{trip.from.scanLocation}</td>
                                    <td className="p-3">{trip.to.scanLocation}</td>
                                    <td className="p-3 text-orange-400">
                                        {trip.anomalyTypeList.map(getAnomalyName).join(', ')}
                                    </td>
                                    <td className="p-3 font-lato">{trip.epcCode}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {paginatedTrips.length === 0 && (
                        <div className="text-center py-10 text-gray-500">해당하는 데이터가 없습니다.</div>
                    )}
                </div>
                <div className="flex-shrink-0 pt-4 flex justify-center items-center gap-4">
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-lato">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};