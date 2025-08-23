'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

type ConeWarningGaugeProps = {
    rate: number;
}

export default function ConeWarningGauge({rate}:ConeWarningGaugeProps) {
    const totalSegments = 30;
    const maxValue = 100;
    
    const safeRate = isNaN(rate) ? 0 : Math.max(0, Math.min(rate, 100));
    const filledSegments = Math.round((safeRate / maxValue) * totalSegments);
    
    const pieData = Array.from({ length: totalSegments }, (_, i) => ({
        name: `seg-${i}`,
        value: 1,
        fill: i < filledSegments ? 'rgba(121,141,185)' : '#ffffff',
    }));
    return (
        <div className="relative w-44 h-44">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius="80%"
                        outerRadius="100%"
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={2.5}
                        dataKey="value"
                        stroke='none'
                        cornerRadius={5}
                    >
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex items-center justify-center gap-1 pointer-events-none">
                <span className="text-5xl font-bold text-white font-lato">{safeRate.toFixed(2)}</span>
                <span className="text-base text-[#E0E0E0] mt-1">%</span>
            </div>
        </div>
    );
}
