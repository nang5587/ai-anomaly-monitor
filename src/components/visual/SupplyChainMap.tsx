'use client'
import React, { useState, useEffect, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import Map  from 'react-map-gl';
import type { PickingInfo } from '@deck.gl/core';

// 1. Data.ts에서 데이터와 타입 가져오기
import { nodes, trips, Node, Trip } from './data';

// 2. Mapbox 액세스 토큰 설정
// TODO: 본인의 Mapbox 액세스 토큰으로 교체해야 합니다.
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibmFuZzU1ODciLCJhIjoiY21jYnFnZ2RiMDhkNDJybmNwOGZ4ZmwxMCJ9.OBoc45r9z0yM1EpqNuffpQ';

// 3. 지도 초기 시점 설정 (대한민국 중심)
const INITIAL_VIEW_STATE = {
    longitude: 127.9,
    latitude: 36.5,
    zoom: 6.5,
    pitch: 45,
    bearing: 0,
};

// 4. 애니메이션 속도 및 시간 범위 설정
const ANIMATION_SPEED = 5; // 애니메이션 속도 (숫자가 클수록 빠름)
const minTime = Math.min(...trips.map(t => t.timestamps[0]));
const maxTime = Math.max(...trips.map(t => t.timestamps[1]));

// 5. 노드 타입에 따른 색상/크기 매핑
const getNodeColor = (type: Node['type']): [number, number, number] => {
    switch (type) {
        case 'Factory': return [227, 26, 28]; // 빨강
        case 'WMS': return [255, 127, 0]; // 주황
        case 'LogiHub': return [31, 120, 180]; // 파랑
        case 'Wholesaler': return [51, 160, 44]; // 초록
        case 'Reseller': return [177, 89, 40]; // 갈색
        default: return [200, 200, 200]; // 회색
    }
};

const getNodeRadius = (type: Node['type']): number => {
    switch (type) {
        case 'Factory': return 8000;
        case 'LogiHub': return 6000;
        case 'Wholesaler': return 3000;
        default: return 1000;
    }
};


export const SupplyChainMap: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(minTime);
    const [hoverInfo, setHoverInfo] = useState<PickingInfo | null>(null);

    // 6. 애니메이션 루프 설정
    useEffect(() => {
        const animate = () => {
            setCurrentTime(time => {
                const nextTime = time + ANIMATION_SPEED;
                return nextTime > maxTime ? minTime : nextTime;
            });
        };
        const animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, []);

    // 7. 툴팁 렌더링 함수
    const renderTooltip = useCallback(() => {
        if (!hoverInfo || !hoverInfo.object) {
            return null;
        }

        const { object, x, y } = hoverInfo;
        const isNode = 'coordinates' in object; // Node 객체인지 Trip 객체인지 확인

        return (
            <div style={{
                position: 'absolute',
                left: x,
                top: y,
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '10px',
                borderRadius: '5px',
                pointerEvents: 'none',
                zIndex: 10
            }}>
                {isNode ? (
                    <>
                        <div><strong>{(object as Node).name}</strong></div>
                        <div>타입: {(object as Node).type}</div>
                    </>
                ) : (
                    <>
                        <div><strong>경로: {(object as Trip).product}</strong></div>
                        <div>출발: {(object as Trip).from}</div>
                        <div>도착: {(object as Trip).to}</div>
                    </>
                )}
            </div>
        );
    }, [hoverInfo]);

    // 8. Deck.gl 레이어 정의
    const layers = [
        new ScatterplotLayer<Node>({
            id: 'nodes-layer',
            data: nodes,
            getPosition: d => d.coordinates,
            getFillColor: d => getNodeColor(d.type),
            getRadius: d => getNodeRadius(d.type),
            radiusMinPixels: 3,
            radiusMaxPixels: 30,
            stroked: true,
            getLineColor: [255, 255, 255],
            lineWidthMinPixels: 1,
            pickable: true,
            onHover: info => setHoverInfo(info),
        }),
        new TripsLayer<Trip>({
            id: 'trips-layer',
            data: trips,
            getPath: d => d.path,
            getTimestamps: d => d.timestamps,
            getColor: [253, 128, 93, 200], // 주황색 궤적
            opacity: 0.8,
            widthMinPixels: 4,
            rounded: true,
            trailLength: 200, // 궤적의 꼬리 길이
            currentTime: currentTime, // 현재 시간에 따라 애니메이션
            // _shadow: false,
            pickable: true,
            onHover: info => setHoverInfo(info),
        }),
    ];

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
            <DeckGL
                layers={layers}
                initialViewState={INITIAL_VIEW_STATE}
                controller={true}
            >
                <Map
                    mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
                    mapStyle="mapbox://styles/mapbox/light-v11"
                />
            </DeckGL>

            {renderTooltip()}

            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                background: 'rgba(255, 255, 255, 0.8)',
                padding: '10px',
                borderRadius: '5px',
                width: '50%',
                zIndex: 1,
            }}>
                <h3>시간 제어</h3>
                <input
                    type="range"
                    min={minTime}
                    max={maxTime}
                    step={1}
                    value={currentTime}
                    onChange={e => setCurrentTime(Number(e.target.value))}
                    style={{ width: '100%' }}
                />
                <div>현재 시간: {Math.round(currentTime)} / {maxTime}</div>
            </div>
        </div>
    );
};