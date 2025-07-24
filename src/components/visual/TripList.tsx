import React from 'react';
import { type AnalyzedTrip } from '../../types/data';
import { getAnomalyName } from '../../types/colorUtils';
import { pastelColorMap } from '../../types/anomalyUtils';

type TripListProps = {
    trips: AnalyzedTrip[];
    onCaseClick: (trip: AnalyzedTrip) => void;
    selectedObjectId: string | null;
};

const formatUnixTime = (unixTimestamp: number | string | null | undefined): string => {
    // null, undefined, 0, 빈 문자열 등 유효하지 않은 값은 'N/A'로 처리
    if (!unixTimestamp) return 'N/A';

    try {
        // Unix 타임스탬프(초)를 밀리초로 변환 (* 1000)
        const date = new Date(Number(unixTimestamp) * 1000);

        // 유효하지 않은 날짜(Invalid Date)인지 확인
        if (isNaN(date.getTime())) {
            return 'N/A';
        }

        // YYYY-MM-DD HH:mm 형식으로 직접 조합
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}`;

    } catch (error) {
        console.error("Error formatting unix timestamp:", error);
        return 'N/A';
    }
};

export default function TripList({ trips, onCaseClick, selectedObjectId }: TripListProps): JSX.Element {
    if (trips === undefined) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                데이터를 불러오는 중입니다...
            </div>
        );
    }

    if (trips.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                표시할 데이터가 없습니다.
            </div>
        );
    }

    return (
        <div style={{
            height: '100%',
            background: 'linear-gradient(145deg, #2A2A2A, #1E1E1E)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(6px)',
            borderTopLeftRadius: '25px',
            borderTopRightRadius: '25px',
            color: '#FFFFFF',
            fontFamily: 'Inter, sans-serif',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* 리스트 제목 */}
            <h3 style={{
                margin: 0,
                padding: '20px',
                fontSize: '18px',
                flexShrink: 0,
            }}>
                전체 운송 목록
            </h3>

            {/* 스크롤 가능한 리스트 컨테이너 */}
            <div
                style={{
                    overflowY: 'auto',
                    flex: 1,
                    padding: '10px 15px',
                }}
                className="hide-scrollbar"
            >
                {trips.map((trip) => {
                    const isSelected = selectedObjectId === trip.roadId;
                    // ✨ trip.anomalyTypeList가 유효한 배열인지 확인
                    const hasAnomalies = trip.anomalyTypeList && trip.anomalyTypeList.length > 0;

                    return (
                        <div
                            key={trip.roadId}
                            onClick={() => onCaseClick(trip)}
                            className={`p-3 mb-2 rounded-xl cursor-pointer transition-all duration-200 ease-in-out border border-transparent ${isSelected ? 'bg-neutral-700/50' : 'hover:bg-neutral-800/50'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                {/* ✨ 수정: 여러 이상 유형 태그를 렌더링하는 부분 */}
                                <div className="flex items-center gap-1 flex-wrap">
                                    {hasAnomalies ? (
                                        trip.anomalyTypeList.map(typeCode => {
                                            const color = pastelColorMap[typeCode] || pastelColorMap['default'];
                                            const bgColor = `${color}26`;
                                            const textColor = color;
                                            return (
                                                <span
                                                    key={typeCode} // 각 태그는 고유한 키를 가져야 함
                                                    className="px-2 py-0.5 text-xs font-bold rounded-full"
                                                    style={{ backgroundColor: bgColor, color: textColor }}
                                                >
                                                    {getAnomalyName(typeCode)}
                                                </span>
                                            );
                                        })
                                    ) : (
                                        // 이상이 없는 경우 빈 공간으로 둡니다.
                                        <span />
                                    )}
                                </div>
                                <span className="text-xs text-neutral-500">
                                    {formatUnixTime(trip.from.eventTime)}
                                </span>
                            </div>

                            <p className="text-sm font-medium text-white mb-2 truncate">
                                {trip.productName}
                            </p>

                            <div className="text-xs text-neutral-400">
                                <p className="truncate">{trip.from.scanLocation} → {trip.to.scanLocation}</p>
                                <p className="mt-1 opacity-70 font-mono">EPC: {trip.epcCode}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}