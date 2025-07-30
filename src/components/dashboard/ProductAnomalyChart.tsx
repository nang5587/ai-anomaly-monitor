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
                {/* 기존 차트와 동일한 디자인을 위한 그리드 */}
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />

                {/* X축은 제품명을 표시합니다 */}
                <XAxis dataKey="productName" stroke="#E0E0E0" fontSize={12} />
                <YAxis stroke="#E0E0E0" fontSize={12} allowDecimals={false} />

                {/* 범례 (어떤 색이 어떤 타입인지 표시) */}
                <Legend wrapperStyle={{ fontSize: '12px', color: '#E0E0E0' }} />

                {/* 커스텀 툴팁: 마우스를 올렸을 때 모든 정보를 보여줍니다 */}
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

                {/* 4개의 데이터 라인 */}
                <Line type="monotone" dataKey="total" stroke={COLORS.total} strokeWidth={2} name="전체" />
                <Line type="monotone" dataKey="fake" stroke={COLORS.fake} strokeWidth={2} name="위조" />
                <Line type="monotone" dataKey="tamper" stroke={COLORS.tamper} strokeWidth={2} name="변조" />
                <Line type="monotone" dataKey="clone" stroke={COLORS.clone} strokeWidth={2} name="복제" />
                <Line type="monotone" dataKey="other" stroke={COLORS.other} strokeWidth={2} name="미분류" />
            </LineChart>
        </ResponsiveContainer>
    );
}