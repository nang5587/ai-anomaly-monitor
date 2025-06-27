'use client';

import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, ArcLayer, BitmapLayer } from '@deck.gl/layers';
import { OrthographicView } from '@deck.gl/core';
import { allEvents, nodePositions } from './data';
import Slider from 'rc-slider';

// 뷰포트 초기 상태
// ✅ 2. INITIAL_VIEW_STATE 변수에 OrthographicViewState 타입을 명시합니다.
const INITIAL_VIEW_STATE: OrthographicViewState = {
    target: [600, 400, 0], // 이제 이 배열은 [number, number, number] 타입으로 올바르게 인식됩니다.
    zoom: -0.5,
    minZoom: -5,
    maxZoom: 2,
};

// Deck.gl 레이어에 전달할 데이터 타입
interface ArcData {
    sourceId: string;
    targetId: string;
    time: number;
}

const SupplyChainMap = () => {
    const [currentTime, setCurrentTime] = useState(0);
    const [arcs, setArcs] = useState<ArcData[]>([]);

    const maxTime = Math.max(...allEvents.map(e => e.time));

    useEffect(() => {
        const visibleEvents = allEvents.filter(event => event.time <= currentTime);

        // ✅ 데이터 구조를 좌표가 아닌 ID로 변경하여 더 유연하게 만듦
        const visibleArcs: ArcData[] = visibleEvents.map(event => ({
            sourceId: event.source,
            targetId: event.target,
            time: event.time
        }));

        setArcs(visibleArcs);

    }, [currentTime]);

    const layers = [
        new BitmapLayer({
            id: 'bitmap-layer',
            // ✅ 3. bounds를 [left, top, right, bottom]으로 설정 (y축 반전 효과)
            // 이미지를 1200x800 크기로 렌더링
            bounds: [0, 800, 1200, 0],
            image: '/korea-map.svg',
            opacity: 0.2 // 투명도를 약간 높여서 더 잘 보이게 함
        }),
        new ScatterplotLayer({
            id: 'scatterplot-layer',
            data: Object.entries(nodePositions),
            // ✅ getPosition은 y축이 아래로 증가하는 우리의 데이터 좌표를 그대로 사용
            getPosition: d => [d[1].x, d[1].y],
            getFillColor: [44, 62, 80], // 조금 더 진한 색
            getRadius: 8,
            radiusMinPixels: 5,
        }),
        new ArcLayer<ArcData>({
            id: 'arc-layer',
            data: arcs,
            getSourcePosition: d => {
                const pos = nodePositions[d.sourceId];
                return [pos.x, pos.y];
            },
            getTargetPosition: d => {
                const pos = nodePositions[d.targetId];
                return [pos.x, pos.y];
            },
            getSourceColor: [192, 57, 43],
            getTargetColor: [231, 76, 60],
            getWidth: 2,
            greatCircle: false,
        })
    ];

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem' }}>
                <h3>시간 흐름 제어 (현재 시간: {currentTime})</h3>
                <Slider min={0} max={maxTime} value={currentTime} onChange={(value) => setCurrentTime(value as number)} />
            </div>
            <div style={{ flexGrow: 1, position: 'relative' }}>
                <DeckGL
                    layers={layers}
                    initialViewState={INITIAL_VIEW_STATE}
                    controller={true}
                    // ✅ 4. views prop에 OrthographicView를 전달합니다.
                    views={new OrthographicView({ id: 'ortho-view', controller: true })}
                >
                </DeckGL>
            </div>
        </div>
    );
};

export default SupplyChainMap;