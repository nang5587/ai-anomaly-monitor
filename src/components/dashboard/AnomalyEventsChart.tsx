'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { getAnomalyColor } from '@/components/visual/colorUtils';
import { AnomalyType } from '../visual/data';

type AnomalyDataPoint = {
    name: string;
    count: number;
    color1: string; // 그라데이션 시작 색
    color2: string; // 그라데이션 끝 색
};

type AnomalyEventsChartProps = {
    data: AnomalyDataPoint[];
};

export default function AnomalyEventsChart({ data }: AnomalyEventsChartProps): JSX.Element {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <defs>
                    {data.map((entry, index) => (
                        <linearGradient id={`colorGradient${index}`} key={index} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={entry.color1} />
                            <stop offset="100%" stopColor={entry.color2} />
                        </linearGradient>
                    ))}
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="name" stroke="#E0E0E0" fontSize={12} tick={{ fill: '#E0E0E0' }} />
                <YAxis stroke="#E0E0E0" fontSize={12} allowDecimals={false} tick={{ fill: '#E0E0E0' }}/>
                <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                    content={({ payload, label }) => (
                        <div style={{ color: 'white', background: 'rgba(0,0,0,0.8)', padding: '8px 12px', borderRadius: '4px', border: '1px solid #555' }}>
                            {payload?.[0] && (
                                <>
                                    <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
                                    <p style={{ margin: '4px 0 0 0', color: '#ccc' }}>건수: {payload[0].value}</p>
                                </>
                            )}
                        </div>
                    )}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#colorGradient${index})`} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}