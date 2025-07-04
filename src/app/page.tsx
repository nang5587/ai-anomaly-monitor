'use client'

import LottieCollage from '@/components/LottieCollage';
import AuthSection from '@/components/AuthSection';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  function LoadingScreen() {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <p className="text-lg">불러오는 중...</p>
        {/* 여기에 스피너 아이콘 등을 추가할 수 있습니다. */}
      </div>
    );
  }

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

    if (token) {
      router.replace('/dashboard');
    }
    else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const collageVariants: Variants = {
    initial: {
      // 화면 정중앙 위치
      x: '50vw',
      y: '50vh',
      translateX: '-50%',
      translateY: '-50%',
      scale: 1.5,
      opacity: 0,
    },
    animate: {
      // 원래 위치로 이동
      x: 0,
      y: 0,
      translateX: 0,
      translateY: 0,
      // ✨ 원래 크기(1)로 축소
      scale: 1,
      opacity: 1,
      transition: {
        duration: 2.2,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.2,
      },
    },
  };

  const authVariants: Variants = {
    initial: {
      opacity: 0,
      x: 100,
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 1.2,
        ease: "easeOut",
        delay: 1.2,
      }
    }
  }

  return (
    <main className="flex flex-col lg:flex-row min-h-screen w-full h-full bg-black overflow-y-auto hide-scrollbar">
      {/* 왼쪽: 비주얼 영역 */}
      <motion.div
        className="w-full lg:w-1/2 h-96 lg:h-screen"
        variants={collageVariants}
        initial="initial"
        animate="animate"
      >
        <LottieCollage />
      </motion.div>

      {/* 오른쪽: 인증/설명 영역 */}
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