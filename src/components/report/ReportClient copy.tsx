"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import html2pdf from "html2pdf.js";

import { FileItem } from '@/types/file';
import ReportView from "./ReportView";

interface ReportClientProps {
    initialFiles: FileItem[];

}

export const formatDateTime = (dateString: string | undefined | null): string => {
    if (!dateString) {
        return '-'; // 날짜가 없을 경우 대체 텍스트
    }

    try {
        const date = new Date(dateString);

        // toLocaleString을 사용하여 한국 시간 및 형식으로 변환
        return date.toLocaleString('ko-KR', {
            year: 'numeric',   // 예: 2025
            month: '2-digit',  // 예: 07
            day: '2-digit',    // 예: 27
            hour: '2-digit',   // 예: 오후 10
            minute: '2-digit', // 예: 50
            hour12: true,      // 12시간제 사용 (오전/오후)
        });
    } catch (error) {
        console.error("날짜 형식 변환 실패:", dateString, error);
        return '날짜 오류'; // 유효하지 않은 날짜 형식일 경우
    }
};

export default function ReportClient({ initialFiles }: ReportClientProps) {
    const reportContentRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (isAuthLoading) return;

        if (!user) {
            alert("로그인이 필요합니다.");
            router.push('/login');
            return;
        }
    }, [user, isAuthLoading, router]);

    const selectedFileId = searchParams.get('fileId')
        ? Number(searchParams.get('fileId'))
        : initialFiles[0]?.fileId || null;

    const [files] = useState<FileItem[]>(initialFiles);

    const handleFileSelect = (fileId: number) => {
        if (!user) {
            alert("로그인 정보가 필요합니다.");
            return;
        }
        let role = '';
        if (user.role.toUpperCase() === 'ADMIN') {
            role = 'supervisor';
        } else if (user.role.toUpperCase() === 'MANAGER') {
            role = 'admin';
        }
        router.push(`/${role}/report?fileId=${fileId}`);
    };

    const handleDownload = async () => {
        const reportElement = reportContentRef.current;
        if (!reportElement || !reportElement.hasChildNodes()) {
            alert("다운로드할 보고서 내용이 없습니다.");
            return;
        }

        // 1. 보고서 내용을 깊은 복사합니다.
        const clone = reportElement.cloneNode(true) as HTMLElement;

        // 2. 재귀적으로 모든 요소의 계산된 스타일을 인라인 스타일로 변환하는 함수
        const inlineAllStyles = (element: HTMLElement) => {
            const computedStyle = window.getComputedStyle(element);

            // 모든 CSS 속성을 순회하며 인라인 스타일로 적용
            for (let i = 0; i < computedStyle.length; i++) {
                const prop = computedStyle[i];
                const value = computedStyle.getPropertyValue(prop);
                // `setProperty`를 사용하여 모든 속성을 강제로 주입
                element.style.setProperty(prop, value);
            }

            // 자식 요소에 대해 재귀적으로 함수 호출
            for (let i = 0; i < element.children.length; i++) {
                inlineAllStyles(element.children[i] as HTMLElement);
            }
        };

        // 3. 복제된 요소에 대해 스타일 인라인 작업을 수행합니다.
        // 이 시점에서 clone 내의 모든 요소는 rgb() 기반의 인라인 스타일을 갖게 됩니다.
        inlineAllStyles(clone);

        // 4. PDF 출력에 불필요한 화면용 스타일을 제거합니다. (인라인화 후에 실행)
        const pageContainers = clone.querySelectorAll('.page-container');
        pageContainers.forEach(container => {
            const el = container as HTMLElement;
            el.style.boxShadow = 'none';
            el.style.margin = '0';
        });

        // 5. DOM에 임시로 추가하여 렌더링 준비
        document.body.appendChild(clone);

        const opt = {
            margin: 0,
            filename: `report_${selectedFileId}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false,
                // 계산된 스타일이 적용된 요소의 크기를 정확히 사용
                width: clone.scrollWidth,
                height: clone.scrollHeight,
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: 'css', after: '.page-break' }
        };

        try {
            // 6. 완벽하게 정제된 복제본으로 PDF를 생성합니다.
            await html2pdf().from(clone).set(opt).save();
        } catch (error) {
            console.error("PDF 생성 중 최종 오류:", error);
            alert("PDF 생성에 실패했습니다. 콘솔을 확인해주세요.");
        } finally {
            // 7. 작업이 끝나면 DOM에서 복제본을 반드시 제거합니다.
            document.body.removeChild(clone);
        }
    };

    if (isAuthLoading || !user) {
        return <div>사용자 정보를 확인 중입니다...</div>
    }

    return (
        <div className="w-full h-full text-white">
            <div className="flex justify-end mb-4">
                <button onClick={handleDownload} className="px-6 py-2 bg-[rgba(111,131,175)] hover:bg-[rgba(101,121,165)] cursor-pointer rounded-lg transition-colors">
                    PDF 다운로드
                </button>
            </div>

            <div className="flex gap-6" style={{ height: 'calc(100vh - 120px)' }}>
                {/* 왼쪽: 파일 목록 관리 */}
                <aside className="w-1/4 max-w-xs bg-[rgba(111,131,175)] rounded-lg p-4 overflow-y-auto">
                    <h2 className="text-lg font-bold mb-4 border-b border-white pb-2">분석 파일 목록</h2>
                    <ul className="space-y-2 overflow-y-auto">
                        {files.map(file => (
                            <li key={file.fileId} onClick={() => handleFileSelect(file.fileId)} className={`p-3 rounded-md cursor-pointer transition-colors text-[rgba(111,131,175)] ${selectedFileId === file.fileId ? 'bg-white font-noto-500' : 'bg-white/70'}`}>
                                {file.fileName}
                                <p className="text-sm mt-1">{formatDateTime(file.createdAt)}</p>
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* 오른쪽: 상세 보고서 뷰 */}
                <main className="flex-1 bg-[rgba(30,30,30)] p-8 overflow-y-auto rounded-lg">
                    <ReportView ref={reportContentRef} />
                </main>
            </div>
        </div>
    );
}