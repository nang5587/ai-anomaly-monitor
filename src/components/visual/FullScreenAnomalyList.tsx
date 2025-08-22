'use-client';

import React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
    tripsAtom,
    selectTripAndFocusAtom,
    isLoadingAtom,
} from '@/stores/mapDataAtoms';
import { AnomalyTripTable } from './AnomalyTripTable';

export const FullScreenAnomalyList: React.FC = () => {
    const trips = useAtomValue(tripsAtom);
    const isLoading = useAtomValue(isLoadingAtom);
    const selectTripAndFocus = useSetAtom(selectTripAndFocusAtom);

    return (
        <div className="w-full h-full p-8 flex flex-col bg-[#1A1A1A] font-noto-400 overflow-y-auto">
            <header className="flex-shrink-0 mb-10 gap-4 flex justify-between items-center">
                <div className="flex flex-col justify-center gap-1">
                    <h1 className="text-white text-4xl font-vietnam">Anomaly List</h1>
                    <span className="text-[#E0E0E0]">이상 탐지된 경로의 리스트입니다. 항목 선택 시 전체 흐름을 확인할 수 있습니다.</span>
                </div>
            </header>
                <AnomalyTripTable
                    trips={trips}
                    onRowClick={selectTripAndFocus}
                    isLoading={isLoading}
                    itemsPerPage={15}
                />
        </div>
    );
};