'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, PieLabelRenderProps } from 'recharts';
import { Node } from '@/components/visual/data'; // Node 타입 import
import { getNodeColor } from '@/components/visual/colorUtils';


// ... (타입 정의 및 renderCustomizedLabel 함수는 동일)
type InventoryDataPoint = { name: string; value: number; };
type InventoryDistributionChartProps = { data: InventoryDataPoint[]; };
// ...

export default function InventoryDistributionChart({ data }: InventoryDistributionChartProps): JSX.Element {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(30, 30, 30, 0.8)',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                    }}
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
                    cx="40%" // 범례 공간 확보를 위해 중앙에서 왼쪽으로 이동
                    cy="50%"
                    labelLine={false}
                    outerRadius="90%"
                    innerRadius="50%"
                    dataKey="value"
                    paddingAngle={5}
                    stroke='none'
                >
                    <defs>
                        {data.map((entry, index) => {
                            // getNodeColor 함수를 사용하여 각 타입에 맞는 색상을 동적으로 적용
                            const nodeType = entry.name as Node['type'];
                            const [r, g, b, a] = getNodeColor(nodeType);
                            const mix = 0.8;
                            const pastelR = Math.round(r + (255 - r) * mix);
                            const pastelG = Math.round(g + (255 - g) * mix);
                            const pastelB = Math.round(b + (255 - b) * mix);
                            const pastelColor = `rgba(${pastelR}, ${pastelG}, ${pastelB}, 0.8)`;  // 불투명한 쪽
                            const transparentPastel = `rgba(${pastelR}, ${pastelG}, ${pastelB}, 0)`;

                            return (
                                <linearGradient id={`colorGradient${index}`} key={index} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={pastelColor} />
                                    <stop offset="100%" stopColor={transparentPastel} />
                                </linearGradient>
                            );
                        })}
                    </defs>
                </Pie>
            </PieChart>
        </ResponsiveContainer>
    );
}