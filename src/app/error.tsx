'use client'; // error.tsx는 반드시 클라이언트 컴포넌트

import { useEffect } from 'react';
import type { ErrorPageProps } from '@/types/error';
import { AlertTriangle, RotateCw } from 'lucide-react';

/**
 * 프로젝트 전체의 에러를 처리하는 전역 에러 바운더리입니다.
 * 특정 경로에 error.tsx가 없을 경우 이 컴포넌트가 사용됩니다.
 */
export default function GlobalError({ error, reset }: ErrorPageProps) {

    useEffect(() => {
        // 2. 에러 리포팅 서비스(Sentry 등)에 에러 정보를 전송할 수 있습니다.
        // console.error는 서버 로그에도 기록되므로 중요합니다.
        console.error("Global Error Boundary Caught:", error);
    }, [error]);

    return (
        <main className="w-full h-full flex items-center justify-center auto bg-[rgba(40,40,40)] text-white overflow-y-auto hide-scrollbar">
            <div className="text-center p-8 max-w-lg w-full mx-4">
                <div className="flex justify-center mb-6">
                    <div className="bg-rose-500 bg-opacity-20 p-4 rounded-full">
                        <AlertTriangle className="w-12 h-12 text-white" />
                    </div>
                </div>

                <h1 className="text-4xl font-bold text-white mb-4">
                    오류가 발생했습니다
                </h1>

                <p className="text-lg text-gray-300 mb-8">
                    서비스 이용에 불편을 드려 죄송합니다. <br />
                    문제가 지속될 경우 관리자에게 문의해주세요.
                </p>

                {/* 
                `3. 개발 환경에서만 구체적인 에러 메시지를 보여줍니다.
                    프로덕션 환경에서는 보안을 위해 상세 에러를 노출하지 않습니다.
                */}
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
                        onClick={() => reset()} // 4. '다시 시도' 버튼
                        className="flex items-center gap-2 px-6 py-3 bg-[rgba(111,131,175)] hover:bg-[rgba(101,121,165)] cursor-pointer rounded-md text-white font-semibold transition-colors"
                    >
                        <RotateCw size={18} />
                        다시 시도
                    </button>
                    <a
                        href="/" // 5. '홈으로' 버튼
                        className="px-6 py-3 bg-[rgba(130,130,130)] hover:bg-[rgba(120,120,120)] rounded-md text-white font-semibold transition-colors"
                    >
                        홈으로 이동
                    </a>
                </div>
            </div>
        </main>
    );
}