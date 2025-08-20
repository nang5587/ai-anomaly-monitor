'use client';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
    tripsAtom,
    loadTripsDataAtom,
    loadMoreTripsAtom,
    isFetchingMoreAtom,
    isLoadingAtom,
    selectTripAndFocusAtom,
    selectedObjectAtom
} from '@/stores/mapDataAtoms';
import { MergeTrip } from './SupplyChainDashboard';
import { formatUnixTimestamp } from '@/stores/mapDataAtoms';
import { useEffect } from 'react';

export const TripTable = () => {
    const trips = useAtomValue(tripsAtom);
    const isLoading = useAtomValue(isLoadingAtom);
    const isFetchingMore = useAtomValue(isFetchingMoreAtom);
    const loadTrips = useSetAtom(loadTripsDataAtom);
    const loadMore = useSetAtom(loadMoreTripsAtom);
    const [selectedTrip, selectTrip] = useAtom(selectedObjectAtom);

    useEffect(() => {
        if (trips.length === 0) {
            loadTrips();
        }
    }, [loadTrips, trips.length]);

    const handleRowClick = (trip: MergeTrip) => {
        if (selectedTrip && 'roadId' in selectedTrip && selectedTrip.roadId === trip.roadId) {
            selectTrip(null);
        } else {
            selectTrip(trip);
        }
    };

    if (isLoading && trips.length === 0) {
        return <div className="text-center p-8">테이블 데이터를 불러오는 중...</div>;
    }

    return (
        <div className="bg-[#1A1A1A] p-4 rounded-lg h-full flex flex-col">
            <h3 className="text-xl font-bold mb-4 px-2 text-white">이상 운송 목록</h3>
            <div className="flex-grow overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-300 table-fixed">
                    <thead className="text-xs text-gray-400 uppercase bg-[#2A2A2A] sticky top-0">
                        <tr>
                            <th scope="col" className="px-4 py-3 w-1/12">ID</th>
                            <th scope="col" className="px-4 py-3 w-2/12">EPC</th>
                            <th scope="col" className="px-4 py-3 w-1/12">제품명</th>
                            <th scope="col" className="px-4 py-3 w-2/12">출발지</th>
                            <th scope="col" className="px-4 py-3 w-2/12">도착지</th>
                            <th scope="col" className="px-4 py-3 w-2/12">발생 시간</th>
                            <th scope="col" className="px-4 py-3 w-1/12">이상 유형</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trips.map((trip) => (
                            <tr
                                key={trip.roadId}
                                className={`border-b border-gray-700 hover:bg-[#2A2A2A] cursor-pointer ${selectedTrip && 'roadId' in selectedTrip && selectedTrip.roadId === trip.roadId ? 'bg-[#3A3A3A]' : ''
                                    }`}
                                onClick={() => handleRowClick(trip)}
                            >
                                <td className="px-4 py-3 font-medium text-white">{trip.roadId}</td>
                                <td className="px-4 py-3 truncate">{trip.epcCode}</td>
                                <td className="px-4 py-3">{trip.productName}</td>
                                <td className="px-4 py-3 truncate">{trip.from.scanLocation}</td>
                                <td className="px-4 py-3 truncate">{trip.to.scanLocation}</td>
                                <td className="px-4 py-3">{formatUnixTimestamp(trip.from.eventTime)}</td>
                                <td className="px-4 py-3">
                                    <span className="bg-orange-500/20 text-orange-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                        {trip.anomalyTypeList.join(', ')}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {isFetchingMore && <div className="text-center py-4">더 많은 데이터를 불러오는 중...</div>}
                <button onClick={() => loadMore()} className="w-full mt-4 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded">
                    더 보기
                </button>
            </div>
        </div>
    );
};