// app/signup/components/RightAnimationArea.tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';

interface RightAnimationAreaProps {
    step: number;
}

// [추가] 각 정류장의 좌표를 상수로 정의하여 관리하기 쉽게 만듭니다.
const stations = [
    { x: 100, y: 300 }, // 1단계 (출발)
    { x: 300, y: 300 }, // 2단계
    { x: 500, y: 300 }, // 3단계
    { x: 700, y: 300 }, // 4단계 (도착)
];

export default function RightAnimationArea({ step }: RightAnimationAreaProps) {
    const pathRef = useRef<SVGPathElement>(null);
    const [truckPosition, setTruckPosition] = useState({ x: 0, y: 0, angle: 0 });

    useEffect(() => {
        const pathElement = pathRef.current;
        if (!pathElement) return;

        const pathLength = pathElement.getTotalLength();
        if (pathLength === 0) return;

        // [수정] step에 따라 트럭이 정확히 각 정류장에 멈추도록 progress를 수정합니다.
        let progress = 0;
        switch (step) {
            case 1: progress = 0; break;      // 0% 지점 (첫 번째 정류장)
            case 2: progress = 1 / 3; break;  // 33.3% 지점 (두 번째 정류장)
            case 3: progress = 2 / 3; break;  // 66.6% 지점 (세 번째 정류장)
            case 4: progress = 1; break;      // 100% 지점 (마지막 정류장)
            default: progress = 0;
        }

        const distance = pathLength * progress;
        const currentPoint = pathElement.getPointAtLength(distance);

        // 각도 계산을 위한 이전 지점 (마지막 지점에서는 뒤로 약간 물러서서 각도 계산)
        const prevDistance = (progress === 1) ? distance - 1 : Math.max(0, distance - 1);
        const prevPoint = pathElement.getPointAtLength(prevDistance);

        const angle = Math.atan2(currentPoint.y - prevPoint.y, currentPoint.x - prevPoint.x) * (180 / Math.PI);

        setTruckPosition({
            x: currentPoint.x,
            y: currentPoint.y,
            angle: angle,
        });

    }, [step]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative">
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 800 600"
                preserveAspectRatio="xMidYMid meet"
                className="overflow-visible"
            >
                {/* --- [수정] 보이는 길 (Visual Path) --- */}
                {/* 1. 정류장 사이를 잇는 회색 실선들 */}
                {stations.slice(0, -1).map((station, index) => (
                    <line
                        key={`line-${index}`}
                        x1={station.x}
                        y1={station.y}
                        x2={stations[index + 1].x}
                        y2={stations[index + 1].y}
                        stroke="#e0e0e0"
                        strokeWidth="5"
                    />
                ))}

                {/* 2. 각 정류장을 나타내는 원들 */}
                {stations.map((station, index) => (
                    <circle
                        key={`circle-${index}`}
                        cx={station.x}
                        cy={station.y}
                        r="20"
                        fill={step > index ? '#3B82F6' : '#e0e0e0'} // 현재 단계까지는 파란색으로 채움
                        stroke="#ffffff"
                        strokeWidth="3"
                        style={{ transition: 'fill 0.5s ease' }}
                    />
                ))}
                {/* ------------------------------------ */}


                {/* --- [수정] 트럭이 실제로 따라가는 보이지 않는 경로 (Animation Path) --- */}
                <path
                    ref={pathRef}
                    // stations 좌표를 이용해 'M(시작점 이동) L(선 긋기) L(선 긋기)...' 형태로 경로 생성
                    d={`M ${stations[0].x} ${stations[0].y} ${stations.slice(1).map(s => `L ${s.x} ${s.y}`).join(' ')}`}
                    fill="none"
                    stroke="none" // 눈에 보이지 않도록 stroke 없음
                />
                {/* ----------------------------------------------------------------- */}

                {/* 트럭 (foreignObject) */}
                <foreignObject
                    x={truckPosition.x - 75}
                    y={truckPosition.y - 75}
                    width="150"
                    height="150"
                    // transform={`rotate(${truckPosition.angle} ${truckPosition.x} ${truckPosition.y})`}
                    style={{
                        transition: 'x 1.2s ease-in-out, y 1.2s ease-in-out, transform 1.2s ease-in-out',
                    }}
                >
                    <Image src="/images/truck2.png" alt="Truck" width={150} height={150} priority />
                </foreignObject>
            </svg>

            {/* 안내 문구 */}
            <div className="absolute bottom-10 text-center w-full">
                <p className="text-lg font-semibold text-gray-700">
                    {step === 4 ? "회원가입을 축하합니다!" : `목적지까지 ${4 - step}단계 남았습니다.`}
                </p>
            </div>
        </div>
    );
}