'use client';

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
                <XAxis type="number" stroke="rgba(111,131,175)" fontSize={12} allowDecimals={false} />
                <YAxis
                    type="category"
                    dataKey="name" 
                    stroke="#333"
                    tick={{ fill: 'rgba(111,131,175)' }}
                    fontSize={12}
                    width={100}
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
                <Bar dataKey="count" barSize={4} background={{ fill: '#eee' }} radius={4} fill="#8884d8">
                    <LabelList
                        dataKey="count"
                        position="right" 
                        style={{ fill: 'rgba(111,131,175)', fontSize: 12, fontWeight: 'bold' }}
                    />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}