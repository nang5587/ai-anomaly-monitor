"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import apiClient from "@/api/apiClient";
import html2pdf from "html2pdf.js";

import { FileItem } from '@/types/file';
import ReportView from "./ReportView";

interface ReportClientProps {
    initialFiles: FileItem[];
}

export default function ReportClient({ initialFiles }: ReportClientProps) {
    const reportContentRef = useRef<HTMLDivElement>(null);

    const [files] = useState<FileItem[]>(initialFiles);
    const [selectedFileId, setSelectedFileId] = useState<number | null>(initialFiles[0]?.fileId || null);

    const handleDownload = async () => {
        if (!reportContentRef.current?.hasChildNodes()) {
            alert("다운로드할 보고서 내용이 없습니다.");
            return;
        }

        const element = reportContentRef.current;
        const opt = {
            margin: 0,
            filename: `report_${selectedFileId}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        await html2pdf().set(opt).from(element).save();
    };

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
                    <ul className="space-y-2">
                        {files.map(file => (
                            <li key={file.fileId} onClick={() => setSelectedFileId(file.fileId)} className={`p-3 rounded-md cursor-pointer transition-colors text-[rgba(111,131,175)] ${selectedFileId === file.fileId ? 'bg-white font-noto-500' : 'hover:bg-white/80'}`}>
                                {file.fileName}
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* 오른쪽: 상세 보고서 뷰 */}
                <main className="flex-1 bg-[rgba(30,30,30)] p-8 overflow-y-auto rounded-lg">
                    <ReportView fileId={selectedFileId} ref={reportContentRef} />
                </main>
            </div>
        </div>
    );
}