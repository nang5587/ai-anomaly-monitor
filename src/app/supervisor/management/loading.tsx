import React from 'react';
import LottieComponent from '@/components/ui/LottieComponent';
import loadingAnimation from '@/assets/lottie/loading.json';
import styles from '@/components/ui/Loading.module.css';

const Loading: React.FC = () => {
    return (
        <div className={styles.loadingContainer}>
            <div className={styles.lottieWrapper}>
                <LottieComponent animationData={loadingAnimation} />
            </div>
        </div>
    );
};

export default Loading;