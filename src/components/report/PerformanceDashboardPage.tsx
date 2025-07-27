// src/app/report/PerformanceDashboardPage.tsx

import { Bar } from "react-chartjs-2";
// ... Chart.js 등록 ...

// --- 타입 정의 (예시) ---
interface PerformanceKpis {
    totalShipments: number;
    totalEvents: number;
    avgLeadTime: string;
    onTimeDeliveryRate: string;
}

interface DailyVolumeData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
    }[];
}

const KpiCard = ({ title, value }: { title: string; value: string; }) => (
    <div className="bg-blue-50 p-4 rounded-lg shadow-sm text-center border border-blue-200">
        <p className="text-sm font-semibold text-blue-700">{title}</p>
        <p className="text-3xl font-bold text-blue-600 mt-1">{value}</p>
    </div>
);


export default function PerformanceDashboardPage({ kpiData, dailyVolumeData }: { kpiData: PerformanceKpis; dailyVolumeData: DailyVolumeData }) {
    return (
        <div className="p-10 bg-white text-black flex flex-col" style={{ width: '210mm', minHeight: '297mm' }}>
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-center border-b-2 border-gray-300 pb-4">
                    📊 전체 성과 KPI 대시보드
                </h1>
            </header>

            <main className="flex-grow">
                {/* 1. 핵심 지표 (KPI) */}
                <section className="mb-12">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">운영 효율성 지표</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <KpiCard title="총 운송 건수" value={`${kpiData.totalShipments} 건`} />
                        <KpiCard title="총 이벤트 수" value={`${kpiData.totalEvents} 개`} />
                        <KpiCard title="평균 운송 리드타임" value={kpiData.avgLeadTime} />
                        <KpiCard title="정시 도착률" value={kpiData.onTimeDeliveryRate} />
                    </div>
                </section>

                {/* 2. 차트 시각화 */}
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">일별 운송량 추이</h2>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <Bar data={dailyVolumeData} options={{ responsive: true }} />
                    </div>
                </section>
            </main>

            <footer className="mt-auto pt-8 border-t text-center text-xs text-gray-500">
                <p>Page 3</p>
            </footer>
        </div>
    );
}