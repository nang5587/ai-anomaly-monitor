'use client';

import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { ListChecks, TrendingUp, TrendingDown, Package, AlertTriangle, Percent, Clock, Box, ShoppingCart } from 'lucide-react';

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
    anomalyChange: number;
    avgLeadTime: string;
    salesRate: string;
};

type FactoryDetailViewProps = {
    activeFactory: string;
    onTabClick: (factory: string) => void;
    kpiData: KpiData;
};

const AnomalyGaugeChart = ({ rate, change }: { rate: string, change: number }) => {
    const value = parseFloat(rate);
    const data = [{ name: 'anomaly', value }];

    const isPositiveChange = change >= 0;
    const changeColor = isPositiveChange ? '#4ade80' : '#f87171'; // 초록색(긍정), 빨간색(부정)

    return (
        <div className="w-full h-full p-4 rounded-2xl flex flex-col items-center
                    shadow-inner shadow-black/20 relative">

            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                    cy="100%"
                    innerRadius="250%" // 게이지 두께 조정
                    outerRadius="300%" // 게이지 두께 조정
                    data={data}
                    startAngle={180}
                    endAngle={0}
                >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar
                        background
                        dataKey="value"
                        angleAxisId={0}
                        fill="rgba(229, 231, 235, 0.2)"
                        cornerRadius={0}
                    />
                    <RadialBar
                        dataKey="value"
                        angleAxisId={0}
                        fill="#A5B4FC" // 좀 더 밝은 파란색으로 변경 (Tailwind indigo-300)
                        cornerRadius={0}
                    />
                </RadialBarChart>
            </ResponsiveContainer>

            {/* [수정] 중앙 텍스트 위치를 transform으로 미세 조정 */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
                <p className="text-5xl font-lato text-white">
                    {value.toFixed(2)}<span className="text-3xl ml-1">%</span>
                </p>
                {/* 지난주 대비 증감률 텍스트도 다시 추가합니다. */}
                <div className="flex items-center gap-1 mt-2">
                    {/* // <ChangeIcon size={18} color={changeColor} /> */}
                    <p className="font-lato text-lg" style={{ color: changeColor }}>
                        {/* // {isPositiveChange ? '+' : ''}{change.toFixed(2)}% */}
                    </p>
                    <p className="text-sm text-gray-400 font-noto-400"></p>
                </div>
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
            <div className='flex flex-col justify-center gap-4 flex-grow min-h-0'>
                <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-3 gap-4">
                    <MiniStatCard title="총 처리 건수" value={kpiData.totalEvents.toLocaleString()} icon={<ListChecks size={40} className="text-white" />} />
                    <MiniStatCard title="총 생산 제품" value={kpiData.uniqueProducts.toLocaleString()} icon={<Package size={40} className="text-white" />} />
                    <MiniStatCard title="평균 리드타임" value={kpiData.avgLeadTime} icon={<Clock size={40} className="text-white" />} />
                </div>

                {/* [수정] 차트를 감싸는 div에 높이를 지정. h-72 (288px) 또는 원하는 높이로 조절하세요. */}
                <div className="h-full w-full">
                    <AnomalyGaugeChart rate={kpiData.anomalyRate} change={kpiData.anomalyChange} />
                </div>
            </div>
        </div>
    );
}