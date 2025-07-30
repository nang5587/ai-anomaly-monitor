import React, { useMemo, useEffect, Suspense } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
    type LocationNode,
    type AnalyzedTrip,
    type AnomalyType,
    getAnomalies,
} from '../../types/data';
import { anomalyDescriptionMap } from '../../types/anomalyUtils';
import { getAnomalyColor, getAnomalyName } from '../../types/colorUtils';

import {
    selectedObjectAtom,
    allAnomalyTripsAtom,
    selectTripAndFocusAtom,
} from '@/stores/mapDataAtoms';

import { MergeTrip } from './SupplyChainDashboard';
import { formatUnixTimestamp } from "@/types/map";
import { ChevronsRight } from 'lucide-react';

interface WaypointItemProps {
    title: string;
    location: string;
    eventTime: number;
    isLast: boolean;
}

const WaypointItem: React.FC<WaypointItemProps> = ({ title, location, eventTime, isLast }) => {
    const innerMarkerSize = 10;
    const outerMarkerSize = 18;
    return (
        <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ position: 'relative', width: `${outerMarkerSize}px`, height: `${outerMarkerSize}px`, marginTop: '4px' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.3)' }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: `${innerMarkerSize}px`, height: `${innerMarkerSize}px`, borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255)' }} />
                </div>
                {!isLast && (
                    <div style={{ flexGrow: 1, width: '2px', backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.3) 40%, transparent 20%)', backgroundSize: '2px 10px', backgroundRepeat: 'repeat-y' }} />
                )}
            </div>
            <div style={{ flex: 1, paddingBottom: isLast ? '0' : '24px', display: 'flex', alignItems: 'center' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#E0E0E0' }}>{title}</p>
                    <p style={{ margin: 0, fontSize: '15px', color: '#FFFFFF', marginTop: '2px' }}>{location}</p>
                    <p style={{ margin: 0, fontSize: '15px', color: '#FFFFFF', marginTop: '2px' }}>{formatUnixTimestamp(eventTime)}</p>
                </div>
            </div>
        </div>
    );
};

// O도착지---O출발지
const TripTimeline: React.FC<{ trip: AnalyzedTrip }> = ({ trip }) => {
    const waypoints = [
        { type: '도착지', location: trip.to.scanLocation, eventTime: trip.to.eventTime },
        { type: '출발지', location: trip.from.scanLocation, eventTime: trip.from.eventTime },
    ];

    return (
        <div>
            {waypoints.map((point, index) => (
                <WaypointItem
                    key={`${point.type}-${index}`}
                    title={point.type}
                    location={point.location}
                    eventTime={point.eventTime}
                    isLast={index === waypoints.length - 1}
                />
            ))}
        </div>
    );
};

const TripDetails: React.FC<{ trip: AnalyzedTrip }> = ({ trip }) => {
    const hasAnomalies = trip.anomalyTypeList && trip.anomalyTypeList.length > 0;

    return (
        <>
            {/* 이상 현상 상세 설명 섹션 */}
            {hasAnomalies && (
                <div className="flex flex-col gap-4 p-3 mb-6 rounded-lg bg-black/20">
                    {trip.anomalyTypeList.map((code, index) => (
                        <div key={`${code}-${index}`}>
                            <p className="font-noto-500 text-base" style={{ color: `rgb(${getAnomalyColor(code).join(',')})` }}>
                                {getAnomalyName(code)}
                            </p>
                            <p className="text-sm text-neutral-300 mt-1">
                                {anomalyDescriptionMap[code] || "상세 설명이 없습니다."}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* 기본 정보 섹션 */}
            <div className="flex flex-col gap-2 text-sm text-neutral-400">
                <div>
                    <span className="text-white text-base">상품명 : </span>
                    <span className="text-[#E0E0E0]">{trip.productName}</span>
                </div>
                <div>
                    <span className="text-white text-base">EPC : </span>
                    <span className="text-[#E0E0E0] font-mono">{trip.epcCode}</span>
                </div>
                <div>
                    <span className="text-white text-base">LOT ID : </span>
                    <span className="text-[#E0E0E0]">{trip.epcLot}</span>
                </div>
                <div className="mb-4">
                    <span className="text-white text-base">Event Type : </span>
                    <span className="text-[#E0E0E0]">{trip.eventType}</span>
                </div>
            </div>

            <TripTimeline trip={trip} />
        </>
    );
};

const NodeDetails: React.FC<{ node: LocationNode; }> = ({ node }) => {
    const selectTripAndFocus = useSetAtom(selectTripAndFocusAtom);
    const allAnomalies = useAtomValue(allAnomalyTripsAtom);

    const relatedAnomalies = useMemo(() => {
        if (!node || !allAnomalies) return [];
        return allAnomalies.filter(
            trip =>
                // 조건 1: 이 trip이 선택된 노드와 관련이 있는가?
                (trip.from.scanLocation === node.scanLocation || trip.to.scanLocation === node.scanLocation) &&
                // ✨ 조건 2: 그리고 이 trip에 이상 징후가 있는가? (이 줄 추가!)
                (trip.anomalyTypeList && trip.anomalyTypeList.length > 0)
        );
    }, [node, allAnomalies]);

    const handleAnomalyClick = (trip: AnalyzedTrip) => {
        selectTripAndFocus(trip);
    };

    return (
        <>
            <div className="p-3 mb-4 rounded-lg bg-black/20 flex">
                <p className="text-sm font-noto-500 leading-relaxed text-white">허브 타입 : {node.hubType}</p><br />
            </div>
            <h4 className="my-4 text-base font-noto-500 text-white">연관된 이상징후 ({relatedAnomalies.length})</h4>
            {relatedAnomalies.length > 0 ? (
                <div className="flex flex-col gap-2">
                    {relatedAnomalies.map((trip, index) => {
                        // 각 trip의 대표 이상 유형을 찾음
                        const representativeAnomaly = trip.anomalyTypeList[0];
                        return (
                            // ✨ div를 button으로 바꾸고 onClick 핸들러 추가
                            <button
                                key={`${trip.roadId}-${trip.from.eventTime}-${index}`}
                                onClick={() => handleAnomalyClick(trip)}
                                className="cursor-pointer text-left text-xs p-2 rounded-md transition-colors bg-white/15 hover:bg-white/10"
                            >
                                <div className="font-noto-500" style={{ color: `rgb(${getAnomalyColor(representativeAnomaly).join(',')})` }}>
                                    {getAnomalyName(representativeAnomaly)}
                                    {trip.anomalyTypeList.length > 1 && ` 외 ${trip.anomalyTypeList.length - 1}건`}
                                </div>
                                <div>{trip.from.scanLocation} → {trip.to.scanLocation}</div>
                                <div>EPC: {trip.epcCode}</div>
                                <div>상품명: {trip.productName}</div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <p className="text-sm text-[#E0E0E0] m-0">이 지점과 연관된 이상 징후가 없습니다.</p>
            )}
        </>
    );
};

const EpcDupListItem: React.FC<{ trip: AnalyzedTrip; onClick: () => void; isSelected: boolean }> = ({ trip, onClick, isSelected }) => (
    <div
        onClick={onClick}
        className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 flex items-start gap-3 ${isSelected ? 'bg-black/20' : 'bg-black/20 hover:bg-black/5 overflow-y-auto'}`}
    >
        <div className="flex-grow">
            <p className="font-noto-500 text-white text-sm">
                {trip.productName}
            </p>
            <div className="text-xs text-[#E0E0E0] mt-1 flex items-center">
                <span>{trip.from.scanLocation}</span>
                <ChevronsRight className="w-4 h-4 mx-1" />
                <span>{trip.to.scanLocation}</span>
            </div>
        </div>
    </div>
);

// --- 메인 컴포넌트 ---
interface DetailsPanelProps {
    selectedObject: AnalyzedTrip | LocationNode | null;
    onClose: () => void;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ selectedObject, onClose }) => {
    const selectTrip = useSetAtom(selectTripAndFocusAtom);
    const allAnomalyTrips = useAtomValue(allAnomalyTripsAtom);

    // ✨ 1. 선택된 객체가 EPC 복제 유형인지 확인
    const isEpcDup = useMemo(() =>
        selectedObject && 'anomalyTypeList' in selectedObject && selectedObject.anomalyTypeList?.includes('clone'),
        [selectedObject]
    );

    // ✨ 2. EPC 복제와 연관된 모든 경로 찾기
    const duplicateTrips = useMemo(() => {
        if (!isEpcDup || !selectedObject || !('epcCode' in selectedObject)) return [];

        const targetEpc = (selectedObject as AnalyzedTrip).epcCode;
        const selectedIndex = allAnomalyTrips.findIndex(trip => trip === selectedObject);

        return allAnomalyTrips.filter((trip, index) =>
            trip.epcCode === targetEpc &&
            trip.anomalyTypeList.includes('clone') &&
            // 현재 선택된 항목의 인덱스와 다른 항목만 필터링
            index !== selectedIndex
        );
    }, [isEpcDup, selectedObject, allAnomalyTrips]);

    const handleTripSelection = (trip: MergeTrip) => {
        selectTrip(trip as MergeTrip);
    }

    if (!selectedObject) return null;

    const isTrip = 'from' in selectedObject && 'to' in selectedObject;

    return (
        <div style={{
            position: 'absolute', top: '10px', right: '220px',
            width: '380px', maxHeight: 'calc(100vh - 180px)',
            background: 'rgba(111,131,175)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(6px)', borderRadius: '25px',
            padding: '20px', color: '#E0E0E0',
            zIndex: 3, display: 'flex', flexDirection: 'column', gap: '15px'
        }}
            className='font-noto-400'>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#FFFFFF' }}>
                    {isEpcDup
                        ? '복제품 의심 이력' // ✨ 타이틀 변경
                        : isTrip
                            ? '운송 상세'
                            : (selectedObject as LocationNode).scanLocation
                    }
                </h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: '20px', cursor: 'pointer' }}>
                    ×
                </button>
            </div>
            <div style={{ overflowY: 'auto', paddingRight: '10px' }}>
                {isEpcDup ? (
                    <div>
                        {/* 섹션 1: 복제품 의심 목록 */}
                        <p className="text-xs text-[#E0E0E0] mb-4">선택된 경로와 동일한 EPC를 사용하는 복제품 의심 경로 목록입니다.</p>
                        <div className="space-y-2">
                            {duplicateTrips.map((trip, index) => (
                                <EpcDupListItem
                                    key={`${trip.roadId}-${index}`}
                                    trip={trip}
                                    onClick={() => handleTripSelection(trip)}
                                    isSelected={selectedObject && 'roadId' in selectedObject && (selectedObject as any).roadId === (trip as any).roadId}
                                />
                            ))}
                        </div>

                        {/* 구분선 */}
                        <div className="my-6 border-t border-gray-600/50" />

                        {/* 섹션 2: 선택된 경로의 상세 정보 */}
                        <h4 className="text-base font-noto-500 text-white mb-2">선택된 경로 상세</h4>
                        {isTrip && <TripDetails trip={selectedObject as AnalyzedTrip} />}
                    </div>
                ) : isTrip ? (
                    <TripDetails trip={selectedObject as AnalyzedTrip} />
                ) : (
                    <Suspense fallback={<div>연관 목록 로딩 중...</div>}>
                        <NodeDetails node={selectedObject as LocationNode} />
                    </Suspense>
                )}
            </div>
        </div>
    );
};

export default DetailsPanel;