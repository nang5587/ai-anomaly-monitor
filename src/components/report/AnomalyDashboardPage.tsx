// src/app/report/AnomalyDashboardPage.tsx

import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// --- 타입 정의 (예시) ---
interface AnomalyKpis {
    totalAnomalies: number;
    anomalyRate: string;
    mostFrequentAnomalyType: string;
    mostProblematicRoute: string;
}

interface AnomalyTypeData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
    }[];
}

// 작은 카드 UI 컴포넌트
const KpiCard = ({ title, value }: { title: string; value: string; }) => (
    <div className="bg-red-50 p-4 rounded-lg shadow-sm text-center border border-red-200">
        <p className="text-sm font-semibold text-red-700">{title}</p>
        <p className="text-3xl font-bold text-red-600 mt-1">{value}</p>
    </div>
);

export default function AnomalyDashboardPage({ kpiData, barChartData, doughnutChartData }: { kpiData: AnomalyKpis; barChartData: AnomalyTypeData; doughnutChartData: any }) {
    return (
        <div className="p-10 bg-white text-black flex flex-col" style={{ width: '210mm', minHeight: '297mm' }}>
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-center border-b-2 border-gray-300 pb-4">
                    🚨 이상 탐지 현황 대시보드
                </h1>
            </header>

            <main className="flex-grow">
                {/* 1. 핵심 지표 (KPI) */}
                <section className="mb-12">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">핵심 지표 요약</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <KpiCard title="총 이상 건수" value={`${kpiData.totalAnomalies} 건`} />
                        <KpiCard title="이상 발생률" value={kpiData.anomalyRate} />
                        <KpiCard title="최다 발생 유형" value={kpiData.mostFrequentAnomalyType} />
                        <KpiCard title="최다 발생 구간" value={kpiData.mostProblematicRoute} />
                    </div>
                </section>

                {/* 2. 차트 시각화 (두 개의 컬럼으로 분리) */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">이상 유형별 발생 건수</h2>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <Bar data={barChartData} options={{ responsive: true }} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">이상 유형별 비율</h2>
                        <div className="bg-gray-50 p-4 rounded-lg flex justify-center items-center" style={{ maxHeight: '400px' }}>
                            <Doughnut data={doughnutChartData} options={{ responsive: true, maintainAspectRatio: false }} />
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