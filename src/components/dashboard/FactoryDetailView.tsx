'use client';

import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { ListChecks, TrendingUp, TrendingDown, Package, AlertTriangle, Percent, Clock, Barcode } from 'lucide-react';
import ConeWarningGauge from '@/components/dashboard/ConeWarningGauge';

// 개별 KPI를 보여줄 미니 카드
const MiniStatCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
    <div className="p-2 rounded-2xl flex flex-col items-center gap-1
                bg-[rgba(111,131,175)]">
        <div className="p-3">{icon}</div>
        <p className="font-noto-400 text-sm/5 text-white">{title}</p>
        <p className="text-3xl text-white font-lato">{value}</p>
    </div>
);


// KPI 데이터 타입 정의
import type { KpiSummary } from '../../types/data';

type FactoryDetailViewProps = {
    factoryName: string | null;
    kpiData: KpiSummary;
};

const formatNumberCompact = (num: number): string => {
    if (isNaN(num)) return '0';

    const formatter = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
    });
    return formatter.format(num);
};

export default function FactoryDetailView({ factoryName, kpiData }: FactoryDetailViewProps) {
    const anomalyPercentage = kpiData.anomalyRate * 100;

    return (
        <div className="bg-[rgba(40,40,40)] p-6 rounded-3xl shadow-lg flex flex-col">
            <h2 className="font-noto-400 text-xl text-white mb-6 text-center rounded-2xl bg-[rgba(30,30,30)] p-2">{factoryName || '인천공장'}</h2>
            <div className='flex flex-col justify-center gap-3'>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-2 gap-3">
                    <MiniStatCard title="총 처리 건수" value={formatNumberCompact(kpiData.totalTripCount)} icon={<ListChecks size={32} className="text-white" />} />
                    <MiniStatCard title="평균 리드타임" value={`${kpiData.avgLeadTime.toFixed(1)}일`} icon={<Clock size={32} className="text-white" />} />
                    <MiniStatCard title="총 생산 제품 수" value={kpiData.uniqueProductCount.toLocaleString()} icon={<Package size={32} className="text-white" />} />
                    <MiniStatCard title="총 생산 EPC" value={`${formatNumberCompact(kpiData.codeCount)}`} icon={<Barcode size={32} className="text-white" />} />
                </div>
                <div className="w-full">
                    <h3 className="font-noto-400 text-white text-lg pt-3 px-3 flex-shrink-0">이상 발생 비율</h3>
                    <div className='flex items-center justify-center my-1'>
                        <ConeWarningGauge rate={anomalyPercentage} />
                    </div>
                </div>
            </div>
        </div>
    );
}