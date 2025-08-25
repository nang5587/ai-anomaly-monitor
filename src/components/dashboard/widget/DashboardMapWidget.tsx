'use client'
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ArrowLeftRight } from 'lucide-react';
import { Play } from 'lucide-react';

import { SupplyChainMapWidget } from './SupplyChainMapWidget';
import { HeatmapViewWidget } from './HeatmapViewWidget';

import { useSetAtom } from 'jotai';
import {
    replayTriggerAtom,
    loadInitialDataAtom,
    selectedFileIdAtom
} from '@/stores/mapDataAtoms';

import { type Tab } from '@/components/visual/SupplyChainDashboard';
import { type LocationNode, type AnalyzedTrip } from '../../../types/data';

type DashboardMapWidgetProps = {
    onWidgetClick: (tab: Tab) => void;
};

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
                <div className="absolute inset-0 z-10 top-0 left-0 p-4">
                    <h3 className="font-noto-400 text-white text-2xl px-3 pb-3 mb-2 flex-shrink-0">이상 발생 밀집도</h3>
                </div>
            </AnimatePresence>
        </div>
    );
};