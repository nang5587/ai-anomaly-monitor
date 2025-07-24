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
    factoryTabs: string[];
    activeFactory: string;
    onTabClick: (factory: string) => void;
    kpiData: KpiSummary;
};

// 큰 숫자를 한국어 단위(천, 만, 억)에 맞춰 간결하게 포맷팅
const formatNumberCompact = (num: number): string => {
    if (isNaN(num)) return '0';

    const formatter = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1, // 소수점 최대 한 자리까지 표시
    });
    return formatter.format(num);
};

// const factoryTabs = ['전체', '화성', '인천', '구미', '양산'];

export default function FactoryDetailView({ factoryTabs, activeFactory, onTabClick, kpiData }: FactoryDetailViewProps) {
    const anomalyPercentage = kpiData.anomalyRate * 100;

    return (
        <div className="bg-[rgba(40,40,40)] p-6 rounded-3xl shadow-lg flex flex-col">
            {/* --- 탭 --- */}
            {factoryTabs && factoryTabs.length > 1 && (
                <div className="flex space-x-1 bg-[rgba(30,30,30)] rounded-full mb-6">
                    {factoryTabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => onTabClick(tab)}
                            className={`w-full py-2.5 text-base font-medium font-noto-400 leading-5 rounded-full transition-colors
                                ${activeFactory === tab ? 'bg-[rgba(111,131,175)] text-white' : 'text-gray-300 hover:bg-white/[0.12] hover:text-white'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            )}

            {/* 만약 탭이 1개만 있다면, 그 공장 이름을 제목처럼 보여줄 수 있습니다. */}
            {factoryTabs && factoryTabs.length === 1 && (
                <h2 className="font-noto-400 text-xl text-white mb-6 text-center rounded-2xl bg-[rgba(30,30,30)] p-2">{factoryTabs[0]}공장</h2>
            )}

            {/* --- KPI 그리드 --- */}
            <div className='flex flex-col justify-center gap-3'>
                {/* 1. 카드 그리드는 필요한 만큼의 공간을 차지합니다. */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-2 gap-3">
                    <MiniStatCard title="총 처리 건수" value={formatNumberCompact(kpiData.totalTripCount)} icon={<ListChecks size={32} className="text-white" />} />
                    <MiniStatCard title="평균 리드타임" value={`${kpiData.avgLeadTime}일`} icon={<Clock size={32} className="text-white" />} />
                    <MiniStatCard title="총 생산 제품 수" value={kpiData.uniqueProductCount.toLocaleString()} icon={<Package size={32} className="text-white" />} />
                    <MiniStatCard title="총 생산 EPC" value={`${formatNumberCompact(kpiData.codeCount)}`} icon={<Barcode size={32} className="text-white" />} />
                </div>

                {/* 2. [수정] 차트 컨테이너가 "남은 모든 공간"을 차지하도록 변경 */}
                <div className="w-full"> {/* h-full 대신 flex-grow와 min-h-0 사용 */}
                    <h3 className="font-noto-400 text-white text-lg pt-3 px-3 flex-shrink-0">이상 발생 비율</h3>
                    <div className='flex items-center justify-center my-1'>
                        <ConeWarningGauge rate={anomalyPercentage} />
                    </div>
                </div>
            </div>
        </div>
    );
}