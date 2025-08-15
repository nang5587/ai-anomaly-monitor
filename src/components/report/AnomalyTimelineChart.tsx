'use client';

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
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="time" stroke="rgba(111,131,175)" fontSize={12} />
                <YAxis stroke="rgba(111,131,175)" fontSize={12} allowDecimals={false} />
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
                    cursor={{ fill: 'rgba(111, 131, 175, 0.2)' }}
                />
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