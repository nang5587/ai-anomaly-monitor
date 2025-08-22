'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
    tripsForSelectedNodeAtom,
    selectTripAndSwitchToFlowmapAtom,
    selectedObjectAtom,
} from '@/stores/mapDataAtoms';
import { MergeTrip } from './SupplyChainDashboard';
import { AnomalyTripTable } from './AnomalyTripTable';
import { AnomalyType } from '@/types/data';
import { LocationNode } from '@/types/data';
import { X, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { getAnomalyName } from '@/types/colorUtils';


export const NodeTripListPanel = () => {
    const trips = useAtomValue(tripsForSelectedNodeAtom);
    const selectedNode = useAtomValue(selectedObjectAtom) as LocationNode | null;
    const selectTripAndSwitch = useSetAtom(selectTripAndSwitchToFlowmapAtom);
    const setSelectedObject = useSetAtom(selectedObjectAtom);

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

            <AnomalyTripTable
                                trips={trips}
                                onRowClick={selectTripAndSwitch}
                                isLoading={false}
                                itemsPerPage={15}
                            />
        </div>
    );
};