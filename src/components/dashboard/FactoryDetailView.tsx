'use client';

import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { ListChecks, TrendingUp, Package, AlertTriangle, Percent, Clock, Box, ShoppingCart } from 'lucide-react';

// 개별 KPI를 보여줄 미니 카드
const MiniStatCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
    <div className="p-4 rounded-2xl flex flex-col items-center gap-4
                bg-[rgba(111,131,175)]
                shadow-inner shadow-black/40">
        <div className="p-3">{icon}</div>
        <p className="font-noto-400 text-sm/5 text-white">{title}</p>
        <p className="text-4xl text-white font-lato">{value}</p>
    </div>
);

// KPI 데이터 타입 정의
export type KpiData = {
    totalEvents: number;
    uniqueProducts: number;
    anomalyCount: number;
    anomalyRate: string;
    avgLeadTime: string;
    salesRate: string;
};

type FactoryDetailViewProps = {
    activeFactory: string;
    onTabClick: (factory: string) => void;
    kpiData: KpiData;
};

const AnomalyGaugeChart = ({ rate }: { rate: string }) => {
    const value = parseFloat(rate);
    const data = [{ name: 'anomaly', value: value }];

    // 비율에 따라 색상을 결정하는 함수
    const getColor = (val: number) => {
        if (val > 10) return '#FF4D4F'; // 위험 (빨강)
        if (val > 5) return '#FAAD14';  // 주의 (노랑)
        return '#52C41A'; // 안전 (초록)
    };

    const color = getColor(value);

    return (
        <div className="w-full h-[180px] p-4 rounded-2xl flex flex-col items-center justify-center gap-2
                    bg-[rgba(55,55,55)] shadow-inner shadow-black/20 relative">

            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                    innerRadius="70%"
                    outerRadius="90%"
                    data={data}
                    startAngle={180}
                    endAngle={0}
                    barSize={20}
                >
                    <PolarAngleAxis
                        type="number"
                        domain={[0, 100]} // 게이지의 전체 범위는 0% ~ 100%
                        angleAxisId={0}
                        tick={false}
                    />
                    {/* 배경 트랙 */}
                    <RadialBar
                        background
                        dataKey="value"
                        angleAxisId={0}
                        fill="rgba(255, 255, 255, 0.1)"
                        cornerRadius={10}
                    />
                    {/* 실제 값 바 */}
                    <RadialBar
                        dataKey="value"
                        angleAxisId={0}
                        fill={color}
                        cornerRadius={10}
                    />
                </RadialBarChart>
            </ResponsiveContainer>
            {/* 중앙에 텍스트 표시 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-4">
                <p className="font-noto-400 text-sm text-gray-300">이상 발생 비율(%)</p>
                <p className="text-4xl font-lato" style={{ color: color }}>
                    {value.toFixed(2)}
                </p>
            </div>
        </div>
    );
};

const factoryTabs = ['전체', '화성', '인천', '구미', '양산'];

export default function FactoryDetailView({ activeFactory, onTabClick, kpiData }: FactoryDetailViewProps) {
    return (
        <div className="bg-[rgba(40,40,40)] p-6 rounded-3xl shadow-lg h-full flex flex-col">
            {/* --- 탭 --- */}
            <div className="flex space-x-1 bg-[rgba(30,30,30)] rounded-full mb-6">
                {factoryTabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => onTabClick(tab)}
                        className={`w-full py-2.5 text-sm font-medium font-noto-400 leading-5 rounded-full transition-colors
                            ${activeFactory === tab ? 'bg-[rgba(111,131,175)] text-white' : 'text-gray-300 hover:bg-white/[0.12] hover:text-white'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* --- KPI 그리드 --- */}
            <div className='flex flex-col justify-center gap-4'>
                <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-3 gap-4 flex-grow overflow-auto min-h-0 hide-scrollbar">
                    <MiniStatCard title="총 처리 건수" value={kpiData.totalEvents.toLocaleString()} icon={<ListChecks size={40} className="text-white" />} />
                    <MiniStatCard title="총 생산 제품" value={kpiData.uniqueProducts.toLocaleString()} icon={<Package size={40} className="text-white" />} />
                    <MiniStatCard title="평균 리드타임" value={kpiData.avgLeadTime} icon={<Clock size={40} className="text-white" />} />
                </div>
                <AnomalyGaugeChart rate={kpiData.anomalyRate} />
            </div>
        </div>
    );
}