'use client';

import { useState, useEffect, forwardRef, useMemo, useImperativeHandle, useRef } from "react";
import { useDashboard } from "@/context/dashboardContext";

import { CoverLetterProps, getLocationNameById, preparePdfData } from "@/types/file";

import ExcelJS from 'exceljs';

import ReportCoverLetter from "./ReportCoverLetter";
import AnomalyDashboardPage from "./AnomalyDashboardPage"
import AnomalyDetailsPage from "./AnomalyDetailsPage";
import PerformanceDashboardPage from "./PerformanceDashboardPage";

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).slice(0, -1);
};

const formatDateNum = (timestamp: number) => {
    if (!timestamp) return '날짜 정보 없음';
    return new Date(timestamp * 1000).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).slice(0, -1);
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

export interface ReportViewRef {
    handleExcelDownload: () => Promise<void>;
    getAnomalyDetailsPdfData: () => { head: string[][]; body: (string | number)[][] } | null;
}

interface ReportViewProps {
    pdfContentRef: React.RefObject<HTMLDivElement>;
}

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
        calculatedReportKpis,
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

    const showAnomalyDetails = anomalyTrips.length > 0;

    const { fakeTrips, tamperTrips, cloneGroups, otherTrips } = useMemo(() => {
        if (!anomalyTrips) return { fakeTrips: [], tamperTrips: [], cloneGroups: [], otherTrips: [] };
        const sortByTime = (a: any, b: any) => a.from.eventTime - b.from.eventTime;
        const fakes = anomalyTrips.filter(t => t.anomalyTypeList.includes('fake')).sort(sortByTime);
        const tampers = anomalyTrips.filter(t => t.anomalyTypeList.includes('tamper')).sort(sortByTime);
        const clones = anomalyTrips.filter(t => t.anomalyTypeList.includes('clone')).sort(sortByTime);
        const others = anomalyTrips.filter(t => t.anomalyTypeList.includes('other')).sort(sortByTime);
        const groups: Record<string, any[]> = {};
        clones.forEach(trip => {
            if (!groups[trip.epcCode]) groups[trip.epcCode] = [];
            groups[trip.epcCode].push(trip);
        });
        const groupedClones = Object.values(groups);
        return { fakeTrips: fakes, tamperTrips: tampers, cloneGroups: groupedClones, otherTrips: others };
    }, [anomalyTrips]);

    const handleExcelDownload = async () => {
        if (!coverData || !kpiData || !anomalyTrips || !anomalyChartData || !stageChartData || !productAnomalyData || !inventoryData || !user) {
            alert("보고서 데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }
        const workbook = new ExcelJS.Workbook();
        const titleStyle: Partial<ExcelJS.Style> = { font: { name: '맑은 고딕', bold: true, size: 18 }, alignment: { vertical: 'middle', horizontal: 'center' } };
        const sectionTitleStyle: Partial<ExcelJS.Style> = { font: { name: '맑은 고딕', bold: true, size: 14 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } } };
        const headerStyle: Partial<ExcelJS.Style> = { font: { name: '맑은 고딕', bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }, alignment: { horizontal: 'center' } };
        const labelStyle: Partial<ExcelJS.Style> = { font: { name: '맑은 고딕', bold: true }, alignment: { horizontal: 'right' } };

        const coverSheet = workbook.addWorksheet('표지');

        coverSheet.mergeCells('A1:F1');
        coverSheet.getCell('A1').value = 'AI 물류 경로 이상탐지 보고서';
        coverSheet.getCell('A1').style = titleStyle;
        coverSheet.getRow(1).height = 40;
        coverSheet.addRow([]);
        coverSheet.addRow(['', '분석 파일명', coverData.fileName]);
        coverSheet.addRow(['', '분석 기간', `${coverData.period ? formatDateTime(coverData.period[0]) : '-'} ~ ${coverData.period ? formatDateTime(coverData.period[1]) : '-'}`]);
        coverSheet.addRow(['', '작성자', user.userName || user.userId]);
        coverSheet.addRow(['', '분석 요청일', formatDateTime(coverData.createdAt)]);
        ['B3', 'B4', 'B5', 'B6'].forEach(key => {
            coverSheet.getCell(key).style = labelStyle;
        });
        coverSheet.getColumn('B').width = 20;
        coverSheet.getColumn('C').width = 50;


        const anomalySheet = workbook.addWorksheet('이상 탐지 요약');

        anomalySheet.mergeCells('A1:B1');
        anomalySheet.getCell('A1').value = '주요 KPI 요약';
        anomalySheet.getCell('A1').style = sectionTitleStyle;
        anomalySheet.addRow(['총 이상 이벤트(건)', kpiData.anomalyCount]);
        anomalySheet.addRow(['최다 발생 구간', calculatedReportKpis.mostProblematicRoute]);
        anomalySheet.addRow(['최다 발생 제품', calculatedReportKpis.mostAffectedProduct]);
        anomalySheet.addRow([]);
        anomalySheet.mergeCells('A6:B6');
        anomalySheet.getCell('A6').value = '이상 탐지 유형별 건수';
        anomalySheet.getCell('A6').style = sectionTitleStyle;
        const anomalyTypeHeader = anomalySheet.addRow(['유형', '건수']);
        anomalyTypeHeader.eachCell(cell => cell.style = headerStyle);
        anomalyChartData.forEach(item => {
            anomalySheet.addRow([item.name, item.count]);
        });
        anomalySheet.addRow([]);
        const stageStartRow = anomalySheet.lastRow!.number + 1;
        anomalySheet.mergeCells(`A${stageStartRow}:B${stageStartRow}`);
        anomalySheet.getCell(`A${stageStartRow}`).value = '공급망 단계별 이상 이벤트';
        anomalySheet.getCell(`A${stageStartRow}`).style = sectionTitleStyle;
        const stageHeader = anomalySheet.addRow(['단계', '건수']);
        stageHeader.eachCell(cell => cell.style = headerStyle);
        stageChartData.forEach(item => {
            anomalySheet.addRow([item.name, item.count]);
        });
        anomalySheet.getColumn('A').width = 30;
        anomalySheet.getColumn('B').width = 15;

        const detailsSheet = workbook.addWorksheet('이상 탐지 상세 내역');
        if (showAnomalyDetails) {
            const head = ['#', '유형', 'EPC Code', '제품명', '탐지 경로', '탐지 시간'];
            const headerRow = detailsSheet.addRow(head);
            headerRow.eachCell(cell => cell.style = headerStyle);
            let counter = 1;
            const centerAlignStyle: Partial<ExcelJS.Style> = { alignment: { vertical: 'middle', horizontal: 'center' } };
            if (fakeTrips.length > 0) {
                const fakeTitleRow = detailsSheet.addRow(['가. 위조(Fake) 의심 목록']);
                detailsSheet.mergeCells(`A${fakeTitleRow.number}:F${fakeTitleRow.number}`);
                fakeTitleRow.getCell(1).style = sectionTitleStyle;
                fakeTrips.forEach(trip => {
                    detailsSheet.addRow([
                        counter++, '위조(Fake)', trip.epcCode, trip.productName,
                        `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                        formatDateNum(trip.to.eventTime) // *️⃣ 백연결 시 함수 변경?
                    ]);
                });
            }
            if (tamperTrips.length > 0) {
                detailsSheet.addRow([]);
                const tamperTitleRow = detailsSheet.addRow(['나. 변조(Tamper) 의심 목록']);
                detailsSheet.mergeCells(`A${tamperTitleRow.number}:F${tamperTitleRow.number}`);
                tamperTitleRow.getCell(1).style = sectionTitleStyle;

                tamperTrips.forEach(trip => {
                    detailsSheet.addRow([
                        counter++, '변조(Tamper)', trip.epcCode, trip.productName,
                        `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                        formatDateNum(trip.to.eventTime) // *️⃣ 백연결 시 함수 변경?
                    ]);
                });
            }
            if (cloneGroups.length > 0) {
                detailsSheet.addRow([]);
                const cloneTitleRow = detailsSheet.addRow(['다. 복제(Clone) 의심 목록']);
                detailsSheet.mergeCells(`A${cloneTitleRow.number}:F${cloneTitleRow.number}`);
                cloneTitleRow.getCell(1).style = sectionTitleStyle;
                cloneGroups.forEach(group => {
                    const startRowNum = detailsSheet.lastRow!.number + 1;
                    group.forEach((trip, index) => {
                        detailsSheet.addRow([
                            index === 0 ? counter : '',
                            '복제(Clone)',
                            trip.epcCode,
                            trip.productName,
                            `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                            formatDate(trip.to.eventTime)
                        ]);
                    });
                    const endRowNum = detailsSheet.lastRow!.number;
                    detailsSheet.getCell(`A${startRowNum}`).value = counter++;
                    if (group.length > 1) {
                        detailsSheet.mergeCells(`A${startRowNum}:A${endRowNum}`); 
                        detailsSheet.mergeCells(`B${startRowNum}:B${endRowNum}`); 
                        detailsSheet.mergeCells(`C${startRowNum}:C${endRowNum}`); 
                        detailsSheet.mergeCells(`D${startRowNum}:D${endRowNum}`); 
                    }
                    ['A', 'B', 'C', 'D'].forEach(col => {
                        detailsSheet.getCell(`${col}${startRowNum}`).style = centerAlignStyle;
                    });
                });
            }

            if (otherTrips.length > 0) {
                detailsSheet.addRow([]);
                const otherTitleRow = detailsSheet.addRow(['라. AI탐지(Other) 목록']);
                detailsSheet.mergeCells(`A${otherTitleRow.number}:F${otherTitleRow.number}`);
                otherTitleRow.getCell(1).style = sectionTitleStyle;
                otherTrips.forEach(trip => {
                    detailsSheet.addRow([
                        counter++, 'AI탐지(Other)', trip.epcCode, trip.productName,
                        `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                        formatDateNum(trip.to.eventTime) // *️⃣ 백연결 시 함수 변경?
                    ]);
                });
            }
            detailsSheet.getColumn('A').alignment = { vertical: 'middle', horizontal: 'center' };
            detailsSheet.getColumn('B').alignment = { vertical: 'middle', horizontal: 'center' };
            detailsSheet.getColumn('C').alignment = { vertical: 'middle', horizontal: 'center' };
            detailsSheet.getColumn('D').alignment = { vertical: 'middle', horizontal: 'center' };
            detailsSheet.getColumn('E').alignment = { vertical: 'middle' };
            detailsSheet.getColumn('F').alignment = { vertical: 'middle' };
            detailsSheet.columns.forEach(column => {
                let maxLength = 0;
                column.eachCell!({ includeEmpty: true }, cell => {
                    const length = cell.value ? cell.value.toString().length : 10;
                    maxLength = Math.max(maxLength, length);
                });
                column.width = maxLength < 12 ? 12 : maxLength + 2;
            });
        } else {
            detailsSheet.mergeCells('A1:F10');
            const cell = detailsSheet.getCell('A1');
            cell.value = '분석 기간 내 상세 추적이 필요한 이상 징후가 발견되지 않았습니다.';
            cell.style = {
                font: { name: '맑은 고딕', size: 12 },
                alignment: { vertical: 'middle', horizontal: 'center', wrapText: true }
            };
            detailsSheet.getRow(1).height = 100;
        }

        const performanceSheet = workbook.addWorksheet('전체 성과 요약');
        performanceSheet.mergeCells('A1:B1');
        performanceSheet.getCell('A1').value = '핵심 성과 지표';
        performanceSheet.getCell('A1').style = sectionTitleStyle;
        performanceSheet.addRow(['판매율 (%)', kpiData.salesRate.toFixed(1)]);
        performanceSheet.addRow(['출고율 (%)', kpiData.dispatchRate.toFixed(1)]);
        performanceSheet.addRow(['전체 재고 비율 (%)', kpiData.inventoryRate.toFixed(1)]);
        performanceSheet.addRow(['평균 리드 타임 (일)', kpiData.avgLeadTime.toFixed(1)]);
        performanceSheet.addRow([]);
        const inventoryStartRow = performanceSheet.lastRow!.number + 1;
        performanceSheet.mergeCells(`A${inventoryStartRow}:B${inventoryStartRow}`);
        performanceSheet.getCell(`A${inventoryStartRow}`).value = '유형별 재고 분산';
        performanceSheet.getCell(`A${inventoryStartRow}`).style = sectionTitleStyle;
        const inventoryHeader = performanceSheet.addRow(['단계', '재고 수량']);
        inventoryHeader.eachCell(cell => cell.style = headerStyle);
        inventoryData.forEach(item => {
            performanceSheet.addRow([item.businessStep, item.value]);
        });
        performanceSheet.getColumn('A').width = 25;
        performanceSheet.getColumn('B').width = 15;

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
        } catch (error) {
            console.error("Excel 파일 생성 중 오류:", error);
            alert("Excel 파일 생성 중 오류가 발생했습니다.");
        }
    };

    const pdfTableData = useMemo(() => {
        return preparePdfData(fakeTrips, tamperTrips, cloneGroups, otherTrips);
    }, [fakeTrips, tamperTrips, cloneGroups, otherTrips]);

    useImperativeHandle(ref, () => ({
        handleExcelDownload,
        getAnomalyDetailsPdfData: () => {
            return pdfTableData;
        },
    }));

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
        <div ref={pdfContentRef} className="w-full flex flex-col items-center py-8">
            <div id="report-page-1"><ReportCoverLetter data={coverLetterData} /></div>
            <div id="report-page-2">
                <AnomalyDashboardPage
                    kpiData={kpiData}
                    anomalyChartData={anomalyChartData}
                    stageChartData={stageChartData}
                    productAnomalyData={productAnomalyData}
                    eventTimelineData={eventTimelineData}
                    mostProblematicRoute={calculatedReportKpis.mostProblematicRoute}
                    mostAffectedProduct={calculatedReportKpis.mostAffectedProduct}
                />
            </div>
            {showAnomalyDetails ? (
                <AnomalyDetailsPage
                    tableData={pdfTableData}
                />
            ) : (
                <div
                    id="report-page-no-details"
                    className="a4-page-container"
                >
                    <div className="a4-page-content">
                        <main className="flex-grow flex flex-col gap-8">
                            <h2
                                style={{
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    marginBottom: '8px',
                                    color: 'rgb(75, 85, 99)',
                                    margin: '0 0 8px 0'
                                }}>
                                3. 이상 탐지 상세 내역
                            </h2>
                            <div className="flex-grow flex items-center justify-center text-center text-gray-500 bg-gray-50 p-8 rounded-lg">
                                <p>분석 기간 내에 상세 추적이 필요한<br />위조(Fake), 변조(Tamper), 복제(Clone), AI탐지(Other) 유형의<br />이상 징후가 발견되지 않았습니다.</p>
                            </div>
                        </main>
                        <footer className="report-footer">

                        </footer>
                    </div>
                </div>
            )}
            <div id="report-page-final">
                <PerformanceDashboardPage
                    kpiData={kpiData}
                    inventoryData={inventoryData}
                    isLastPage={true}
                />
            </div>
        </div>
    );
});

ReportView.displayName = 'ReportView';

export default ReportView;