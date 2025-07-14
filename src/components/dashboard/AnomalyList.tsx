// src/components/dashboard/AnomalyList.tsx
import React from 'react';
import { type AnalyzedTrip, type Node } from '@/components/visual/data';
import { getAnomalyColor, getAnomalyName } from '../visual/colorUtils';
import { Truck, Shuffle, ShieldAlert, Copy, MapPinOff } from 'lucide-react';

type TripWithId = AnalyzedTrip & { id: string };

type AnomalyListProps = {
    anomalies: TripWithId[];
};

const anomalyIconMap: { [key: string]: JSX.Element } = {
    jump: <Truck className="w-4 h-4" />,          // 시공간 점프
    evtOrderErr: <Shuffle className="w-4 h-4" />, // 이벤트 순서 오류
    epcFake: <ShieldAlert className="w-4 h-4" />, // 위조 (보안/인증 문제)
    epcDup: <Copy className="w-4 h-4" />,         // 복제
    locErr: <MapPinOff className="w-4 h-4" />,    // 경로 위조 (위치 이탈)
};

const pastelColorMap: { [key: string]: string } = {
    // '시공간 점프': 연한 라벤더 색상
    'jump': '#D7BDE2',
    // '이벤트 순서 오류': 부드러운 살구색
    'evtOrderErr': '#FAD7A0',
    // '위조': 매우 연한 핑크
    'epcFake': '#F5B7B1',
    // '복제': 부드러운 크림색
    'epcDup': '#FCF3CF',
    // '경로 위조': 매우 연한 하늘색
    'locErr': '#A9CCE3',
    // 기본값: 연한 회색
    'default': '#E5E7E9',
};

const formatUnixTimestamp = (timestamp: number | string): string => {
    // 유효하지 않은 타임스탬프는 'N/A'로 처리
    if (!timestamp || timestamp === 0) return 'N/A';

    // Unix 타임스탬프(초 단위)는 밀리초로 변환해야 함 ( * 1000 )
    const date = new Date(Number(timestamp) * 1000);

    // 'sv-SE' 로케일은 YYYY-MM-DD 형식에 가장 가까워 편리함
    const formatter = new Intl.DateTimeFormat('sv-SE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false, // 24시간 표기법 사용
    });

    return formatter.format(date);
};

export default function AnomalyList({ anomalies }: AnomalyListProps): JSX.Element {
    if (anomalies === undefined) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                이상 데이터 로딩 중...
            </div>
        );
    }

    if (anomalies.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                표시할 이상 데이터가 없습니다.
            </div>
        );
    }

    return (
        // ✨ 1. 여기가 전체를 감싸는 단일 그리드 컨테이너입니다.
        <div className="w-full">

            {/* ✨ 2. 헤더 셀들은 이제 부모 그리드의 첫 번째 행을 구성합니다. */}
            <div className="whitespace-nowrap hidden sm:grid grid-cols-[2fr_1fr_3fr_3fr_1fr] gap-x-4 text-center bg-[rgba(40,40,40)] rounded-3xl text-white py-4 px-12 mb-3">
                <div className="col-span-1">상품명 / EPC</div>
                <div className="col-span-1">시간</div>
                <div className="col-span-1">경로 (출발 → 도착)</div>
                <div className="col-span-1">상세 내용</div>
                <div className="col-span-1">이상 유형</div>
            </div>

            {/* --- Table Body --- */}
            {/* ✨ 3. map 함수가 각 셀들을 직접 반환합니다. */}
            {anomalies.map((trip) => {
                const anomalyType = trip.anomaly;
                const tagColor = (anomalyType && pastelColorMap[anomalyType])
                    ? pastelColorMap[anomalyType]
                    : pastelColorMap['default'];

                const tagStyle = { color: tagColor };

                const anomalyName = anomalyType ? getAnomalyName(anomalyType) : '';
                const rowHoverStyle = "group-hover:bg-[rgba(40,40,40,0.5)]";

                return (
                    <div
                        key={trip.id}
                        className={`group font-noto-400 border-b border-b-[#e0e0e034] transition-colors
                                    sm:grid sm:grid-cols-[2fr_1fr_3fr_3fr_1fr] sm:gap-x-4 sm:items-center sm:text-center
                                    hover:bg-[rgba(30,30,30)]
                                    flex flex-col gap-2 py-4 px-6 sm:px-12 ${rowHoverStyle}`}
                    >
                        <div className="sm:col-span-1 text-white flex flex-col sm:items-center sm:justify-center text-left">
                            <p className="font-medium">{trip.productName}</p>
                            <p className="text-xs text-[#a0a0a0]">{trip.epcCode}</p>
                        </div>
                        <div className="sm:col-span-1 text-xs flex flex-col gap-1 justify-center sm:items-center text-[#E0E0E0]">
                            <p>출발: {formatUnixTimestamp(trip.from.eventTime)}</p>
                            <p>도착: {formatUnixTimestamp(trip.to.eventTime)}</p>
                        </div>
                        <div className="sm:col-span-1 text-[#E0E0E0] flex items-center justify-center gap-2">
                            <span className="truncate">{trip.from.scanLocation}</span>
                            <ArrowRight size={14} className="shrink-0 text-[#E0E0E0]" />
                            <span className="truncate">{trip.to.scanLocation}</span>
                        </div>
                        <div className="sm:col-span-1 text-xs text-[#E0E0E0]">
                            {trip.anomalyDescription}
                        </div>
                        <div className="sm:col-span-1">
                            {anomalyType && (
                                <span
                                    style={tagStyle}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                                >
                                    {anomalyIconMap[anomalyType]}
                                    {anomalyName}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const ArrowRight = ({ size = 24, className = '' }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
);