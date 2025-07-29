"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

import { FileText, FileSpreadsheet, Download } from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

import ExcelPreview from "./ExcelPreview";

import { FileItem } from '@/types/file';
import ReportView, { type ReportViewRef } from "./ReportView";

declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

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
    const [downloadType, setDownloadType] = useState<'excel' | 'pdf' | null>(null);

    const [isPreviewSelectorOpen, setIsPreviewSelectorOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'pdf' | 'excel'>('pdf');

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

    const handlePDFDownload = async () => {
        if (isDownloading) return;
        if (!reportViewRef.current) {
            alert("보고서 컴포넌트가 아직 준비되지 않았습니다.");
            return;
        }
        setIsDownloading(true);
        setDownloadType('pdf');
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');

            // --- 1. 한글 폰트 설정 (필수!) ---
            // public/fonts/NanumGothic.ttf 파일이 있어야 합니다.
            const fontResponse = await fetch('/fonts/NanumGothic.ttf');
            if (!fontResponse.ok) throw new Error("폰트 파일을 불러올 수 없습니다.");
            const font = await fontResponse.arrayBuffer();
            const fontBase64 = btoa(new Uint8Array(font).reduce((data, byte) => data + String.fromCharCode(byte), ''));
            pdf.addFileToVFS('NanumGothic.ttf', fontBase64);
            pdf.addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
            pdf.setFont('NanumGothic');

            // --- 2. html2canvas로 렌더링할 페이지들 캡처 ---
            const pagesToCapture = ['report-page-1', 'report-page-2'];
            for (let i = 0; i < pagesToCapture.length; i++) {
                const pageId = pagesToCapture[i];
                const element = document.getElementById(pageId);
                if (element) {
                    // ✨ 3. 첫 페이지(i=0)가 아닐 때만 새 페이지 추가
                    if (i > 0) pdf.addPage();
                    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' } as any);
                    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
                }
            }

            // --- 3. AnomalyDetailsPage의 테이블 데이터를 가져와 autoTable로 그리기 ---
            const tableData = reportViewRef.current.getAnomalyDetailsPdfData();

            if (tableData && tableData.body.length > 0) {
                pdf.addPage(); // 테이블을 위한 새 페이지 추가
                pdf.setFontSize(16);
                pdf.text("3. 이상 탐지 상세 내역", 14, 22);

                autoTable(pdf, { // 👈 호출 방식을 이렇게 변경!
                    head: tableData.head,
                    body: tableData.body,
                    startY: 30,
                    theme: 'grid',
                    styles: { font: 'NanumGothic', fontSize: 8, cellPadding: 2 },
                    headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
                    // didParseCell: function (data: any) {
                    //     if (data.section === 'body' && data.column.index <= 1) {
                    //         if (data.cell.raw === '') { // 내용이 비어있으면
                    //             data.cell.styles.lineWidth = 0; // 위쪽, 왼쪽 선을 그리지 않음 (병합된 것처럼 보이게)
                    //         }
                    //     }
                    // },
                });
            } else {
                // 데이터 없을 때 페이지 추가
                const noDetailsElement = document.getElementById('report-page-no-details');
                if (noDetailsElement) {
                    pdf.addPage();
                    const canvas = await html2canvas(noDetailsElement, { scale: 2, backgroundColor: '#ffffff' } as any);
                    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
                }
            }

            // --- 4. 마지막 페이지 캡처 ---
            const finalPageElement = document.getElementById('report-page-final');
            if (finalPageElement) {
                pdf.addPage();
                const canvas = await html2canvas(finalPageElement, { scale: 2, backgroundColor: '#ffffff' } as any);
                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
            }

            const totalPages = (pdf.internal as any).getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i); // 각 페이지로 이동
                pdf.setFontSize(10);
                pdf.setTextColor(150);
                const text = `Page ${i} / ${totalPages}`;
                const textWidth = pdf.getStringUnitWidth(text) * pdf.getFontSize() / pdf.internal.scaleFactor;
                const textX = (pdf.internal.pageSize.getWidth() - textWidth) / 2;
                pdf.text(text, textX, 290); // 페이지 하단 중앙에 텍스트 추가
            }

            pdf.save(`report_${selectedFileId || 'unknown'}.pdf`);
            alert("PDF가 성공적으로 다운로드되었습니다!");

        } catch (error) {
            console.error("PDF 생성 오류:", error);
            alert("PDF 생성에 실패했습니다.");
        } finally {
            setIsDownloading(false);
            setDownloadType(null);
        }
    };

    const handleExcelDownload = async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        setDownloadType('excel');
        if (reportViewRef.current?.handleExcelDownload) {
            await reportViewRef.current.handleExcelDownload();
        } else {
            console.error("Excel 다운로드 기능을 찾을 수 없습니다.");
            alert("Excel 다운로드 기능이 아직 준비되지 않았습니다.");
        }
        setIsDownloading(false);
        setDownloadType(null);
    };


    if (isAuthLoading || !user) {
        return <div>사용자 정보를 확인 중입니다...</div>
    }

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                color: 'rgb(255, 255, 255)',
                display: 'flex', flexDirection: 'column'
            }}
        >
            <div
                style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '16px', flexShrink: 0
                }}
            >
                <div className="flex items-center bg-[rgba(60,60,60)] rounded-3xl py-1 px-1.5">
                    <button
                        onClick={() => setActiveTab('pdf')}
                        className={`px-4 py-2 text-sm font-semibold rounded-2xl transition ${activeTab === 'pdf' ? 'bg-[rgba(111,131,175)] text-white' : 'text-gray-400 hover:bg-[rgba(70,70,70)]'}`}
                    >
                        PDF 미리보기
                    </button>
                    <button
                        onClick={() => setActiveTab('excel')}
                        className={`px-4 py-2 text-sm font-semibold rounded-2xl transition ${activeTab === 'excel' ? 'bg-[rgba(111,131,175)] text-white' : 'text-gray-400 hover:bg-[rgba(70,70,70)]'}`}
                    >
                        Excel 미리보기
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={handleExcelDownload} disabled={isDownloading} className="flex items-center gap-2 px-4 py-2 bg-[rgba(111,131,175)] text-white rounded-lg transition hover:bg-[rgba(101,121,165)] disabled:opacity-50 disabled:cursor-not-allowed">
                        <FileSpreadsheet size={16} />
                        <span>{isDownloading && downloadType === 'excel' ? '생성 중...' : 'Excel'}</span>
                    </button>

                    <button onClick={handlePDFDownload} disabled={isDownloading} className="flex items-center gap-2 px-4 py-2 bg-[rgba(111,131,175)] text-white rounded-lg transition hover:bg-[rgba(101,121,165)] disabled:opacity-50 disabled:cursor-not-allowed">
                        <FileText size={16} />
                        <span>{isDownloading && downloadType === 'pdf' ? '생성 중...' : 'PDF'}</span>
                    </button>
                </div>
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
                    {activeTab === 'pdf' && <ReportView ref={reportViewRef} pdfContentRef={pdfContentRef} />}
                    {activeTab === 'excel' && <ExcelPreview />}
                </main>
            </div>
        </div>
    );
}