import ReportClient from '@/components/report/ReportClient';
import { getFiles_server } from '@/api/apiServer';
import { FileItem } from '@/types/file';

export default async function ReportPage() {
  const files: FileItem[] = await getFiles_server();

  return (
    <div className="w-full h-full ">
      <div className="w-full h-full bg-[rgba(40,40,40)] p-10 flex flex-col">
        <div className="flex items-center mb-20 gap-4 flex-shrink-0">
          <div className="flex flex-col justify-center gap-1">
            <h1 className="text-white text-4xl font-vietnam">AI Analysis Report</h1>
            <span className="text-[#E0E0E0]">AI 분석 결과를 PDF, Excel로 다운받을 수 있습니다.</span>
          </div>
        </div>
        <div className="flex-1 w-full flex justify-center overflow-y-auto px-4 pb-10">
          <ReportClient initialFiles={files} />
        </div>
      </div>
    </div>
  );
}