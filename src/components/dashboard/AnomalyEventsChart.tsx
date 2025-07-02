'use client'
import React from 'react';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

const data = [
    { name: '4월', '이상 이벤트': 28 },
    { name: '5월', '이상 이벤트': 35 },
    { name: '6월', '이상 이벤트': 45 },
    { name: '7월', '이상 이벤트': 42 },
    { name: '8월', '이상 이벤트': 51 },
    { name: '9월', '이상 이벤트': 58 },
];

const AnomalyEventsChart: React.FC = () => {
    return (
        <div className="bg-[rgba(40,40,40)] p-6 rounded-3xl shadow-lg text-white h-[300px]">
            <h3 className="text-xl font-semibold mb-4">월별 이상 이벤트 발생 추이</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 20,
                        left: -10, // Y축 라벨 공간 확보
                        bottom: 25, // 하단 제목 공간 확보
                    }}
                >
                    {/* 어두운 테마에 맞는 그리드 스타일 */}
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />

                    {/* X축: 월 표시, 틱(tick) 색상 및 라인 설정 */}
                    <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.7)" tickLine={false} />

                    {/* Y축: 건수 표시, 틱 색상 및 라인 설정 */}
                    <YAxis stroke="rgba(255, 255, 255, 0.7)" tickLine={false} />

                    {/* 툴팁: 마우스 호버 시 정보 표시, 어두운 테마에 맞게 스타일링 */}
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(30, 30, 30, 0.8)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                        }}
                        labelStyle={{ color: '#fff' }}
                    />

                    {/* 레전드(범례): 차트 하단에 위치 */}
                    <Legend wrapperStyle={{ bottom: 0, left: 20 }} />

                    {/* 라인: '이상 이벤트' 데이터를 기반으로 하며, 색상 및 두께 설정 */}
                    <Line
                        type="monotone"
                        dataKey="이상 이벤트"
                        stroke="#facc15" // 노란색 계열
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AnomalyEventsChart;