"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


import { FileItem } from '@/types/file';
import ReportView, { type ReportViewRef } from "./ReportView";

interface ReportClientProps {
    initialFiles: FileItem[];
}

export const formatDateTime = (dateString: string | undefined | null): string => {
    if (!dateString) {
        return '-';
    }

    try {
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    } catch (error) {
        console.error("날짜 형식 변환 실패:", dateString, error);
        return '날짜 오류';
    }
};

export default function ReportClient({ initialFiles }: ReportClientProps) {
    const reportViewRef = useRef<ReportViewRef>(null);
    const pdfContentRef = useRef<HTMLDivElement>(null);

    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const searchParams = useSearchParams();
    const [isDownloading, setIsDownloading] = useState(false);


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
        console.log("PDF 다운로드 시작");

        const reportElement = pdfContentRef.current;

        if (!reportElement) {
            alert("보고서 요소를 찾을 수 없습니다.");
            return;
        }

        if (!reportElement.hasChildNodes() || reportElement.innerHTML.trim() === '') {
            alert("다운로드할 보고서 내용이 없습니다.");
            return;
        }

        if (isDownloading) {
            return;
        }

        setIsDownloading(true);

        try {
            console.log("PDF 생성 시작 (개별 페이지 캡처)");

            // 렌더링 대기
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 각 페이지 요소 찾기 - 직접 자식 요소들을 페이지로 간주
            const pageElements = Array.from(reportElement.children) as HTMLElement[];
            console.log(`총 ${pageElements.length}개 페이지 발견`);

            if (pageElements.length === 0) {
                throw new Error("페이지 요소를 찾을 수 없습니다.");
            }

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            // 각 페이지를 개별적으로 캡처
            for (let i = 0; i < pageElements.length; i++) {
                const pageElement = pageElements[i];
                console.log(`페이지 ${i + 1} 처리 중...`);

                // 페이지 요소가 A4 크기인지 확인
                const computedStyle = window.getComputedStyle(pageElement);
                console.log(`페이지 ${i + 1} 크기:`, {
                    width: computedStyle.width,
                    height: computedStyle.height
                });

                // 개별 페이지 캡처
                const canvas = await html2canvas(pageElement, {
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    width: pageElement.scrollWidth,
                    height: pageElement.scrollHeight,
                    scale: 1.5, // 적절한 해상도
                } as any);

                console.log(`페이지 ${i + 1} 캔버스 크기:`, canvas.width, "x", canvas.height);

                if (canvas.width === 0 || canvas.height === 0) {
                    console.warn(`페이지 ${i + 1} 캔버스 크기가 0입니다. 건너뜁니다.`);
                    continue;
                }

                const imgData = canvas.toDataURL('image/png', 0.95);

                // 첫 번째 페이지가 아니면 새 페이지 추가
                if (i > 0) {
                    pdf.addPage();
                }

                // A4 크기에 맞게 이미지 배치
                const pageWidth = 210; // A4 너비 (mm)
                const pageHeight = 297; // A4 높이 (mm)

                // 이미지를 A4 크기에 맞게 스케일링
                const imgWidth = pageWidth;
                const imgHeight = (canvas.height * pageWidth) / canvas.width;

                if (imgHeight <= pageHeight) {
                    // 이미지가 한 페이지에 들어감
                    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                } else {
                    // 이미지가 페이지보다 큰 경우 스케일 다운
                    const scaleFactor = pageHeight / imgHeight;
                    const scaledWidth = imgWidth * scaleFactor;
                    const scaledHeight = pageHeight;
                    const xOffset = (pageWidth - scaledWidth) / 2;

                    pdf.addImage(imgData, 'PNG', xOffset, 0, scaledWidth, scaledHeight);
                }

                console.log(`페이지 ${i + 1} PDF 추가 완료`);
            }

            // PDF 저장
            pdf.save(`report_${selectedFileId || 'unknown'}.pdf`);

            console.log("PDF 생성 및 다운로드 완료");
            alert("PDF가 성공적으로 다운로드되었습니다!");

        } catch (error) {
            console.error("PDF 생성 오류:", error);

            let errorMessage = "PDF 생성에 실패했습니다.";
            if (error instanceof Error) {
                console.error("오류 상세:", error.message);
                if (error.message.includes('canvas')) {
                    errorMessage += " 화면 캡처 중 오류가 발생했습니다.";
                } else if (error.message.includes('비어있습니다')) {
                    errorMessage += " 보고서 내용이 없습니다.";
                }
            }
            alert(errorMessage);

        } finally {
            setIsDownloading(false);
        }
    };

    const handleExcelDownload = async () => {
        if (reportViewRef.current?.handleExcelDownload) {
            await reportViewRef.current.handleExcelDownload();
        } else {
            console.error("Excel 다운로드 기능을 찾을 수 없습니다.");
            alert("Excel 다운로드 기능이 아직 준비되지 않았습니다.");
        }
    };


    if (isAuthLoading || !user) {
        return <div>사용자 정보를 확인 중입니다...</div>
    }

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                color: 'rgb(255, 255, 255)'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: '16px'
                }}
            >
                <button
                    onClick={handleExcelDownload}
                    disabled={isDownloading}
                    style={{
                        padding: '8px 24px',
                        borderRadius: '8px',
                        transition: 'all 0.2s',
                        backgroundColor: isDownloading ? 'rgb(156, 163, 175)' : 'rgba(111, 131, 175, 1)',
                        color: 'white',
                        border: 'none',
                        cursor: isDownloading ? 'not-allowed' : 'pointer'
                    }}
                    onMouseOver={(e) => {
                        if (!isDownloading) {
                            e.currentTarget.style.backgroundColor = 'rgba(101, 121, 165, 1)';
                        }
                    }}
                    onMouseOut={(e) => {
                        if (!isDownloading) {
                            e.currentTarget.style.backgroundColor = 'rgba(111, 131, 175, 1)';
                        }
                    }}
                >
                    {isDownloading ? 'Excel 생성 중...' : 'Excel 다운로드'}
                </button>

                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    style={{
                        padding: '8px 24px',
                        borderRadius: '8px',
                        transition: 'all 0.2s',
                        backgroundColor: isDownloading ? 'rgb(156, 163, 175)' : 'rgba(111, 131, 175, 1)',
                        color: 'white',
                        border: 'none',
                        cursor: isDownloading ? 'not-allowed' : 'pointer'
                    }}
                    onMouseOver={(e) => {
                        if (!isDownloading) {
                            e.currentTarget.style.backgroundColor = 'rgba(101, 121, 165, 1)';
                        }
                    }}
                    onMouseOut={(e) => {
                        if (!isDownloading) {
                            e.currentTarget.style.backgroundColor = 'rgba(111, 131, 175, 1)';
                        }
                    }}
                >
                    {isDownloading ? 'PDF 생성 중...' : 'PDF 다운로드'}
                </button>
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: '24px',
                    height: 'calc(100vh - 120px)'
                }}
            >
                {/* 왼쪽: 파일 목록 관리 */}
                <aside
                    style={{
                        width: '25%',
                        maxWidth: '300px',
                        backgroundColor: 'rgba(111, 131, 175, 1)',
                        borderRadius: '8px',
                        padding: '16px',
                        overflowY: 'auto'
                    }}
                >
                    <h2
                        style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            marginBottom: '16px',
                            borderBottom: '1px solid rgb(255, 255, 255)',
                            paddingBottom: '8px',
                            color: 'rgb(255, 255, 255)'
                        }}
                    >
                        분석 파일 목록
                    </h2>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {files.map(file => (
                            <li
                                key={file.fileId}
                                onClick={() => handleFileSelect(file.fileId)}
                                style={{
                                    padding: '12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    color: 'rgba(111, 131, 175, 1)',
                                    backgroundColor: selectedFileId === file.fileId ? 'rgb(255, 255, 255)' : 'rgba(255, 255, 255, 0.7)',
                                    fontWeight: selectedFileId === file.fileId ? '500' : 'normal'
                                }}
                            >
                                {file.fileName}
                                <p style={{ fontSize: '14px', marginTop: '4px' }}>
                                    {formatDateTime(file.createdAt)}
                                </p>
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* 오른쪽: 상세 보고서 뷰 */}
                <main
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(30, 30, 30, 1)',
                        padding: '32px',
                        overflowY: 'auto',
                        borderRadius: '8px'
                    }}
                >
                    <ReportView ref={reportViewRef} pdfContentRef={pdfContentRef} />
                </main>
            </div>
        </div>
    );
}