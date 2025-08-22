import React, { useEffect, useState } from 'react';

// Props 타입 정의
type GaugeChartProps = {
    progress?: number;
    size?: number;
    strokeWidth?: number;
    segments?: number;
    segmentGap?: number;
    bgColor?: string;
    // 그라데이션을 위해 색상 props를 두 개로 확장
    gradientFrom?: string;
    gradientTo?: string;
};

const GaugeChart: React.FC<GaugeChartProps> = ({
    progress = 0,
    size = 300, // 기본 크기를 키워 디자인이 잘 보이도록 함
    strokeWidth = 30, // 기본 두께를 키움
    segments = 30,
    segmentGap = 5,
    bgColor = "#374151", // 배경색을 조금 더 어둡게
    gradientFrom = "#a78bfa", // 연한 보라
    gradientTo = "#6366f1", // 진한 인디고
}) => {
    // React 18+ useId로 고유 ID 생성 (그라데이션, 필터 등에 사용)
    const uniqueId = React.useId();
    const gradientId = `gauge-gradient-${uniqueId}`;
    const filterId = `gauge-shadow-${uniqueId}`;

    // 세로형에 맞는 크기 및 경로 계산
    const height = size;
    const width = size / 2;
    const radius = height / 2 - strokeWidth / 2;

    // 시작점, 끝점 좌표
    const startY = strokeWidth / 2;
    const endY = height - strokeWidth / 2;
    const startX = strokeWidth / 2;

    // 세로형 반원 경로(path) 데이터
    // sweep-flag를 1에서 0으로 변경하여 아크 방향을 반전시킵니다.
    const arcPath = `M ${startX},${endY} A ${radius},${radius} 0 0 0 ${startX},${startY}`;

    // 경로의 전체 길이를 계산
    const [pathLength, setPathLength] = React.useState(0);
    const pathRef = React.useRef<SVGPathElement>(null);

    React.useLayoutEffect(() => {
        if (pathRef.current) {
            setPathLength(pathRef.current.getTotalLength());
        }
    }, [size, strokeWidth]);

    // 세그먼트 계산
    const totalGapLength = segmentGap * (segments - 1);
    const totalDashLength = pathLength - totalGapLength;
    const dashLength = totalDashLength / segments;
    const strokeDasharray = pathLength > 0 ? `${dashLength} ${segmentGap}` : 'none';

    // 진행률에 따른 stroke-dashoffset 계산
    const progressOffset = pathLength * (1 - progress / 100);

    return (
        <div style={{ position: 'relative', width: width, height: height }}>
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                style={{ overflow: 'visible' }} // 그림자 효과가 잘리지 않도록
            >
                {/* SVG 효과 정의 섹션 */}
                <defs>
                    {/* 그라데이션 정의 */}
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={gradientTo} />
                        <stop offset="100%" stopColor={gradientFrom} />
                    </linearGradient>

                    {/* 그림자(Glow) 필터 정의 */}
                    <filter id={filterId}>
                        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={gradientTo} floodOpacity="0.7" />
                    </filter>
                </defs>

                {/* 1. 배경 트랙 (세그먼트) */}
                <path
                    ref={pathRef}
                    d={arcPath}
                    fill="none"
                    stroke={bgColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeLinecap="round"
                />

                {/* 2. 진행률 막대 (그라데이션 + 그림자) - 이 막대를 마스킹하여 진행률 표현 */}
                {pathLength > 0 && (
                    <path
                        d={arcPath}
                        fill="none"
                        stroke={`url(#${gradientId})`}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={pathLength}
                        strokeDashoffset={progressOffset} // 핵심: 이 값으로 진행률을 표현
                        filter={`url(#${filterId})`}
                        style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                    />
                )}

                {/* 3. 시작점/끝점 마커 */}
                <circle cx={startX} cy={startY} r={strokeWidth / 4} fill={bgColor} />
                <circle cx={startX} cy={endY} r={strokeWidth / 4} fill={bgColor} />
            </svg>

            {/* 텍스트 위치 */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    color: '#FFFFFF',
                    textShadow: '0 0 5px rgba(0,0,0,0.5)', // 텍스트 가독성 향상
                }}
            >
                <span style={{ fontSize: '2.5rem', fontWeight: '600' }}>
                    {progress.toFixed(2)}%
                </span>
            </div>
        </div>
    );
};

export default GaugeChart;