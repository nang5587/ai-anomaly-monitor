'use client'

import React, { useState } from "react";

import LeftFormArea from '@/components/LeftFormArea';
import RightAnimationArea from '@/components/RightAnimationArea';

export default function JoinPage() {
    const [step, setStep] = useState(1);
    const backgroundStyle: React.CSSProperties = {
        position: 'relative',
        backgroundImage: "url('/images/bgTruck.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
    };

    return (
        <main className="flex items-center justify-center w-full h-full"
            style={backgroundStyle}>
            {/* 상단 애니메이션 */}
            <div className="flex flex-col w-full max-w-2xl h-[90vh] max-h-[800px] overflow-hidden bg-white rounded-4xl">

                {/* 상단 애니메이션 (전체 높이의 25% 또는 1/4) */}
                <div className="h-1/4 w-full flex items-center justify-center">
                    <RightAnimationArea step={step} />
                </div>

                {/* 하단 폼 (전체 높이의 75% 또는 3/4) */}
                <div className="h-3/4 w-full flex items-start justify-center overflow-y-auto pt-4">
                    <LeftFormArea step={step} setStep={setStep} />
                </div>

            </div>
        </main>
    )
}