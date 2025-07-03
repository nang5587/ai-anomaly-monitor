'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { getAnomalyColor } from '@/components/visual/colorUtils';
import { AnomalyType } from '../visual/data';

type AnomalyDataPoint = {
    name: string;
    count: number;
    color?: string; // 바 색상을 위한 속성
};

type AnomalyEventsChartProps = {
    data: AnomalyDataPoint[];
};

export default function AnomalyEventsChart({ data }: AnomalyEventsChartProps): JSX.Element {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <defs>
                    {data.map((entry, index) => {
                        const [r, g, b] = getAnomalyColor(entry.name as AnomalyType);
                        const mix = 0.7;
                        const pastelR = Math.round(r + (255 - r) * mix);
                        const pastelG = Math.round(g + (255 - g) * mix);
                        const pastelB = Math.round(b + (255 - b) * mix);

                        const pastelColor = `rgba(${pastelR}, ${pastelG}, ${pastelB}, 0.8)`;  // 불투명한 쪽
                        const transparentPastel = `rgba(${pastelR}, ${pastelG}, ${pastelB}, 0)`; // 투명한 쪽

                        return (
                            <linearGradient id={`colorGradient${index}`} key={index} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={pastelColor} />
                                <stop offset="100%" stopColor={transparentPastel} />
                            </linearGradient>
                        );
                    })}
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} allowDecimals={false} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(30, 30, 30, 0.8)',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        color: '#ffffff'
                    }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#colorGradient${index})`} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}