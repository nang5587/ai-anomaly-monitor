'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import type { FileItem } from '@/types/file';

import { X, FileText, ArrowRight } from 'lucide-react';

interface UploadHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    files: FileItem[];
    onFileSelect: (fileId: number) => void;
}

export default function UploadHistoryModal({ isOpen, onClose, files, onFileSelect }: UploadHistoryModalProps) {
    if (!isOpen) return null;
    const router = useRouter();

    const handleItemClick = (fileId: number) => {
        onFileSelect(fileId); // 부모 컴포넌트(DashboardProvider)에 파일 ID 전달
        onClose();            // 모달 닫기
    };

    const handleGoToFullHistory = () => {
        router.push('/filelist'); // '/filelist' 경로로 이동
        onClose(); // 이동 후 모달 닫기
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDateTime = (dateTimeString: string) => {
        try {
            // "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
            const isoString = dateTimeString.replace(' ', 'T');
            const date = new Date(isoString);

            // 유효하지 않은 날짜일 경우 원본 문자열을 그대로 반환 (방어 코드)
            if (isNaN(date.getTime())) {
                return dateTimeString;
            }

            return date.toLocaleString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            // 예기치 않은 오류 발생 시 원본 문자열 반환
            return dateTimeString;
        }
    };

    return (
        // Backdrop (모달 바깥의 어두운 배경)
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center"
            onClick={onClose}
        >
            {/* Modal Content */}
            <div
                className="bg-gradient-to-br from-[#2A2A2A] to-[#1E1E1E] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫히지 않도록 함
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white">최근 업로드 내역</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-neutral-400 hover:bg-white/10 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Body (Scrollable List) */}
                <div className="flex-grow overflow-y-auto p-4">
                    {files.length > 0 ? (
                        <ul className="space-y-2">
                            {files.map(file => (
                                <li
                                    key={file.fileId}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                                    onClick={() => handleItemClick(file.fileId)}
                                >
                                    <div className="flex items-center gap-4">
                                        <FileText className="text-neutral-400" size={20} />
                                        <div>
                                            <p className="font-semibold text-white">{file.fileName}</p>
                                            <p className="text-xs text-neutral-400">
                                                업로더: {file.userId} | 파일 크기: {formatFileSize(file.fileSize)}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-neutral-500">
                                        {formatDateTime(file.createdAt)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-neutral-500 py-8">업로드 내역이 없습니다.</p>
                    )}
                </div>

                <div className="p-4 text-right">
                    <button
                        onClick={handleGoToFullHistory}
                        className="px-4 py-2 text-sm font-noto-400 text-white bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                    >
                        전체 내역 보기
                    </button>
                </div>
            </div>
        </div>
    );
}