'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from 'recharts';

type AnomalyDataPoint = {
    name: string;
    type: string;
    count: number;
    color1: string;
    color2: string;
};

type AnomalyEventsChartProps = {
    data: AnomalyDataPoint[];
};

const pastelColorMap: { [key: string]: string } = {
    'fake': 'rgba(111,131,175)',
    'tamper': 'rgba(111,131,175)',
    'clone': 'rgba(111,131,175)',
    'default': 'rgba(111,131,175)',
};

export default function AnomalyEventsChart({ data }: AnomalyEventsChartProps): JSX.Element {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <defs>
                    {Object.entries(pastelColorMap).map(([type, color]) => (
                        <linearGradient key={type} id={`grad-${type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={1} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.2} />
                        </linearGradient>
                    ))}
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(111, 131, 175, 0.3)" />
                <XAxis dataKey="name" stroke="rgba(111,131,175)" fontSize={12} tick={{ fill: 'rgba(111,131,175)' }} />
                <YAxis stroke="rgba(111,131,175)" fontSize={12} allowDecimals={false} tick={{ fill: 'rgba(111,131,175)' }} domain={[0, (dataMax: number) => Math.ceil((dataMax * 1.2) / 10) * 10]} />
                <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                    content={({ payload, label }) => (
                        <div style={{ color: 'white', background: 'rgba(0,0,0,0.85)', padding: '8px 12px', borderRadius: '6px' }}>
                            {payload?.[0] && (
                                <>
                                    <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
                                    <p style={{ margin: '4px 0 0 0', color: '#ccc' }}>건수: {payload[0].value}</p>
                                </>
                            )}
                        </div>
                    )}
                />
                <Bar dataKey="count" barSize={60}>
                    {/* <LabelList
                        dataKey="count"     // 막대에 표시할 데이터의 키
                        position="top"      // 막대의 '위쪽(top)'에 표시
                        offset={8}          // 막대 끝에서 8px 떨어진 위치
                        fill="rgba(40,40,40,0.8)" // 글자 색상
                        fontSize={14}       // 글자 크기
                        fontWeight="bold"   // 글자 굵기
                        /> */}
                    <LabelList
                        dataKey="count"
                        position="top"
                        style={{ fill: 'rgba(111,131,175)', fontSize: 12 }}
                    />
                    {data.map((entry, index) => {
                        const type = entry.type in pastelColorMap ? entry.type : 'default';
                        return (
                            <Cell
                                key={`cell-${index}`}
                                fill={`url(#grad-${type})`}
                                stroke='rgba(255,255,255,0.3)'
                                strokeWidth={1}

                                style={{
                                    filter: 'drop-shadow(0px 2px 6px rgba(255,255,255,0.2))',
                                    borderTop: "10px"
                                }}
                            />

                        );
                    })}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}