'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

import { StageBarDataPoint } from '@/types/chart';

interface StandardChartProps {
    data: StageBarDataPoint[];
}

const StageStandardLineChart: React.FC<StandardChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-400">데이터가 없습니다.</div>;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart
                data={data}
                margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
            >
                <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgba(111,131,175)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="rgba(111,131,175)" stopOpacity={0}/>
                    </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" vertical={false} />
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#E0E0E0', fontSize: 12 }}
                    interval={0}
                    angle={-30}
                    textAnchor='end'
                    height={80}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#A0A0A0', fontSize: 11 }}
                />
                <Tooltip
                    cursor={{ stroke: 'rgba(111,131,175)', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{
                        background: 'rgba(0, 0, 0, 0.85)', color: 'white', borderRadius: '6px', whiteSpace:'nowrap',
                        border: 'none'
                    }}
                    itemStyle={{ color: '#FFFFFF' }}
                />
                <Area
                    dataKey="count"
                    stroke="rgba(111,131,175)"
                    strokeWidth={2}
                    fill="url(#areaGradient)"
                    dot={{ r: 5, stroke: 'rgba(111,131,175)', fill: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 8, stroke: '#fff' }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default StageStandardLineChart;