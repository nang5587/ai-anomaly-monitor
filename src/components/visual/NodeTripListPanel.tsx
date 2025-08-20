'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import {
    tripsForSelectedNodeAtom,
    selectTripAndSwitchToFlowmapAtom,
    selectedObjectAtom,
} from '@/stores/mapDataAtoms';
import { MergeTrip } from './SupplyChainDashboard';
import { LocationNode } from '@/types/data';
import { X } from 'lucide-react';

export const NodeTripListPanel = () => {
    const trips = useAtomValue(tripsForSelectedNodeAtom);
    const selectedNode = useAtomValue(selectedObjectAtom) as LocationNode | null;
    const selectTripAndSwitch = useSetAtom(selectTripAndSwitchToFlowmapAtom);
    const setSelectedObject = useSetAtom(selectedObjectAtom);

    if (!selectedNode || !('scanLocation' in selectedNode) || trips.length === 0) {
        return null;
    }

    return (
        <div className="absolute top-20 right-4 w-96 bg-[#1E1E1E]/90 backdrop-blur-md rounded-lg shadow-2xl z-30 flex flex-col max-h-[calc(100vh-10rem)]">
            <div className="p-4 border-b border-white/20 flex justify-between items-center">
                <h3 className="font-bold text-white text-lg">{selectedNode.scanLocation}</h3>
                <button onClick={() => setSelectedObject(null)} className="text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>
            <div className="flex-grow overflow-y-auto">
                <ul className="text-white">
                    {trips.map(trip => (
                        <li
                            key={trip.roadId}
                            onClick={() => selectTripAndSwitch(trip)}
                            className="px-4 py-3 border-b border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                        >
                            <div className="flex justify-between items-center text-sm">
                                <span>{trip.from.scanLocation}</span>
                                <span className="text-gray-400 mx-2">→</span>
                                <span>{trip.to.scanLocation}</span>
                            </div>
                            <div className="text-xs text-orange-400 mt-1">
                                {trip.anomalyTypeList.join(', ')}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};