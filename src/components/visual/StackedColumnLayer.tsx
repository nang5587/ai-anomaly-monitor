import { CompositeLayer, Layer, LayersList, LayerProps } from '@deck.gl/core';
import { ColumnLayer } from '@deck.gl/layers';
import type { Color } from 'deck.gl';
import { scaleLinear } from 'd3-scale';

import type { NodeWithEventStats } from '@/types/map';
import type { AnomalyType } from '../../types/data';
import { type StatValue } from '@/types/map'

import { ANOMALY_TYPE_COLORS } from '@/types/colorUtils';
const ANOMALY_TYPE_ORDER: AnomalyType[] = [
    'fake',
    'tamper',
    'clone',
    'other'
];
const DEFAULT_COLOR: Color = [201, 203, 207];

const radiusScale = scaleLinear<number>()
    .domain([8, 9, 11, 14])
    .range([8000, 5000, 800, 150])
    .clamp(true);

const elevationScale = scaleLinear<number>()
    .domain([8, 9, 11, 14])
    .range([2000, 1000, 400, 100])
    .clamp(true);

interface StackedColumnLayerProps extends LayerProps {
    data: NodeWithEventStats[];
    radius?: number;
    isHighlightMode?: boolean;
    getElevationScale?: number;
    zoom?: number;
    autoScale?: boolean;
}

export class StackedColumnLayer extends CompositeLayer<StackedColumnLayerProps> {
    static layerName = 'StackedColumnLayer';
    static defaultProps = {
        radius: 120,
        isHighlightMode: false,
        getElevationScale: 150,
        zoom: 10,
        autoScale: true,
    };
    renderLayers(): Layer | LayersList | null {
        const { data, isHighlightMode, zoom, autoScale } = this.props;
        if (!data || data.length === 0) return null;
        const actualRadius = autoScale ? radiusScale(zoom!) : this.props.radius!;
        const actualElevationScale = autoScale ? elevationScale(zoom!) : this.props.getElevationScale!;

        return data.flatMap(node => {
            const eventTypeStats = node.eventTypeStats || {};
            if (isHighlightMode && !node.hasAnomaly) {
                return new ColumnLayer(this.getSubLayerProps({
                    id: `${this.props.id}-${node.scanLocation}-highlight-off`,
                    data: [node],
                    getPosition: (d: NodeWithEventStats) => [...d.coord, 0],
                    getElevation: 50 * (actualElevationScale / this.props.getElevationScale!),
                    radius: actualRadius,
                    getFillColor: [100, 100, 100, 100],
                    radiusUnits: 'meters',
                    pickable: true,
                }));
            }
            let accumulatedHeight = 0;
            return ANOMALY_TYPE_ORDER.map((type, index) => {
                const stats = eventTypeStats[type] as StatValue | undefined;
                if (!stats || stats.count === 0) {
                    return null;
                }
                const segmentHeight = stats.count * actualElevationScale;
                const baseHeight = accumulatedHeight;
                accumulatedHeight += segmentHeight;
                return new ColumnLayer(this.getSubLayerProps({
                    id: `${this.props.id}-${node.scanLocation}-${type}-${index}`,
                    data: [node],
                    getPosition: (d: NodeWithEventStats) => [d.coord[0], d.coord[1], baseHeight],
                    getElevation: segmentHeight,
                    getFillColor: ANOMALY_TYPE_COLORS[type as AnomalyType] || DEFAULT_COLOR,
                    radius: actualRadius,
                    pickable: true,
                    coverage: 0.9,
                }));
            }).filter((layer): layer is ColumnLayer => layer !== null);
        });
    }
}