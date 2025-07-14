import React, { useMemo, useEffect, useState } from 'react';
import { Node, AnalyzedTrip, getAnomalies } from '../visual/data';
import { getAnomalyColor, getAnomalyName } from '../visual/colorUtils';

import { v4 as uuidv4 } from 'uuid';

type TripWithId = AnalyzedTrip & { id: string };

interface WaypointItemProps {
    title: string;
    location: string;
    isLast: boolean;
}

const WaypointItem: React.FC<WaypointItemProps> = ({ title, location, isLast }) => {
    const innerMarkerSize = 10;
    const outerMarkerSize = 18;
    return (
        <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ position: 'relative', width: `${outerMarkerSize}px`, height: `${outerMarkerSize}px`, marginTop: '4px' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '50%', backgroundColor: 'rgba(111, 131, 175, 0.3)' }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: `${innerMarkerSize}px`, height: `${innerMarkerSize}px`, borderRadius: '50%', backgroundColor: 'rgba(111, 131, 175)' }} />
                </div>
                {!isLast && (
                    <div style={{ flexGrow: 1, width: '2px', backgroundImage: 'linear-gradient(rgba(111, 131, 175, 0.3) 40%, transparent 20%)', backgroundSize: '2px 10px', backgroundRepeat: 'repeat-y' }} />
                )}
            </div>
            <div style={{ flex: 1, paddingBottom: isLast ? '0' : '24px', display: 'flex', alignItems: 'center' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#E0E0E0' }}>{title}</p>
                    <p style={{ margin: 0, fontSize: '15px', color: '#FFFFFF', marginTop: '2px' }}>{location}</p>
                </div>
            </div>
        </div>
    );
};

const TripTimeline: React.FC<{ trip: TripWithId }> = ({ trip }) => {
    const waypoints = [
        { type: '도착지', location: trip.to.scanLocation },
        { type: '출발지', location: trip.from.scanLocation },
    ];

    return (
        <div>
            {waypoints.map((point, index) => (
                <WaypointItem
                    key={point.type}
                    title={point.type}
                    location={point.location}
                    isLast={index === waypoints.length - 1}
                />
            ))}
        </div>
    );
};

const TripDetails: React.FC<{ trip: TripWithId }> = ({ trip }) => {
    return (
        <>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '24px' }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                    {trip.anomalyDescription || "세부 정보 없음"}
                </p>
            </div>
            <div style={{ fontSize: '14px', color: '#a0a0a0', marginBottom: '8px' }}>
                <span style={{ color: '#FFFFFF' }} className='text-base'>상품명 : </span>
                <span className='text-[#E0E0E0]'>{trip.productName}</span>
            </div>
            <div style={{ fontSize: '14px', color: '#a0a0a0', marginBottom: '8px' }}>
                <span style={{ color: '#FFFFFF' }} className='text-base'>EPC : </span>
                <span className='text-[#E0E0E0]'>{trip.epcCode}</span>
            </div>
            <div style={{ fontSize: '14px', color: '#a0a0a0', marginBottom: '24px' }}>
                <span style={{ color: '#FFFFFF' }} className='text-base'>LOT ID : </span>
                <span className='text-[#E0E0E0]'>{trip.epcLot}</span>
            </div>
            {/* ✨ 2. TripTimeline에도 nodeMap을 전달 */}
            <TripTimeline trip={trip} />
        </>
    );
};

const NodeDetails: React.FC<{ node: Node; allAnomalies: TripWithId[]; }> = ({ node, allAnomalies }) => {
    const relatedAnomalies = useMemo(() => {
        return allAnomalies.filter(
            trip => trip.from.scanLocation === node.scanLocation || trip.to.scanLocation === node.scanLocation
        );
    }, [node, allAnomalies]);

    return (
        <>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                    <strong style={{ color: '#FFFFFF' }}>허브 타입:</strong> {node.hubType}<br />
                    <strong style={{ color: '#FFFFFF' }}>좌표:</strong> {node.coord.join(', ')}
                </p>
            </div>
            <h4 style={{ margin: '15px 0 10px 0', fontSize: '15px', color: '#ddd' }}>연관된 이상징후 ({relatedAnomalies.length})</h4>
            {relatedAnomalies.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {relatedAnomalies.map(trip => (
                        <div key={trip.id} style={{ fontSize: '12px', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px' }}>
                            <div style={{ fontWeight: 'bold', color: `rgb(${getAnomalyColor(trip.anomaly || undefined).join(',')})` }}>{getAnomalyName(trip.anomaly || undefined)}</div>
                            <div>{trip.from.scanLocation} → {trip.to.scanLocation}</div>
                            <div>상품명: {trip.productName}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>이 지점과 연관된 이상 징후가 없습니다.</p>
            )}
        </>
    );
};

// --- 메인 컴포넌트 ---

interface DetailsPanelProps {
    selectedObject: TripWithId | Node | null;
    onClose: () => void;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ selectedObject, onClose }) => {
    const [allAnomalies, setAllAnomalies] = useState<TripWithId[]>([]);

    useEffect(() => {
        getAnomalies().then(response => {
            // 👇 데이터를 받아와서 상태에 저장하기 전에 ID를 부여합니다.
            const anomalyTrips = response.data;
            const anomaliesWithId = anomalyTrips.map(trip => ({
                ...trip,
                id: uuidv4() 
            }));
            setAllAnomalies(anomaliesWithId);
        });
    }, []);

    if (!selectedObject) return null;

    const isTrip = 'from' in selectedObject && 'to' in selectedObject;

    return (
        <div style={{
            position: 'absolute', top: '10px', right: '220px',
            width: '320px', maxHeight: 'calc(100vh - 180px)',
            background: 'linear-gradient(145deg, #2A2A2A, #1E1E1E)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(6px)', borderRadius: '25px',
            padding: '20px', color: '#E0E0E0',
            zIndex: 3, display: 'flex', flexDirection: 'column', gap: '15px'
        }}
            className='font-noto-400'>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#FFFFFF' }}>
                    {isTrip
                        ? getAnomalyName((selectedObject as TripWithId).anomaly!)
                        : (selectedObject as Node).scanLocation
                    }
                </h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '20px', cursor: 'pointer' }}>
                    ×
                </button>
            </div>
            <div style={{ overflowY: 'auto', paddingRight: '10px' }} className="hide-scrollbar">
                {isTrip
                    ? <TripDetails trip={selectedObject as TripWithId} />
                    : <NodeDetails node={selectedObject as Node} allAnomalies={allAnomalies} />
                }
            </div>
        </div>
    );
};

export default DetailsPanel;