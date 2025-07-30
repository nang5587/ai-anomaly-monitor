'use client';

import { useState, useEffect, forwardRef, useMemo, useImperativeHandle, useRef } from "react";
import { useDashboard } from "@/context/dashboardContext";

import { CoverLetterProps, getLocationNameById, preparePdfData } from "@/types/file";

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
    }).slice(0, -1);
};

const formatDateNum = (timestamp: number) => {
    // 유효하지 않은 timestamp (0, null, undefined)에 대한 방어 코드
    if (!timestamp) return '날짜 정보 없음';
    // JavaScript의 Date 객체는 밀리초 단위를 사용하므로, 초 단위 timestamp에 1000을 곱합니다.
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
    pdfContentRef: React.RefObject<HTMLDivElement>; // 부모가 만든 ref를 받을 prop
}

// forwardRef를 사용하여 부모 컴포넌트(ReportClient)에서 생성한 ref를 받아옵니다.
const ReportView = forwardRef<ReportViewRef, ReportViewProps>(({ pdfContentRef }, ref) => {
    // const anomalyDetailsPageRef = useRef<AnomalyDetailsPageRef>(null);
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
    const pageOrder = {
        cover: 1,
        anomalyDashboard: 2,
        anomalyDetails: 3,
        performance: 4,
    };

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
        console.log("Excel 다운로드 시작");

        if (!coverData || !kpiData || !anomalyTrips || !anomalyChartData || !stageChartData || !productAnomalyData || !inventoryData || !user) {
            alert("보고서 데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        const workbook = new ExcelJS.Workbook();

        // --- 🎨 스타일 사전 정의 (재사용을 위해) ---
        const titleStyle: Partial<ExcelJS.Style> = { font: { name: '맑은 고딕', bold: true, size: 18 }, alignment: { vertical: 'middle', horizontal: 'center' } };
        const sectionTitleStyle: Partial<ExcelJS.Style> = { font: { name: '맑은 고딕', bold: true, size: 14 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } } };
        const headerStyle: Partial<ExcelJS.Style> = { font: { name: '맑은 고딕', bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }, alignment: { horizontal: 'center' } };
        const labelStyle: Partial<ExcelJS.Style> = { font: { name: '맑은 고딕', bold: true }, alignment: { horizontal: 'right' } };

        // =================================================================
        // 📄 시트 1: 표지 (Cover Letter)
        // =================================================================
        const coverSheet = workbook.addWorksheet('표지');

        // 보고서 제목
        coverSheet.mergeCells('A1:F1');
        coverSheet.getCell('A1').value = 'AI 물류 경로 이상탐지 보고서';
        coverSheet.getCell('A1').style = titleStyle;
        coverSheet.getRow(1).height = 40;

        // 보고서 정보
        coverSheet.addRow([]); // 빈 줄
        coverSheet.addRow(['', '분석 파일명', coverData.fileName]);
        coverSheet.addRow(['', '분석 기간', `${coverData.period ? formatDateTime(coverData.period[0]) : '-'} ~ ${coverData.period ? formatDateTime(coverData.period[1]) : '-'}`]);
        coverSheet.addRow(['', '작성자', user.userName || user.userId]);
        coverSheet.addRow(['', '분석 요청일', formatDateTime(coverData.createdAt)]);

        // 표지 스타일링
        ['B3', 'B4', 'B5', 'B6'].forEach(key => {
            coverSheet.getCell(key).style = labelStyle;
        });
        coverSheet.getColumn('B').width = 20;
        coverSheet.getColumn('C').width = 50;

        // =================================================================
        // 📄 시트 2: 이상 탐지 요약 (AnomalyDashboardPage)
        // =================================================================
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

        // =================================================================
        // 📄 시트 3: 이상 탐지 상세 내역 (AnomalyDetailsPage)
        // =================================================================
        const detailsSheet = workbook.addWorksheet('이상 탐지 상세 내역');

        if (showAnomalyDetails) {
            // ❗ useMemo 콜백을 즉시 실행하여 값을 얻습니다.
            const head = ['#', '유형', 'EPC Code', '제품명', '탐지 경로', '탐지 시간'];
            const headerRow = detailsSheet.addRow(head);
            headerRow.eachCell(cell => cell.style = headerStyle);

            let counter = 1;
            const centerAlignStyle: Partial<ExcelJS.Style> = { alignment: { vertical: 'middle', horizontal: 'center' } };

            // --- 데이터 추가 및 셀 병합 ---

            // 가. 위조(Fake) 데이터 추가
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

            // 나. 변조(Tamper) 데이터 추가
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

            // 다. 복제(Clone) 데이터 추가 (셀 병합)
            if (cloneGroups.length > 0) {
                detailsSheet.addRow([]);
                const cloneTitleRow = detailsSheet.addRow(['다. 복제(Clone) 의심 목록']);
                detailsSheet.mergeCells(`A${cloneTitleRow.number}:F${cloneTitleRow.number}`);
                cloneTitleRow.getCell(1).style = sectionTitleStyle;
                cloneGroups.forEach(group => {
                    const startRowNum = detailsSheet.lastRow!.number + 1; // 병합 시작 행 번호

                    group.forEach((trip, index) => {
                        // 각 행의 데이터를 일단 모두 추가
                        detailsSheet.addRow([
                            index === 0 ? counter : '', // 그룹의 첫 행에만 카운터 표시
                            '복제(Clone)', // 유형은 모든 행에 표시 (필터링 용이)
                            trip.epcCode,
                            trip.productName,
                            `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                            formatDate(trip.to.eventTime)
                        ]);
                    });

                    const endRowNum = detailsSheet.lastRow!.number; // 병합 마지막 행 번호

                    detailsSheet.getCell(`A${startRowNum}`).value = counter++;

                    // 2. 셀 병합 실행!
                    if (group.length > 1) {
                        detailsSheet.mergeCells(`A${startRowNum}:A${endRowNum}`); // 카운터
                        detailsSheet.mergeCells(`B${startRowNum}:B${endRowNum}`); // 유형
                        detailsSheet.mergeCells(`C${startRowNum}:C${endRowNum}`); // EPC Code
                        detailsSheet.mergeCells(`D${startRowNum}:D${endRowNum}`); // 제품명
                    }
                    ['A', 'B', 'C', 'D'].forEach(col => {
                        detailsSheet.getCell(`${col}${startRowNum}`).style = centerAlignStyle;
                    });
                });
            }

            // 라. 미분류(other) 데이터 추가
            if (otherTrips.length > 0) {
                detailsSheet.addRow([]);
                const otherTitleRow = detailsSheet.addRow(['라. 미분류(Other) 목록']);
                detailsSheet.mergeCells(`A${otherTitleRow.number}:F${otherTitleRow.number}`);
                otherTitleRow.getCell(1).style = sectionTitleStyle;

                otherTrips.forEach(trip => {
                    detailsSheet.addRow([
                        counter++, '미분류(Other)', trip.epcCode, trip.productName,
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
            // 데이터가 없을 때: "내역 없음" 메시지를 시트에 추가
            detailsSheet.mergeCells('A1:F10'); // 셀을 넉넉하게 병합
            const cell = detailsSheet.getCell('A1');
            cell.value = '분석 기간 내 상세 추적이 필요한 이상 징후가 발견되지 않았습니다.';
            cell.style = {
                font: { name: '맑은 고딕', size: 12 },
                alignment: { vertical: 'middle', horizontal: 'center', wrapText: true }
            };
            detailsSheet.getRow(1).height = 100; // 셀 높이 조절
        }


        // =================================================================
        // 📄 시트 4: 전체 성과 요약 (PerformanceDashboardPage)
        // =================================================================
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

        // =================================================================
        // 📁 파일 생성 및 다운로드
        // =================================================================
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
        // <div ref={pdfContentRef} className="flex flex-col items-center">
        <div ref={pdfContentRef} className="w-full flex flex-col items-center bg-gray-200 py-8">
            {/* 페이지 1: 커버 레터 - wrapper 제거 */}
            <div id="report-page-1"><ReportCoverLetter data={coverLetterData} /></div>

            {/* 페이지 2: 이상 탐지 대시보드 - wrapper 제거 */}
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

            {/* 페이지 3: 이상 탐지 상세 내역 - wrapper 제거 */}
            {showAnomalyDetails ? (
                // 데이터가 있을 때: 기존 AnomalyDetailsPage를 렌더링
                <AnomalyDetailsPage
                    tableData={pdfTableData}
                />
            ) : (
                // 데이터가 없을 때: "내역 없음"을 표시하는 컴포넌트 렌더링
                <div
                    id="report-page-no-details" // PDF 캡처를 위해 id 부여
                    className="a4-page-container" // 다른 페이지들과 동일한 A4 스타일 적용
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
                                <p>분석 기간 내에 상세 추적이 필요한<br />위조(Fake), 변조(Tamper), 복제(Clone), 미분류(Other) 유형의<br />이상 징후가 발견되지 않았습니다.</p>
                            </div>
                        </main>
                        <footer className="report-footer">

                        </footer>
                    </div>
                </div>
            )}
            {/* 페이지 4: 전체 성과 대시보드 - wrapper 제거 */}
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