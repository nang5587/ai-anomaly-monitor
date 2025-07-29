'use client';

import { useRef } from 'react';
import { DashboardContext } from '../../context/dashboardContext'; // ❗ Provider가 아닌 Context 자체를 import
import ReportView, { type ReportViewRef } from '@/components/report/ReportView'; // ❗ ReportView의 실제 경로로 수정

// 1. 위에서 만든 목업 데이터를 import 합니다.
import {
    mockCoverData,
    mockKpiData,
    mockAnomalyTrips,
    mockAnomalyChartData,
    mockStageChartData,
    mockProductAnomalyData,
    mockInventoryData,
    mockUser
} from './mockReportData'; // 목업 데이터 파일 경로

export default function ExcelTestPage() {
    // 2. ReportView 컴포넌트를 참조할 ref를 생성합니다.
    const reportViewRef = useRef<ReportViewRef>(null);

    // 3. ReportView가 useDashboard()를 통해 사용할 가짜 데이터 객체를 만듭니다.
    //    useDashboard 훅의 반환 타입과 동일한 구조로 만듭니다.
    const mockDashboardContextValue = {
        selectedFileId: 12345,
        coverData: mockCoverData,
        kpiData: mockKpiData,
        anomalyTrips: mockAnomalyTrips,
        anomalyChartData: mockAnomalyChartData,
        stageChartData: mockStageChartData,
        productAnomalyData: mockProductAnomalyData,
        eventTimelineData: [], // 필요하면 추가
        inventoryData: mockInventoryData,
        isLoading: false,
        user: mockUser,
        // 테스트에 필요 없는 다른 값들은 null 또는 기본값으로 설정
        isFetchingMore: false,
        nextCursor: null,
        nodes: [],
        allTripsForMap: [],
        // ...
    };

    const triggerExcelDownload = () => {
        // 5. 버튼 클릭 시 ref를 통해 ReportView의 handleExcelDownload 함수를 직접 호출!
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

            {/* 
              4. DashboardContext.Provider로 ReportView를 감싸고,
                 value prop에 우리가 만든 가짜 데이터를 전달합니다.
                 이렇게 하면 ReportView 내부의 useDashboard()는 이 가짜 데이터를 사용하게 됩니다.
            */}
            {/* @ts-ignore - 테스트 목적이므로 전체 context 타입을 맞추지 않아도 되도록 무시 */}
            <DashboardContext.Provider value={mockDashboardContextValue}>
                <div className="border p-4 overscroll-y-auto">
                    <h2 className="text-xl font-semibold mb-2">ReportView 미리보기 (화면 렌더링용)</h2>
                    {/* ref를 전달하여 ReportView의 함수에 접근할 수 있도록 합니다. */}
                    <ReportView ref={reportViewRef} pdfContentRef={useRef(null)} />
                </div>
            </DashboardContext.Provider>
        </main>
    );
}