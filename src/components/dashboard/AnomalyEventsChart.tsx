'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

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

// const pastelColorMap: { [key: string]: string } = {
//     // '시공간 점프': 연한 라벤더 색상
//     'jump': '#D7BDE2',
//     // '이벤트 순서 오류': 부드러운 살구색
//     'evtOrderErr': '#FAD7A0',
//     // '위조': 매우 연한 핑크
//     'epcFake': '#F5B7B1',
//     // '복제': 부드러운 크림색
//     'epcDup': '#FCF3CF',
//     // '경로 위조': 매우 연한 하늘색
//     'locErr': '#A9CCE3',
//     // 기본값: 연한 회색
//     'default': '#E5E7E9',
// };

const pastelColorMap: { [key: string]: string } = {
    // '시공간 점프': 연한 라벤더 색상
    'jump': 'rgba(111,131,175)',
    // '이벤트 순서 오류': 부드러운 살구색
    'evtOrderErr': 'rgba(111,131,175)',
    // '위조': 매우 연한 핑크
    'epcFake': 'rgba(111,131,175)',
    // '복제': 부드러운 크림색
    'epcDup': 'rgba(111,131,175)',
    // '경로 위조': 매우 연한 하늘색
    'locErr': 'rgba(111,131,175)',
    // 기본값: 연한 회색
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
                <YAxis stroke="rgba(111,131,175)" fontSize={12} allowDecimals={false} tick={{ fill: 'rgba(111,131,175)' }} />
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
                <Bar dataKey="count" barSize={60}>
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