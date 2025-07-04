'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Node } from '@/components/visual/data';
import { getNodeColor } from '@/components/visual/colorUtils';

type InventoryDataPoint = { name: string; value: number };
type InventoryDistributionChartProps = { data: InventoryDataPoint[] };

export default function InventoryDistributionChart({ data }: InventoryDistributionChartProps): JSX.Element {
    // 가장 큰 value를 가진 데이터 항목 찾기
    const maxValue = Math.max(...data.map(d => d.value));
    const maxIndex = data.findIndex(d => d.value === maxValue);

    // 강조 색상
    const highlightColor = 'rgba(111,131,175, 1)';
    const highlightStroke = '#E0E0E0';

    // 기본 회색 계열 색상
    const baseFill = 'rgba(200, 200, 200, 0.3)';
    const baseStroke = '#E0E0E0';

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Tooltip
                    content={({ payload }) => (
                        <div style={{ color: 'white', background: 'rgba(0,0,0,0.8)', padding: 8, borderRadius: 4 }}>
                            {payload?.[0] && (
                                <p>{payload[0].name} : {payload[0].value}</p>
                            )}
                        </div>
                    )}
                />
                <Legend
                    iconSize={10}
                    wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255)', paddingLeft: '10px' }}
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                />
                <Pie
                    data={data}
                    cx="40%"
                    cy="50%"
                    labelLine={false}
                    outerRadius="90%"
                    // innerRadius="50%"
                    dataKey="value"
                    // paddingAngle={3}
                    stroke="none"
                >
                    {data.map((entry, index) => {
                        const isMax = index === maxIndex;
                        return (
                            <Cell
                                key={`cell-${index}`}
                                fill={isMax ? highlightColor : baseFill}
                                stroke={isMax ? highlightStroke : baseStroke}
                                strokeWidth={1}
                            />
                        );
                    })}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
    );
}
