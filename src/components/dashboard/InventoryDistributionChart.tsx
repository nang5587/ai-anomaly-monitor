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
                    {data.map((entry, index) => (
                        <Cell key={index} fill={`url(#colorGradient${index})`} />
                    ))}
                </Pie>
                <defs>
                    {data.map((entry, index) => {
                        const nodeType = entry.name as Node['type'];
                        const [r, g, b, a] = getNodeColor(nodeType);
                        const mix = 0.8;
                        const pastelR = Math.round(r + (255 - r) * mix);
                        const pastelG = Math.round(g + (255 - g) * mix);
                        const pastelB = Math.round(b + (255 - b) * mix);
                        const pastelColor = `rgba(${pastelR}, ${pastelG}, ${pastelB}, 0.8)`;
                        const transparentPastel = `rgba(${pastelR}, ${pastelG}, ${pastelB}, 0)`;

                        return (
                            <radialGradient
                                key={index}
                                id={`colorGradient${index}`}
                                cx="50%"
                                cy="50%"
                                r="50%"
                                fx="50%"
                                fy="50%"
                            >
                                <stop offset="0%" stopColor={pastelColor} />
                                <stop offset="100%" stopColor={transparentPastel} />
                            </radialGradient>
                        );
                    })}
                </defs>
            </PieChart>
        </ResponsiveContainer>
    );
}