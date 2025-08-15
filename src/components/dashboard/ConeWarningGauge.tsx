'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

type ConeWarningGaugeProps = {
    rate: number;
}

export default function ConeWarningGauge({rate}:ConeWarningGaugeProps) {
    const totalSegments = 40;
    const maxValue = 100;
    
    const safeRate = isNaN(rate) ? 0 : Math.max(0, Math.min(rate, 100));
    const filledSegments = Math.round((safeRate / maxValue) * totalSegments);
    
    const pieData = Array.from({ length: totalSegments }, (_, i) => ({
        name: `seg-${i}`,
        value: 1,
        fill: i < filledSegments ? 'rgba(121,141,185)' : '#ffffff',
    }));
    return (
        <div className="relative w-56 h-56">
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

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-5xl font-bold text-white font-lato">{safeRate.toFixed(2)}</p>
                <p className="text-base text-[#E0E0E0] mt-1">%</p>
            </div>
        </div>
    );
}
