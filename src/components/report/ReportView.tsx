// src/app/report/ReportView.tsx

'use client';

import { useState, useEffect, forwardRef } from "react";
import apiClient from "@/api/apiClient";

import { CoverReportData } from "@/types/api";
import { CoverLetterProps, getLocationNameById } from "@/types/file";

import ReportCoverLetter from "./ReportCoverLetter";
import AnomalyDashboardPage from "./AnomalyDashboardPage"

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).replace(/\. /g, '.').slice(0, -1);
};

interface ReportViewProps {
    fileId: number | null;
}

const DUMMY_DB: Record<number, CoverReportData> = {
    1: {
        fileName: "화성-프로젝트.csv",
        userName: "김화성",
        locationId: 2,
        createdAt: "2025-07-27",
        period: ["2025-07-20", "2025-07-27"]
    },
    2: {
        fileName: "수원-물류센터-데이터.csv",
        userName: "이수원",
        locationId: 1,
        createdAt: "2025-07-28",
        period: ["2025-07-21", "2025-07-28"]
    },
    3: {
        fileName: "서울-분기보고.csv",
        userName: "박서울",
        locationId: 2,
        createdAt: "2025-07-29",
        period: ["2025-07-22", "2025-07-29"]
    }
};


// forwardRef를 사용하여 부모 컴포넌트(ReportClient)에서 생성한 ref를 받아옵니다.
const ReportView = forwardRef<HTMLDivElement, ReportViewProps>(({ fileId }, ref) => {
    const [reportData, setReportData] = useState<CoverReportData | null>(null);
    const [anomalyData, setAnomalyData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!fileId) {
            setReportData(null);
            return;
        }

        const fetchReportData = async () => {
            setIsLoading(true);
            setReportData(null);

            try {
                // const response = await apiClient.get<CoverReportData>(`/api/manager/report/cover/${fileId}`);
                // setReportData(response.data); // 🚀 백엔드 연동 시 주석 해제

                // 🚀 연동 시 삭제 --------------------------------------------------
                await new Promise(resolve => setTimeout(resolve, 300)); // 0.3초의 로딩 딜레이 효과
                const data = DUMMY_DB[fileId];
                if (data) {
                    setReportData(data);
                } else {
                    console.warn(`fileId ${fileId}에 대한 더미 데이터가 없습니다.`);
                    setReportData(null); // 데이터가 없으면 명시적으로 null 처리
                }
                // -------------------------------------------------------------------

            } catch (error) {
                console.error("리포트 데이터 로딩 실패:", error);
                setReportData(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReportData();
    }, [fileId]);

    // API 데이터를 UI에 맞는 props 형태로 가공
    const coverLetterData: CoverLetterProps | null = reportData ? {
        fileName: reportData.fileName,
        analysisPeriod: `${formatDate(reportData.period[0])} ~ ${formatDate(reportData.period[1])}`,
        createdAt: formatDate(reportData.createdAt),
        userName: reportData.userName,
        locationName: getLocationNameById(reportData.locationId),
        companyName: "(주)메타비즈",
        companyLogoUrl: '/images/logo.png'
    } : null;

    if (isLoading) {
        return <div className="text-center p-10 text-gray-300">보고서 데이터를 불러오는 중...</div>;
    }

    if (!coverLetterData) {
        return (
            <div className="text-center p-10 text-gray-300">
                {fileId ? "선택된 파일에 대한 보고서가 없습니다." : "분석할 파일을 선택해주세요."}
            </div>
        );
    }

    return (
        <>
            <div
                ref={ref} // 부모로부터 받은 ref를 여기에 직접 연결
                className="page-container bg-white shadow-lg mx-auto"
                style={{ width: '210mm', height: '297mm' }}
            >
                <ReportCoverLetter data={coverLetterData} />
            </div>
            <div
                className="page-container bg-white shadow-lg mx-auto"
                style={{ width: '210mm', minHeight: '297mm' }}
            >
                <AnomalyDashboardPage
                    kpiData={anomalyData.kpiData}
                    barChartData={anomalyData.barChartData}
                    doughnutChartData={anomalyData.barChartData}
                />
            </div>
        </>
    );
});

// forwardRef를 사용할 때 displayName을 설정해주는 것이 좋습니다 (디버깅 용도).
ReportView.displayName = 'ReportView';

export default ReportView;