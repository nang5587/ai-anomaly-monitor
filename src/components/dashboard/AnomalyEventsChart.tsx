'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

// pastelColorMap은 이제 defs에서 직접 사용되지 않으므로, 필요 없다면 제거해도 됩니다.
// import { pastelColorMap } from '@/types/anomalyUtils'; 

type AnomalyDataPoint = {
    name: string;
    type: string;
    count: number;
    // color1, color2는 이제 이 컴포넌트에서 사용되지 않습니다.
};

type AnomalyEventsChartProps = {
    data: AnomalyDataPoint[];
};

export default function AnomalyEventsChart({ data }: AnomalyEventsChartProps): JSX.Element {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <defs>
                    {/* --- 👇 1. 딱 2개의 그라데이션만 정의 --- */}

                    {/* 기본 타입을 위한 그라데이션 */}
                    <linearGradient id="grad-default" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={'rgba(111,131,175)'} stopOpacity={1} />
                        <stop offset="100%" stopColor={'rgba(111,131,175)'} stopOpacity={0.2} />
                    </linearGradient>

                    {/* 'other' 타입을 위한 그라데이션 */}
                    <linearGradient id="grad-other" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFBA69" stopOpacity={1} />
                        <stop offset="100%" stopColor="#FFBA69" stopOpacity={0.2} />
                    </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="4 4" stroke="rgba(111, 131, 175, 0.3)" />
                <XAxis dataKey="name" stroke="rgba(111,131,175)" fontSize={12} tick={{ fill: 'rgba(111,131,175)' }} />
                <YAxis stroke="rgba(111,131,175)" fontSize={12} allowDecimals={false} tick={{ fill: 'rgba(111,131,175)' }} />
                <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                    content={({ payload, label }) => (
                        <div style={{ color: 'white', background: 'rgba(0,0,0,0.85)', padding: '8px 12px', borderRadius: '6px' }}>
                            {payload?.[0] && (
                                <>
                                    <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
                                    <p style={{ margin: '4px 0 0 0', color: '#ccc' }}>건수: {payload[0].value}</p>
                                </>
                            )}
                        </div>
                    )}
                />
                <Bar dataKey="count" barSize={60}>
                    {data.map((entry, index) => {
                        // --- 👇 2. 조건에 따라 두 그라데이션 중 하나를 선택하는 로직 ---
                        const isOther = entry.type === 'other';

                        return (
                            <Cell
                                key={`cell-${index}`}
                                fill={isOther ? 'url(#grad-other)' : 'url(#grad-default)'}
                                stroke='rgba(255,255,255,0.3)'
                                strokeWidth={1}
                                style={{
                                    filter: isOther
                                        ? 'drop-shadow(0px 2px 6px rgba(255,186,105,0.4))'
                                        : 'drop-shadow(0px 2px 6px rgba(255,255,255,0.2))',
                                }}
                            />
                        );
                    })}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}