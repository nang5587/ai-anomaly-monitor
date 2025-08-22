'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { ProductCount } from '@/types/data';

type ProductAnomalyChartProps = {
    data: ProductCount[];
};

import { COLORS } from '@/types/file';

export default function ProductAnomalyChart({ data }: ProductAnomalyChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="productName" stroke="#E0E0E0" fontSize={12} />
                <YAxis stroke="#E0E0E0" fontSize={12} allowDecimals={false} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#E0E0E0' }} />
                <Tooltip
                    contentStyle={{
                        background: 'rgba(0,0,0,0.85)',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white'
                    }}
                    labelStyle={{ fontWeight: 'bold' }}
                    formatter={(value, name) => [`${value}건`, name]}
                />
                <Line type="monotone" dataKey="total" stroke={COLORS.total} strokeWidth={2} name="전체" />
                <Line type="monotone" dataKey="fake" stroke={COLORS.fake} strokeWidth={2} name="위조" />
                <Line type="monotone" dataKey="tamper" stroke={COLORS.tamper} strokeWidth={2} name="변조" />
                <Line type="monotone" dataKey="clone" stroke={COLORS.clone} strokeWidth={2} name="복제" />
                <Line type="monotone" dataKey="other" stroke={COLORS.other} strokeWidth={2} name="AI탐지" />
            </LineChart>
        </ResponsiveContainer>
    );
}