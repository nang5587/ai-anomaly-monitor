import { CompositeLayer, Layer, LayersList, LayerProps } from '@deck.gl/core';
import { ColumnLayer } from '@deck.gl/layers';
import type { Color } from 'deck.gl';
import { scaleLinear } from 'd3-scale';

// 필요한 타입들을 import 합니다.
import type { NodeWithEventStats } from '@/types/map';
import type { AnomalyType } from '../../types/data';
import { type StatValue } from '@/types/map'

// AnomalyType을 기준으로 색상을 정의합니다.
const ANOMALY_TYPE_COLORS: Record<AnomalyType, Color> = {
    'fake': [215, 189, 226, 200],   // 시공간 점프 (연한 라벤더)
    'tamper': [250, 215, 160, 200], // 이벤트 순서 오류 (부드러운 살구)
    'clone': [252, 243, 207, 200],   // EPC 복제 (부드러운 크림)
};

const ANOMALY_TYPE_ORDER: AnomalyType[] = [
    'fake',
    'tamper',
    'clone',
];
const DEFAULT_COLOR: Color = [201, 203, 207];

// ✅✅✅ 새로운 스케일링 함수: D3를 이용한 선형 보간 ✅✅✅
const radiusScale = scaleLinear<number>()
    // 입력값 범위 (줌 레벨): [국가 전체, 시/도, 도시, 동네]
    .domain([8, 9, 11, 14])
    // 출력값 범위 (반지름 크기): [60km, 2km, 500m, 120m]
    .range([8000, 5000, 800, 150])
    .clamp(true); // 범위를 벗어나지 않도록 고정

// 줌 레벨에 따른 높이 배율을 계산하는 스케일 생성
const elevationScale = scaleLinear<number>()
    .domain([8, 9, 11, 14])
    // 출력값 범위 (높이 배율): [매우 높게, 높게, 보통, 기본]
    .range([50000, 8000, 1500, 250])
    .clamp(true);

// 이 레이어가 받을 Props 타입을 정의합니다.
interface StackedColumnLayerProps extends LayerProps {
    data: NodeWithEventStats[];
    radius?: number;
    isHighlightMode?: boolean;
    getElevationScale?: number;
    // 줌 레벨을 받기 위한 새로운 prop 추가
    zoom?: number;
    // 자동 스케일링 사용 여부
    autoScale?: boolean;
}

export class StackedColumnLayer extends CompositeLayer<StackedColumnLayerProps> {
    // Deck.gl이 이 레이어를 식별하고 디버깅할 수 있도록 고유한 이름을 지정합니다.
    static layerName = 'StackedColumnLayer';

    // 이 레이어의 기본 Props 값을 설정합니다.
    static defaultProps = {
        radius: 120,
        isHighlightMode: false,
        getElevationScale: 150,
        zoom: 10, // 기본 줌 레벨
        autoScale: true, // 기본적으로 자동 스케일링 활성화
    };

    // 이 CompositeLayer가 어떤 하위 레이어(Sub-layers)를 렌더링할지 정의하는 핵심 메소드입니다.
    renderLayers(): Layer | LayersList | null {
        const { data, isHighlightMode, zoom, autoScale } = this.props;

        if (!data || data.length === 0) return null;

        // ✅✅✅ D3 스케일을 사용하여 실제 값 계산 ✅✅✅
        const actualRadius = autoScale ? radiusScale(zoom!) : this.props.radius!;
        const actualElevationScale = autoScale ? elevationScale(zoom!) : this.props.getElevationScale!;

        // data 배열의 각 노드에 대해 여러 개의 ColumnLayer를 생성하고,
        // flatMap을 사용하여 모든 레이어를 하나의 1차원 배열로 만듭니다.
        return data.flatMap(node => {
            const eventTypeStats = node.eventTypeStats || {};

            // 하이라이트 모드 로직
            if (isHighlightMode && !node.hasAnomaly) {
                return new ColumnLayer(this.getSubLayerProps({
                    id: `${this.props.id}-${node.scanLocation}-highlight-off`,
                    data: [node],
                    getPosition: (d: NodeWithEventStats) => [...d.coord, 0], // 🔥 바닥에서 시작
                    getElevation: 50 * (actualElevationScale / this.props.getElevationScale!),
                    radius: actualRadius,
                    getFillColor: [100, 100, 100, 100],
                    radiusUnits: 'meters',
                    pickable: true,
                }));
            }

            // 🔥 각 노드별로 현재 스케일에서의 누적 높이를 다시 계산
            let currentAccumulatedHeight = 0;

            // 각 이벤트 타입에 대해 별도의 ColumnLayer를 생성합니다.
            return ANOMALY_TYPE_ORDER.map((type, index) => {
                // 현재 노드에 이 `type`의 이벤트가 있는지 확인합니다.
                const stats = eventTypeStats[type] as StatValue | undefined;

                // 이벤트 데이터가 없으면 아무것도 렌더링하지 않고 null을 반환합니다.
                if (!stats || stats.count === 0) {
                    return null;
                }

                // 🔥 현재 스케일에서의 세그먼트 높이 계산
                const segmentHeight = stats.count * actualElevationScale;

                const layer = new ColumnLayer(this.getSubLayerProps({
                    id: `${this.props.id}-${node.scanLocation}-${type}-${index}`,
                    data: [node],
                    getPosition: (d: NodeWithEventStats) => {
                        // 🔥 모든 세그먼트를 절대 높이 0에서 시작하도록 강제
                        return [d.coord[0], d.coord[1], 0];
                    },
                    getElevation: segmentHeight,
                    getFillColor: ANOMALY_TYPE_COLORS[type as AnomalyType] || DEFAULT_COLOR,
                    radiusUnits: 'meters',
                    radius: actualRadius,
                    pickable: true,
                    coverage: 0.9,
                }));

                // 🔥 다음 세그먼트를 위해 높이를 누적 (현재 스케일 기준)
                currentAccumulatedHeight += segmentHeight;
                return layer;
            }).filter((layer): layer is ColumnLayer => layer !== null);
        });
    }
}