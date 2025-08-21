import React from 'react';

import { formatUnixTimestamp } from '@/types/map';
import { type AnalyzedTrip, type AnomalyType } from '../../types/data';
import { getAnomalyName } from '../../types/colorUtils';
import { pastelColorMap } from '../../types/anomalyUtils';

interface AnomalyListProps {
    anomalies: AnalyzedTrip[];
    onCaseClick: (trip: AnalyzedTrip) => void;
    selectedObjectId: number | null;
}

const AnomalyList: React.FC<AnomalyListProps> = ({ anomalies, onCaseClick, selectedObjectId }) => {
    return (
        <div style={{
            height: '100%',
            background: 'linear-gradient(145deg, #2A2A2A, #1E1E1E)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(6px)',
            borderTopRightRadius: '10px',
            borderTopLeftRadius: '10px',
            color: '#FFFFFF',
            fontFamily: 'Inter, sans-serif',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
        }}>
            <div style={{
                overflowY: 'auto',
                flex: 1,
                padding: '10px 15px',
            }}
            >
                {anomalies.map((trip, index) => {
                    const hasAnomalies = trip.anomalyTypeList && trip.anomalyTypeList.length > 0;

                    if (!hasAnomalies) {
                        return null;
                    }
                    const uniqueKey = `${trip.epcCode}-${trip.from.eventTime}-${index}`;

                    const isSelected = trip.roadId ? selectedObjectId === trip.roadId : false;

                    return (
                        <div
                            key={uniqueKey}
                            onClick={() => onCaseClick(trip)}
                            className={`p-3 mb-2 rounded-xl cursor-pointer transition-all duration-200 ease-in-out border border-transparent ${isSelected ? 'bg-neutral-700/50' : 'hover:bg-neutral-800/50'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1 flex-wrap">
                                    {trip.anomalyTypeList.map((typeCode, index) => {
                                        const pastel = pastelColorMap[typeCode] || pastelColorMap['default'];
                                        const bgColor = `${pastel}26`;
                                        const textColor = pastel;

                                        return (
                                            <span
                                                key={`${typeCode}-${index}`}
                                                className="px-2 py-0.5 text-xs font-bold rounded-full"
                                                style={{ backgroundColor: bgColor, color: textColor }}
                                            >
                                                {getAnomalyName(typeCode)}
                                            </span>
                                        );
                                    })}
                                </div>
                                <span className="text-xs text-neutral-500">
                                    {formatUnixTimestamp(trip.to.eventTime)}
                                </span>
                            </div>

                            <p className="text-sm font-medium text-white mb-2">
                                {trip.epcCode}
                            </p>

                            <div className="text-xs text-neutral-400">
                                <p>{trip.eventType}</p>
                                <p>{trip.from.scanLocation} → {trip.to.scanLocation}</p>
                                <p className="mt-1 opacity-70">EPC: {trip.epcCode}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AnomalyList;