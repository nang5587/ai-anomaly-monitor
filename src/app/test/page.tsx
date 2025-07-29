'use client';

import { useAtom } from 'jotai';
import { statusBarAtom, StatusBarState } from '@/stores/uiAtoms'; // statusBarAtom과 타입도 가져옵니다
import StatusBar from '@/components/upload/StatusBar'; // 테스트할 StatusBar 컴포넌트

export default function StatusBarTestPage() {
    // 1. useAtom을 사용하여 Jotai 상태를 직접 읽고 쓸 수 있게 합니다.
    const [statusBar, setStatusBar] = useAtom(statusBarAtom);

    // --- UI 컨트롤을 위한 핸들러 함수들 ---

    // 상태(status)를 변경하는 함수
    const handleStatusChange = (status: StatusBarState['status']) => {
        setStatusBar(prev => ({ ...prev, status, visible: true }));
    };

    // 진행률(progress)을 변경하는 함수
    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const progress = Number(e.target.value) / 100; // 슬라이더 값(0~100)을 0~1로 변환
        setStatusBar(prev => ({ ...prev, progress, visible: true }));
    };

    // 메시지(message)를 변경하는 함수
    const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStatusBar(prev => ({ ...prev, message: e.target.value, visible: true }));
    };

    // 상태 바를 숨기는 함수
    const hideStatusBar = () => {
        setStatusBar(prev => ({ ...prev, visible: false }));
    }

    return (
        // main 태그에 패딩을 줘서 앱의 기본 헤더에 가려지지 않게 합니다.
        <main className="p-8">
            {/* 2. StatusBar 컴포넌트를 여기에 렌더링하여 실시간으로 확인합니다. */}
            <StatusBar />

            <div className="mt-16 max-w-2xl mx-auto bg-gray-100 p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-6 text-center">StatusBar 테스트 컨트롤러</h1>

                {/* --- 상태(status) 변경 버튼 --- */}
                <div className="mb-6">
                    <h2 className="font-semibold mb-2">상태 (Status) 변경</h2>
                    <div className="flex gap-4">
                        <button onClick={() => handleStatusChange('uploading')} className="px-4 py-2 bg-blue-500 text-white rounded">Uploading</button>
                        <button onClick={() => handleStatusChange('success')} className="px-4 py-2 bg-green-500 text-white rounded">Success</button>
                        <button onClick={() => handleStatusChange('error')} className="px-4 py-2 bg-red-500 text-white rounded">Error</button>
                    </div>
                </div>

                {/* --- 진행률(progress) 변경 슬라이더 --- */}
                <div className="mb-6">
                    <label htmlFor="progress" className="font-semibold mb-2 block">
                        진행률 (Progress): {Math.round(statusBar.progress * 100)}%
                    </label>
                    <input
                        type="range"
                        id="progress"
                        min="0"
                        max="100"
                        value={statusBar.progress * 100}
                        onChange={handleProgressChange}
                        className="w-full"
                    />
                </div>

                {/* --- 메시지(message) 변경 입력 필드 --- */}
                <div className="mb-6">
                    <label htmlFor="message" className="font-semibold mb-2 block">
                        메시지 (Message)
                    </label>
                    <input
                        type="text"
                        id="message"
                        value={statusBar.message}
                        onChange={handleMessageChange}
                        className="w-full p-2 border rounded"
                        placeholder="표시할 메시지를 입력하세요"
                    />
                </div>

                {/* --- 보이기/숨기기 버튼 --- */}
                <div>
                    <h2 className="font-semibold mb-2">보이기 / 숨기기</h2>
                    <button onClick={hideStatusBar} className="px-4 py-2 bg-gray-500 text-white rounded">
                        StatusBar 숨기기
                    </button>
                </div>
            </div>
        </main>
    );
}