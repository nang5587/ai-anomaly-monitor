'use client';
declare module "html2pdf.js";
import { useEffect, useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';

interface ReportData {
  title: string;
  author: string;
  date: string;
  viewCount: number;
  fileName: string;
  content: string[];
}

export default function Manager1ReportPage() {
  const reportRef = useRef(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/report/manager1");
        const data = await response.json();
        setReportData(data);
      } catch (err) {
        console.error("Failed to load report:", err);
      }
    };
    fetchReport();
  }, []);

  const handleDownload = () => {
    if (reportRef.current) {
      html2pdf().from(reportRef.current).save(`${reportData?.fileName || '이상탐지보고서'}.pdf`);
    }
  };

  if (!reportData) return <p className="p-8">로딩 중...</p>;

  return (
    <div
      className="min-h-screen bg-cover bg-center p-8 flex flex-col items-center"
      style={{ backgroundImage: `url('/background-report.png')` }} // public 폴더에 background-report.jpg 넣어야 함
    >
      <div
        ref={reportRef}
        className="bg-white w-full max-w-4xl p-10 rounded-lg shadow-lg"
      >
        <h1 className="text-2xl font-bold border-b pb-2 mb-4">{reportData.title}</h1>
        <div className="text-sm text-gray-600 mb-2">
          
          <p><strong>등록일:</strong> {reportData.date}</p>
          
        </div>
        <div className="border p-4 rounded bg-gray-50 mb-6">
          <p><strong>첨부파일:</strong> {reportData.fileName}</p>
        </div>
        <div className="prose prose-sm max-w-full text-gray-800">
          {reportData.content.map((para, idx) => (
            <p key={idx} className="mb-2">{para}</p>
          ))}
        </div>
      </div>

      <button
        onClick={handleDownload}
        className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
      >
        PDF 저장
      </button>
    </div>
  );
}
