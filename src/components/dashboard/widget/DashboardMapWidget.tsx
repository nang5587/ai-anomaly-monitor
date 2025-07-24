'use client'
import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ArrowLeftRight } from 'lucide-react';
import { Play } from 'lucide-react';

import { SupplyChainMapWidget } from './SupplyChainMapWidget';
import { HeatmapViewWidget } from './HeatmapViewWidget';

import { type Tab } from '@/components/visual/SupplyChainDashboard';
import { type LocationNode, type AnalyzedTrip } from '../../../types/data';

// Props 타입 정의
type DashboardMapWidgetProps = {
    nodes: LocationNode[];
    anomalyTrips: AnalyzedTrip[]; // 히트맵 위젯용 데이터
    allTripsForMap: AnalyzedTrip[]; // 경로 지도 위젯용 데이터
    minTime: number;
    maxTime: number;
    replayTrigger: number;
    onWidgetClick: (tab: Tab) => void;
    onReplayClick: () => void; // 다시보기 버튼 클릭 핸들러
};

// Framer Motion 애니메이션 Variants 정의
const widgetVariants: Variants = {
    hidden: { x: '100%', opacity: 0, scale: 0.9 },
    visible: { x: 0, opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeInOut' } },
    exit: { x: '-100%', opacity: 0, scale: 0.9, transition: { duration: 0.5, ease: 'easeInOut' } },
};

export const DashboardMapWidget: React.FC<DashboardMapWidgetProps> = ({
    nodes,
    anomalyTrips,
    allTripsForMap,
    minTime,
    maxTime,
    replayTrigger,
    onWidgetClick,
    onReplayClick,
}) => {
    const [activeWidget, setActiveWidget] = useState<'path' | 'heatmap'>('heatmap');

    const toggleWidget = () => {
        setActiveWidget(prev => (prev === 'path' ? 'heatmap' : 'path'));
    };

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
                            key={replayTrigger} // 리플레이를 위해 key를 외부에서 받음
                            nodes={nodes}
                            analyzedTrips={allTripsForMap}
                            minTime={minTime}
                            maxTime={maxTime}
                            onWidgetClick={() => onWidgetClick('all')}
                        />
                        <button
                            onClick={onReplayClick}
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
                            nodes={nodes}
                            trips={anomalyTrips} // 히트맵은 이상 데이터만 사용
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