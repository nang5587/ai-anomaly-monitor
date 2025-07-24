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

const formatNumberWithCommas = (value: number) => `${value.toLocaleString('en-US')} 개`;

export default function DataBalanceRadarChart({ data }: DataBalanceRadarChartProps) {
    const { radarData, averageValue } = useMemo(() => {
        // 데이터가 없거나 비어있으면 빈 값 반환
        if (!data || data.length === 0) {
            return { radarData: [], averageValue: 0 };
        }

        // businessStep을 subject로, value를 value로 매핑
        const formattedData = data.map(item => ({
            subject: item.businessStep,
            value: item.value
        }));

        const total = formattedData.reduce((sum, item) => sum + item.value, 0);
        const avg = formattedData.length > 0 ? total / formattedData.length : 0;

        // Nivo Radar 차트가 요구하는 최종 데이터 형태로 가공
        const dataWithAverage: RadarDatum[] = formattedData.map(item => ({
            businessStep: item.subject,
            value: item.value,
            average: parseFloat(avg.toFixed(1)),
        }));

        return { radarData: dataWithAverage, averageValue: avg };
    }, [data]); // ✨ 의존성 배열에 data 추가

    // 데이터가 없을 때 표시할 UI
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
                keys={['average', 'value' ]} // 순서 변경: 실제 값을 위로, 평균을 아래로
                indexBy="businessStep" // ✨ subject 대신 businessStep 사용
                valueFormat={value => `${value.toLocaleString('en-US')} 개`}
                maxValue={Math.max(...radarData.map(d => d.value)) * 1.2} // ✨ 동적 최대값 계산
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
                colors={['#E0E0E0', 'rgba(111, 131, 175, 1)' ]} // 순서에 맞게 색상 변경
                fillOpacity={0.4}
                borderColor={{ from: 'color' }}
                borderWidth={2}
                gridLabelOffset={30}
                dotSize={6}
                dotColor={{ from: 'color' }}
                dotBorderWidth={2}
                // blendMode="multiply"
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