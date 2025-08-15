'use client';

import Lottie from 'lottie-react';
import animationData from '@/assets/logistics.json';

export default async function LottieCollage() {
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