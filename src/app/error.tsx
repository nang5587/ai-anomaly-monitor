'use client'

import { useEffect } from 'react';
import type { ErrorPageProps } from '@/types/error';
import { AlertTriangle, RotateCw } from 'lucide-react';

import LottieComponent from '../components/ui/LottieComponent';
import lottieError from '../assets/lottie/error.json';

export default function GlobalError({ error, reset }: ErrorPageProps) {

    useEffect(() => {
        console.error("Global Error Boundary Caught:", error);
    }, [error]);

    return (
        <main className="w-full h-full flex items-center justify-center auto bg-[rgba(40,40,40)] text-white overflow-y-auto hide-scrollbar">
            <div className="text-center p-8 max-w-lg w-full mx-4">
                <div className="flex justify-center mb-6">
                        <LottieComponent animationData={lottieError} />
                </div>

                <h1 className="text-4xl font-bold text-white mb-4">
                    오류가 발생했습니다
                </h1>

                <p className="text-lg text-gray-300 mb-8">
                    서비스 이용에 불편을 드려 죄송합니다. <br />
                    문제가 지속될 경우 관리자에게 문의해주세요.
                </p>

                {process.env.NODE_ENV === 'development' && (
                    <details className="text-left bg-[rgba(30,30,30)] p-4 rounded-md mb-8">
                        <summary className="cursor-pointer text-[#E0E0E0] font-semibold">에러 상세 정보 (개발용)</summary>
                        <pre className="mt-2 text-xs text-gray-300 whitespace-pre-wrap overflow-auto">
                            {error.message}
                            {error.digest && `\n\nDigest: ${error.digest}`}
                            {error.stack && `\n\nStack Trace:\n${error.stack}`}
                        </pre>
                    </details>
                )}

                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => reset()}
                        className="flex items-center gap-2 px-6 py-3 bg-[rgba(111,131,175)] hover:bg-[rgba(101,121,165)] cursor-pointer rounded-md text-white font-semibold transition-colors"
                    >
                        <RotateCw size={18} />
                        다시 시도
                    </button>
                    <a
                        href="/"
                        className="px-6 py-3 bg-[rgba(130,130,130)] hover:bg-[rgba(120,120,120)] rounded-md text-white font-semibold transition-colors"
                    >
                        홈으로 이동
                    </a>
                </div>
            </div>
        </main>
    );
}