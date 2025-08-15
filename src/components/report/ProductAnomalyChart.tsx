'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList } from 'recharts';
import { ProductCount } from '@/types/data';

type ProductAnomalyChartProps = {
    data: ProductCount[];
};

import { COLORS } from '@/types/file';

export default function ProductAnomalyChart({ data }: ProductAnomalyChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <Legend verticalAlign='top' height={30} wrapperStyle={{ fontSize: '10px', color: 'rgba(111,131,175)' }} />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="productName" stroke="rgba(111,131,175)" fontSize={12} />
                <YAxis stroke="rgba(111,131,175)" fontSize={12} allowDecimals={false} />
                <Tooltip
                    contentStyle={{
                        background: 'rgba(0,0,0,0.85)',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white'
                    }}
                    labelStyle={{ fontWeight: 'bold' }}
                    formatter={(value: number, name: string) => [`${value}건`, name]}
                />
                <Bar dataKey="fake" stackId="a" name="위조" fill={COLORS.fake}>
                    <LabelList dataKey="fake" position="middle" style={{ fill: 'white', fontSize: 12, fontWeight: 'bold'  }} />
                </Bar>
                <Bar dataKey="tamper" stackId="a" name="변조" fill={COLORS.tamper}>
                    <LabelList dataKey="tamper" position="middle" style={{ fill: 'white', fontSize: 12, fontWeight: 'bold'  }} />
                </Bar>
                <Bar dataKey="clone" stackId="a" name="복제" fill={COLORS.clone} >
                    <LabelList dataKey="clone" position="middle" style={{ fill: 'white', fontSize: 12, fontWeight: 'bold'  }} />
                </Bar>
                <Bar dataKey="clone" stackId="a" name="신규 유형" fill={COLORS.other} >
                    <LabelList dataKey="clone" position="middle" style={{ fill: 'white', fontSize: 12, fontWeight: 'bold'  }} />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}