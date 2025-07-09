'use client';
import React, { useState, useEffect, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl/mapbox';
import { TripsLayer } from '@deck.gl/geo-layers';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox Access Token
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// 지도의 초기 시점 설정
const INITIAL_VIEW_STATE = {
    longitude: 129.0756, latitude: 35.1796, zoom: 8, pitch: 45, bearing: 0,
};

const ANIMATION_SPEED = 10;

// Trip 데이터 타입 정의 (기존과 동일)
interface Waypoint {
    coord: [number, number]; timestamp: number; read_point: string;
    event_type: string; product_name: string;
}
interface Trip { product_serial: number; waypoints: Waypoint[]; }
interface LogisticsMapProps { data: Trip[]; }

export default function LogisticsMap({ data }: LogisticsMapProps) {
    const [minTimestamp, maxTimestamp] = useMemo(() => {
        if (!data || data.length === 0) return [0, 0];
        let min = Infinity;
        let max = -Infinity;
        for (const trip of data) {
            for (const waypoint of trip.waypoints) {
                min = Math.min(min, waypoint.timestamp);
                max = Math.max(max, waypoint.timestamp);
            }
        }
        // min과 max가 같을 경우를 대비해 최소 범위를 줌 (옵션)
        return [min, max > min ? max : min + 1];
    }, [data]);

    const [currentTime, setCurrentTime] = useState(minTimestamp);
    const [isPlaying, setIsPlaying] = useState(true);

    // [수정 1] 데이터 로딩 시점에 따라 currentTime을 동기화
    useEffect(() => {
        if (!isPlaying || minTimestamp === maxTimestamp) return;

        let frameId: number;

        const animate = () => {
            setCurrentTime(t => {
                const nextTime = t + ANIMATION_SPEED;
                return nextTime > maxTimestamp ? minTimestamp : nextTime;
            });
            frameId = requestAnimationFrame(animate); // 루프 지속
        };

        frameId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(frameId);
    }, [isPlaying, minTimestamp, maxTimestamp]);


    // --- 디버깅용 콘솔 로그 ---
    console.log({ data, minTimestamp, maxTimestamp, currentTime, isPlaying });

    // 데이터가 없을 때 렌더링하지 않도록 방어 코드 추가
    if (!data || data.length === 0) {
        return <div>데이터를 로딩 중이거나 표시할 데이터가 없습니다.</div>;
    }

    const tripsLayer = new TripsLayer<Trip>({
        id: 'trips-layer',
        data,
        getPath: d => d.waypoints.map(p => p.coord),
        getTimestamps: d => d.waypoints.map(p => p.timestamp),
        getColor: d => [(d.product_serial * 50) % 255, (d.product_serial * 90) % 255, (d.product_serial * 130) % 255],
        opacity: 0.8,
        widthMinPixels: 5,
        rounded: true,
        trailLength: 200,
        currentTime: currentTime,
        pickable: true,
        autoHighlight: true,
    });

    const formatTime = (time: number) => {
        // 타임스탬프가 유효한 숫자인지 확인
        if (!time || time === 0) return "시간 정보 없음";
        // Unix 타임스탬프(초)를 밀리초로 변환하여 Date 객체 생성
        return new Date(time * 1000).toLocaleString('ko-KR');
    }

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
            <DeckGL
                layers={[tripsLayer]}
                initialViewState={INITIAL_VIEW_STATE}
                controller={true}
                getTooltip={({ object }) => object && `시리얼: ${object.product_serial}`}
            >
                <Map mapboxAccessToken={MAPBOX_ACCESS_TOKEN} mapStyle="mapbox://styles/mapbox/dark-v10" />

                <div style={{
                    position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(0, 0, 0, 0.7)', color: 'white', padding: '10px 20px',
                    borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '15px',
                    fontFamily: 'sans-serif', zIndex: 1
                }}>
                    <button onClick={() => setIsPlaying(!isPlaying)} style={{ padding: '5px 10px' }}>
                        {isPlaying ? '정지' : '재생'}
                    </button>
                    <span>{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min={minTimestamp}
                        max={maxTimestamp}
                        step={ANIMATION_SPEED}
                        value={currentTime}
                        // 슬라이더를 직접 움직일 때 애니메이션을 멈추고, 손을 떼면 현재 상태에 따라 다시 재생
                        onMouseDown={() => setIsPlaying(false)}
                        onChange={e => setCurrentTime(Number(e.target.value))}
                        style={{ width: '500px' }}
                    />
                </div>
            </DeckGL>
        </div>
    );
}