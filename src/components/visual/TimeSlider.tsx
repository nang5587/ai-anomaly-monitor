import { useState } from "react";

import type { AnalyzedTrip, AnomalyType } from "./data";
import { getAnomalyColor, getAnomalyName } from "./colorUtils";

const SIMULATION_START_DATE = new Date('2025-02-17T00:00:00Z');
const TIME_UNIT_IN_HOURS = 1;

// 숫자 타임스탬프를 'YYYY-MM-DD HH:mm' 형식으로 변환하는 함수
const formatTimestamp = (time: number): string => {
    const date = new Date(SIMULATION_START_DATE);
    date.setHours(date.getHours() + time * TIME_UNIT_IN_HOURS);
    return date.toLocaleString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
    }).replace(/\. /g, '-').replace('.', '');
};

type TripWithId = AnalyzedTrip & { id: string };

interface TimeSliderProps {
    minTime: number;
    maxTime: number;
    currentTime: number;
    isPlaying: boolean;
    onChange: (time: number) => void;
    onTogglePlay: () => void;
    anomalies: TripWithId[];
    onMarkerClick: (trip: TripWithId) => void;
}

type TooltipInfo = {
    trip: AnalyzedTrip;
    top: number;
    left: number;
};

const pastelColorMap: { [key: string]: string } = {
    'jump': '#D7BDE2',      // 연한 라벤더
    'evtOrderErr': '#FAD7A0', // 부드러운 살구
    'epcFake': '#F5B7B1',     // 매우 연한 핑크
    'epcDup': '#FCF3CF',      // 부드러운 크림
    'locErr': '#A9CCE3',      // 매우 연한 하늘색
    'default': '#E5E7E9',     // 연한 회색
};

const TimeSlider: React.FC<TimeSliderProps> = ({ minTime, maxTime, currentTime, isPlaying, onChange, onTogglePlay, anomalies,
    onMarkerClick, }) => {
    const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

    const duration = maxTime - minTime;

    const renderTooltip = () => {
        if (!tooltip) return null;

        const { anomalyTypeList } = tooltip.trip;
        const hasAnomalies = anomalyTypeList && anomalyTypeList.length > 0;

        // 대표 색상은 첫 번째 이상 유형으로 결정
        const representativeColor = hasAnomalies ? pastelColorMap[anomalyTypeList[0]] : pastelColorMap['default'];
        const bgColor = `${representativeColor}26`;
        const textColor = representativeColor;

        return (
            <div style={{
                position: 'fixed', top: tooltip.top, left: tooltip.left,
                transform: 'translate(-50%, -120%)', backgroundColor: bgColor, color: textColor,
                padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                pointerEvents: 'none', zIndex: 100, whiteSpace: 'nowrap',
                border: `1px solid ${representativeColor}80`, backdropFilter: 'blur(4px)',
            }}>
                {/* 여러 이상 유형의 이름을 쉼표로 구분하여 표시 */}
                {hasAnomalies ? anomalyTypeList.map(getAnomalyName).join(', ') : '정상'}
            </div>
        );
    };

    // ✨ 여러 색상을 가진 파이 차트 형태의 마커를 생성하는 컴포넌트
    const AnomalyMarker = ({ anomalyTypes }: { anomalyTypes: AnomalyType[] }) => {
        if (!anomalyTypes || anomalyTypes.length === 0) {
            return <div style={{ width: '12px', height: '12px', background: pastelColorMap['default'], borderRadius: '50%' }} />;
        }
        if (anomalyTypes.length === 1) {
            return <div style={{ width: '12px', height: '12px', background: pastelColorMap[anomalyTypes[0]], borderRadius: '50%' }} />;
        }

        // 여러 색상을 conic-gradient로 표현
        const colorStops = anomalyTypes.map((type, index) => {
            const startAngle = (index / anomalyTypes.length) * 360;
            const endAngle = ((index + 1) / anomalyTypes.length) * 360;
            return `${pastelColorMap[type]} ${startAngle}deg ${endAngle}deg`;
        });

        return (
            <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: `conic-gradient(${colorStops.join(', ')})`,
            }} />
        );
    };
    return (
        <>
            <style jsx global>{`
                /* 커스텀 슬라이더 스타일 */
                .time-slider {
                    -webkit-appearance: none;
                    width: 100%;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 5px;
                    outline: none;
                    transition: opacity .2s;
                }
                .time-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 15px;
                    height: 15px;
                    background: #fff;
                    border-radius: 50%;
                    cursor: pointer;
                }
                .time-slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    background: #fff;
                    border: 2px solid #007bff;
                    border-radius: 50%;
                    cursor: pointer;
                }
                .play-pause-btn svg {
                    width: 25px;
                    height: 25px;
                    fill: white;
                    cursor: pointer;
                }
            `}</style>
            <div style={{
                position: 'absolute',
                bottom: '30px',
                left: '1%',
                right: '1%', // 오른쪽 범례와 겹치지 않도록
                padding: '15px 20px',
                color: 'white',
                fontFamily: 'sans-serif',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                background: 'rgba(40, 40, 40)', // 배경 추가
                backdropFilter: 'blur(10px)',       // 블러 효과 추가
                borderRadius: '25px',
            }}>
                <button className="play-pause-btn" onClick={onTogglePlay}>
                    {isPlaying ? (
                        <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>
                    ) : (
                        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                    )}
                </button>

                {/* ✨ 5. 마커와 슬라이더를 담을 컨테이너 */}
                <div style={{ flexGrow: 1, position: 'relative', height: '15px', display: 'flex', alignItems: 'center' }}>

                    {/* ✨ 6. 마커들을 렌더링하는 부분 */}
                    {anomalies.map(trip => {
                        const positionPercent = ((trip.from.eventTime - minTime) / duration) * 100;
                        return (
                            <div
                                key={trip.id}
                                style={{
                                    position: 'absolute', top: '50%', left: `${positionPercent}%`,
                                    transform: 'translate(-50%, -50%)', cursor: 'pointer', zIndex: 1,
                                }}
                                onClick={() => onMarkerClick(trip)}
                                onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setTooltip({ trip, top: rect.top, left: rect.left + rect.width / 2 });
                                }}
                                onMouseLeave={() => setTooltip(null)}
                            >
                                <AnomalyMarker anomalyTypes={trip.anomalyTypeList} />
                            </div>
                        );
                    })}

                    <input
                        type="range"
                        className="time-slider"
                        min={minTime}
                        max={maxTime}
                        step={1}
                        value={currentTime}
                        onChange={e => onChange(Number(e.target.value))}
                    />
                </div>
                <div style={{ fontSize: '12px', color: '#ccc', textAlign: 'center', minWidth: '130px' }}>
                    <strong style={{ color: 'white' }}>{formatTimestamp(currentTime)}</strong>
                </div>
            </div>

            {renderTooltip()}
        </>
    );
};

export default TimeSlider;