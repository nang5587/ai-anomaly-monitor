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
        <main className="w-full h-full p-8 overflow-y-auto">
        </main>
    );
}