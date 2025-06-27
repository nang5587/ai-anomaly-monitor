'use client';

import { useState, useEffect } from 'react';
// ✅ 1. framer-motion에서 Variants 타입을 import 합니다.
import { motion, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';

import { FaCheck } from "react-icons/fa6";

// ✅ 2. fadeInUp 변수에 Variants 타입을 명시해줍니다.
const fadeInUp: Variants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.6,
            // 이제 TypeScript는 ease에 들어갈 수 있는 값을 알고 있으므로 에러가 발생하지 않습니다.
            ease: 'easeOut',
        },
    },
};

export default function AuthSection() {
    const [showButtons, setShowButtons] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowButtons(true);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleLogin = () => {
        router.push('/login');
    };

    const handleSignup = () => {
        alert('회원가입 기능은 준비 중입니다.');
    };

    return (
        <div className="w-full flex flex-col items-center gap-20 text-center">
            {/* 소개글 섹션 */}
            <motion.div
                className="w-full max-w-xl"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
            >
                <h1 className="text-4xl font-bold mb-10 text-gray-800 whitespace-nowrap">
                    투명한 공급망, 신뢰를 스캔하다.
                </h1>
                <p className="text-lg my-4 text-gray-600 whitespace-nowrap text-center">
                    2차원 바코드와 AI 분석으로 보이지 않던 유통 경로의 빈틈을 찾아냅니다.
                    <br />
                    데이터로 브랜드 가치를 보호하고 비즈니스를 성장시키세요.
                </p>
                <p className="text-lg font-bold mb-4 text-gray-600 whitespace-nowrap text-center">
                    <span className='flex justify-center items-center'><FaCheck/>&nbsp;실시간 유통 경로 추적</span><br />
                    <span className='flex justify-center items-center'><FaCheck/>&nbsp;AI 기반 이상 패턴 탐지</span><br />
                    <span className='flex justify-center items-center'><FaCheck/>&nbsp;직관적인 데이터 시각화 대시보드</span><br />
                    <span className='flex justify-center items-center'><FaCheck/>&nbsp;간편한 바코드 인증</span>
                </p>
            </motion.div>

            {/* 버튼 섹션 */}
            <motion.div
                className="flex flex-col items-center gap-4 w-full max-w-xl"
                variants={fadeInUp}
                initial="hidden"
                animate={showButtons ? 'visible' : 'hidden'}
            >
                <h2 className="text-xl font-semibold mb-2 whitespace-nowrap">시작할 준비가 되셨나요?</h2>
                <div className='flex gap-4 w-full'>
                    <button
                        className="w-full whitespace-nowrap bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                        onClick={handleLogin}
                    >
                        로그인
                    </button>
                    <button
                        className="w-full whitespace-nowrap bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                        onClick={handleSignup}
                    >
                        회원가입
                    </button>
                </div>
            </motion.div>
        </div>
    );
}