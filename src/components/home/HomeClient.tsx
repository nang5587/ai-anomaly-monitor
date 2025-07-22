'use client';

import { motion, type Variants } from 'framer-motion';
import LottieCollage from '@/components/LottieCollage';
import AuthSection from '@/components/AuthSection';

export default function HomeClient() {
    const collageVariants: Variants = {
        initial: { x: '50vw', y: '50vh', translateX: '-50%', translateY: '-50%', scale: 1.5, opacity: 0 },
        animate: { x: 0, y: 0, translateX: 0, translateY: 0, scale: 1, opacity: 1, transition: { duration: 2.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 } },
    };

    const authVariants: Variants = {
        initial: { opacity: 0, x: 100 },
        animate: { opacity: 1, x: 0, transition: { duration: 1.2, ease: "easeOut", delay: 1.2 } }
    };

    return (
        <main className="flex flex-col lg:flex-row min-h-screen w-full h-full bg-black overflow-y-auto hide-scrollbar">
            <motion.div
                className="w-full lg:w-1/2 h-96 lg:h-screen"
                variants={collageVariants}
                initial="initial"
                animate="animate"
            >
                <LottieCollage />
            </motion.div>
            <motion.div
                className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-0"
                variants={authVariants}
                initial="initial"
                animate="animate"
            >
                <AuthSection />
            </motion.div>
        </main>
    );
}