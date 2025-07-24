import React from 'react';

import { type AnalyzedTrip, type AnomalyType } from '../../types/data';
import { getAnomalyName } from '../../types/colorUtils';
import { pastelColorMap } from '../../types/anomalyUtils';

interface AnomalyListProps {
    anomalies: AnalyzedTrip[];
    onCaseClick: (trip: AnalyzedTrip) => void;
    selectedObjectId: string | null;
}

const AnomalyList: React.FC<AnomalyListProps> = ({ anomalies, onCaseClick, selectedObjectId }) => {
    return (
        <div style={{
            height: '100%',
            background: 'linear-gradient(145deg, #2A2A2A, #1E1E1E)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(6px)',
            // borderRadius: '25px',
            borderTopRightRadius: '25px',
            borderTopLeftRadius: '25px',
            color: '#FFFFFF',
            fontFamily: 'Inter, sans-serif',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
        }}>
            <h3 style={{
                margin: 0,
                padding: '20px',
                fontSize: '18px',
                flexShrink: 0,
            }}>
                이상 탐지 리스트
            </h3>

            <div style={{
                overflowY: 'auto',
                flex: 1,
                padding: '10px 15px',
            }}
                className="hide-scrollbar"
            >
                {anomalies.map((trip, index) => {
                    const hasAnomalies = trip.anomalyTypeList && trip.anomalyTypeList.length > 0;

                    if (!hasAnomalies) {
                        return null; 
                    }
                    const uniqueKey = trip.roadId || `${trip.epcCode}-${trip.from.eventTime}-${index}`;

                    const isSelected = trip.roadId ? selectedObjectId === trip.roadId : false;

                    return (
                        <div
                            key={uniqueKey}
                            onClick={() => onCaseClick(trip)}
                            className={`p-3 mb-2 rounded-xl cursor-pointer transition-all duration-200 ease-in-out border border-transparent ${isSelected ? 'bg-neutral-700/50' : 'hover:bg-neutral-800/50'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                {/* ✨ 수정: 여러 개의 태그를 렌더링하기 위한 컨테이너 */}
                                <div className="flex items-center gap-1 flex-wrap">
                                    {trip.anomalyTypeList.map(typeCode => {
                                        const pastel = pastelColorMap[typeCode] || pastelColorMap['default'];
                                        const bgColor = `${pastel}26`;
                                        const textColor = pastel;

                                        return (
                                            <span
                                                key={typeCode} // 각 태그는 고유한 키가 필요
                                                className="px-2 py-0.5 text-xs font-bold rounded-full"
                                                style={{ backgroundColor: bgColor, color: textColor }}
                                            >
                                                {getAnomalyName(typeCode)}
                                            </span>
                                        );
                                    })}
                                </div>
                                <span className="text-xs text-neutral-500">
                                    {trip.eventType}
                                </span>
                            </div>

                            <p className="text-sm font-medium text-white mb-2">
                                {trip.productName}
                            </p>

                            <div className="text-xs text-neutral-400">
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