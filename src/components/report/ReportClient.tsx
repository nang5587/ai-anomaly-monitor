"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getFiles_client } from "@/api/apiClient";

import { FileText, FileSpreadsheet } from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

import { FileItem } from '@/types/file';
import ReportView, { type ReportViewRef } from "./ReportView";
import ExcelPreview, { type ExcelPreviewRef } from "./ExcelPreview";

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
    const excelPreviewRef = useRef<ExcelPreviewRef>(null);

    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const searchParams = useSearchParams();
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadType, setDownloadType] = useState<'excel' | 'pdf' | null>(null);

    const [isPreviewSelectorOpen, setIsPreviewSelectorOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'pdf' | 'excel'>('pdf');
    const [files, setFiles] = useState<FileItem[]>(initialFiles);

    useEffect(() => {
        const isMock = process.env.NEXT_PUBLIC_MOCK_API === 'true';
        if (isMock) {
            const fetchMockFiles = async () => {
                console.log("Mock 모드 활성화: 클라이언트에서 Mock 파일 데이터를 불러옵니다.");
                try {
                    const mockData = await getFiles_client();
                    setFiles(mockData);
                } catch (error) {
                    console.error("Mock 파일 데이터 로딩 실패:", error);
                }
            };
            fetchMockFiles();
        }
    }, []);

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
        : files[0]?.fileId || null;

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
            const pdf = new jsPDF({
                putOnlyUsedFonts: true,
                compress: true,
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            const fontRegularResponse = await fetch('/fonts/NanumGothic.ttf');
            if (!fontRegularResponse.ok) throw new Error("NanumGothic.ttf 폰트 파일을 불러올 수 없습니다.");
            const fontRegularBuffer = await fontRegularResponse.arrayBuffer();
            const fontRegularBase64 = btoa(new Uint8Array(fontRegularBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
            const fontBoldResponse = await fetch('/fonts/NanumGothicBold.ttf');
            if (!fontBoldResponse.ok) throw new Error("NanumGothicBold.ttf 폰트 파일을 불러올 수 없습니다.");
            const fontBoldBuffer = await fontBoldResponse.arrayBuffer();
            const fontBoldBase64 = btoa(new Uint8Array(fontBoldBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));

            pdf.addFileToVFS('NanumGothic.ttf', fontRegularBase64);
            pdf.addFileToVFS('NanumGothicBold.ttf', fontBoldBase64);

            pdf.addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
            pdf.addFont('NanumGothicBold.ttf', 'NanumGothic', 'bold');

            pdf.setFont('NanumGothic', 'normal');

            const pagesToCapture = ['report-page-1', 'report-page-2'];
            for (let i = 0; i < pagesToCapture.length; i++) {
                const pageId = pagesToCapture[i];
                const element = document.getElementById(pageId);
                if (element) {
                    if (i > 0) pdf.addPage();
                    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' } as any);
                    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
                }
            }

            const tableData = reportViewRef.current.getAnomalyDetailsPdfData();

            if (tableData && tableData.body.length > 0) {
                pdf.addPage();
                pdf.setTextColor(75, 85, 99);
                pdf.setFont('NanumGothic', 'bold');
                pdf.setFontSize(12);
                pdf.text("3. 이상 탐지 상세 내역", 14, 22);
                pdf.setTextColor(0, 0, 0);

                autoTable(pdf, {
                    head: tableData.head,
                    body: tableData.body,
                    startY: 30,
                    theme: 'grid',
                    styles: {
                        font: 'NanumGothic',
                        fontSize: 8,
                        cellPadding: 2
                    },
                    headStyles: {
                        fillColor: [44, 62, 80],
                        textColor: 255,
                        fontStyle: 'bold'
                    },
                    bodyStyles: {
                        fontStyle: 'normal'
                    },
                    columnStyles: {
                        0: { cellWidth: 7 },
                        1: { cellWidth: 20 },
                        2: { cellWidth: 30 },
                        3: { cellWidth: 20 },
                        4: { cellWidth: 'auto' },
                        5: { cellWidth: 38 }
                    }
                });
            } else {
                const noDetailsElement = document.getElementById('report-page-no-details');
                if (noDetailsElement) {
                    pdf.addPage();
                    const canvas = await html2canvas(noDetailsElement, { scale: 2, backgroundColor: '#ffffff' } as any);
                    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
                }
            }
            const finalPageElement = document.getElementById('report-page-final');
            if (finalPageElement) {
                pdf.addPage();
                const canvas = await html2canvas(finalPageElement, { scale: 2, backgroundColor: '#ffffff' } as any);
                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
            }
            const totalPages = (pdf.internal as any).getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(10);
                pdf.setTextColor(150);
                const text = `Page ${i} / ${totalPages}`;
                const textWidth = pdf.getStringUnitWidth(text) * pdf.getFontSize() / pdf.internal.scaleFactor;
                const textX = (pdf.internal.pageSize.getWidth() - textWidth) / 2;
                pdf.text(text, textX, 290);
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
        if (excelPreviewRef.current?.handleExcelDownload) {
            await excelPreviewRef.current.handleExcelDownload();
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
                        className={`px-4 py-2 text-sm font-semibold rounded-2xl transition cursor-pointer ${activeTab === 'pdf' ? 'bg-[rgba(111,131,175)] text-white' : 'text-gray-400 hover:bg-[rgba(70,70,70)]'}`}
                    >
                        PDF 미리보기
                    </button>
                    <button
                        onClick={() => setActiveTab('excel')}
                        className={`px-4 py-2 text-sm font-semibold rounded-2xl transition cursor-pointer ${activeTab === 'excel' ? 'bg-[rgba(111,131,175)] text-white' : 'text-gray-400 hover:bg-[rgba(70,70,70)]'}`}
                    >
                        Excel 미리보기
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    {activeTab === 'pdf' && (
                        <button onClick={handlePDFDownload} disabled={isDownloading} className="flex items-center gap-2 px-4 py-2 bg-[#E53935] text-white rounded-3xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                            <FileText size={16} />
                            <span>{isDownloading && downloadType === 'pdf' ? '생성 중...' : 'PDF'}</span>
                        </button>
                    )}
                    {activeTab === 'excel' && (
                        <button onClick={handleExcelDownload} disabled={isDownloading} className="flex items-center gap-2 px-4 py-2 bg-[#43A047] text-white rounded-3xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                            <FileSpreadsheet size={16} />
                            <span>{isDownloading && downloadType === 'excel' ? '생성 중...' : 'Excel'}</span>
                        </button>
                    )}
                </div>
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: '24px',
                    height: 'calc(100vh - 120px)'
                }}
            >
                <aside
                    style={{
                        width: '25%',
                        maxWidth: '300px',
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
                                    color: selectedFileId === file.fileId ? 'rgba(255,255,255)' : 'rgba(255,255,255,0.6)',
                                    backgroundColor: selectedFileId === file.fileId ? 'rgb(50, 50, 50)' : 'rgba(30, 30, 30, 0.7)',
                                    fontWeight: selectedFileId === file.fileId ? '500' : 'normal',
                                    border: selectedFileId === file.fileId ? '1px solid rgba(111,131,175)' : '1px solid transparent'
                                }}
                            >
                                {file.fileName}
                                <p style={{ fontSize: '14px', marginTop: '4px' }}>
                                    {formatDateTime(file.createdAt)}
                                </p>
                            </li>
                        ))}
                        {files.length < 1 && (
                            <div className="text-center text-[#E0E0E0]">
                                업로드된 파일이 없습니다.
                            </div>
                        )}
                    </ul>
                </aside>
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
                    {activeTab === 'excel' && (
                        <ExcelPreview ref={excelPreviewRef} />
                    )}
                </main>
            </div>
        </div>
    );
}