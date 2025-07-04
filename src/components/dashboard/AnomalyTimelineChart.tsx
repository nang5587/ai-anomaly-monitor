// src/components/dashboard/AnomalyTimelineChart.tsx
'use client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E0E0E0" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#E0E0E0" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="time" stroke="#E0E0E0" fontSize={12} />
                <YAxis stroke="#E0E0E0" fontSize={12} allowDecimals={false} />
                <Tooltip content={({ payload, label }) => (
                    <div style={{ color: 'white', background: 'rgba(0,0,0,0.8)', padding: 8, borderRadius: 4 }}>
                        {payload?.[0] && (
                            <>
                                <p>시간 {label}</p>
                                <p>{payload[0].name} : {payload[0].value}</p>
                            </>
                        )}
                    </div>
                )} />
                <Area type="monotone" dataKey="count" stroke="#E0E0E0" fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
        </ResponsiveContainer>
    );
}