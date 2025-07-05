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
    anomalyRate: number; // string -> number
    anomalyChange: number;
    avgLeadTime: string;
    salesRate: string;
};

type FactoryDetailViewProps = {
    activeFactory: string;
    onTabClick: (factory: string) => void;
    kpiData: KpiData;
};

const AnomalyGaugeChart = ({ rate, change }: { rate: number, change: number }) => {
    // parseFloat과 isNaN 검사가 더 이상 필요 없어집니다. 코드가 간결해져요.
    const safeValue = isNaN(rate) ? 0 : rate;
    const safeChange = isNaN(change) ? 0 : change;

    // const safeChange = isNaN(change) ? 0 : change;
    const isPositiveChange = safeChange >= 0;
    const changeColor = isPositiveChange ? '#4ade80' : '#f87171';

    return (
        <div className="w-full h-80 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                    cy="50%"
                    innerRadius="50%"
                    outerRadius="100%"
                    data={[{ name: 'anomaly', value: safeValue }]}
                    startAngle={180}
                    endAngle={0}
                >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background dataKey="value" angleAxisId={0}
                        fill="#E0E0E0" cornerRadius={0} />
                    <RadialBar dataKey="value" angleAxisId={0}
                        fill="url(#gradient)" cornerRadius={0} />
                    <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="rgba(111,131,175)" />
                            <stop offset="100%" stopColor="rgba(111,131,175)" />
                        </linearGradient>
                    </defs>
                </RadialBarChart>
            </ResponsiveContainer>

            <div className="absolute flex flex-col items-center justify-center">
                <p className="text-4xl font-lato text-white">
                    {safeValue.toFixed(2)}<span className="text-xl ml-1">%</span>
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
            <div className="flex space-x-1 bg-[rgba(30,30,30)] rounded-full mb-8">
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
                {/* 1. 카드 그리드는 필요한 만큼의 공간을 차지합니다. */}
                <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-3 gap-4">
                    <MiniStatCard title="총 처리 건수" value={kpiData.totalEvents.toLocaleString()} icon={<ListChecks size={40} className="text-white" />} />
                    <MiniStatCard title="총 생산 제품" value={kpiData.uniqueProducts.toLocaleString()} icon={<Package size={40} className="text-white" />} />
                    <MiniStatCard title="평균 리드타임" value={kpiData.avgLeadTime} icon={<Clock size={40} className="text-white" />} />
                </div>

                {/* 2. [수정] 차트 컨테이너가 "남은 모든 공간"을 차지하도록 변경 */}
                <div className="flex-grow w-full min-h-0"> {/* h-full 대신 flex-grow와 min-h-0 사용 */}
                    <AnomalyGaugeChart rate={kpiData.anomalyRate} change={kpiData.anomalyChange} />
                </div>
            </div>
        </div>
    );
}