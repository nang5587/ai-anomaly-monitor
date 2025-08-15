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
        <div className={`fixed bottom-10 right-4 w-96 bg-[rgba(111,131,175)] rounded-lg shadow-2xl text-white transition-all duration-300 ease-in-out z-70`}>
            <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                    {(statusBar.status === 'uploading' || statusBar.status === 'parsing') &&
                        <Loader size={18} className="text-white animate-spin" />}
                    {statusBar.status === 'success' && <CheckCircle2 size={18} className="text-green-400" />}
                    {statusBar.status === 'error' && <AlertTriangle size={18} className="text-red-400" />}
                    <span className="font-noto-400 text-sm">
                        {titleText}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={toggleExpansion} className="p-1 rounded-full hover:bg-white/10">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                    {(statusBar.status === 'success' || statusBar.status === 'error') && (
                        <button onClick={handleClose} className="p-1 rounded-full hover:bg-white/10">
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-3 pb-4">
                    {statusBar.message && (
                        <div className={`text-sm p-3 rounded-md ${statusBar.status === 'error' ? 'bg-red-500/20 text-white' : 'bg-white/20 text-white'}`}>
                            <p>{statusBar.message}</p>
                        </div>
                    )}
                    <div className="relative w-full pt-4">
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
                                left: `calc(${statusBar.progress * 100}% - 60px)`,
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