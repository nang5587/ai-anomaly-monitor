'use client'

import React from 'react';
import Lottie from 'lottie-react';

interface CustomLottieProps {
    animationData: object;
    loop?: boolean;
    autoplay?: boolean;
    [key: string]: any;
}

const LottieComponent: React.FC<CustomLottieProps> = ({ animationData, loop = true, autoplay = true, style }) => {
    return (
        <Lottie
            animationData={animationData}
            loop={loop}
            autoplay={autoplay}
            style={style}
        />
    );
};

export default LottieComponent;