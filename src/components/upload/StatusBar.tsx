'use client';

import { useAtom } from 'jotai';
import { useState } from 'react';
import { statusBarAtom } from '@/stores/uiAtoms';
import { X, AlertTriangle, CheckCircle2, Loader, ChevronUp, ChevronDown } from 'lucide-react';

import LottieComponent from '../ui/LottieComponent';
import truckAnimation from '@/assets/lottie/truck.json'

export default function StatusBar() {
    const [statusBar, setStatusBar] = useAtom(statusBarAtom);
    const [isExpanded, setIsExpanded] = useState(true);

    if (!statusBar.visible) {
        return null;
    }

    const handleClose = () => {
        setStatusBar(prev => ({ ...prev, visible: false }));
    }

    const toggleExpansion = () => {
        setIsExpanded(prev => !prev);
    };

    const lottieStyle = {
        width: 80,
        height: 80,
    };

    const titleText = {
        'idle': '대기 중...',
        'parsing': '파일 분석 중...',
        'uploading': '파일 처리 중...',
        'success': '처리 완료',
        'error': '오류 발생'
    }[statusBar.status] || '처리 중...';


    return (
        // ✨ 2. 카드 스타일 및 위치 지정
        <div className={`fixed bottom-4 right-4 w-96 bg-[rgba(111,131,175)] border border-gray-700 rounded-lg shadow-2xl text-white transition-all duration-300 ease-in-out z-70`}>
            {/* --- 헤더: 항상 보이는 부분 --- */}
            <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                    {/* 상태 아이콘 */}
                    {(statusBar.status === 'uploading' || statusBar.status === 'parsing') &&
                        <Loader size={18} className="text-white animate-spin" />}
                    {statusBar.status === 'success' && <CheckCircle2 size={18} className="text-green-400" />}
                    {statusBar.status === 'error' && <AlertTriangle size={18} className="text-red-400" />}
                    {/* 축소 시/확장 시 다른 텍스트 표시 */}
                    <span className="font-noto-400 text-sm">
                        {titleText}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    {/* 축소/확장 버튼 */}
                    <button onClick={toggleExpansion} className="p-1 rounded-full hover:bg-white/10">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                    {/* 닫기 버튼 */}
                    {(statusBar.status === 'success' || statusBar.status === 'error') && (
                        <button onClick={handleClose} className="p-1 rounded-full hover:bg-white/10">
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* ✨ 3. 축소/확장 가능한 콘텐츠 영역 */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-3 pb-4">

                    {/* 프로그레스 바와 로티 */}
                    <div className="relative w-full pt-4"> {/* 로티가 위로 삐져나갈 공간 확보 */}
                        <div className="w-full bg-gray-600 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-500 ${statusBar.status === 'error' ? 'bg-red-500' :
                                        statusBar.status === 'success' ? 'bg-green-500' :
                                            'bg-blue-400'
                                    }`}
                                style={{ width: `${statusBar.progress * 100}%` }}
                            ></div>
                        </div>
                        <div
                            className="absolute bottom-[-15px] transition-all duration-500 ease-linear"
                            style={{
                                // ✨ 4. left와 transform으로 위치 정밀 조정
                                left: `calc(${statusBar.progress * 100}% - 40px)`, // (로티 너비 / 2) 만큼 빼서 중앙 정렬
                                opacity: statusBar.progress > 0 ? 1 : 0,
                            }}
                        >
                            <LottieComponent
                                animationData={truckAnimation}
                                loop={true}
                                autoplay={true}
                                style={lottieStyle}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}