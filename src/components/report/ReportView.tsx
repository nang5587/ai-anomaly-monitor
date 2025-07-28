'use client';

import { useState, useEffect, forwardRef, useMemo } from "react";
import { useDashboard } from "@/context/dashboardContext";

import { CoverLetterProps, getLocationNameById } from "@/types/file";

import ReportCoverLetter from "./ReportCoverLetter";
import AnomalyDashboardPage from "./AnomalyDashboardPage"
import AnomalyDetailsPage from "./AnomalyDetailsPage";
import PerformanceDashboardPage from "./PerformanceDashboardPage";

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).replace(/\. /g, '.').slice(0, -1);
};

// 간소화된 페이지 컨테이너 - 내부 컴포넌트가 A4 크기를 관리하도록
const pageWrapperStyle: React.CSSProperties = {
    pageBreakAfter: 'always',
    breakAfter: 'page',
    pageBreakInside: 'avoid',
    breakInside: 'avoid',
    margin: '0',
    padding: '0'
};

const lastPageWrapperStyle: React.CSSProperties = {
    pageBreakAfter: 'avoid',
    breakAfter: 'avoid',
    pageBreakInside: 'avoid',
    breakInside: 'avoid',
    margin: '0',
    padding: '0'
};

// forwardRef를 사용하여 부모 컴포넌트(ReportClient)에서 생성한 ref를 받아옵니다.
const ReportView = forwardRef<HTMLDivElement>((props, ref) => {
    const {
        coverData,
        kpiData,
        anomalyTrips,
        anomalyChartData,
        stageChartData,
        productAnomalyData,
        eventTimelineData,
        inventoryData,
        isLoading,
        user,
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

    const calculatedReportKpis = useMemo(() => {
        // 최다 발생 구간 계산
        const routeCounts = anomalyTrips.reduce((acc, trip) => {
            const route = `${trip.from.scanLocation} → ${trip.to.scanLocation}`;
            acc[route] = (acc[route] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const mostProblematicRoute = Object.entries(routeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        // 최다 발생 제품 계산
        const mostAffectedProduct = [...productAnomalyData].sort((a, b) => b.total - a.total)[0]?.productName || 'N/A';

        return {
            mostProblematicRoute,
            mostAffectedProduct
        };
    }, [anomalyTrips, productAnomalyData]);

    const showAnomalyDetails = anomalyTrips.length > 0;
    const totalPages = 2 + (showAnomalyDetails ? 1 : 0) + 1; // 기본 2페이지 + 상세페이지(조건부) + 성과페이지

    const pageNumbers = {
        cover: 1,
        anomalyDashboard: 2,
        anomalyDetails: showAnomalyDetails ? 3 : 0,
        performance: showAnomalyDetails ? 4 : 3,
    };

    // --- 렌더링 로직 ---

    if (isLoading) {
        return (
            <div
                style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: 'rgb(209, 213, 219)'
                }}
            >
                보고서 데이터를 불러오는 중...
            </div>
        );
    }

    if (!coverLetterData || !kpiData) {
        return (
            <div
                style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: 'rgb(209, 213, 219)'
                }}
            >
                보고서를 생성할 데이터가 없습니다.
            </div>
        );
    }

    return (
        // 최상위 컨테이너는 크기 설정 없이 내용만 감싸기
        <div
            ref={ref}
            className="flex flex-col items-center"
        >
            {/* 페이지 1: 커버 레터 - wrapper 제거 */}
            <ReportCoverLetter data={coverLetterData} />

            {/* 페이지 2: 이상 탐지 대시보드 - wrapper 제거 */}
            <AnomalyDashboardPage
                kpiData={kpiData}
                anomalyChartData={anomalyChartData}
                stageChartData={stageChartData}
                productAnomalyData={productAnomalyData}
                eventTimelineData={eventTimelineData}
                mostProblematicRoute={calculatedReportKpis.mostProblematicRoute}
                mostAffectedProduct={calculatedReportKpis.mostAffectedProduct}
                pageNumber={pageNumbers.anomalyDashboard}
                totalPages={totalPages}
            />


            {/* 페이지 3: 이상 탐지 상세 내역 - wrapper 제거 */}
            {showAnomalyDetails && (

                <AnomalyDetailsPage
                    anomalyTrips={anomalyTrips}
                    pageNumber={pageNumbers.anomalyDetails}
                    totalPages={totalPages}
                />
            )}

            {/* 페이지 4: 전체 성과 대시보드 - wrapper 제거 */}
            <PerformanceDashboardPage
                kpiData={kpiData}
                inventoryData={inventoryData}
                pageNumber={pageNumbers.performance}
                totalPages={totalPages}
                isLastPage={true}
            />

        </div>
    );
});

ReportView.displayName = 'ReportView';

export default ReportView;