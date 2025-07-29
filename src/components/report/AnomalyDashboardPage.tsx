// src/app/report/AnomalyDashboardPage.tsx

'use client';

import { useMemo } from "react";
import dynamic from 'next/dynamic';

// 차트 컴포넌트 동적 import
const DynamicAnomalyChart = dynamic(() => import('@/components/dashboard/AnomalyEventsChart'), { ssr: false });
const DynamicStageLollipopChart = dynamic(() => import('./StageLollipopChart'), { ssr: false });
const DynamicProductChart = dynamic(() => import('./ProductAnomalyChart'), { ssr: false });
const DynamicTimelineChart = dynamic(() => import('./AnomalyTimelineChart'), { ssr: false });

// 필요한 타입들을 import 합니다.
import { KpiSummary } from "@/types/api";
import { ByProductResponse } from "@/types/data";
import { StageBarDataPoint } from '@/types/chart';
import { INSIGHTS_TEMPLATES, ACTION_ITEMS_TEMPLATES } from './Templates'
import { AnomalyType } from "@/types/api";

// --- 타입 정의 ---
interface AnomalyChartPoint {
    name: string;
    type: AnomalyType;
    count: number;
    color1: string;
    color2: string;
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

// 보고서용 KPI 카드 - 더 컴팩트하게 수정
const ReportKpiCard = ({ title, value, description }: { title: string; value: string; description?: string }) => (
    <div
        style={{
            backgroundColor: 'rgb(249, 250, 251)',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid rgb(229, 231, 235)',
            textAlign: 'center'
        }}
    >
        <p style={{ fontSize: '12px', color: 'rgb(107, 114, 128)', margin: '0 0 4px 0' }}>{title}</p>
        <p
            style={{
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '0',
                color: title.includes('이상') ? 'rgb(220, 38, 38)' : 'rgb(31, 41, 55)'
            }}
        >
            {value}
        </p>
        {description && (
            <p style={{ fontSize: '10px', color: 'rgb(156, 163, 175)', margin: '4px 0 0 0' }}>
                {description}
            </p>
        )}
    </div>
);

// --- 메인 컴포넌트 ---
export default function AnomalyDashboardPage({
    kpiData,
    anomalyChartData,
    stageChartData,
    productAnomalyData,
    eventTimelineData,
    mostProblematicRoute,
    mostAffectedProduct,
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

    return (
        <div
            style={{
                width: '210mm',
                height: '297mm',
                backgroundColor: 'rgb(255, 255, 255)',
                color: 'rgb(0, 0, 0)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                padding: '10mm', // 더 작은 여백
                boxSizing: 'border-box',
                pageBreakAfter: 'always',
                breakAfter: 'page'
            }}
        >
            {/* 헤더 - 더 컴팩트하게 */}
            <header style={{ marginBottom: '16px', flexShrink: 0 }}>
                <h1
                    style={{
                        fontSize: '22px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        paddingBottom: '12px',
                        color: 'rgb(0, 0, 0)',
                        margin: '0'
                    }}
                >
                    Ⅰ. 이상 탐지 요약
                </h1>
            </header>

            {/* 메인 콘텐츠 - 공간 최적화 */}
            <main
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    overflow: 'hidden'
                }}
            >
                {/* 1. 핵심 요약 지표 (KPIs) - 더 컴팩트하게 */}
                <section style={{ flexShrink: 0 }}>
                    <h2
                        style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            color: 'rgb(75, 85, 99)',
                            margin: '0 0 8px 0'
                        }}
                    >
                        1. 핵심 지표 요약
                    </h2>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '8px'
                        }}
                    >
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
                            value={mostFrequentAnomaly.name}
                            description="가장 빈번하게 발생한 이상 유형"
                        />
                        <ReportKpiCard
                            title="고유 제품 수"
                            value={(kpiData?.uniqueProductCount ?? 0).toLocaleString()}
                            description="분석에 포함된 총 제품 종류"
                        />
                    </div>
                </section>

                {/* 2. 분석 요약 - 더 컴팩트하게 */}
                <section style={{ flexShrink: 0 }}>
                    <h2
                        style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            color: 'rgb(75, 85, 99)',
                            margin: '0 0 8px 0'
                        }}
                    >
                        2. 분석 요약 및 권고
                    </h2>
                    <div
                        style={{
                            backgroundColor: 'rgb(254, 252, 232)',
                            borderLeft: '4px solid rgb(252, 211, 77)',
                            padding: '12px',
                            borderTopRightRadius: '6px',
                            borderBottomRightRadius: '6px',
                            fontSize: '13px'
                        }}
                    >
                        <h3 style={{ fontWeight: 'bold', color: 'rgb(146, 64, 14)', margin: '0 0 8px 0' }}>
                            주요 발견사항
                        </h3>
                        <ul
                            style={{
                                listStyleType: 'disc',
                                listStylePosition: 'inside',
                                margin: '0',
                                padding: '0',
                                color: 'rgb(0, 0, 0)',
                                lineHeight: '1.4'
                            }}
                        >
                            <li style={{ marginBottom: '4px' }}><strong>가장 큰 문제점:</strong> {mainInsight}</li>
                            <li style={{ marginBottom: '4px' }}><strong>집중 발생 구간:</strong> {mostProblematicRoute}</li>
                            <li><strong>제품별 특이사항:</strong> {mostAffectedProduct}</li>
                        </ul>
                    </div>
                </section>

                {/* 3. 시각화 섹션 - 남은 공간 모두 활용 */}
                <section
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gridTemplateRows: 'repeat(2, 1fr)',
                        gap: '8px',
                        flex: 1,
                        minHeight: '100mm' // 최소 높이 보장으로 차트 영역 확대
                    }}
                >
                    {/* 차트 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '0' }}>
                        <h3
                            style={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                color: 'rgb(75, 85, 99)',
                                margin: '0 0 4px 0'
                            }}
                        >
                            가. 이상 탐지 유형별 상세
                        </h3>
                        <p
                            style={{
                                fontSize: '10px',
                                textAlign: 'right',
                                color: 'rgb(75, 85, 99)',
                                margin: '0 0 4px 0'
                            }}
                        >
                            (단위: 건)
                        </p>
                        <div
                            style={{
                                backgroundColor: 'rgb(249, 250, 251)',
                                padding: '8px',
                                borderRadius: '6px',
                                border: '1px solid rgb(229, 231, 235)',
                                flex: 1,
                                minHeight: '0'
                            }}
                        >
                            <DynamicAnomalyChart data={anomalyChartData} />
                        </div>
                    </div>

                    {/* 차트 2 */}
                    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '0' }}>
                        <h3
                            style={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                color: 'rgb(75, 85, 99)',
                                margin: '0 0 4px 0'
                            }}
                        >
                            나. 공급망 단계별 이상 발생
                        </h3>
                        <p
                            style={{
                                fontSize: '10px',
                                textAlign: 'right',
                                color: 'rgb(75, 85, 99)',
                                margin: '0 0 4px 0'
                            }}
                        >
                            (단위: 건)
                        </p>
                        <div
                            style={{
                                backgroundColor: 'rgb(249, 250, 251)',
                                padding: '8px',
                                borderRadius: '6px',
                                border: '1px solid rgb(229, 231, 235)',
                                flex: 1,
                                minHeight: '0'
                            }}
                        >
                            <DynamicStageLollipopChart data={stageChartData} />
                        </div>
                    </div>

                    {/* 차트 3 */}
                    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '0' }}>
                        <h3
                            style={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                color: 'rgb(75, 85, 99)',
                                margin: '0 0 4px 0'
                            }}
                        >
                            다. 제품별 이상 발생 추이
                        </h3>
                        <p
                            style={{
                                fontSize: '10px',
                                textAlign: 'right',
                                color: 'rgb(75, 85, 99)',
                                margin: '0 0 4px 0'
                            }}
                        >
                            (단위: 건)
                        </p>
                        <div
                            style={{
                                backgroundColor: 'rgb(249, 250, 251)',
                                padding: '8px',
                                borderRadius: '6px',
                                border: '1px solid rgb(229, 231, 235)',
                                flex: 1,
                                minHeight: '0'
                            }}
                        >
                            <DynamicProductChart data={productAnomalyData} />
                        </div>
                    </div>

                    {/* 차트 4 */}
                    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '0' }}>
                        <h3
                            style={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                color: 'rgb(75, 85, 99)',
                                margin: '0 0 4px 0'
                            }}
                        >
                            라. 요일별 이상 발생 추이
                        </h3>
                        <p
                            style={{
                                fontSize: '10px',
                                textAlign: 'right',
                                color: 'rgb(75, 85, 99)',
                                margin: '0 0 4px 0'
                            }}
                        >
                            (단위: 건)
                        </p>
                        <div
                            style={{
                                backgroundColor: 'rgb(249, 250, 251)',
                                padding: '8px',
                                borderRadius: '6px',
                                border: '1px solid rgb(229, 231, 235)',
                                flex: 1,
                                minHeight: '0'
                            }}
                        >
                            <DynamicTimelineChart data={eventTimelineData} />
                        </div>
                    </div>
                </section>
            </main>

            {/* 푸터 - 더 컴팩트하게 */}
            <footer
                style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    textAlign: 'center',
                    fontSize: '10px',
                    color: 'rgb(107, 114, 128)',
                    flexShrink: 0
                }}
            >

            </footer>
        </div>
    );
}