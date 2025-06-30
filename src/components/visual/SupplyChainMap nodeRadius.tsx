'use client'
import React, { useState, useEffect, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
// 1. ScatterplotLayer 대신 ColumnLayer를 가져옵니다.
import { ColumnLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import Map from 'react-map-gl';
import { LightingEffect, type PickingInfo } from '@deck.gl/core';

// Data.ts에서 데이터와 타입 가져오기
import { nodes, trips, Node, Trip } from './data';
import { AmbientLight, PointLight } from '@deck.gl/core';

// 조명 효과 정의 (컴포넌트 바깥에)
const ambientLight = new AmbientLight({
    color: [255, 255, 255],
    intensity: 1.0
});
const pointLight = new PointLight({
    color: [255, 255, 255],
    intensity: 2.0,
    position: [127, 36, 800000] // 서울 근처 상공에 조명 설치
});
const lightingEffect = new LightingEffect({ ambientLight, pointLight });
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibmFuZzU1ODciLCJhIjoiY21jYnFnZ2RiMDhkNDJybmNwOGZ4ZmwxMCJ9.OBoc45r9z0yM1EpqNuffpQ';

// 3D 효과를 잘 보려면 pitch 값을 45 이상으로 유지하는 것이 좋습니다.
const INITIAL_VIEW_STATE = {
    longitude: 127.9,
    latitude: 36.5,
    zoom: 6.5,
    pitch: 45, // 3D 뷰를 위한 각도
    bearing: 0,
};

const ANIMATION_SPEED = 5;
const minTime = Math.min(...trips.map(t => t.timestamps[0]));
const maxTime = Math.max(...trips.map(t => t.timestamps[1]));

// 기존 getNodeColor 함수는 그대로 사용합니다.
const getNodeColor = (type: Node['type']): [number, number, number] => {
    switch (type) {
        case 'Factory': return [227, 26, 28];
        case 'WMS': return [255, 127, 0];
        case 'LogiHub': return [31, 120, 180];
        case 'Wholesaler': return [51, 160, 44];
        case 'Reseller': return [177, 89, 40];
        default: return [200, 200, 200];
    }
};

// 기존 getNodeRadius 함수는 건물의 '반지름(굵기)'으로 사용합니다.
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

    useEffect(() => {
        let animationFrame: number;
        const animate = () => {
            setCurrentTime(time => {
                const nextTime = time + ANIMATION_SPEED;
                return nextTime > maxTime ? minTime : nextTime;
            });
            animationFrame = requestAnimationFrame(animate);
        };
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, []);

    const renderTooltip = useCallback(() => {
        if (!hoverInfo || !hoverInfo.object) return null;
        const { object, x, y } = hoverInfo;
        const isNode = 'coordinates' in object;

        return (
            <div style={{
                position: 'absolute', left: x, top: y, background: 'rgba(0, 0, 0, 0.8)',
                color: 'white', padding: '10px', borderRadius: '5px', pointerEvents: 'none', zIndex: 10
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

    // 2. 레이어 정의: ScatterplotLayer를 ColumnLayer로 교체합니다.
    const layers = [
        new ColumnLayer<Node>({
            id: 'nodes-3d-layer',
            data: nodes,
            pickable: true,
            onHover: info => setHoverInfo(info),

            // 3D로 돌출시키는 핵심 속성
            extruded: true,

            getPosition: d => d.coordinates,
            getFillColor: d => getNodeColor(d.type),

            // 기둥의 굵기(반지름) 설정
            radius: 5000, // 모든 건물의 굵기를 5km로 고정하거나, 아래처럼 동적으로 설정
            // radius: d => getNodeRadius(d.type), 

            // 기둥의 높이 설정
            getElevation: d => getNodeRadius(d.type) * 10, // 기존 반지름 값에 10을 곱해 높이로 사용
            elevationScale: 5, // 전체 높이를 일괄적으로 조절하는 스케일
        }),
        new TripsLayer<Trip>({
            id: 'trips-layer',
            data: trips,
            getPath: d => d.path,
            getTimestamps: d => d.timestamps,
            getColor: [253, 128, 93, 200],
            opacity: 0.8,
            widthMinPixels: 4,
            rounded: true,
            trailLength: 200,
            currentTime: currentTime,
            pickable: true,
            onHover: info => setHoverInfo(info),
        }),
    ];

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
            <DeckGL
                layers={layers}
                effects={[lightingEffect]}
                initialViewState={INITIAL_VIEW_STATE}
                controller={true}
            >
                <Map
                    mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
                    mapStyle="mapbox://styles/mapbox/dark-v11" // 3D에는 어두운 맵이 더 잘 어울립니다.
                />
            </DeckGL>

            {renderTooltip()}

            {/* 시간 제어 UI는 동일 */}
            <div style={{
                position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(255, 255, 255, 0.8)',
                padding: '10px', borderRadius: '5px', width: '50%', zIndex: 1,
            }}>
                <h3>시간 제어</h3>
                <input
                    type="range" min={minTime} max={maxTime} step={1} value={currentTime}
                    onChange={e => setCurrentTime(Number(e.target.value))} style={{ width: '100%' }}
                />
                <div>현재 시간: {Math.round(currentTime)} / {maxTime}</div>
            </div>
        </div>
    );
};