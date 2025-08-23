import React from 'react';
import LottieComponent from '@/components/ui/LottieComponent';
import loadingAnimation from '../../assets/lottie/loading.json';
import styles from './Loading.module.css';

export default function Loading () {
    return (
        <div className={styles.loadingContainer}>
            <div className={styles.lottieWrapper}>
                <LottieComponent animationData={loadingAnimation} />
            </div>
        </div>
    );
};