'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';

interface RightAnimationAreaProps {
    step: number;
}

const stations = [
    { x: 100, y: 300 },
    { x: 300, y: 300 }, 
    { x: 500, y: 300 }, 
    { x: 700, y: 300 }, 
];

export default function RightAnimationArea({ step }: RightAnimationAreaProps) {
    const pathRef = useRef<SVGPathElement>(null);
    const [truckPosition, setTruckPosition] = useState({ x: 0, y: 0, angle: 0 });

    useEffect(() => {
        const pathElement = pathRef.current;
        if (!pathElement) return;

        const pathLength = pathElement.getTotalLength();
        if (pathLength === 0) return;
        let progress = 0;
        switch (step) {
            case 1: progress = 0; break;    
            case 2: progress = 1 / 3; break;  
            case 3: progress = 2 / 3; break;  
            case 4: progress = 1; break;      
            default: progress = 0;
        }
        const distance = pathLength * progress;
        const currentPoint = pathElement.getPointAtLength(distance);
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
                {stations.map((station, index) => (
                    <circle
                        key={`circle-${index}`}
                        cx={station.x}
                        cy={station.y}
                        r="20"
                        fill={step > index ? '#3B82F6' : '#e0e0e0'}
                        stroke="#ffffff"
                        strokeWidth="3"
                        style={{ transition: 'fill 0.5s ease' }}
                    />
                ))}
                <path
                    ref={pathRef}
                    d={`M ${stations[0].x} ${stations[0].y} ${stations.slice(1).map(s => `L ${s.x} ${s.y}`).join(' ')}`}
                    fill="none"
                    stroke="none"
                />
                <foreignObject
                    x={truckPosition.x - 75}
                    y={truckPosition.y - 75}
                    width="150"
                    height="150"
                    style={{
                        transition: 'x 1.2s ease-in-out, y 1.2s ease-in-out, transform 1.2s ease-in-out',
                    }}
                >
                    <Image src="/images/truck2.png" alt="Truck" width={150} height={150} priority />
                </foreignObject>
            </svg>
            <div className="absolute bottom-10 text-center w-full">
                <p className="text-lg font-semibold text-gray-700">
                    {step === 4 ? "회원가입을 축하합니다!" : `목적지까지 ${4 - step}단계 남았습니다.`}
                </p>
            </div>
        </div>
    );
}