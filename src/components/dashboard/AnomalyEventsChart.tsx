'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { getAnomalyColor } from '@/components/visual/colorUtils';
import { AnomalyType } from '../visual/data';

type AnomalyDataPoint = {
    name: string;
    type: string; // AnomalyType
    count: number;
    color1: string;
    color2: string;
};

type AnomalyEventsChartProps = {
    data: AnomalyDataPoint[];
};

const pastelColorMap: { [key: string]: string } = {
    // '시공간 점프': 연한 라벤더 색상
    'jump': '#D7BDE2',
    // '이벤트 순서 오류': 부드러운 살구색
    'evtOrderErr': '#FAD7A0',
    // '위조': 매우 연한 핑크
    'epcFake': '#F5B7B1',
    // '복제': 부드러운 크림색
    'epcDup': '#FCF3CF',
    // '경로 위조': 매우 연한 하늘색
    'locErr': '#A9CCE3',
    // 기본값: 연한 회색
    'default': '#E5E7E9',
};


export default function AnomalyEventsChart({ data }: AnomalyEventsChartProps): JSX.Element {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="name" stroke="#E0E0E0" fontSize={12} tick={{ fill: '#E0E0E0' }} />
                <YAxis stroke="#E0E0E0" fontSize={12} allowDecimals={false} tick={{ fill: '#E0E0E0' }} />
                <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                    content={({ payload, label }) => (
                        <div style={{ color: 'white', background: 'rgba(0,0,0,0.8)', padding: '8px 12px', borderRadius: '4px', border: '1px solid #555' }}>
                            {payload?.[0] && (
                                <>
                                    <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
                                    <p style={{ margin: '4px 0 0 0', color: '#ccc' }}>건수: {payload[0].value}</p>
                                </>
                            )}
                        </div>
                    )}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={60}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pastelColorMap[entry.type] || pastelColorMap['default']} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}