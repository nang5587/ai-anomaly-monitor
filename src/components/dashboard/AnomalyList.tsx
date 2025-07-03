// src/components/dashboard/AnomalyList.tsx
import React from 'react';
import { AnalyzedTrip, Node } from '@/components/visual/data';
import { getAnomalyColor, getAnomalyName } from '../visual/colorUtils';
import { Truck, AlertTriangle, GitFork, Shuffle } from 'lucide-react';

type AnomalyListProps = {
    data: AnalyzedTrip[];
    nodeMap: Map<string, Node>;
};

const anomalyIconMap: { [key: string]: JSX.Element } = {
    SPACE_JUMP: <Truck className="w-4 h-4" />,
    CLONE: <GitFork className="w-4 h-4" />,
    ORDER_ERROR: <Shuffle className="w-4 h-4" />,
    PATH_FAKE: <AlertTriangle className="w-4 h-4" />,
};

const getAnomalyDescription = (trip: AnalyzedTrip): string => {
    if (!trip.anomaly) return '정상';
    switch (trip.anomaly.type) {
        case 'SPACE_JUMP': return `비정상적 이동: ${trip.anomaly.distance}km를 ${trip.anomaly.travelTime}분 만에 주파`;
        case 'CLONE': return `원본(${trip.anomaly.originalTripId})에서 복제됨 (${trip.anomaly.cloneCount}개)`;
        case 'ORDER_ERROR': return `출발(${trip.anomaly.currentEventTime})이 이전 이벤트(${trip.anomaly.previousEventTime})보다 빠름`;
        case 'PATH_FAKE': return `미승인 지점(${trip.anomaly.bypassedNode.name}) 경유`;
        default: return '알 수 없는 오류';
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
                        <div className={`col-start-1 col-span-5 grid grid-cols-subgrid gap-x-4 items-center text-center py-2 px-12 transition-colors cursor-pointer rounded-2xl group ${rowHoverStyle}`}>
                            <div className="col-span-1 flex gap-2 items-center justify-center">
                                <p className="text-xs text-[#E0E0E0]">{trip.id}</p>
                                <p className="text-white font-medium">{trip.product}</p>
                            </div>
                            <div className="col-span-1 text-xs flex gap-2 justify-center items-center whitespace-nowrap">
                                <p className="text-[#E0E0E0]">출발: {trip.timestamps[0]}</p>
                                <p className="text-[#E0E0E0]">도착: {trip.timestamps[1]}</p>
                            </div>
                            <div className="col-span-1 text-[#E0E0E0] flex justify-center items-center gap-2">
                                <span className="truncate">{fromNode?.name || trip.from}</span>
                                <ArrowRight size={14} className="text-[#E0E0E0] shrink-0" />
                                <span className="truncate">{toNode?.name || trip.to}</span>
                            </div>
                            <div className="col-span-1 text-[#E0E0E0]">
                                {getAnomalyDescription(trip)}
                            </div>
                            <div className="col-span-1">
                                {anomalyType && (
                                    <span style={{ ...tagStyle, width: '130px' }} className="inline-flex items-center justify-center gap-1.5 px-1 py-2 rounded-full text-sm font-bold">
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