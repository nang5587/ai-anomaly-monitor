'use client'
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 샘플 데이터 및 각 항목별 색상
const data = [
    { name: '화성 허브', value: 400 },
    { name: '인천 제1창고', value: 300 },
    { name: '구미 물류센터', value: 300 },
    { name: '양산 제2창고', value: 200 },
];

const COLORS = ['#0ea5e9', '#10b981', '#f97316', '#8b5cf6'];

const WarehouseDistributionChart: React.FC = () => {
    return (
        // 👇 flex flex-col 유지
        <div className="bg-[rgba(40,40,40)] p-6 rounded-3xl shadow-lg text-white h-[300px] flex flex-col">
            <h3 className="text-xl font-semibold mb-2">창고별 재고 분포</h3>
            {/* 👇 이 div가 차트 영역을 감싸며, 남은 공간을 모두 차지하게 합니다. */}
            <div className="w-full flex-grow min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    {/* 👇 margin을 제거하여 공간을 최대한 확보합니다. */}
                    <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(30, 30, 30, 0.8)',
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                            }}
                        />
                        <Legend
                            iconType="circle"
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                        />
                        <Pie
                            data={data}
                            cx="50%"
                            cy="45%" 
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            nameKey="name"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default WarehouseDistributionChart;