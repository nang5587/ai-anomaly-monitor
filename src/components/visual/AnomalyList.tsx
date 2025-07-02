import React from 'react';
import { AnalyzedTrip, AnomalyType } from '../visual/data';
import { getAnomalyColor, getAnomalyName } from './colorUtils'; // ✨ 분리된 함수 import

interface AnomalyListProps {
    anomalies: AnalyzedTrip[];
    onCaseClick: (trip: AnalyzedTrip) => void;
    selectedObjectId: string | null;
}

const AnomalyList: React.FC<AnomalyListProps> = ({ anomalies, onCaseClick, selectedObjectId }) => {
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
                    const [r, g, b] = getAnomalyColor(trip.anomaly?.type);
                    const mix = 0.7;
                    const pastelR = Math.round(r + (255 - r) * mix);
                    const pastelG = Math.round(g + (255 - g) * mix);
                    const pastelB = Math.round(b + (255 - b) * mix);
                    const isSelected = selectedObjectId === trip.id;

                    return (
                        <div
                            key={trip.id}
                            onClick={() => onCaseClick(trip)}
                            style={{
                                // 원래 스타일로 복구
                                background: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                padding: '12px 15px',
                                borderRadius: '25px',
                                marginBottom: '10px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                            }}
                            onMouseEnter={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.borderColor = '#777';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderColor = '#555';
                                }
                            }}
                        >
                            <div style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                background: `rgba(${pastelR}, ${pastelG}, ${pastelB})`,
                                color: `rgb(${Math.round(r * 0.75)}, ${Math.round(g * 0.75)}, ${Math.round(b * 0.75)})`,
                                borderRadius: '25px',
                                fontWeight: '600',
                                fontSize: '13px',
                                marginBottom: '10px',
                            }}>
                                {getAnomalyName(trip.anomaly?.type)}
                            </div>
                            <div style={{ fontSize: '13px', color: '#ccc', marginBottom: '4px' }}>
                                {trip.from} → {trip.to}
                            </div>
                            <div style={{ fontSize: '13px', color: '#ccc' }}>
                                Product: {trip.product}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AnomalyList;