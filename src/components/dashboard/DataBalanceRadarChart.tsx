'use client';

import { useMemo } from 'react';
import { ResponsiveRadar } from '@nivo/radar';
import { type InventoryDataPoint } from "../../types/data";

interface DataBalanceRadarChartProps {
    data: InventoryDataPoint[];
}

type RadarDatum = {
    businessStep: string;
    value: number;
    average: number;
};

export default function DataBalanceRadarChart({ data }: DataBalanceRadarChartProps) {
    const { radarData, averageValue } = useMemo(() => {
        if (!data || data.length === 0) {
            return { radarData: [], averageValue: 0 };
        }
        const formattedData = data.map(item => ({
            subject: item.businessStep,
            value: item.value
        }));
        const total = formattedData.reduce((sum, item) => sum + item.value, 0);
        const avg = formattedData.length > 0 ? total / formattedData.length : 0;
        const dataWithAverage: RadarDatum[] = formattedData.map(item => ({
            businessStep: item.subject,
            value: item.value,
            average: parseFloat(avg.toFixed(1)),
        }));
        return { radarData: dataWithAverage, averageValue: avg };
    }, [data]); 

    if (radarData.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-neutral-500">
                <p>재고 데이터가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            <ResponsiveRadar
                data={radarData}
                keys={['average', 'value' ]}
                indexBy="businessStep"
                valueFormat={value => `${value.toLocaleString('en-US')} 개`}
                maxValue={Math.max(...radarData.map(d => d.value)) * 1.2}
                margin={{ top: 70, right: 80, bottom: 40, left: 80 }}
                theme={{
                    axis: {
                        ticks: { text: { fill: '#E0E0E0', fontSize: 11 } },
                        legend: { text: { fill: '#FFFFFF' } }
                    },
                    grid: { line: { stroke: 'rgba(255, 255, 255, 0.3)', strokeDasharray: '4 4' } },
                    tooltip: { container: { background: 'rgba(0, 0, 0, 0.85)', color: '#FFFFFF', borderRadius: '6px', whiteSpace:'nowrap' } },
                    legends: { text: { fill: '#999' } }
                }}
                colors={['#E0E0E0', 'rgba(111, 131, 175, 1)' ]}
                fillOpacity={0.4}
                borderColor={{ from: 'color' }}
                borderWidth={2}
                gridLabelOffset={30}
                dotSize={6}
                dotColor={{ from: 'color' }}
                dotBorderWidth={2}
                motionConfig="wobbly"
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
                            { id: 'value', label: '재고 수량', color: 'rgba(111, 131, 175, 1)' },
                            { id: 'average', label: `평균 (${averageValue.toLocaleString('en-US')} 개)`, color: '#E0E0E0' },
                        ],
                        effects: [{ on: 'hover', style: { itemTextColor: '#fff' } }],
                    },
                ]}
            />
        </div>
    );
}