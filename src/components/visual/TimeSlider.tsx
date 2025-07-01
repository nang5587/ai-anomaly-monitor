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

interface TimeSliderProps {
    minTime: number;
    maxTime: number;
    currentTime: number;
    isPlaying: boolean;
    onChange: (time: number) => void;
    onTogglePlay: () => void;
}

const TimeSlider: React.FC<TimeSliderProps> = ({ minTime, maxTime, currentTime, isPlaying, onChange, onTogglePlay }) => {
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
                bottom: '40px',
                left: '5%',
                right: '5%', // 오른쪽 범례와 겹치지 않도록
                padding: '15px 20px',
                color: 'white',
                fontFamily: 'sans-serif',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                gap: '20px'
            }}>
                <button className="play-pause-btn" onClick={onTogglePlay}>
                    {isPlaying ? (
                        // 일시정지 아이콘 (❚❚)
                        <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>
                    ) : (
                        // 재생 아이콘 (▶)
                        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                    )}
                </button>
                {/* <h3 style={{ margin: 0, fontSize: '16px' }}>시간 제어</h3> */}
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
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
                    <div style={{ fontSize: '12px', color: '#ccc', textAlign: 'center' }}>
                        <strong style={{ color: 'white' }}>{formatTimestamp(currentTime)}</strong>
                    </div>
            </div>
        </>
    );
};

export default TimeSlider;