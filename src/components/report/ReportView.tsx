'use client';

import { useState, useEffect, forwardRef, useMemo } from "react";
import { useDashboard } from "@/context/dashboardContext";

import { CoverLetterProps, getLocationNameById } from "@/types/file";

import ReportCoverLetter from "./ReportCoverLetter";
import AnomalyDashboardPage from "./AnomalyDashboardPage"
import PerformanceDashboardPage from "./PerformanceDashboardPage";

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).replace(/\. /g, '.').slice(0, -1);
};

// forwardRef를 사용하여 부모 컴포넌트(ReportClient)에서 생성한 ref를 받아옵니다.
const ReportView = forwardRef<HTMLDivElement>((props, ref) => {
    const {
        coverData,
        kpiData,
        anomalyChartData,
        stageChartData,
        productAnomalyData,
        eventTimelineData,
        inventoryData,
        isLoading,
        user
    } = useDashboard();

    const coverLetterData = useMemo<CoverLetterProps | null>(() => {
        if (!coverData || !user) return null;

        return {
            fileName: coverData.fileName,
            analysisPeriod: `${formatDate(coverData.period[0])} ~ ${formatDate(coverData.period[1])}`,
            createdAt: formatDate(coverData.createdAt),
            userName: coverData.userName,
            locationName: getLocationNameById(coverData.locationId),
            companyName: "(주)메타비즈",
            companyLogoUrl: '/images/logo.png'
        };
    }, [coverData, user]);

    // --- 렌더링 로직 ---

    if (isLoading) {
        return <div className="text-center p-10 text-gray-300">보고서 데이터를 불러오는 중...</div>;
    }

    if (!coverLetterData || !kpiData) {
        return (
            <div className="text-center p-10 text-gray-300">
                보고서를 생성할 데이터가 없습니다.
            </div>
        );
    }

    return (
        // ✨ 5. 최상위 ref 컨테이너가 모든 페이지를 감쌉니다.
        <div ref={ref}>
            {/* 페이지 1: 커버 레터 */}
            <div className="page-container bg-white shadow-lg mx-auto mb-8" style={{ width: '210mm', minHeight: '297mm' }}>
                <ReportCoverLetter data={coverLetterData} />
            </div>

            {/* 페이지 2: 이상 탐지 대시보드 */}
            <div className="page-container bg-white shadow-lg mx-auto mb-8" style={{ width: '210mm', minHeight: '297mm' }}>
                <AnomalyDashboardPage
                    kpiData={kpiData}
                    anomalyChartData={anomalyChartData}
                    stageChartData={stageChartData}
                    productAnomalyData={productAnomalyData}
                    eventTimelineData={eventTimelineData}
                />
            </div>

            {/* 페이지 3: 전체 성과 대시보드 */}
            <div className="page-container bg-white shadow-lg mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
                {/* <PerformanceDashboardPage
                    kpiData={kpiData}
                    inventoryData={inventoryData}
                /> */}
            </div>
        </div>
    );
});

ReportView.displayName = 'ReportView';

export default ReportView;