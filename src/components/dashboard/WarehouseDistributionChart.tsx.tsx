'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 샘플 데이터 및 각 항목별 색상
const data = [
    { name: '화성 허브', value: 400 },
    { name: '인천 제1창고', value: 300 },
    { name: '구미 물류센터', value: 300 },
    { name: '양산 제2창고', value: 200 },
];

const COLORS = ['#0ea5e9', '#10b981', '#f97316', '#8b5cf6']; // 파랑, 초록, 주황, 보라

const WarehouseDistributionChart: React.FC = () => {
    return (
        <div className="bg-[rgba(40,40,40)] p-6 rounded-lg shadow-lg text-white h-[300px]">
            <h3 className="text-xl font-semibold mb-4">창고별 재고 분포</h3>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 40, left: 0 }}>
                    {/* 툴팁 스타일 */}
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(30, 30, 30, 0.8)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                        }}
                    />

                    {/* 범례 스타일 및 위치 */}
                    <Legend
                        iconType="circle"
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ bottom: 0, left: 0 }}
                    />

                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60} // 안쪽 원의 반지름 (도넛 모양 생성)
                        outerRadius={80} // 바깥쪽 원의 반지름
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                    >
                        {/* 각 데이터 조각에 지정된 색상 입히기 */}
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default WarehouseDistributionChart;