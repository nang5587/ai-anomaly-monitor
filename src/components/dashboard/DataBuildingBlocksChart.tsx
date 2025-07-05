'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 데이터 블록의 타입을 정의합니다.
type Block = {
    id: string;
    label: string;
    value: number;
    color: string;
};

// 원본 데이터 (Block 타입 배열로 선언)
const blockData: Block[] = [
    { id: 'Factory', label: 'Factory', value: 380, color: '#6F83AF' },
    { id: 'WMS', label: 'WMS', value: 90, color: '#8A9DBF' },
    { id: 'Logistics_HUB', label: 'Logistics HUB', value: 75, color: '#A5B9CF' },
    { id: 'W_Stock', label: 'W Stock', value: 60, color: '#C0D5DF' },
    { id: 'R_Stock', label: 'R Stock', value: 50, color: '#DBF1EF' },
    { id: 'POS_Sell', label: 'POS Sell', value: 35, color: '#F5F5F5' },
];

// DataBlock 컴포넌트의 Props 타입을 정의합니다.
type DataBlockProps = {
    block: Block;
    maxHeight: number;
    totalValue: number;
    onHover: (id: string | null) => void;
};

// 각 블록 컴포넌트
const DataBlock: React.FC<DataBlockProps> = ({ block, maxHeight, totalValue, onHover }) => {
    // 값에 비례하여 높이 계산
    const heightPercentage = (block.value / maxHeight) * 100;
    const distributionPercentage = (block.value / totalValue) * 100;

    return (
        <motion.div
            className="relative h-full flex flex-col-reverse cursor-pointer" // 아래쪽부터 쌓이도록
            onMouseEnter={() => onHover(block.id)}
            onMouseLeave={() => onHover(null)}
            initial={{ height: '0%' }}
            animate={{ height: '100%' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            <motion.div
                className="w-full rounded-t-lg transition-all duration-300"
                style={{
                    backgroundColor: block.color,
                    boxShadow: `0 -5px 20px -5px ${block.color}55`, // 은은한 네온 효과
                }}
                initial={{ height: '0%' }}
                animate={{ height: `${heightPercentage}%` }}
                transition={{ duration: 1, delay: 0.2, type: 'spring' }}
                whileHover={{
                    backgroundColor: LightenColor(block.color, 20), // 호버 시 색상 밝게
                    boxShadow: `0 -5px 30px -5px ${block.color}99`,
                }}
            >
                {/* 블록 내부 텍스트 (높이가 충분할 때만 표시) */}
                {heightPercentage > 15 && (
                    <div className="absolute inset-x-0 bottom-2 text-center text-black/70 font-bold text-xs p-1">
                        <p>{block.label}</p>
                        <p className="text-sm">{distributionPercentage.toFixed(1)}%</p>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

// Tooltip 컴포넌트의 Props 타입을 정의합니다.
type TooltipProps = {
    block: Block | null;
};

// 툴팁 컴포넌트
const Tooltip: React.FC<TooltipProps> = ({ block }) => {
    if (!block) return null;
    return (
        <motion.div
            className="absolute -top-14 left-1/2 -translate-x-1/2 p-2 px-3 bg-gray-800 text-white text-sm rounded-lg shadow-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
        >
            <strong>{block.label}:</strong> {block.value}
        </motion.div>
    );
};

// 메인 차트 컴포넌트
const DataBuildingBlocksChart: React.FC = () => {
    // useState의 제네릭을 사용하여 상태의 타입을 명시합니다. (string 또는 null)
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    // useMemo의 반환 값 타입을 명시적으로 정의할 수 있습니다.
    const { sortedData, maxHeight, totalValue } = useMemo<{
        sortedData: Block[];
        maxHeight: number;
        totalValue: number;
    }>(() => {
        const sorted = [...blockData].sort((a, b) => b.value - a.value);
        const max = Math.max(...sorted.map((d) => d.value));
        const total = sorted.reduce((sum, d) => sum + d.value, 0);
        return { sortedData: sorted, maxHeight: max, totalValue: total };
    }, []);

    const hoveredBlock = hoveredId ? sortedData.find((b) => b.id === hoveredId) : null;

    return (
        <div className="w-full h-full bg-gray-900 p-6 rounded-lg flex flex-col justify-end">
            <div className="relative flex-grow flex items-end justify-center gap-2">
                {sortedData.map((block) => (
                    <div key={block.id} className="relative w-full h-full">
                        <DataBlock
                            block={block}
                            maxHeight={maxHeight}
                            totalValue={totalValue}
                            onHover={setHoveredId}
                        />
                    </div>
                ))}
                
                {/* 툴팁에 hoveredBlock (타입: Block | null)을 전달합니다 */}
                <AnimatePresence>
                    {hoveredBlock && <Tooltip block={hoveredBlock} />}
                </AnimatePresence>
            </div>
            <div className="pt-4 mt-4 border-t border-gray-700 text-center text-gray-400 text-xs">
                Inventory Distribution by Source
            </div>
        </div>
    );
};

export default DataBuildingBlocksChart;

// 헬퍼 함수: 색상을 밝게 만드는 유틸리티 (매개변수 타입 명시)
function LightenColor(color: string, percent: number): string {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.floor(R * (100 + percent) / 100);
    G = Math.floor(G * (100 + percent) / 100);
    B = Math.floor(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    const RR = R.toString(16).padStart(2, '0');
    const GG = G.toString(16).padStart(2, '0');
    const BB = B.toString(16).padStart(2, '0');

    return `#${RR}${GG}${BB}`;
}