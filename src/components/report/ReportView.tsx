'use client';

import { useState, useEffect, forwardRef, useMemo, useImperativeHandle } from "react";
import { useDashboard } from "@/context/dashboardContext";

import { CoverLetterProps, getLocationNameById } from "@/types/file";

import ExcelJS from 'exceljs';

// PDF 페이지들
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

export interface ReportViewRef {
    handleExcelDownload: () => Promise<void>;
}

interface ReportViewProps {
    pdfContentRef: React.RefObject<HTMLDivElement>; // 부모가 만든 ref를 받을 prop
}

// forwardRef를 사용하여 부모 컴포넌트(ReportClient)에서 생성한 ref를 받아옵니다.
const ReportView = forwardRef<ReportViewRef, ReportViewProps>(({ pdfContentRef }, ref) => {
    const {
        selectedFileId,
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



    const handleExcelDownload = async () => {
        console.log("Excel 다운로드 시작");

        if (!coverData || !kpiData || !anomalyTrips || !productAnomalyData || !inventoryData || !user) {
            alert("보고서 데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('AI 분석 보고서');

        // 1. 커버 레터 데이터 추가 (예시)
        sheet.addRow(['보고서 제목', '물류 경로 이상탐지 분석 보고서']);
        sheet.addRow(['분석 파일명', coverData.fileName]);
        sheet.addRow(['분석 기간', `${coverData.period ? formatDateTime(coverData.period[0]) : '-'} ~ ${coverData.period ? formatDateTime(coverData.period[1]) : '-'}`]);
        sheet.addRow(['작성자', user?.userName]);

        // 2. KPI 요약 데이터 추가 (예시)
        sheet.addRow(['KPI 요약',]);
        sheet.addRow(['총 Trip 수', kpiData.totalTripCount]);
        sheet.addRow(['고유 제품 수', kpiData.uniqueProductCount]);
        sheet.addRow(['이상 징후 수', kpiData.anomalyCount]);

        // 3. 이상 징후 데이터 추가 (예시, anomalyTrips)
        sheet.addRow(['이상 징후 상세 내역']);
        anomalyTrips.forEach(trip => {
            sheet.addRow([trip.epcCode, trip.productName, trip.from.scanLocation, trip.to.scanLocation, trip.eventType, trip.anomalyTypeList ? trip.anomalyTypeList.join(', ') : '']);
        });

        // 4. 재고 데이터 추가 (예시, inventoryData)
        sheet.addRow(['재고 분산 현황']);
        inventoryData.forEach(item => {
            sheet.addRow([item.businessStep, item.value]);
        });

        // 5. 등등 필요한 데이터 추가

        // 파일 생성 및 다운로드
        try {
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `report_${selectedFileId || 'unknown'}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            console.log("Excel 생성 및 다운로드 완료");
            alert("Excel 파일이 성공적으로 다운로드되었습니다!");
        } catch (error) {
            console.error("Excel 생성 및 다운로드 중 오류:", error);
            alert("Excel 파일 생성 및 다운로드 중 오류가 발생했습니다.");
        }
    };

    useImperativeHandle(ref, () => ({
        handleExcelDownload,
    }));

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
            ref={pdfContentRef}
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