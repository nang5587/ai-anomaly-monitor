import React, { useMemo } from 'react';
import { Node, AnalyzedTrip, analyzedTrips } from '../visual/data';
import { getAnomalyColor, getAnomalyName } from '../visual/colorUtils';

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
            {/* 왼쪽: 마커와 점선 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>

                {/* ✨ 2. 마커를 담는 컨테이너. 이 컨테이너가 relative 위치 기준이 됩니다. */}
                <div style={{
                    position: 'relative',
                    width: `${outerMarkerSize}px`,
                    height: `${outerMarkerSize}px`,
                    marginTop: '4px'
                }}>
                    {/* 바깥쪽 투명한 원 */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(111, 131, 175, 0.3)', // 더 투명한 색상
                    }} />

                    {/* 안쪽 불투명한 원 (기존 마커) */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: `${innerMarkerSize}px`,
                        height: `${innerMarkerSize}px`,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(111, 131, 175)',
                    }} />
                </div>

                {/* 점선 (스타일 약간 수정) */}
                {!isLast && (
                    <div style={{
                        flexGrow: 1,
                        width: '2px', // 너비 2px로 복구
                        backgroundImage: 'linear-gradient(rgba(111, 131, 175, 0.3) 40%, transparent 20%)', // 점선 색상도 통일
                        backgroundSize: '2px 10px',
                        backgroundRepeat: 'repeat-y'
                    }} />
                )}
            </div>

            {/* 오른쪽: 위치 정보 (변경 없음) */}
            <div style={{ flex: 1, paddingBottom: isLast ? '0' : '24px', display: 'flex', alignItems: 'center' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#a0a0a0' }}>{title}</p>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '2px' }}>{location}</p>
                </div>
            </div>
        </div>
    );
};

// ✨ 2. 타임라인 구성 컴포넌트도 시간 로직을 제거하여 간소화합니다.
const TripTimeline: React.FC<{ trip: AnalyzedTrip }> = ({ trip }) => {
    // 도착지를 위에 표시하기 위한 순서
    const waypoints = [
        { type: 'Arrival', location: trip.to },
        { type: 'Departure', location: trip.from },
    ];

    return (
        <div>
            {waypoints.map((point, index) => (
                <WaypointItem
                    key={point.type}
                    title={`${point.type} Waypoint`}
                    location={point.location}
                    isLast={index === waypoints.length - 1}
                />
            ))}
        </div>
    );
}

interface DetailsPanelProps {
    selectedObject: AnalyzedTrip | Node | null;
    onClose: () => void;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ selectedObject, onClose }) => {
    if (!selectedObject) return null;

    const isTrip = 'path' in selectedObject;

    const getAnomalyDescription = (trip: AnalyzedTrip): string => {
        // ... (내부 로직은 동일)
        switch (trip.anomaly?.type) {
            case 'jump':        return "물리적으로 불가능한 속도로 장거리 이동이 감지되었습니다. 중간 경로가 누락되었을 수 있습니다.";
            case 'evtOrderErr': return "물류 이벤트의 순서가 비정상적입니다. 도착 이벤트가 출발 이벤트보다 먼저 기록되었습니다.";
            case 'epcFake':     return "제품의 EPC(Electronic Product Code)가 정해진 생성 규칙을 위반했습니다. 위조된 제품일 수 있습니다.";
            case 'epcDup':      return "동일한 제품 ID가 두 개 이상의 경로에서 동시에 이동 중입니다. 제품이 불법 복제되었을 가능성이 있습니다.";
            case 'locErr':      return "예상된 경로와 다른 경로로 이동했습니다. 제품이 탈취되었거나 경로가 위조되었을 수 있습니다.";
            default:            return "세부 정보 없음";
        }
    }

    const relatedAnomalies = useMemo(() => {
        if (isTrip) return [];
        const node = selectedObject as Node;
        return analyzedTrips.filter(
            trip => trip.anomaly && (trip.from === node.id || trip.to === node.id)
        );
    }, [selectedObject, isTrip]);

    return (
        <div style={{
            position: 'absolute',
            top: '80px',
            right: '220px',
            width: '320px',
            maxHeight: 'calc(100vh - 180px)',
            background: 'linear-gradient(145deg, #2A2A2A, #1E1E1E)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(6px)',
            borderRadius: '25px',
            padding: '20px',
            color: '#E0E0E0',
            fontFamily: 'Inter, sans-serif',
            zIndex: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#FFFFFF' }}>
                    {isTrip ? getAnomalyName((selectedObject as AnalyzedTrip).anomaly?.type) : (selectedObject as Node).name}
                </h3>
                <button onClick={onClose} style={{
                    background: 'none', border: 'none', color: '#aaa', fontSize: '20px', cursor: 'pointer'
                }}>
                    ×
                </button>
            </div>

            <div style={{ overflowY: 'auto', paddingRight: '10px' }} className="hide-scrollbar">
                {isTrip ? (
                    <>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '24px' }}>
                            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                                {getAnomalyDescription(selectedObject as AnalyzedTrip)}
                            </p>
                        </div>

                        <div style={{ fontSize: '14px', color: '#a0a0a0', marginBottom: '20px' }}>
                            <strong style={{ color: '#FFFFFF' }}>Product ID:</strong> {(selectedObject as AnalyzedTrip).product}
                        </div>

                        <TripTimeline trip={selectedObject as AnalyzedTrip} />

                        {(selectedObject as AnalyzedTrip).anomaly?.type === 'locErr' &&
                            <div style={{ marginTop: '20px', fontSize: '14px' }}>
                                <strong>Expected Path:</strong> {((selectedObject as AnalyzedTrip).anomaly as any).expectedPath.join(' → ')}
                            </div>
                        }
                    </>
                ) : (
                    <>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
                            <p style={{ margin: 0, fontSize: '14px' }}>
                                <strong>Type:</strong> {(selectedObject as Node).type}<br />
                                <strong>Location:</strong> {(selectedObject as Node).coordinates.join(', ')}
                            </p>
                        </div>
                        <h4 style={{ margin: '15px 0 10px 0', fontSize: '15px', color: '#ddd' }}>Related Anomalies ({relatedAnomalies.length})</h4>
                        {relatedAnomalies.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {relatedAnomalies.map(trip => (
                                    <div key={trip.id} style={{ fontSize: '12px', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px' }}>
                                        <div style={{ fontWeight: 'bold', color: `rgb(${getAnomalyColor(trip.anomaly?.type).join(',')})` }}>{getAnomalyName(trip.anomaly?.type)}</div>
                                        <div>{trip.from} → {trip.to}</div>
                                        <div>Product: {trip.product}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>No anomalies related to this node.</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default DetailsPanel;