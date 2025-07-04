'use client';

import { ResponsivePie } from '@nivo/pie';

const pieData = [
    {
        id: 'Factory',
        label: 'Factory',
        value: 380,
        color: '#6F83AF',
    },
    {
        id: 'WMS',
        label: 'WMS',
        value: 90,
        color: '#A0A0A0',
    },
    {
        id: 'Logistics_HUB',
        label: 'Logistics HUB',
        value: 75,
        color: '#C0C0C0',
    },
    {
        id: 'W_Stock',
        label: 'W Stock',
        value: 60,
        color: '#C8C8C8',
    },
    {
        id: 'R_Stock',
        label: 'R Stock',
        value: 50,
        color: '#D0D0D0',
    },
    {
        id: 'POS_Sell',
        label: 'POS Sell',
        value: 35,
        color: '#E0E0E0',
    },
];

export default function InventoryDistributionChart() {
    return (
        <div className="w-full h-full">
            <ResponsivePie
                data={pieData}
                innerRadius={0.6}
                padAngle={2}
                cornerRadius={6}
                activeOuterRadiusOffset={10}
                colors={{ datum: 'data.color' }}
                borderWidth={2}
                borderColor={{ from: 'color', modifiers: [['darker', 0.5]] }}
                enableArcLinkLabels={false}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor="#FFFFFF"
                arcLabel={(e) => `${e.label} (${e.value})`}
                tooltip={({ datum }) => (
                    <div style={{
                        background: 'rgba(0,0,0,0.9)',
                        padding: '8px 12px',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '14px',
                    }}>
                        <strong>{datum.label}</strong>: {datum.value}
                    </div>
                )}
                theme={{
                    background: 'transparent',
                    labels: {
                        text: {
                            fontSize: 12,
                            fontWeight: 'bold',
                        },
                    },
                }}
            />
        </div>
    );
}
