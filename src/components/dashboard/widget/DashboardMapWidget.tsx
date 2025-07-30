'use client'
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ArrowLeftRight } from 'lucide-react';
import { Play } from 'lucide-react';

import { SupplyChainMapWidget } from './SupplyChainMapWidget';
import { HeatmapViewWidget } from './HeatmapViewWidget';

import { useSetAtom } from 'jotai'; // ✨ useSetAtom import
import {
    replayTriggerAtom,
    loadInitialDataAtom,
    selectedFileIdAtom
} from '@/stores/mapDataAtoms';

import { type Tab } from '@/components/visual/SupplyChainDashboard';
import { type LocationNode, type AnalyzedTrip } from '../../../types/data';

// Props 타입 정의
type DashboardMapWidgetProps = {
    onWidgetClick: (tab: Tab) => void;
};

// Framer Motion 애니메이션 Variants 정의
const widgetVariants: Variants = {
    hidden: { x: '100%', opacity: 0, scale: 0.9 },
    visible: { x: 0, opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeInOut' } },
    exit: { x: '-100%', opacity: 0, scale: 0.9, transition: { duration: 0.5, ease: 'easeInOut' } },
};

export const DashboardMapWidget: React.FC<DashboardMapWidgetProps> = ({ onWidgetClick }) => {
    const [activeWidget, setActiveWidget] = useState<'path' | 'heatmap'>('heatmap');
    const triggerReplay = useSetAtom(replayTriggerAtom);

    const loadInitialData = useSetAtom(loadInitialDataAtom);
    const setSelectedFileId = useSetAtom(selectedFileIdAtom);
    const searchParams = useSearchParams();

    const toggleWidget = () => {
        setActiveWidget(prev => (prev === 'path' ? 'heatmap' : 'path'));
    };
    const handleReplayClick = () => {
        triggerReplay((c) => c + 1);
    };

    useEffect(() => {
        const fileIdFromUrl = searchParams.get('fileId');
        if (fileIdFromUrl) {
            const fileId = Number(fileIdFromUrl);
            setSelectedFileId(fileId);
            loadInitialData();
        } else {
            console.warn("DashboardMapWidget: URL에서 fileId를 찾을 수 없습니다.");
        }
    }, [searchParams, setSelectedFileId, loadInitialData]);

    return (
        <div className="relative w-full h-full rounded-3xl overflow-hidden bg-black">
            <AnimatePresence mode="wait">
                {activeWidget === 'path' && (
                    <motion.div
                        key="path" // AnimatePresence가 컴포넌트를 식별하는 고유 키
                        className="w-full h-full"
                        variants={widgetVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <SupplyChainMapWidget
                            onWidgetClick={() => onWidgetClick('all')}
                        />
                        <button
                            onClick={handleReplayClick}
                            className="absolute top-4 left-4 text-white p-2 rounded-full bg-black/50 border border-white/30 hover:bg-black/80 transition-colors"
                            title="애니메이션 다시 재생"
                        >
                            <Play size={24} />
                        </button>
                    </motion.div>
                )}

                {activeWidget === 'heatmap' && (
                    <motion.div
                        key="heatmap"
                        className="w-full h-full"
                        variants={widgetVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <HeatmapViewWidget
                            showLegend={false}
                            onWidgetClick={() => onWidgetClick('heatmap')}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 카드 넘김 버튼 */}
            <button
                onClick={toggleWidget}
                className="absolute top-4 right-4 text-white p-2 rounded-full bg-black/50 border border-white/30 hover:bg-black/80 transition-colors"
                title="다음 위젯 보기"
            >
                <ArrowLeftRight size={24} />
            </button>
        </div>
    );
};