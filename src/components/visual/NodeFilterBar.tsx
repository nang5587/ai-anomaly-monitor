'use client';

import React, { useState, useMemo } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { nodesAtom, selectedObjectAtom, selectNodeAndFocusAtom } from '@/stores/mapDataAtoms';
import type { LocationNode } from '@/types/data';
import { ChevronDown } from 'lucide-react';

const CustomCheckbox: React.FC<{ label: string; checked: boolean; onChange: () => void; }> = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300 hover:text-white transition-colors">
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="hidden"
        />
        <div className={`w-4 h-4 rounded-sm border-2 ${checked ? 'bg-blue-400 border-blue-400' : 'bg-gray-700 border-gray-500'}`}>
            {checked && <div className="w-full h-full bg-[url('/check.svg')] bg-center bg-no-repeat" />}
        </div>
        {label}
    </label>
);

export const NodeFilterBar = () => {
    const nodes = useAtomValue(nodesAtom);
    const selectNode = useSetAtom(selectNodeAndFocusAtom);
    const [selectedObject, setSelectedObject] = useAtom(selectedObjectAtom);
    const businessSteps = useMemo(() => ["Factory", "WMS", "LogiHub", "Wholesaler", "Reseller", "POS"], []);
    const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>(() => {
        const initialState: Record<string, boolean> = { '전체': true };
        businessSteps.forEach(step => initialState[step] = true);
        return initialState;
    });

    const handleCheckboxChange = (step: string) => {
        setCheckedSteps(prev => {
            const newState = { ...prev };
            if (step === '전체') {
                const newAllValue = !prev['전체'];
                Object.keys(newState).forEach(key => {
                    newState[key] = newAllValue;
                });
            } else {
                newState[step] = !prev[step];
                const allOthersChecked = businessSteps.every(s => newState[s]);
                newState['전체'] = allOthersChecked;
            }
            return newState;
        });
        setSelectedObject(null);
    };
    const filteredNodes = useMemo(() => {
        const sorted = [...nodes].sort((a, b) => a.scanLocation.localeCompare(b.scanLocation));
        if (checkedSteps['전체']) {
            return sorted;
        }
        return sorted.filter(node => checkedSteps[node.businessStep]);
    }, [nodes, checkedSteps]);
    const selectedNodeScanLocation = (selectedObject && 'scanLocation' in selectedObject) ? selectedObject.scanLocation : '';

    return (
        <div className="absolute top-15 left-1/2 -translate-x-1/2 w-auto max-w-5xl z-20">
            <div className="backdrop-blur-sm rounded-lg shadow-2xl text-gray-200 flex items-center gap-6 p-2 px-3 font-noto-400">
                <div className="flex items-center gap-4 flex-wrap">
                    <CustomCheckbox label="전체" checked={checkedSteps['전체']} onChange={() => handleCheckboxChange('전체')} />
                    <div className="w-px h-5 bg-gray-600" />
                    {businessSteps.map(step => (
                        <CustomCheckbox key={step} label={step} checked={checkedSteps[step]} onChange={() => handleCheckboxChange(step)} />
                    ))}
                </div>

                <div className="w-px h-8 bg-gray-600" />
                <div className="relative w-64">
                    <select
                        value={selectedNodeScanLocation}
                        onChange={(e) => {
                            const node = nodes.find(n => n.scanLocation === e.target.value);
                            if (node) selectNode(node);
                        }}
                        className="w-full appearance-none bg-[#2A2A2A] border border-gray-600 text-white text-sm rounded-lg px-4 py-2 pr-8 focus:ring-blue-500 focus:border-blue-500 transition"
                    >
                        <option value="" disabled>노드 선택...</option>
                        {filteredNodes.map(node => (
                            <option key={node.hubType} value={node.scanLocation}>
                                {node.scanLocation}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>
        </div>
    );
};