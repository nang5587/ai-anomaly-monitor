'use client';

import { useRef } from 'react';
import { DashboardContext } from '../../context/dashboardContext';
import ReportView, { type ReportViewRef } from '@/components/report/ReportView';

import {
    mockCoverData,
    mockKpiData,
    mockAnomalyTrips,
    mockAnomalyChartData,
    mockStageChartData,
    mockProductAnomalyData,
    mockInventoryData,
    mockUser
} from './mockReportData';

export default function ExcelTestPage() {
    const reportViewRef = useRef<ReportViewRef>(null);

    const mockDashboardContextValue = {
        selectedFileId: 12345,
        coverData: mockCoverData,
        kpiData: mockKpiData,
        anomalyTrips: mockAnomalyTrips,
        anomalyChartData: mockAnomalyChartData,
        stageChartData: mockStageChartData,
        productAnomalyData: mockProductAnomalyData,
        eventTimelineData: [], 
        inventoryData: mockInventoryData,
        isLoading: false,
        user: mockUser,
        isFetchingMore: false,
        nextCursor: null,
        nodes: [],
        allTripsForMap: [],
    };

    const triggerExcelDownload = () => {
        if (reportViewRef.current?.handleExcelDownload) {
            reportViewRef.current.handleExcelDownload();
        } else {
            alert('ReportView ref가 준비되지 않았습니다.');
        }
    };

    return (
        <main className="p-8 overflow-y-auto">
            <h1 className="text-2xl font-bold mb-4">Excel 다운로드 테스트 페이지</h1>
            
            <div className="mb-8">
                <button
                    onClick={triggerExcelDownload}
                    className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
                >
                    Test Excel Download
                </button>
                <p className="text-sm text-gray-600 mt-2">
                    이 버튼을 누르면 아래 ReportView 컴포넌트 내부의 handleExcelDownload 함수가 실행됩니다.
                </p>
            </div>
            <DashboardContext.Provider value={mockDashboardContextValue}>
                <div className="border p-4 overscroll-y-auto">
                    <h2 className="text-xl font-semibold mb-2">ReportView 미리보기 (화면 렌더링용)</h2>
                    <ReportView ref={reportViewRef} pdfContentRef={useRef(null)} />
                </div>
            </DashboardContext.Provider>
        </main>
    );
}