'use client';

import React from 'react';
import { ListChecks, TrendingUp, Package, AlertTriangle, Percent, Clock, Box, ShoppingCart } from 'lucide-react';

// 개별 KPI를 보여줄 미니 카드
const MiniStatCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
    <div className="bg-[rgba(111,131,175)] p-4 rounded-2xl flex flex-col items-center gap-4">
        <div className="p-3">{icon}</div>
        <p className="text-sm/5 text-white">{title}</p>
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

const factoryTabs = ['전체', '화성', '인천', '구미', '양산'];

export default function FactoryDetailView({ activeFactory, onTabClick, kpiData }: FactoryDetailViewProps) {
    return (
        <div className="bg-[rgba(40,40,40)] p-6 rounded-3xl shadow-lg h-full flex flex-col">
            {/* --- 탭 --- */}
            <div className="flex space-x-1 bg-[rgba(30,30,30)] p-1 rounded-full mb-6">
                {factoryTabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => onTabClick(tab)}
                        className={`w-full py-2.5 text-sm font-medium leading-5 rounded-full transition-colors
                            ${activeFactory === tab ? 'bg-[rgba(111,131,175)] text-white' : 'text-gray-300 hover:bg-white/[0.12] hover:text-white'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* --- KPI 그리드 --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 flex-grow overflow-auto min-h-0 hide-scrollbar">
                <MiniStatCard title="총 처리 건수" value={kpiData.totalEvents.toLocaleString()} icon={<ListChecks size={40} className="text-white" />} />
                <MiniStatCard title="총 생산 제품" value={kpiData.uniqueProducts.toLocaleString()} icon={<Package size={40} className="text-white" />} />
                <MiniStatCard title="이상 탐지 건수" value={kpiData.anomalyCount.toLocaleString()} icon={<AlertTriangle size={40} className="text-white" />} />
                <MiniStatCard title="이상 발생 비율" value={`${kpiData.anomalyRate}%`} icon={<Percent size={40} className="text-white" />} />
                <MiniStatCard title="평균 리드타임" value={kpiData.avgLeadTime} icon={<Clock size={40} className="text-white" />} />
                <MiniStatCard title="판매율" value={`${kpiData.salesRate}%`} icon={<ShoppingCart size={40} className="text-white" />} />
            </div>
        </div>
    );
}