'use client';

// 1. import 목록을 AreaChart와 Area로 변경합니다.
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

// 데이터 타입 정의는 이전과 동일합니다.
export interface StageBarDataPoint {
    stageName: string;
    count: number;
}

interface StandardChartProps {
    data: StageBarDataPoint[];
}

const StageStandardLineChart: React.FC<StandardChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-400">데이터가 없습니다.</div>;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            {/* 2. BarChart를 AreaChart로 변경합니다. */}
            <AreaChart
                data={data}
                margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
            >
                {/* 3. 영역을 채울 그라디언트를 정의합니다. */}
                <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgba(111,131,175)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="rgba(111,131,175)" stopOpacity={0}/>
                    </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" vertical={false} />
                <XAxis
                    dataKey="stageName"
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
                {/* 4. Bar 컴포넌트를 Area 컴포넌트로 교체합니다. */}
                <Area
                    dataKey="count"
                    stroke="rgba(111,131,175)" // 선 색상
                    strokeWidth={2}
                    fill="url(#areaGradient)" // 영역 채우기
                    dot={{ r: 5, stroke: 'rgba(111,131,175)', fill: '#fff', strokeWidth: 2 }} // 각 데이터 포인트의 점
                    activeDot={{ r: 8, stroke: '#fff' }} // 호버 시 점 스타일
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default StageStandardLineChart;