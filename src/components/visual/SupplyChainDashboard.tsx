'use client'
import React, { useState, useEffect, useMemo } from 'react';

import { v4 as uuidv4 } from 'uuid';

import {
    getNodes,
    getAnomalies,
    getTrips, // '전체 이력' 조회를 위해 새로 추가
    type Node,
    type AnalyzedTrip,
} from './data';

import { SupplyChainMap } from './SupplyChainMap'; // 리팩토링된 맵 컴포넌트
import AnomalyList from './AnomalyList';
import DetailsPanel from './DetailsPanel';

// 탭 타입 정의
type Tab = 'anomalies' | 'all';

// 탭 버튼 스타일
const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: isActive ? 'bold' : 'normal',
    color: isActive ? '#FFFFFF' : '#AAAAAA',
    backgroundColor: 'transparent',
    border: 'none',
    borderTop: isActive ? '2px solid #3399FF' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
});

type TripWithId = AnalyzedTrip & { id: string };



export const SupplyChainDashboard: React.FC = () => {
    // --- 상태 관리 ---
    const [activeTab, setActiveTab] = useState<Tab>('anomalies');
    const [nodes, setNodes] = useState<Node[]>([]);
    const [rawTrips, setRawTrips] = useState<AnalyzedTrip[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedObject, setSelectedObject] = useState<TripWithId | Node | null>(null);

    const trips: TripWithId[] = useMemo(() => {
        if (!rawTrips) return [];
        // 원본 데이터 배열을 순회하며 각 객체에 고유 id를 추가
        return rawTrips.map(trip => ({
            ...trip,
            id: uuidv4(),
        }));
    }, [rawTrips]);

    // --- 데이터 로딩 ---
    // 1. 노드 데이터는 처음에 한 번만 로드합니다.
    useEffect(() => {
        getNodes()
            .then(setNodes)
            .catch(error => console.error("노드 데이터 로딩 실패:", error));
    }, []);

    // 2. 탭이 변경될 때마다 해당 탭에 맞는 Trip 데이터를 로드합니다.
    useEffect(() => {
        setIsLoading(true);
        setSelectedObject(null);
        setRawTrips([]); // 원본 데이터 초기화
        // setNextCursor(null);

        const fetchData = async () => {
            try {
                if (activeTab === 'anomalies') {
                    const anomalyData = await getAnomalies();
                    setRawTrips(anomalyData);
                } else {
                    const allTripsResponse = await getTrips(); // 첫 페이지 로드
                    setRawTrips(allTripsResponse.data);
                    // setNextCursor(allTripsResponse.nextCursor);
                }
            } catch (error) {
                console.error("데이터 로딩 실패:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [activeTab]);

    // --- 파생 데이터 (자식 컴포넌트에 prop으로 전달) ---
    const nodeMap = useMemo(() => new Map<string, Node>(nodes.map(n => [n.hubType, n])), [nodes]);
    const anomalyList = useMemo(() => trips.filter(t => t.anomaly), [trips]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
            {isLoading && (
                <div className="w-full h-full bg-black bg-opacity-70 flex items-center justify-center text-white absolute z-50">
                    <p>데이터를 불러오는 중입니다...</p>
                </div>
            )}

            {/* 지도 및 관련 UI 컴포넌트들 */}
            <SupplyChainMap
                nodes={nodes}
                analyzedTrips={trips}
                selectedObject={selectedObject}
                onObjectSelect={setSelectedObject}
            />

            {/* 왼쪽 패널 컨테이너 */}
            <div style={{
                position: 'absolute', top: '0px', left: '20px', width: '300px',
                height: 'calc(100vh - 200px)',
                zIndex: 3, display: 'flex', flexDirection: 'column', gap: '15px',
            }}>
                {/* 탭 UI */}
                <div style={{ display: 'flex', flexShrink: 0 }} className='bg-[#000000] rounded-b-3xl'>
                    <button style={tabButtonStyle(activeTab === 'anomalies')} className='whitespace-nowrap' onClick={() => setActiveTab('anomalies')}>
                        이상 징후 분석
                    </button>
                    <button style={tabButtonStyle(activeTab === 'all')} className='whitespace-nowrap' onClick={() => setActiveTab('all')}>
                        전체 이력 추적
                    </button>
                </div>

                {/* '이상 징후 분석' 탭일 때만 AnomalyList 표시 */}
                {activeTab === 'anomalies' && (
                    // 이 div가 남는 공간을 모두 차지하도록 설정
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <AnomalyList
                            anomalies={anomalyList}
                            onCaseClick={(trip) => setSelectedObject(trip)}
                            selectedObjectId={selectedObject ? ('id' in selectedObject ? selectedObject.id : null) : null}
                        />
                    </div>
                )}

                {/* 👇 '전체 이력 추적' 탭 */}
                {activeTab === 'all' && (
                    // 이 div도 남는 공간을 모두 차지하도록 설정
                    <div style={{ flex: 1, minHeight: 0, padding: '10px', color: 'white' }}>
                        {/* 여기에 "더 보기" 버튼 등이 들어갑니다. */}
                        <p>현재 {trips.length}개의 경로를 보고 있습니다.</p>
                        {/* 더 보기 버튼 로직을 다시 추가해야 합니다. */}
                    </div>
                )}
            </div>

            {/* 상세 패널은 공통으로 사용 */}
            <DetailsPanel
                selectedObject={selectedObject}
                onClose={() => setSelectedObject(null)}
            />
        </div>
    );
};