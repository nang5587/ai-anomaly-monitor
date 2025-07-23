import type { LocationNode } from '@/components/visual/data';

export interface HeatmapViewProps {
    isHighlightMode: boolean;
}

export type EventTypeStats = {
    [eventType: string]: {
        count: number;
        hasAnomaly: boolean;
    }
};

export type NodeWithEventStats = LocationNode & {
    totalEventCount: number;
    hasAnomaly: boolean;
    eventTypeStats: EventTypeStats;
    dominantEventType: string;
    dominantEventCount: number;
};

// 히트맵 바 높이
export type StatValue = { count: number; hasAnomaly: boolean; };