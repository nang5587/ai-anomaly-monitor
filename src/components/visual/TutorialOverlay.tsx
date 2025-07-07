'use client';

import { MousePointerClick, ZoomIn, Orbit } from 'lucide-react';

interface TutorialOverlayProps {
    onClose: () => void; // 닫기 함수를 prop으로 받음
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
    return (
        // 전체 화면을 덮는 반투명 배경
        <div
            onClick={onClose} // 클릭 시 닫기 함수 호출
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                zIndex: 1000, // 다른 UI 요소들 위에 보이도록 z-index를 높게 설정
                cursor: 'pointer',
                textAlign: 'center',
                fontFamily: 'sans-serif',
            }}
        >
            <div style={{ animation: 'fadeIn 1s ease-in-out' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                    맵 조작 가이드
                </h1>
                <div style={{ display: 'flex', gap: '4rem', justifyContent: 'center' }}>
                    <div style={{ maxWidth: '200px' }}>
                        <MousePointerClick size={48} style={{ margin: '0 auto 1rem' }} />
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>선택 및 이동</h3>
                        <p style={{ fontSize: '0.9rem', color: '#ccc' }}>
                            마우스 좌클릭 드래그로 맵을 이동하고, 노드나 경로를 클릭하여 상세 정보를 확인하세요.
                        </p>
                    </div>
                    <div style={{ maxWidth: '200px' }}>
                        <ZoomIn size={48} style={{ margin: '0 auto 1rem' }} />
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>확대/축소</h3>
                        <p style={{ fontSize: '0.9rem', color: '#ccc' }}>
                            마우스 휠 스크롤을 사용하여 맵을 확대하거나 축소할 수 있습니다.
                        </p>
                    </div>
                    <div style={{ maxWidth: '200px' }}>
                        <Orbit size={48} style={{ margin: '0 auto 1rem' }} />
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>회전 및 기울기</h3>
                        <p style={{ fontSize: '0.9rem', color: '#ccc' }}>
                            마우스 우클릭 또는 Ctrl + 좌클릭 드래그로 맵을 회전하고 기울기를 조절할 수 있습니다.
                        </p>
                    </div>
                </div>
                <p style={{ marginTop: '3rem', fontSize: '1rem', color: '#aaa' }}>
                    (아무 곳이나 클릭하면 이 가이드가 사라집니다)
                </p>
            </div>

            {/* 간단한 CSS 애니메이션을 위한 스타일 태그 */}
            <style jsx>{`
                @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default TutorialOverlay;