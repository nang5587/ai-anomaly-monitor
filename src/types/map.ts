import type { LocationNode } from './data';

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


export const formatUnixTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000); // 유닉스 초 → 밀리초
    return date.toLocaleString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
    }).replace(/\. /g, '-').replace('.', '');
};