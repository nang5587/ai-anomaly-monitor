// src/app/report/AnomalyDashboardPage.tsx

'use client';

import { useMemo } from "react";
import dynamic from 'next/dynamic';

// 차트 컴포넌트 동적 import
const DynamicAnomalyChart = dynamic(() => import('@/components/dashboard/AnomalyEventsChart'), { ssr: false });
const DynamicStageLollipopChart = dynamic(() => import('@/components/dashboard/StageLollipopChart'), { ssr: false });
const DynamicProductChart = dynamic(() => import('@/components/dashboard/ProductAnomalyChart'), { ssr: false });
const DynamicTimelineChart = dynamic(() => import('@/components/dashboard/AnomalyTimelineChart'), { ssr: false });

// 필요한 타입들을 import 합니다.
import { KpiSummary } from "@/types/api";
import { ByProductResponse } from "@/types/data";
import { StageBarDataPoint } from "@/components/dashboard/StageLollipopChart";
import { INSIGHTS_TEMPLATES, ACTION_ITEMS_TEMPLATES } from './templates'
import { AnomalyType } from "@/types/api";

// --- 타입 정의 ---
// 이 페이지가 필요로 하는 데이터의 타입을 명확히 합니다.
interface AnomalyChartPoint {
    name: string;
    type: AnomalyType;
    count: number;
}

interface AnomalyDashboardProps {
    kpiData: KpiSummary;
    anomalyChartData: AnomalyChartPoint[];
    stageChartData: StageBarDataPoint[];
    productAnomalyData: ByProductResponse;
    eventTimelineData: any[];
    mostProblematicRoute: string;
    mostAffectedProduct: string;
}

// 보고서용 KPI 카드를 새로 정의합니다.
const ReportKpiCard = ({ title, value, description }: { title: string; value: string; description?: string }) => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-500">{title}</p>
        <p className={`text-3xl font-bold mt-1 ${title.includes('이상') ? 'text-red-600' : 'text-gray-800'}`}>{value}</p>
        {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
    </div>
);

// --- 메인 컴포넌트 ---
export default function AnomalyDashboardPage({
    kpiData,
    anomalyChartData,
    stageChartData,
    productAnomalyData,
    eventTimelineData
}: AnomalyDashboardProps) {
    // 프론트엔드에서 계산해야 하는 추가적인 KPI
    const mostFrequentAnomaly = useMemo(() => {
        if (!anomalyChartData || anomalyChartData.length === 0) {
            return { type: null, name: 'N/A', count: 0 };
        }
        const sorted = [...anomalyChartData].sort((a, b) => b.count - a.count);
        return sorted[0];
    }, [anomalyChartData]);

    const percentage = ((mostFrequentAnomaly.count / kpiData.anomalyCount) * 100).toFixed(0);

    const mainInsight = mostFrequentAnomaly.type
        ? INSIGHTS_TEMPLATES[mostFrequentAnomaly.type].replace('[PERCENTAGE]', percentage)
        : "데이터 분석 중 오류가 발생했습니다.";

    const actionItems = mostFrequentAnomaly.type ? ACTION_ITEMS_TEMPLATES[mostFrequentAnomaly.type] : null;

    return (
        <div className="p-10 bg-white text-black flex flex-col font-sans" style={{ width: '210mm', minHeight: '297mm' }}>
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-center pb-4">
                    Ⅰ. 이상 탐지 요약 대시보드
                </h1>
            </header>

            <main className="flex-grow flex flex-col space-y-10">
                {/* 1. 핵심 요약 지표 (KPIs) */}
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">1. 핵심 지표 요약 (Executive Summary)</h2>
                    <div className="grid grid-cols-4 gap-4">
                        <ReportKpiCard
                            title="총 이상 발생 건수"
                            value={(kpiData?.anomalyCount ?? 0).toLocaleString()}
                            description="전체 이벤트 대비 이상 비율"
                        />
                        <ReportKpiCard
                            title="이상 발생률"
                            value={`${((kpiData?.anomalyRate ?? 0) * 100).toFixed(2)}%`}
                            description={`총 ${kpiData.totalTripCount.toLocaleString()}건 중`}
                        />
                        <ReportKpiCard
                            title="최다 발생 유형"
                            value={mostFrequentAnomaly}
                            description="가장 빈번하게 발생한 이상 유형"
                        />
                        <ReportKpiCard
                            title="고유 제품 수"
                            value={(kpiData?.uniqueProductCount ?? 0).toLocaleString()}
                            description="분석에 포함된 총 제품 종류"
                        />
                    </div>
                </section>

                <section>
                    <h2 className="...">2. 분석 요약 및 권고</h2>
                    <div className="grid grid-cols-2 gap-6 ...">
                        <div>
                            <h3 className="...">주요 발견사항 (Key Insights)</h3>
                            <ul className="list-disc list-inside ...">
                                <li><strong>가장 큰 문제점:</strong> {mainInsight}</li>
                                <li><strong>집중 발생 구간:</strong> {mostProblematicRoute}</li>
                                <li><strong>제품별 특이사항:</strong> {mostAffectedProduct}</li>
                            </ul>
                        </div>
                        {actionItems && (
                            <div>
                                <h3 className="...">권장 조치 (Action Items)</h3>
                                <ul className="list-disc list-inside ...">
                                    <li><strong>단기 조치:</strong> {actionItems.short.replace('[ROUTE]', mostProblematicRoute)}</li>
                                    <li><strong>중기 조치:</strong> {actionItems.mid}</li>
                                    <li><strong>장기 조치:</strong> {actionItems.long}</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </section>

                {/* 2. 시각화 섹션 */}
                <section className="grid grid-cols-2 grid-rows-2 gap-x-8 gap-y-10 flex-grow">

                    {/* --- 1행 1열: 이상 탐지 유형별 상세 --- */}
                    <div className="flex flex-col">
                        <h2 className="text-lg font-semibold mb-4 text-center text-gray-700">3.1 이상 탐지 유형별 상세</h2>
                        <div className="bg-gray-50 p-4 rounded-lg border flex-grow">
                            <DynamicAnomalyChart data={anomalyChartData} />
                        </div>
                    </div>

                    {/* --- 1행 2열: 공급망 단계별 이상 발생 --- */}
                    <div className="flex flex-col">
                        <h2 className="text-lg font-semibold mb-4 text-center text-gray-700">3.2 공급망 단계별 이상 발생</h2>
                        <div className="bg-gray-50 p-4 rounded-lg border flex-grow">
                            <DynamicStageLollipopChart data={stageChartData} />
                        </div>
                    </div>

                    {/* --- 2행 1열: 제품별 이상 발생 추이 --- */}
                    <div className="flex flex-col">
                        <h2 className="text-lg font-semibold mb-4 text-center text-gray-700">3.3 제품별 이상 발생 추이</h2>
                        <div className="bg-gray-50 p-4 rounded-lg border flex-grow">
                            <DynamicProductChart data={productAnomalyData} />
                        </div>
                    </div>

                    {/* --- 2행 2열: 요일별 이상 발생 추이 --- */}
                    <div className="flex flex-col">
                        <h2 className="text-lg font-semibold mb-4 text-center text-gray-700">2.4 요일별 이상 발생 추이</h2>
                        <div className="bg-gray-50 p-4 rounded-lg border flex-grow">
                            <DynamicTimelineChart data={eventTimelineData} />
                        </div>
                    </div>

                </section>
            </main>

            <footer className="mt-auto pt-8 border-t text-center text-xs text-gray-500">
                <p>Page 2</p>
            </footer>
        </div>
    );
}