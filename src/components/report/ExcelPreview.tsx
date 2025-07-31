'use client';

// import React, { useState, useMemo } from 'react';
import React, { useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useDashboard } from '@/context/dashboardContext';
import type { MergeTrip } from '@/context/MapDataContext';
import ExcelJS from 'exceljs';

import { formatPdfDateTime } from '@/types/file';

// 탭 버튼 스타일
const tabStyle = "px-4 py-2 text-sm font-semibold border-b-2 cursor-pointer";
const activeTabStyle = "border-blue-500 text-blue-500";
const inactiveTabStyle = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300";

const tableClass = "w-full text-sm text-left text-gray-500";
const theadClass = "text-xs text-gray-700 uppercase bg-gray-50";
const thClass = "px-6 py-3";
const tdClass = "px-6 py-4 bg-white border-b";

export interface ExcelPreviewRef {
    handleExcelDownload: () => Promise<void>;
}

const ExcelPreview = forwardRef<ExcelPreviewRef, {}>((props, ref) => {
    const [activeSheet, setActiveSheet] = useState('cover');
    const {
        coverData, kpiData, anomalyTrips, anomalyChartData, selectedFileId,
        stageChartData, inventoryData, calculatedReportKpis, user
    } = useDashboard();

    const showAnomalyDetails = anomalyTrips && anomalyTrips.length > 0;

    // AnomalyDetailsPage와 동일한 데이터 분류 로직
    const { fakeTrips, tamperTrips, cloneGroups, otherTrips } = useMemo(() => {
        if (!anomalyTrips) return { fakeTrips: [], tamperTrips: [], cloneGroups: [], otherTrips: [] };
        const sortByTime = (a: MergeTrip, b: MergeTrip) => a.from.eventTime - b.from.eventTime;
        const fakes = anomalyTrips.filter(t => t.anomalyTypeList.includes('fake')).sort(sortByTime);
        const tampers = anomalyTrips.filter(t => t.anomalyTypeList.includes('tamper')).sort(sortByTime);
        const clones = anomalyTrips.filter(t => t.anomalyTypeList.includes('clone')).sort(sortByTime);
        const others = anomalyTrips.filter(t => t.anomalyTypeList.includes('other')).sort(sortByTime);
        const groups: Record<string, MergeTrip[]> = {};
        clones.forEach(trip => {
            if (!groups[trip.epcCode]) groups[trip.epcCode] = [];
            groups[trip.epcCode].push(trip);
        });
        const groupedClones = Object.values(groups);
        return { fakeTrips: fakes, tamperTrips: tampers, cloneGroups: groupedClones, otherTrips: others };
    }, [anomalyTrips]);

    // ⭐⭐⭐⭐⭐⭐⭐⭐⭐
    if (!coverData || !kpiData || !user) {
        return <div className="p-8 text-center text-gray-500">미리보기 데이터를 불러오는 중...</div>;
    }

    const handleExcelDownload = async () => {
        console.log("Excel 다운로드 시작 (from ExcelPreview)");

        if (!coverData || !kpiData) {
            alert("보고서 데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        const workbook = new ExcelJS.Workbook();

        // --- 🎨 스타일 사전 정의 (재사용을 위해) ---
        const titleStyle: Partial<ExcelJS.Style> = { font: { name: '맑은 고딕', bold: true, size: 18 }, alignment: { vertical: 'middle', horizontal: 'center' } };
        const sectionTitleStyle: Partial<ExcelJS.Style> = { font: { name: '맑은 고딕', bold: true, size: 14 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } } };
        const headerStyle: Partial<ExcelJS.Style> = { font: { name: '맑은 고딕', bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }, alignment: { horizontal: 'center' } };
        const labelStyle: Partial<ExcelJS.Style> = { font: { name: '맑은 고딕', bold: true }, alignment: { horizontal: 'right' } };

        // =================================================================
        // 📄 시트 1: 표지 (Cover Letter)
        // =================================================================
        const coverSheet = workbook.addWorksheet('표지');

        // 보고서 제목
        coverSheet.mergeCells('A1:F1');
        coverSheet.getCell('A1').value = '물류 경로 이상탐지 AI 분석 보고서';
        coverSheet.getCell('A1').style = titleStyle;
        coverSheet.getRow(1).height = 40;

        // 보고서 정보
        coverSheet.addRow([]); // 빈 줄
        coverSheet.addRow(['', '분석 파일명', coverData.fileName]);
        coverSheet.addRow(['', '분석 기간', `${coverData.period ? formatPdfDateTime(coverData.period[0]) : '-'} ~ ${coverData.period ? formatPdfDateTime(coverData.period[1]) : '-'}`]);
        coverSheet.addRow(['', '작성자', user.userName || user.userId]);
        coverSheet.addRow(['', '분석 요청일', formatPdfDateTime(coverData.createdAt)]);

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
            const head = ['#', '유형', 'EPC Code', '제품명', '탐지 경로', '탐지 시간'];
            const headerRow = detailsSheet.addRow(head);
            headerRow.eachCell(cell => cell.style = headerStyle);

            const centerAlignStyle: Partial<ExcelJS.Style> = { alignment: { vertical: 'middle', horizontal: 'center' } };
            const noDataStyle: Partial<ExcelJS.Style> = { font: { color: { argb: 'FF888888' }, italic: true }, alignment: { horizontal: 'center' } };

            // --- 데이터 추가 및 셀 병합 (수정된 로직) ---

            // ✨ 1. 가. 위조(Fake) 데이터 추가
            let fakeCounter = 1; // 카운터를 루프 밖에서 초기화
            const fakeTitleRow = detailsSheet.addRow(['가. 위조(Fake) 의심 목록']);
            detailsSheet.mergeCells(`A${fakeTitleRow.number}:F${fakeTitleRow.number}`);
            fakeTitleRow.getCell(1).style = sectionTitleStyle;

            if (fakeTrips.length > 0) {
                fakeTrips.forEach(trip => {
                    detailsSheet.addRow([
                        fakeCounter++,
                        '위조(Fake)',
                        trip.epcCode,
                        trip.productName,
                        `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                        formatPdfDateTime(trip.to.eventTime)
                    ]);
                });
            } else {
                const noDataRow = detailsSheet.addRow(['해당 유형의 이상 징후가 없습니다.']);
                detailsSheet.mergeCells(`A${noDataRow.number}:F${noDataRow.number}`);
                noDataRow.getCell(1).style = noDataStyle;
            }

            // ✨ 2. 나. 변조(Tamper) 데이터 추가
            let tamperCounter = 1; // 카운터를 새로 초기화
            detailsSheet.addRow([]); // 빈 줄 추가로 섹션 구분
            const tamperTitleRow = detailsSheet.addRow(['나. 변조(Tamper) 의심 목록']);
            detailsSheet.mergeCells(`A${tamperTitleRow.number}:F${tamperTitleRow.number}`);
            tamperTitleRow.getCell(1).style = sectionTitleStyle;

            if (tamperTrips.length > 0) {
                tamperTrips.forEach(trip => {
                    detailsSheet.addRow([
                        tamperCounter++,
                        '변조(Tamper)',
                        trip.epcCode,
                        trip.productName,
                        `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                        formatPdfDateTime(trip.to.eventTime)
                    ]);
                });
            } else {
                const noDataRow = detailsSheet.addRow(['해당 유형의 이상 징후가 없습니다.']);
                detailsSheet.mergeCells(`A${noDataRow.number}:F${noDataRow.number}`);
                noDataRow.getCell(1).style = noDataStyle;
            }

            // ✨ 3. 다. 복제(Clone) 데이터 추가
            let cloneCounter = 1; // 그룹 단위 카운터를 새로 초기화
            detailsSheet.addRow([]); // 빈 줄 추가로 섹션 구분
            const cloneTitleRow = detailsSheet.addRow(['다. 복제(Clone) 의심 목록']);
            detailsSheet.mergeCells(`A${cloneTitleRow.number}:F${cloneTitleRow.number}`);
            cloneTitleRow.getCell(1).style = sectionTitleStyle;

            if (cloneGroups.length > 0) {
                cloneGroups.forEach(group => {
                    const startRowNum = detailsSheet.lastRow!.number + 1;
                    group.forEach((trip, index) => {
                        detailsSheet.addRow([
                            '', // 카운터는 나중에 한 번에 채움
                            '복제(Clone)',
                            trip.epcCode,
                            trip.productName,
                            `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                            formatPdfDateTime(trip.to.eventTime)
                        ]);
                    });
                    const endRowNum = detailsSheet.lastRow!.number;

                    detailsSheet.getCell(`A${startRowNum}`).value = cloneCounter++;

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
            } else {
                const noDataRow = detailsSheet.addRow(['해당 유형의 이상 징후가 없습니다.']);
                detailsSheet.mergeCells(`A${noDataRow.number}:F${noDataRow.number}`);
                noDataRow.getCell(1).style = noDataStyle;
            }

            let otherCounter = 1; // 그룹 단위 카운터를 새로 초기화
            detailsSheet.addRow([]); // 빈 줄 추가로 섹션 구분
            const otherTitleRow = detailsSheet.addRow(['다. 복제(Clone) 의심 목록']);
            detailsSheet.mergeCells(`A${otherTitleRow.number}:F${otherTitleRow.number}`);
            otherTitleRow.getCell(1).style = sectionTitleStyle;
            // 라. 신규 유형(other) 데이터 추가
            if (otherTrips.length > 0) {
                detailsSheet.addRow([]);
                const otherTitleRow = detailsSheet.addRow(['라. 신규 유형(Other) 목록']);
                detailsSheet.mergeCells(`A${otherTitleRow.number}:F${otherTitleRow.number}`);
                otherTitleRow.getCell(1).style = sectionTitleStyle;

                otherTrips.forEach(trip => {
                    detailsSheet.addRow([
                        otherCounter++, '신규 유형(Other)', trip.epcCode, trip.productName,
                        `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                        formatPdfDateTime(trip.to.eventTime) // *️⃣ 백연결 시 함수 변경?
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

    useImperativeHandle(ref, () => ({
        handleExcelDownload,
    }));

    // --- 시트 렌더링 함수들 ---

    const CoverSheet = () => (
        <div className="p-6 space-y-2">
            <h1 className="text-3xl font-bold mb-6">물류 경로 이상탐지 AI 분석 보고서</h1>
            <p><strong>분석 파일명:</strong> {coverData.fileName}</p>
            <p><strong>분석 기간:</strong> {`${formatPdfDateTime(coverData.period[0])} ~ ${formatPdfDateTime(coverData.period[1])}`}</p>
            <p><strong>작성자:</strong> {coverData.userName}</p>
            <p><strong>분석 요청일:</strong> {formatPdfDateTime(coverData.createdAt)}</p>
        </div>
    );

    const AnomalySummarySheet = () => (
        <div className="space-y-8">
            <table className={tableClass}>
                <thead className={theadClass}><tr ><th colSpan={2} className={`${thClass} text-base`}>주요 KPI 요약</th></tr></thead>
                <tbody>
                    <tr><td className={tdClass}>총 이상 이벤트(건)</td><td className={tdClass}>{kpiData.anomalyCount}</td></tr>
                    <tr><td className={tdClass}>최다 발생 구간</td><td className={tdClass}>{calculatedReportKpis.mostProblematicRoute}</td></tr>
                    <tr><td className={tdClass}>최다 발생 제품</td><td className={tdClass}>{calculatedReportKpis.mostAffectedProduct}</td></tr>
                </tbody>
            </table>
            <table className={tableClass}>
                <thead className={theadClass}><tr><th colSpan={2} className={`${thClass} text-base`}>이상 탐지 유형별 건수</th></tr><tr><th className={thClass}>유형</th><th className={thClass}>건수</th></tr></thead>
                <tbody>{anomalyChartData.map(item => <tr key={item.name}><td className={tdClass}>{item.name}</td><td className={tdClass}>{item.count}</td></tr>)}</tbody>
            </table>
            <table className={tableClass}>
                <thead className={theadClass}><tr><th colSpan={2} className={`${thClass} text-base`}>공급망 단계별 이상 이벤트</th></tr><tr><th className={thClass}>단계</th><th className={thClass}>건수</th></tr></thead>
                <tbody>{stageChartData.map(item => <tr key={item.name}><td className={tdClass}>{item.name}</td><td className={tdClass}>{item.count}</td></tr>)}</tbody>
            </table>
        </div>
    );

    const AnomalyDetailsSheet = () => {
        if (anomalyTrips.length === 0) {
            return <p className="p-6 text-gray-500">상세 추적이 필요한 이상 징후가 발견되지 않았습니다.</p>;
        }

        // ✨ 각 섹션의 카운터를 별도로 관리합니다.
        let fakeCounter = 1;
        let tamperCounter = 1;
        let cloneCounter = 1;
        let otherCounter = 1;

        return (
            <table className={tableClass}>
                <thead className={theadClass}>
                    <tr>
                        <th className={thClass}>#</th>
                        <th className={thClass}>유형</th>
                        <th className={thClass}>EPC Code</th>
                        <th className={thClass}>제품명</th>
                        <th className={thClass}>탐지 경로</th>
                        <th className={thClass}>탐지 시간</th>
                    </tr>
                </thead>
                <tbody>
                    {/* --- 가. 위조(Fake) --- */}
                    <tr className="bg-gray-100 font-bold">
                        <td colSpan={6} className={tdClass}>가. 위조(Fake) 의심 목록</td>
                    </tr>
                    {fakeTrips.length > 0 ? (
                        fakeTrips.map(trip => (
                            <tr key={trip.epcCode + fakeCounter}>
                                <td className={tdClass}>{fakeCounter++}</td>
                                <td className={tdClass}>위조(Fake)</td>
                                <td className={tdClass}>{trip.epcCode}</td>
                                <td className={tdClass}>{trip.productName}</td>
                                <td className={tdClass}>{`${trip.from.scanLocation} → ${trip.to.scanLocation}`}</td>
                                <td className={tdClass}>{formatPdfDateTime(trip.to.eventTime)}</td>
                            </tr>
                        ))
                    ) : (
                        // ✨ 데이터 없을 때 표시할 행
                        <tr>
                            <td colSpan={6} className={`${tdClass} text-center text-gray-400`}>
                                해당 유형의 이상 징후가 없습니다.
                            </td>
                        </tr>
                    )}

                    {/* --- 나. 변조(Tamper) --- */}
                    <tr className="bg-gray-100 font-bold">
                        <td colSpan={6} className={tdClass}>나. 변조(Tamper) 의심 목록</td>
                    </tr>
                    {tamperTrips.length > 0 ? (
                        tamperTrips.map(trip => (
                            <tr key={trip.epcCode + tamperCounter}>
                                <td className={tdClass}>{tamperCounter++}</td>
                                <td className={tdClass}>변조(Tamper)</td>
                                <td className={tdClass}>{trip.epcCode}</td>
                                <td className={tdClass}>{trip.productName}</td>
                                <td className={tdClass}>{`${trip.from.scanLocation} → ${trip.to.scanLocation}`}</td>
                                <td className={tdClass}>{formatPdfDateTime(trip.to.eventTime)}</td>
                            </tr>
                        ))
                    ) : (
                        // ✨ 데이터 없을 때 표시할 행
                        <tr>
                            <td colSpan={6} className={`${tdClass} text-center text-gray-400`}>
                                해당 유형의 이상 징후가 없습니다.
                            </td>
                        </tr>
                    )}

                    {/* --- 다. 복제(Clone) --- */}
                    <tr className="bg-gray-100 font-bold">
                        <td colSpan={6} className={tdClass}>다. 복제(Clone) 의심 목록</td>
                    </tr>
                    {cloneGroups.length > 0 ? (
                        cloneGroups.map(group => (
                            <React.Fragment key={group[0].epcCode}>
                                {group.map((trip: MergeTrip, index: number) => (
                                    <tr key={trip.epcCode + index}>
                                        {/* ✨ cloneCounter를 사용하도록 수정 */}
                                        {index === 0 && <td rowSpan={group.length} className={tdClass}>{cloneCounter++}</td>}
                                        {index === 0 && <td rowSpan={group.length} className={tdClass}>복제(Clone)</td>}
                                        {index === 0 && <td rowSpan={group.length} className={tdClass}>{trip.epcCode}</td>}
                                        {index === 0 && <td rowSpan={group.length} className={tdClass}>{trip.productName}</td>}
                                        <td className={tdClass}>{`${trip.from.scanLocation} → ${trip.to.scanLocation}`}</td>
                                        <td className={tdClass}>{formatPdfDateTime(trip.to.eventTime)}</td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))
                    ) : (
                        // ✨ 데이터 없을 때 표시할 행
                        <tr>
                            <td colSpan={6} className={`${tdClass} text-center text-gray-400`}>
                                해당 유형의 이상 징후가 없습니다.
                            </td>
                        </tr>
                    )}

                    {/* --- 라. 신규 유형(Other) --- */}
                    <tr className="bg-gray-100 font-bold">
                        <td colSpan={6} className={tdClass}>라. 신규 유형(Other) 목록</td>
                    </tr>
                    {otherTrips.length > 0 ? (
                        otherTrips.map(trip => (
                            <tr key={trip.epcCode + otherCounter}>
                                <td className={tdClass}>{otherCounter++}</td>
                                <td className={tdClass}>신규 유형(Other)</td>
                                <td className={tdClass}>{trip.epcCode}</td>
                                <td className={tdClass}>{trip.productName}</td>
                                <td className={tdClass}>{`${trip.from.scanLocation} → ${trip.to.scanLocation}`}</td>
                                <td className={tdClass}>{formatPdfDateTime(trip.to.eventTime)}</td>
                            </tr>
                        ))
                    ) : (
                        // ✨ 데이터 없을 때 표시할 행
                        <tr>
                            <td colSpan={6} className={`${tdClass} text-center text-gray-400`}>
                                해당 유형의 이상 징후가 없습니다.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        );
    };

    const PerformanceSheet = () => (
        <div className="space-y-8">
            <table className={tableClass}>
                <thead className={theadClass}><tr ><th colSpan={2} className={`${thClass} text-base`}>핵심 성과 지표</th></tr></thead>
                <tbody>
                    <tr><td className={tdClass}>판매율 (%)</td><td className={tdClass}>{kpiData.salesRate.toFixed(1)}</td></tr>
                    <tr><td className={tdClass}>출고율 (%)</td><td className={tdClass}>{kpiData.dispatchRate.toFixed(1)}</td></tr>
                    <tr><td className={tdClass}>전체 재고 비율 (%)</td><td className={tdClass}>{kpiData.inventoryRate.toFixed(1)}</td></tr>
                    <tr><td className={tdClass}>평균 리드 타임 (일)</td><td className={tdClass}>{kpiData.avgLeadTime.toFixed(1)}</td></tr>
                </tbody>
            </table>
            <table className={tableClass}>
                <thead className={theadClass}><tr><th colSpan={2} className={`${thClass} text-base`}>유형별 재고 분산</th></tr><tr><th className={thClass}>사업 단계</th><th className={thClass}>재고 수량</th></tr></thead>
                <tbody>{inventoryData.map(item => <tr key={item.businessStep}><td className={tdClass}>{item.businessStep}</td><td className={tdClass}>{item.value}</td></tr>)}</tbody>
            </table>
        </div>
    );

    const renderContent = () => {
        switch (activeSheet) {
            case 'cover': return <CoverSheet />;
            case 'summary': return <AnomalySummarySheet />;
            case 'details': return <AnomalyDetailsSheet />;
            case 'performance': return <PerformanceSheet />;
            default: return null;
        }
    };

    return (
        <div className="bg-white h-full flex flex-col text-black">
            <div className="border-b border-gray-200 flex-shrink-0">
                <nav className="-mb-px flex space-x-4 px-4" aria-label="Tabs">
                    <button onClick={() => setActiveSheet('cover')} className={`${tabStyle} ${activeSheet === 'cover' ? activeTabStyle : inactiveTabStyle}`}>표지</button>
                    <button onClick={() => setActiveSheet('summary')} className={`${tabStyle} ${activeSheet === 'summary' ? activeTabStyle : inactiveTabStyle}`}>이상 탐지 요약</button>
                    {anomalyTrips.length > 0 && <button onClick={() => setActiveSheet('details')} className={`${tabStyle} ${activeSheet === 'details' ? activeTabStyle : inactiveTabStyle}`}>상세 내역</button>}
                    <button onClick={() => setActiveSheet('performance')} className={`${tabStyle} ${activeSheet === 'performance' ? activeTabStyle : inactiveTabStyle}`}>성과 요약</button>
                </nav>
            </div>
            <div className="flex-grow overflow-auto p-4">
                {renderContent()}
            </div>
        </div>
    );
});

ExcelPreview.displayName = 'ExcelPreview';

// 7. ✨ export default를 파일 맨 아래에 둡니다.
export default ExcelPreview;