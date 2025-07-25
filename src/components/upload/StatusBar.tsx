'use client';

import { useAtom } from 'jotai';
import { statusBarAtom } from '@/stores/uiAtoms';
import { X, AlertTriangle } from 'lucide-react';

export default function StatusBar() {
    // const statusBar = useAtomValue(statusBarAtom);
    const [statusBar, setStatusBar] = useAtom(statusBarAtom);

    if (!statusBar.visible) {
        return null;
    }

    const handleClose = () => {
        setStatusBar(prev => ({ ...prev, visible: false }));
    }

    return (
        <div className={`w-full p-3 transition-all duration-300 z-50 shadow-md ${statusBar.status === 'error' ? 'bg-red-100' :
            statusBar.status === 'success' ? 'bg-green-100' :
                'bg-blue-100'
            }`}>
            <div className="flex items-center justify-between mb-2 max-w-7xl mx-auto">
                <div className={`font-semibold flex items-center gap-2 ${statusBar.status === 'error' ? 'text-red-800' :
                    statusBar.status === 'success' ? 'text-green-800' :
                        'text-blue-800'
                    }`}>
                    {/* 상태에 따른 아이콘 */}
                    {statusBar.status === 'uploading' && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
                    {statusBar.status === 'success' && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                    {statusBar.status === 'error' && <AlertTriangle size={16} />}

                    {/* 상태에 따른 메시지 제목 */}
                    <span>
                        {statusBar.status === 'parsing' && '파일 분석 중...'}
                        {statusBar.status === 'uploading' && '파일 업로드 중...'}
                        {statusBar.status === 'success' && '업로드 성공'}
                        {statusBar.status === 'error' && '업로드 실패'}
                    </span>
                </div>
                {(statusBar.status === 'success' || statusBar.status === 'error') && (
                    <button onClick={handleClose} className="p-1 rounded-full text-gray-600 hover:bg-black/10 hover:text-black transition-colors"
                        aria-label="상태 바 닫기">
                        <X size={20} />
                    </button>
                )}
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2.5 max-w-7xl mx-auto">
                <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${statusBar.status === 'error' ? 'bg-red-500' :
                        statusBar.status === 'success' ? 'bg-green-500' :
                            'bg-blue-500'
                        }`}
                    style={{ width: `${statusBar.progress * 100}%` }}
                ></div>
            </div>

            {/* 상세 메시지 */}
            <p className="text-sm text-gray-700 mt-2 text-center max-w-7xl mx-auto truncate">
                {statusBar.message}
            </p>
        </div>
    );
}