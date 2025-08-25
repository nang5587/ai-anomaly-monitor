"use client";

import React from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    Title,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { VennDiagramController, ArcSlice } from 'chartjs-chart-venn';

ChartJS.register(
    VennDiagramController,
    ArcSlice,
    ArcElement,
    Tooltip,
    Legend,
    Title,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement
);

interface VennData {
    sets: string[];
    value: number;
}

interface VennDiagramChartProps {
    data: VennData[];
    title?: string;
}

const VennDiagramChart: React.FC<VennDiagramChartProps> = ({ data, title }) => {
    const colors = {
        rule: 'rgb(111, 131, 175)',
        ai: 'rgb(224, 224, 224)',
        intersection: 'rgb(254, 168, 153)',
    };
    const labels = {
        rule: '룰 기반',
        ai: 'AI 기반',
        intersection: '교집합',
    };

    const chartData = {
        datasets: [
            {
                data: data,
                backgroundColor: [
                    `rgba(${colors.rule.match(/\d+/g)?.join(', ')}, 0.6)`,
                    `rgba(${colors.ai.match(/\d+/g)?.join(', ')}, 0.7)`,
                    `rgba(${colors.intersection.match(/\d+/g)?.join(', ')}, 0.6)`,
                ],
                borderColor: ['#93c5fd', '#ffffff', colors.intersection],
                borderWidth: 1,
                labels: {
                    display: false,
                    value: {
                        font: {
                            size: 20,
                            weight: 'bold' as const,
                        },
                        color: 'rgba(255, 255, 255, 0.9)',
                    }
                }
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    generateLabels: () => {
                        return [
                            {
                                text: labels.rule,
                                fillStyle: colors.rule,
                                fontColor: 'gray',
                                strokeStyle: '#93c5fd',
                                lineWidth: 1,
                            },
                            {
                                text: labels.ai,
                                fillStyle: colors.ai,
                                fontColor: 'gray',
                                strokeStyle: '#ffffff',
                                lineWidth: 1,
                            },
                            {
                                text: labels.intersection,
                                fillStyle: colors.intersection,
                                fontColor: 'gray',
                                strokeStyle: colors.intersection,
                                lineWidth: 1,
                            },
                        ];
                    },
                },
            },
            title: {
                display: !!title,
                text: title,
                color: 'rgba(255, 255, 255, 0.9)',
                font: {
                    size: 18,
                },
                padding: {
                    bottom: 20,
                }
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const item = context.dataset.data[context.dataIndex];
                        const label = item.sets.join(' ∩ ') || '';
                        return `${label}: ${item.value}건`;
                    }
                }
            },
            venn: {
                labels: {
                    display: false, 
                },
            },
        },
    };

    return <Chart type="venn" data={chartData} options={options} />;
};

export default VennDiagramChart;