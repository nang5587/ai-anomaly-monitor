'use client';

import { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';

import { CheckCheck, ActivitySquare, ScanBarcode, Radar } from 'lucide-react';

const fadeInUp: Variants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.6,
            ease: 'easeOut',
            staggerChildren: 0.15,
            delayChildren: 0.2,
        },
    },
};

export default function AuthSection() {
    const [showButtons, setShowButtons] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => setShowButtons(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleLogin = () => router.push('/login');
    const handleSignup = () => router.push('/join');

    return (
        <div className="relative w-2/3 h-full px-8 py-12 rounded-3xl backdrop-blur-m shadow-2xl text-center flex flex-col items-center justify-center gap-12">
            <motion.div
                className="w-full"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
            >
                <h1 className="text-4xl sm:text-5xl lg:text-[60px] font-bold bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent whitespace-nowrap font-noto-500 text-left">
                    투명한 공급망,<br />신뢰를 스캔하다.
                </h1>
            </motion.div>
            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
            >
                {[
                    { icon: <Radar size={24} />, text: '유통 경로 추적' },
                    { icon: <ActivitySquare size={24} />, text: 'AI 기반 이상 패턴 탐지' },
                    { icon: <CheckCheck size={24} />, text: '데이터 시각화 대시보드' },
                    { icon: <ScanBarcode size={24} />, text: '간편한 바코드 인증' },
                ].map((item, idx) => (
                    <motion.div
                        key={idx}
                        className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white font-noto-400"
                        variants={fadeInUp}
                    >
                        {item.icon}
                        <span className="text-white text-sm sm:text-base">{item.text}</span>
                    </motion.div>
                ))}
            </motion.div>
            <motion.div
                className="w-full flex flex-col items-start gap-4"
                variants={fadeInUp}
                initial="hidden"
                animate={showButtons ? 'visible' : 'hidden'}
            >
                <h2 className="text-white text-xl font-noto-400 mb-2">시작할 준비가 되셨나요?</h2>
                <div className="flex gap-4 w-full md:w-1/2 font-noto-400 text-lg">
                    <button
                        onClick={handleLogin}
                        className="w-full flex items-center justify-center gap-2 bg-[rgba(111,131,175)] hover:bg-[rgba(101,121,165)] 
                                text-white py-2 px-3 rounded-xl shadow-md transition-all duration-200 whitespace-nowrap cursor-pointer"
                    >
                        로그인
                    </button>
                    <button
                        onClick={handleSignup}
                        className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 
                                text-gray-900 py-2 px-2 rounded-xl shadow-md transition-all duration-200 whitespace-nowrap cursor-pointer"
                    >
                        회원가입
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
