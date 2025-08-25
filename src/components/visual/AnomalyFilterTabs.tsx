'use client'
import React from 'react';
import { useAtom } from 'jotai';
import { anomalyFilterAtom } from '@/stores/mapDataAtoms';
import { getAnomalyName } from '../../types/colorUtils';
import type { AnomalyType } from '../../types/data';

const ANOMALY_TYPES: AnomalyType[] = [
    "fake",
    "tamper",
    "clone",
    "other"
];

const tabButtonStyle = (isActive: boolean, disabled: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    fontSize: '14px',
    color: isActive ? '#FFFFFF' : '#E0E0E0',
    backgroundColor: isActive ? 'rgba(111, 131, 175, 1)' : 'transparent',
    
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: isActive ? '#8ec5ff' : 'transparent',

    borderRadius: '9999px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s ease-in-out',
    whiteSpace: 'nowrap',
});

interface AnomalyFilterTabsProps {
    disabled: boolean;
}

const AnomalyFilterTabs: React.FC<AnomalyFilterTabsProps> = ({disabled}) => {
    const [selectedFilter, setSelectedFilter] = useAtom(anomalyFilterAtom);

    return (
        <div style={{
            display: 'flex',
            gap: '8px',
            backgroundColor: 'rgba(30, 30, 30)',
            padding: '6px',
            borderRadius: '9999px',
            backdropFilter: 'blur(8px)',
            pointerEvents: disabled ? 'none' : 'auto',
        }} className='w-fit'>
            <button
                style={tabButtonStyle(selectedFilter === null, disabled)}
                onClick={() => setSelectedFilter(null)}
            >
                전체
            </button>
            {ANOMALY_TYPES.map(type => (
                <button
                    key={type}
                    style={tabButtonStyle(selectedFilter === type, disabled)}
                    onClick={() => setSelectedFilter(type)}
                >
                    {getAnomalyName(type)}
                </button>
            ))}
        </div>
    );
};

export default AnomalyFilterTabs;