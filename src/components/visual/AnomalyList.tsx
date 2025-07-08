import React from 'react';

import { type AnalyzedTrip, type AnomalyType, type Node } from '../visual/data';
import { getAnomalyColor, getAnomalyName } from './colorUtils'; // ✨ 분리된 함수 import

interface AnomalyListProps {
    anomalies: AnalyzedTrip[];
    onCaseClick: (trip: AnalyzedTrip) => void;
    selectedObjectId: string | null;
    nodeMap: Map<string, Node>;
}

const AnomalyList: React.FC<AnomalyListProps> = ({ anomalies, onCaseClick, selectedObjectId, nodeMap }) => {
    return (
        <div style={{
            flex: 1,
            minHeight: 0,
            background: 'linear-gradient(145deg, #2A2A2A, #1E1E1E)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(6px)',
            borderRadius: '25px',
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
                Anomaly List
            </h3>

            <div style={{
                overflowY: 'auto',
                flex: 1,
                padding: '10px 15px',
            }}
                className="hide-scrollbar"
            >
                {anomalies.map(trip => {
                    if (!trip.anomaly) return null;

                    const [r, g, b] = getAnomalyColor(trip.anomaly);
                    // 배경과 텍스트 색상을 더 명확하게 대비시킴
                    const bgColor = `rgba(${r}, ${g}, ${b}, 0.15)`;
                    const textColor = `rgb(${r}, ${g}, ${b})`;

                    const isSelected = selectedObjectId === trip.id;

                    // ✨ 2. Node의 이름 필드를 scanLocation으로 변경
                    const fromNodeName = nodeMap.get(trip.from)?.scanLocation || trip.from;
                    const toNodeName = nodeMap.get(trip.to)?.scanLocation || trip.to;

                    return (
                        <div
                            key={trip.id}
                            onClick={() => onCaseClick(trip)}
                            className={`p-3 mb-2 rounded-xl cursor-pointer transition-all duration-200 ease-in-out border border-transparent ${isSelected ? 'bg-neutral-700/50' : 'hover:bg-neutral-800/50'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span 
                                    className="px-3 py-1 text-xs font-bold rounded-full"
                                    style={{ backgroundColor: bgColor, color: textColor }}
                                >
                                    {getAnomalyName(trip.anomaly)}
                                </span>
                                <span className="text-xs text-neutral-500">
                                    {trip.eventType}
                                </span>
                            </div>
                            
                            <p className="text-sm font-medium text-white mb-2">
                                {trip.productName} {/* ✨ 3. product 대신 productName 표시 */}
                            </p>

                            <div className="text-xs text-neutral-400">
                                <p>{fromNodeName} → {toNodeName}</p>
                                {/* ✨ EPC 코드를 추가 정보로 표시 */}
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