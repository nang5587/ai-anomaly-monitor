// src/components/dashboard/AnomalyTimelineChart.tsx
'use client';
// 1. BarChart, Bar, LabelList를 import에 추가하고 Area는 삭제합니다.
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';

type TimelineDataPoint = {
    time: string;
    count: number;
};

type AnomalyTimelineChartProps = {
    data: TimelineDataPoint[];
};

export default function AnomalyTimelineChart({ data }: AnomalyTimelineChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            {/* 2. AreaChart를 BarChart로 변경 */}
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                {/* 그라데이션 defs는 더 이상 필요 없으므로 삭제합니다. */}

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="time" stroke="rgba(111,131,175)" fontSize={12} />
                <YAxis stroke="rgba(111,131,175)" fontSize={12} allowDecimals={false} />

                {/* 3. 원래 툴팁 코드를 그대로 유지합니다. */}
                <Tooltip
                    content={({ payload, label }) => (
                        <div style={{ color: 'white', background: 'rgba(0,0,0,0.85)', padding: 8, borderRadius: '6px' }}>
                            {payload?.[0] && (
                                <>
                                    <p className='font-bold'>요일 {label}</p>
                                    <p>{payload[0].name} : {payload[0].value}</p>
                                </>
                            )}
                        </div>
                    )}
                    // 마우스 호버 시 배경 효과를 추가하면 좋습니다.
                    cursor={{ fill: 'rgba(111, 131, 175, 0.2)' }}
                />

                {/* 4. Area를 Bar로 변경하고 LabelList를 추가합니다. */}
                <Bar dataKey="count" fill="rgba(111,131,175,0.8)" radius={[0, 0, 0, 0]}>
                    <LabelList
                        dataKey="count"
                        position="top"
                        style={{ fill: 'rgba(111,131,175)', fontSize: 12 }}
                    />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}