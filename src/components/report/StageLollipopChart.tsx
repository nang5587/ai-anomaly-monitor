'use client';

// 1. Recharts에서 필요한 컴포넌트들을 가져옵니다.
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    LabelList
} from 'recharts';
import type { ReactNode } from 'react';

import { StageBarDataPoint } from '@/types/chart';

interface StageLollipopChartProps {
    data: StageBarDataPoint[];
}

export default function StageLollipopChart({ data }: StageLollipopChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                layout="vertical"
                data={data}
                margin={{ top: 10, right: 40, left: 0, bottom: 10 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.1)" />

                {/* 3. X축은 숫자 값을 표시합니다. */}
                <XAxis type="number" stroke="rgba(111,131,175)" fontSize={12} allowDecimals={false} />

                {/* 4. Y축은 카테고리(name)를 표시합니다. */}
                {/*    이 축이 이제 긴 텍스트를 처리합니다. */}
                <YAxis
                    type="category"
                    dataKey="name" // 이름 데이터를 사용
                    stroke="#333"
                    tick={{ fill: 'rgba(111,131,175)' }}
                    fontSize={12}
                    width={100} // 라벨 길이에 따라 조절 가능
                    interval={0}
                    tickLine={false}
                    axisLine={false}
                />

                <Tooltip
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                    contentStyle={{
                        background: 'rgba(0, 0, 0, 0.85)', color: 'white', borderRadius: '6px',
                        border: 'none'
                    }}
                />

                {/* 5. 롤리팝 형태의 Bar를 그립니다. */}
                <Bar dataKey="count" barSize={4} background={{ fill: '#eee' }} radius={4} fill="#8884d8">
                    <LabelList
                        dataKey="count"
                        position="right" // 숫자를 막대 오른쪽에 표시
                        style={{ fill: 'rgba(111,131,175)', fontSize: 12, fontWeight: 'bold' }}
                    />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}