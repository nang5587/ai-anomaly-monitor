'use client'

import ImageCollage from '@/components/ImageCollage';
import AuthSection from '@/components/AuthSection';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

  return (
    <main className="flex w-full h-full">
      {/* 왼쪽: 비주얼 영역 */}
      <div className="w-1/3 h-full">
        <ImageCollage />
      </div>

      {/* 오른쪽: 인증/설명 영역 */}
      <div className="w-2/3 h-full flex items-center justify-center">
        <AuthSection />
      </div>
    </main>
  );
}