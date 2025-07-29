'use client';

import React, { useState, useMemo } from 'react';
import { useDashboard } from '@/context/dashboardContext';
import type { MergeTrip } from '@/context/MapDataContext';

const formatDateTime = (dateInput: string | number | Date | undefined | null): string => {
    if (!dateInput) return '-';
    try {
        const date = typeof dateInput === 'number' ? new Date(dateInput * 1000) : new Date(dateInput);
        if (isNaN(date.getTime())) return '유효하지 않은 날짜';
        return date.toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: true,
        });
    } catch { return '날짜 변환 오류'; }
};

// 탭 버튼 스타일
const tabStyle = "px-4 py-2 text-sm font-semibold border-b-2 cursor-pointer";
const activeTabStyle = "border-blue-500 text-blue-500";
const inactiveTabStyle = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300";

const tableClass = "w-full text-sm text-left text-gray-500";
const theadClass = "text-xs text-gray-700 uppercase bg-gray-50";
const thClass = "px-6 py-3";
const tdClass = "px-6 py-4 bg-white border-b";

export default function ExcelPreview() {
    const [activeSheet, setActiveSheet] = useState('cover');
    const {
        coverData, kpiData, anomalyTrips, anomalyChartData,
        stageChartData, inventoryData, calculatedReportKpis
    } = useDashboard();

    // AnomalyDetailsPage와 동일한 데이터 분류 로직
    const { fakeTrips, tamperTrips, cloneGroups } = useMemo(() => {
        if (!anomalyTrips) return { fakeTrips: [], tamperTrips: [], cloneGroups: [] };
        const sortByTime = (a: MergeTrip, b: MergeTrip) => a.from.eventTime - b.from.eventTime;
        const fakes = anomalyTrips.filter(t => t.anomalyTypeList.includes('fake')).sort(sortByTime);
        const tampers = anomalyTrips.filter(t => t.anomalyTypeList.includes('tamper')).sort(sortByTime);
        const clones = anomalyTrips.filter(t => t.anomalyTypeList.includes('clone')).sort(sortByTime);
        const groups: Record<string, MergeTrip[]> = {};
        clones.forEach(trip => {
            if (!groups[trip.epcCode]) groups[trip.epcCode] = [];
            groups[trip.epcCode].push(trip);
        });
        const groupedClones = Object.values(groups);
        return { fakeTrips: fakes, tamperTrips: tampers, cloneGroups: groupedClones };
    }, [anomalyTrips]);

    if (!coverData || !kpiData) {
        return <div className="p-8 text-center text-gray-500">미리보기 데이터를 불러오는 중...</div>;
    }

    // --- 시트 렌더링 함수들 ---

    const CoverSheet = () => (
        <div className="p-6 space-y-2">
            <h1 className="text-3xl font-bold mb-6">물류 경로 이상탐지 AI 분석 보고서</h1>
            <p><strong>분석 파일명:</strong> {coverData.fileName}</p>
            <p><strong>분석 기간:</strong> {`${formatDateTime(coverData.period[0])} ~ ${formatDateTime(coverData.period[1])}`}</p>
            <p><strong>작성자:</strong> {coverData.userName}</p>
            <p><strong>분석 요청일:</strong> {formatDateTime(coverData.createdAt)}</p>
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
        let counter = 1;
        return (
            <table className={tableClass}>
                <thead className={theadClass}>
                    <tr>
                        <th className={thClass}>#</th><th className={thClass}>유형</th><th className={thClass}>EPC Code</th>
                        <th className={thClass}>제품명</th><th className={thClass}>탐지 경로</th><th className={thClass}>탐지 시간</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Fake */}
                    {fakeTrips.length > 0 && <tr className="bg-gray-100 font-bold"><td colSpan={6} className={tdClass}>가. 위조(Fake) 의심 목록</td></tr>}
                    {fakeTrips.map(trip => <tr key={trip.epcCode + counter}><td className={tdClass}>{counter++}</td><td className={tdClass}>위조(Fake)</td><td className={tdClass}>{trip.epcCode}</td><td className={tdClass}>{trip.productName}</td><td className={tdClass}>{`${trip.from.scanLocation} → ${trip.to.scanLocation}`}</td><td className={tdClass}>{formatDateTime(trip.to.eventTime)}</td></tr>)}
                    {/* Tamper */}
                    {tamperTrips.length > 0 && <tr className="bg-gray-100 font-bold"><td colSpan={6} className={tdClass}>나. 변조(Tamper) 의심 목록</td></tr>}
                    {tamperTrips.map(trip => <tr key={trip.epcCode + counter}><td className={tdClass}>{counter++}</td><td className={tdClass}>변조(Tamper)</td><td className={tdClass}>{trip.epcCode}</td><td className={tdClass}>{trip.productName}</td><td className={tdClass}>{`${trip.from.scanLocation} → ${trip.to.scanLocation}`}</td><td className={tdClass}>{formatDateTime(trip.to.eventTime)}</td></tr>)}
                    {/* Clone */}
                    {cloneGroups.length > 0 && <tr className="bg-gray-100 font-bold"><td colSpan={6} className={tdClass}>다. 복제(Clone) 의심 목록</td></tr>}
                    {cloneGroups.map(group => (
                        <React.Fragment key={group[0].epcCode}>
                            {group.map((trip: MergeTrip, index: number) => (
                                <tr key={trip.epcCode + index}>
                                    {index === 0 && <td rowSpan={group.length} className={tdClass}>{counter++}</td>}
                                    {index === 0 && <td rowSpan={group.length} className={tdClass}>복제(Clone)</td>}
                                    {index === 0 && <td rowSpan={group.length} className={tdClass}>{trip.epcCode}</td>}
                                    {index === 0 && <td rowSpan={group.length} className={tdClass}>{trip.productName}</td>}
                                    <td className={tdClass}>{`${trip.from.scanLocation} → ${trip.to.scanLocation}`}</td>
                                    <td className={tdClass}>{formatDateTime(trip.to.eventTime)}</td>
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
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
}