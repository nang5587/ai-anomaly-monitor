'use client';

import { useMemo } from 'react';
import { ResponsiveRadar } from '@nivo/radar';

type RadarDatum = {
    subject: string;
    value: number;
    average: number;
};

type SliceTooltipProps = {
    slice: {
        points: Array<{
            id: string;
            serieId: string | number;
            formattedValue: string;
            color: string;
            data: RadarDatum;
        }>
    }
}

const originalData = [
    { subject: 'Factory', value: 80 },
    { subject: 'WMS', value: 90 },
    { subject: 'Logistics', value: 75 },
    { subject: 'Warehouse', value: 60 },
    { subject: 'Retail', value: 50 },
    { subject: 'POS', value: 35 },
];

const CustomSliceTooltip = (props: any) => {
    console.log('Tooltip props:', props);
    if (!props.slice) {
        return null;
    }
    if (!props.slice) {
        return null;
    }

    const { slice } = props;

    return (
        <div style={{ background: 'rgba(0,0,0,0.85)', padding: '9px 12px', borderRadius: '6px', color: '#fff' }}>
            {slice.points.map((point: any) => (
                <div key={point.id} style={{ display: 'flex', alignItems: 'center', padding: '3px 0' }}>
                    <div style={{ width: 12, height: 12, background: point.color, marginRight: 8 }} />
                    {/* point.data가 RadarDatum 타입임을 가정하고 사용합니다. */}
                    <strong>{point.serieId === 'value' ? point.data.subject : 'Average'}:</strong>
                    <span style={{ marginLeft: 'auto' }}>{point.formattedValue}</span>
                </div>
            ))}
        </div>
    );
};

export default function DataBalanceRadarChart() {
    const { radarData, averageValue } = useMemo(() => {
        if (!originalData || originalData.length === 0) {
            return { radarData: [], averageValue: 0 };
        }
        const total = originalData.reduce((sum, item) => sum + item.value, 0);
        const avg = total / originalData.length;
        const dataWithAverage = originalData.map(item => ({
            ...item,
            average: parseFloat(avg.toFixed(1)),
        }));
        return { radarData: dataWithAverage, averageValue: avg };
    }, []);

    return (
        <div className="w-full h-full">
            <ResponsiveRadar
                data={radarData}
                keys={['average', 'value']}
                indexBy="subject"
                maxValue={Math.max(...originalData.map(d => d.value)) * 1.2}
                margin={{ top: 70, right: 80, bottom: 40, left: 80 }}

                theme={{
                    axis: { ticks: { text: { fill: '#E0E0E0', fontSize: 10 } } },
                    grid: { line: { stroke: 'rgba(255, 255, 255, 0.2)', strokeDasharray: '4 4' } },
                    tooltip: { container: { background: 'rgba(0, 0, 0, 0.85)', color: '#FFFFFF', borderRadius: '6px' } },
                    labels: { text: { fill: '#FFFFFF', fontSize: 14, fontWeight: 'bold' } }
                }}

                colors={['#E0E0E0', 'rgba(111, 131, 175, 1)']}
                borderColor={{ from: 'color' }}
                borderWidth={2}
                // sliceTooltip={CustomSliceTooltip}

                gridLabelOffset={30}
                dotSize={6}
                dotColor={{ from: 'color' }}
                dotBorderWidth={2}

                legends={[
                    {
                        anchor: 'top-left',
                        direction: 'column',
                        translateX: -50,
                        translateY: -40,
                        itemsSpacing: 4,
                        itemWidth: 80,
                        itemHeight: 20,
                        itemTextColor: '#999',
                        symbolSize: 12,
                        symbolShape: 'circle',
                        data: [
                            { id: 'average', label: `Average (${averageValue.toFixed(0)})`, color: '#E0E0E0' },
                            { id: 'value', label: 'Actual', color: 'rgba(111, 131, 175, 1)' }
                        ],
                        effects: [{ on: 'hover', style: { itemTextColor: '#fff' } }],
                    },
                ]}
            />
        </div>
    );
}