// src/components/dashboard/AnomalyList.tsx
import React from 'react';
import { AnalyzedTrip, Node } from '@/components/visual/data';
import { getAnomalyColor, getAnomalyName } from '../visual/colorUtils';
import { Truck, Shuffle, ShieldAlert, Copy, MapPinOff } from 'lucide-react';

type AnomalyListProps = {
    data: AnalyzedTrip[];
    nodeMap: Map<string, Node>;
};

const anomalyIconMap: { [key:string]: JSX.Element } = {
    jump: <Truck className="w-4 h-4" />,          // 시공간 점프
    evtOrderErr: <Shuffle className="w-4 h-4" />, // 이벤트 순서 오류
    epcFake: <ShieldAlert className="w-4 h-4" />, // 위조 (보안/인증 문제)
    epcDup: <Copy className="w-4 h-4" />,         // 복제
    locErr: <MapPinOff className="w-4 h-4" />,    // 경로 위조 (위치 이탈)
};

const getAnomalyDescription = (trip: AnalyzedTrip): string => {
    if (!trip.anomaly) return '정상';
    switch (trip.anomaly.type) {
        case 'jump':        return `비정상적 이동: ${trip.anomaly.distance}km를 ${trip.anomaly.travelTime}분 만에 주파`;
        case 'evtOrderErr': return `출발(${trip.anomaly.currentEventTime})이 이전 이벤트(${trip.anomaly.previousEventTime})보다 빠름`;
        case 'epcFake':     return `EPC 생성 규칙 위반: ${trip.anomaly.invalidRule}`;
        case 'epcDup':      return `다른 경로와 충돌 발생 (ID: ${trip.anomaly.conflictingTripId})`;
        case 'locErr':      return `미승인 지점(${trip.anomaly.bypassedNode.name}) 경유`;
        default:            return '알 수 없는 오류';
    }
};

export default function AnomalyList({ data, nodeMap }: AnomalyListProps): JSX.Element {
    return (
        // ✨ 1. 여기가 전체를 감싸는 단일 그리드 컨테이너입니다.
        <div className="grid grid-cols-[2fr_1fr_3fr_3fr_1fr] gap-x-4 min-w-full text-sm">

            {/* --- Table Header --- */}
            {/* ✨ 2. 헤더 셀들은 이제 부모 그리드의 첫 번째 행을 구성합니다. */}
            <div className="col-start-1 col-span-5 grid grid-cols-subgrid gap-x-4 text-center bg-[rgba(40,40,40)] rounded-3xl text-white py-4 px-12 mb-3">
                <div className="col-span-1">Trip ID / 제품명</div>
                <div className="col-span-1">시간</div>
                <div className="col-span-1">경로 (출발 → 도착)</div>
                <div className="col-span-1">상세 내용</div>
                <div className="col-span-1">이상 유형</div>
            </div>

            {/* --- Table Body --- */}
            {/* ✨ 3. map 함수가 각 셀들을 직접 반환합니다. */}
            {data.map((trip) => {
                const fromNode = nodeMap.get(trip.from);
                const toNode = nodeMap.get(trip.to);
                const anomalyType = trip.anomaly?.type;

                const name = anomalyType ? getAnomalyName(anomalyType) : '';
                let r = 180, g = 180, b = 180;
                let tagStyle = {};

                if (anomalyType) {
                    [r, g, b] = getAnomalyColor(anomalyType);
                    const mix = 0.7;
                    const pastelR = Math.round(r + (255 - r) * mix);
                    const pastelG = Math.round(g + (255 - g) * mix);
                    const pastelB = Math.round(b + (255 - b) * mix);
                    tagStyle = { color: `rgb(${pastelR}, ${pastelG}, ${pastelB})` };
                }

                // 각 행의 스타일
                const rowHoverStyle = "group-hover:bg-[rgba(40,40,40,0.5)]";

                return (
                    // ✨ 4. React.Fragment로 각 행의 셀들을 그룹화하고, 부모 그리드에 연결합니다.
                    <React.Fragment key={trip.id}>
                        {/* ✨ 바디 그리드도 컬럼 너비에 맞게 수정 */}
                        <div className={`col-start-1 col-span-5 grid grid-cols-subgrid gap-x-4 items-center text-center py-2 px-12 transition-colors cursor-pointer rounded-2xl group ${rowHoverStyle}`}>
                            <div className="col-span-1 flex flex-col items-center justify-center">
                                <p className="text-white font-medium">{trip.product}</p>
                                <p className="text-xs text-[#a0a0a0]">{trip.id}</p>
                            </div>
                            <div className="col-span-1 text-xs flex flex-col gap-1 justify-center items-center whitespace-nowrap">
                                <p className="text-[#E0E0E0]">출발: {trip.timestamps[0]}</p>
                                <p className="text-[#E0E0E0]">도착: {trip.timestamps[1]}</p>
                            </div>
                            <div className="col-span-1 text-[#E0E0E0] flex justify-center items-center gap-2">
                                <span className="truncate">{fromNode?.name || trip.from}</span>
                                <ArrowRight size={14} className="text-[#E0E0E0] shrink-0" />
                                <span className="truncate">{toNode?.name || trip.to}</span>
                            </div>
                            <div className="col-span-1 text-xs text-[#b0b0b0] break-words px-2">
                                {getAnomalyDescription(trip)}
                            </div>
                            <div className="col-span-1">
                                {anomalyType && (
                                    // ✨ 3. 아이콘과 텍스트를 함께 표시하도록 UI 개선
                                    <span style={tagStyle} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[rgba(255,255,255,0.05)] border border-current">
                                        {anomalyIconMap[anomalyType]}
                                        {name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );
}

const ArrowRight = ({ size = 24, className = '' }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
);