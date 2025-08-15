'use client';

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Chart, ChartType } from "chart.js";
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { KpiSummary, InventoryDataPoint } from "@/types/api";
import { getNodeName } from "@/types/colorUtils";

declare module 'chart.js' {
    interface PluginOptionsByType<TType extends ChartType> {
        doughnutCenterText?: {
            total: number;
        }
    }
}

const doughnutCenterTextPlugin = {
    id: 'doughnutCenterText',
    beforeDraw: (chart: Chart) => {
        const total = chart.config.options?.plugins?.doughnutCenterText?.total;
        if (!total) return;

        const { ctx, chartArea: { top, right, bottom, left, width, height } } = chart;
        ctx.save();

        ctx.font = 'bold 20px sans-serif';
        ctx.fillStyle = 'rgb(55, 65, 81)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const centerX = left + width / 2;
        const centerY = top + height / 2;

        ctx.fillText(total.toLocaleString(), centerX, centerY - 10);

        ctx.font = 'normal 14px sans-serif';
        ctx.fillStyle = 'rgb(107, 114, 128)';

        ctx.fillText('총 재고량', centerX, centerY + 20);
        ctx.restore();
    }
};

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, doughnutCenterTextPlugin, ChartDataLabels);

interface PerformanceDashboardProps {
    kpiData: KpiSummary;
    inventoryData: InventoryDataPoint[];
    isLastPage?: boolean;
}

const KpiCard = ({ title, value, unit = '', fixed = 0 }: {
    title: string;
    value: number;
    unit?: string;
    fixed?: number;
}) => {
    const displayValue = value.toLocaleString(undefined, {
        minimumFractionDigits: fixed,
        maximumFractionDigits: fixed,
    });

    return (
        <div
            style={{
                backgroundColor: 'rgb(249, 250, 251)',
                padding: '12px',
                borderRadius: '6px',
                textAlign: 'center',
                border: '1px solid rgb(229, 231, 235)'
            }}
        >
            <p style={{ fontSize: '12px', fontWeight: '600', color: 'rgb(107, 114, 128)', margin: '0 0 4px 0' }}>
                {title}
            </p>
            <p
                style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: 'rgb(37, 99, 235)',
                    margin: '0'
                }}
            >
                {displayValue}
                <span style={{ fontSize: '16px', fontWeight: '500' }}>{unit}</span>
            </p>
        </div>
    );
};

const InsightSummarySection = ({ kpiData, inventoryData }: { kpiData: KpiSummary; inventoryData: InventoryDataPoint[] }) => {
    const bottleneckStage = inventoryData.reduce((max, item) => item.value > max.value ? item : max, inventoryData[0]);
    const totalInventory = inventoryData.reduce((sum, item) => sum + item.value, 0);
    const bottleneckPercentage = ((bottleneckStage.value / totalInventory) * 100).toFixed(1);
    const insights = [];
    if (kpiData.avgLeadTime > 5) {
        insights.push(`평균 리드타임이 ${kpiData.avgLeadTime.toFixed(1)}일로, 고객 경험에 영향을 줄 수 있는 수준입니다.`);
    }

    insights.push(`전체 재고의 ${bottleneckPercentage}%가 '${bottleneckStage.businessStep}' 단계에 집중되어 있어, 해당 단계의 병목 현상 해결이 시급합니다.`);

    if (kpiData.salesRate < 90 || kpiData.dispatchRate < 90) {
        insights.push(`판매율 또는 출고율이 90% 미만으로, 일부 재고가 장기화될 위험이 있습니다.`);
    }

    return (
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
                1. 핵심 요약 및 제언
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
                <p style={{ fontWeight: 'bold', color: 'rgb(146, 64, 14)', margin: '0 0 8px 0' }}>
                    Key Insights
                </p>
                <ul
                    style={{
                        listStyleType: 'disc',
                        listStylePosition: 'inside',
                        margin: '0',
                        padding: '0',
                        color: 'rgb(31, 41, 55)',
                        lineHeight: '1.4'
                    }}
                >
                    {insights.map((insight, index) => (
                        <li key={index} style={{ marginBottom: '4px' }}>{insight}</li>
                    ))}
                </ul>
                <p style={{ fontWeight: 'bold', color: 'rgb(146, 64, 14)', margin: '8px 0 4px 0' }}>
                    Recommendations
                </p>
                <p style={{ color: 'rgb(31, 41, 55)', margin: '0' }}>
                    '{bottleneckStage.businessStep}' 단계의 프로세스를 점검하고, 재고 상위 제품에 대한 특별 프로모션 또는 판매 전략을 고려해볼 수 있습니다.
                </p>
            </div>
        </section>
    );
};

const makeInventoryChartData = (data: InventoryDataPoint[]) => {
    const labels = data.map(item => getNodeName(item.businessStep));
    const values = data.map(item => item.value);

    return {
        labels: labels,
        datasets: [{
            label: '재고량',
            data: values,
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)'
            ],
            borderColor: 'rgba(255, 255, 255, 0.7)',
            borderWidth: 1,
        }]
    };
};

export default function PerformanceDashboardPage({
    kpiData,
    inventoryData,
    isLastPage = false,
}: PerformanceDashboardProps) {

    const inventoryChartData = makeInventoryChartData(inventoryData);
    const totalInventory = inventoryData.reduce((sum, item) => sum + item.value, 0);
    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        plugins: {
            legend: {
                position: 'right' as const,
            },
            doughnutCenterText: {
                total: totalInventory
            },
            datalabels: {
                color: '#fff',
                font: {
                    weight: 'bold' as const,
                    size: 14,
                },
                formatter: (value: number, context: any) => {
                    return value.toLocaleString();
                },
                display: (context: any) => {
                    return context.dataset.data[context.dataIndex] > 0;
                }
            }
        }
    };

    return (
        <div
            className={`${!isLastPage ? 'page-break' : ''}`}
            style={{
                padding: '40px',
                backgroundColor: 'rgb(255, 255, 255)',
                color: 'rgb(0, 0, 0)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                width: '210mm',
                height: '297mm'
            }}
        >
            <header style={{ marginBottom: '32px', flexShrink: 0 }}>
                <h1
                    style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        paddingBottom: '16px',
                        color: 'rgb(0, 0, 0)'
                    }}
                >
                    Ⅱ. 전체 성과 KPI
                </h1>
            </header>

            <main
                style={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '32px'
                }}
            >
                <InsightSummarySection kpiData={kpiData} inventoryData={inventoryData} />
                <section>
                    <h2
                        style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            color: 'rgb(75, 85, 99)',
                            margin: '0 0 8px 0'
                        }}
                    >
                        2. 운영 효율성 지표 현황
                    </h2>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '16px'
                        }}
                    >
                        <KpiCard title="총 운송 건수" value={kpiData.totalTripCount} />
                        <KpiCard title="평균 리드타임" value={kpiData.avgLeadTime} unit="일" fixed={1} />
                        <KpiCard title="판매율" value={kpiData.salesRate} unit="%" fixed={1} />
                        <KpiCard title="출고율" value={kpiData.dispatchRate} unit="%" fixed={1} />
                    </div>
                </section>
                <section
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '24px'
                    }}
                >
                    <div>
                        <h2
                            style={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: 'rgb(75, 85, 99)',
                            }}
                        >
                            가. 공급망 단계별 재고 분포
                        </h2>
                        <p
                            style={{
                                fontSize: '12px',
                                textAlign: 'right',
                                color: 'rgb(75, 85, 99)'
                            }}
                        >
                            (단위: 건)
                        </p>
                        <div
                            style={{
                                backgroundColor: 'rgb(249, 250, 251)',
                                padding: '16px',
                                borderRadius: '8px',
                                border: '1px solid rgb(229, 231, 235)',
                                height: '400px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            <Doughnut data={inventoryChartData} options={doughnutOptions} />
                        </div>
                    </div>
                    <div>
                        <h2
                            style={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: 'rgb(75, 85, 99)',
                                margin: '0 0 18px 0'
                            }}
                        >
                            나. 분석 대상 요약
                        </h2>
                        <div
                            style={{
                                backgroundColor: 'rgb(249, 250, 251)',
                                padding: '16px',
                                borderRadius: '8px',
                                border: '1px solid rgb(229, 231, 235)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                height: '400px',
                                gap: '16px'
                            }}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '16px', color: 'rgb(75, 85, 99)' }}>
                                    분석 대상 고유 제품
                                </p>
                                <p
                                    style={{
                                        fontSize: '36px',
                                        fontWeight: 'bold',
                                        color: 'rgb(31, 41, 55)',
                                        marginTop: '8px'
                                    }}
                                >
                                    {kpiData.uniqueProductCount.toLocaleString()}
                                    <span style={{ fontSize: '18px', marginLeft: '4px' }}>종</span>
                                </p>
                            </div>

                            <hr style={{ border: '1px solid rgb(229, 231, 235)' }} />

                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '16px', color: 'rgb(75, 85, 99)' }}>
                                    처리된 고유 코드
                                </p>
                                <p
                                    style={{
                                        fontSize: '36px',
                                        fontWeight: 'bold',
                                        color: 'rgb(31, 41, 55)',
                                        marginTop: '8px'
                                    }}
                                >
                                    {kpiData.codeCount.toLocaleString()}
                                    <span style={{ fontSize: '18px', marginLeft: '4px' }}>개</span>
                                </p>
                            </div>

                            <hr style={{ border: '1px solid rgb(229, 231, 235)' }} />

                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '16px', color: 'rgb(75, 85, 99)' }}>
                                    전체 재고 대비 판매율
                                </p>
                                <p
                                    style={{
                                        fontSize: '36px',
                                        fontWeight: 'bold',
                                        color: 'rgb(31, 41, 55)',
                                        marginTop: '8px'
                                    }}
                                >
                                    {kpiData.inventoryRate.toFixed(1)}
                                    <span style={{ fontSize: '18px', marginLeft: '4px' }}>%</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer
                style={{
                    marginTop: 'auto',
                    paddingTop: '32px',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: 'rgb(107, 114, 128)',
                    flexShrink: 0
                }}
            >

            </footer>
        </div>
    );
}