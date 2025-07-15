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

const anomalyDescriptionMap: { [key: string]: string } = {
    jump: "비논리적인 시공간 이동이 감지되었습니다.",
    evtOrderErr: "이벤트 발생 순서가 논리적으로 맞지 않습니다.",
    epcFake: "EPC 생성 규칙에 어긋나는 위조된 코드가 발견되었습니다.",
    epcDup: "동일한 EPC 코드가 같은 시간에 다른 위치에서 중복으로 존재합니다.",
    locErr: "예상 경로를 이탈하여, 잘못된 위치에 상품이 존재합니다.",
};

// ✨ 이상 유형 코드에 맞는 태그 색상 매핑
const pastelColorMap: { [key: string]: string } = {
    'jump': '#D7BDE2',
    'evtOrderErr': '#FAD7A0',
    'epcFake': '#F5B7B1',
    'epcDup': '#FCF3CF',
    'locErr': '#A9CCE3',
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
        <div className="w-full">
            {/* 헤더 */}
            <div className="whitespace-nowrap hidden sm:grid grid-cols-[2fr_1.5fr_2.5fr_3fr_2fr] gap-x-4 text-center bg-[rgba(40,40,40)] rounded-3xl text-white py-4 px-12 mb-3">
                <div className="col-span-1">상품명 / EPC</div>
                <div className="col-span-1">시간</div>
                <div className="col-span-1">경로 (출발 → 도착)</div>
                <div className="col-span-1">상세 내용</div>
                <div className="col-span-1">이상 유형</div>
            </div>

            {/* 바디 */}
            {anomalies.map((trip) => {
                const hasAnomalies = trip.anomalyTypeList && trip.anomalyTypeList.length > 0;
                if (!hasAnomalies) return null;

                return (
                    // ✨ 2. onClick 이벤트와 선택/호버 관련 클래스 제거
                    <div
                        key={trip.id}
                        className={`group font-noto-400 border-b border-b-[#e0e0e034] hover:bg-[rgba(30,30,30)]
                                    sm:grid sm:grid-cols-[2fr_1.5fr_2.5fr_3fr_2fr] sm:gap-x-4 sm:items-center sm:text-center
                                    flex flex-col gap-2 py-4 px-6 sm:px-12`}
                    >
                        {/* 상품명 / EPC */}
                        <div className="sm:col-span-1 text-white flex flex-col sm:items-center sm:justify-center text-left">
                            <p className="font-medium">{trip.productName}</p>
                            <p className="text-xs text-[#a0a0a0]">{trip.epcCode}</p>
                        </div>
                        {/* 시간 */}
                        <div className="sm:col-span-1 text-xs flex flex-col gap-1 justify-center sm:items-center text-[#E0E0E0]">
                            <p>출발: {formatUnixTimestamp(trip.from.eventTime)}</p>
                            <p>도착: {formatUnixTimestamp(trip.to.eventTime)}</p>
                        </div>
                        {/* 경로 */}
                        <div className="sm:col-span-1 text-[#E0E0E0] flex items-center justify-center gap-2">
                            <span className="truncate">{trip.from.scanLocation}</span>
                            <ArrowRight size={14} className="shrink-0 text-[#E0E0E0]" />
                            <span className="truncate">{trip.to.scanLocation}</span>
                        </div>

                        {/* 상세 내용 */}
                        <div className="sm:col-span-1 text-xs text-[#E0E0E0] text-left sm:text-center">
                            <ul className="list-disc list-inside">
                                {trip.anomalyTypeList.map(code => (
                                    <li key={code}>{anomalyDescriptionMap[code] || '설명 없음'}</li>
                                ))}
                            </ul>
                        </div>

                        {/* 이상 유형 */}
                        <div className="sm:col-span-1 flex flex-wrap items-center justify-center gap-1">
                            {trip.anomalyTypeList.map(code => {
                                const tagColor = pastelColorMap[code] || pastelColorMap['default'];
                                return (
                                    <span
                                        key={code}
                                        style={{ color: tagColor }}
                                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold"
                                    >
                                        {anomalyIconMap[code]}
                                        {getAnomalyName(code)}
                                    </span>
                                );
                            })}
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