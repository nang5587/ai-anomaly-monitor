'use client';

import Lottie from 'lottie-react';
import animationData from '@/assets/logistics.json'; // json 경로는 실제 위치에 맞게

export default function LottieCollage() {
    return (
        <div className="w-full h-full relative">
            <Lottie
                animationData={animationData}
                loop
                autoplay
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                }}
            />
        </div>
    );
}