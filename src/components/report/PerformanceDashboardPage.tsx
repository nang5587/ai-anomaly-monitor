// src/app/report/PerformanceDashboardPage.tsx

'use client';
// ✨ 1. Doughnut 차트를 사용하기 위해 ArcElement를 추가로 import 합니다.
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";

// ✨ 2. 필요한 타입을 import 합니다.
import { KpiSummary, InventoryDataPoint } from "@/types/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// --- 타입 정의 ---
interface PerformanceDashboardProps {
    kpiData: KpiSummary;
    inventoryData: InventoryDataPoint[];
}

const KpiCard = ({ title, value }: { title: string; value: string; }) => (
    <div className="bg-blue-50 p-4 rounded-lg shadow-sm text-center border border-blue-200">
        <p className="text-sm font-semibold text-blue-700">{title}</p>
        <p className="text-3xl font-bold text-blue-600 mt-1">{value}</p>
    </div>
);

// inventoryData를 Chart.js가 이해할 수 있는 형식으로 변환하는 헬퍼 함수
const makeInventoryChartData = (data: InventoryDataPoint[]) => {
    const labels = data.map(item => item.businessStep);
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
    inventoryData
}: PerformanceDashboardProps) {

    const inventoryChartData = makeInventoryChartData(inventoryData);

    return (
        <div className="p-10 bg-white text-black flex flex-col font-sans" style={{ width: '210mm', minHeight: '297mm' }}>
            <header className="mb-8 flex-shrink-0">
                <h1 className="text-2xl font-bold text-center pb-4">
                    Ⅱ. 전체 성과 KPI 대시보드
                </h1>
            </header>

            <main className="flex-grow space-y-10">
                {/* 1. 핵심 지표 (KPI) */}
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">1. 운영 효율성 지표</h2>
                    {/* ✨ 3. kpiData에 있는 모든 유용한 지표를 표시합니다. */}
                    <div className="grid grid-cols-4 gap-4">
                        <KpiCard title="총 운송 건수" value={kpiData.totalTripCount.toLocaleString()} />
                        <KpiCard title="평균 리드타임" value={`${parseFloat(kpiData.avgLeadTime).toFixed(1)}일`} />
                        <KpiCard title="판매율" value={`${kpiData.salesRate.toFixed(1)}%`} />
                        <KpiCard title="출고율" value={`${kpiData.dispatchRate.toFixed(1)}%`} />
                    </div>
                </section>

                {/* ✨ 4. 시각화 섹션을 2개의 컬럼으로 구성합니다. */}
                <section className="grid grid-cols-2 gap-8">
                    {/* 왼쪽: 공급망 단계별 재고 분포 */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">2.1 공급망 단계별 재고 분포</h2>
                        <div className="bg-gray-50 p-4 rounded-lg border flex justify-center items-center" style={{ maxHeight: '400px' }}>
                            <Doughnut data={inventoryChartData} options={{ responsive: true, maintainAspectRatio: false, animation: false }} />
                        </div>
                    </div>
                    {/* 오른쪽: 제품 포트폴리오 및 기타 정보 */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">2.2 분석 대상 요약</h2>
                        <div className="bg-gray-50 p-6 rounded-lg border space-y-6 h-full">
                            <div className="text-center">
                                <p className="text-base text-gray-600">분석 대상 고유 제품</p>
                                <p className="text-4xl font-bold text-gray-800 mt-2">{kpiData.uniqueProductCount.toLocaleString()}<span className="text-lg ml-1">종</span></p>
                            </div>
                            <hr />
                            <div className="text-center">
                                <p className="text-base text-gray-600">처리된 고유 코드</p>
                                <p className="text-4xl font-bold text-gray-800 mt-2">{kpiData.codeCount.toLocaleString()}<span className="text-lg ml-1">개</span></p>
                            </div>
                            <hr />
                            <div className="text-center">
                                <p className="text-base text-gray-600">전체 재고 대비 판매율</p>
                                <p className="text-4xl font-bold text-gray-800 mt-2">{kpiData.inventoryRate.toFixed(1)}<span className="text-lg ml-1">%</span></p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="mt-auto pt-8 border-t text-center text-xs text-gray-500 flex-shrink-0">
                <p>Page 3</p>
            </footer>
        </div>
    );
}