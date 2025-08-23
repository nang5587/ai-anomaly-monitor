import { History, Download } from 'lucide-react';

interface FileActionsCardProps {
    onOpenHistory: () => void;
    onDownloadReport: () => void;
}

export default function FileActionsCard({ onOpenHistory, onDownloadReport }: FileActionsCardProps) {
    return (
        <div className="bg-[rgba(40,40,40)] p-8 rounded-3xl shadow-md flex items-center justify-center">
            <button
                onClick={onOpenHistory}
                className="flex flex-col items-center justify-center rounded-lg w-1/2 cursor-pointer"
                title="업로드 이력 보기"
            >
                <History className="h-10 w-10 text-[#E0E0E0]" />
            </button>
            <div className="h-2/3 w-px bg-[#E0E0E0] mx-4"></div>
            <button
                onClick={onDownloadReport}
                className="flex flex-col items-center justify-center rounded-lg w-1/2 cursor-pointer"
                title="보고서 다운로드"
            >
                <Download className="h-10 w-10 text-[#E0E0E0]" />
            </button>
        </div>
    );
}