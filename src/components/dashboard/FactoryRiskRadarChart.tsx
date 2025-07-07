// src/components/dashboard/FactoryRiskRadarChart.tsx
'use client';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

type RadarDataPoint = {
    subject: string;
    A: number;
    fullMark: number;
};

type FactoryRiskRadarChartProps = {
    data: RadarDataPoint[];
};

export default function FactoryRiskRadarChart({ data }: FactoryRiskRadarChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
                <PolarAngleAxis dataKey="subject" stroke="#E0E0E0" fontSize={14} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar name="위험도 점수" dataKey="A" stroke="rgba(111,131,175)" fill="rgba(111,131,175,0.6)" fillOpacity={1} />
                <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="bottom"
                    wrapperStyle={{ color: '#E0E0E0' }}
                />
            </RadarChart>
        </ResponsiveContainer>
    );
}