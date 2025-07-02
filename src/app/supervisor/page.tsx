'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

import StatCard from '@/components/dashboard/StatCard';
import AnomalyEventsChart from '@/components/dashboard/AnomalyEventsChart';
import WarehouseDistributionChart from '@/components/dashboard/WarehouseDistributionChart.tsx';

import { SupplyChainMap } from '@/components/visual/SupplyChainMap';
import { analyzedTrips, Node, AnalyzedTrip } from '@/components/visual/data';
import type { PickingInfo } from 'deck.gl';

import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Truck,
  Boxes,
} from "lucide-react";

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return; // 아직 로딩 중일 수 있음

    if (user.role !== 'ADMIN') {
      alert('접근 권한이 없습니다.');
      router.push('/login');
    }
  }, [user, router]);

  const [selectedObject, setSelectedObject] = useState<AnalyzedTrip | Node | null>(null);
  const [hoverInfo, setHoverInfo] = useState<PickingInfo | null>(null);
  const [currentTime, setCurrentTime] = useState(0); // 초기 시간
  const [flyToLocation, setFlyToLocation] = useState<any>(null);
  const [visibleTypes, setVisibleTypes] = useState<Record<Node['type'], boolean>>({
    Factory: true,
    WMS: true,
    LogiHub: true,
    Wholesaler: true,
    Reseller: true,
  });
  const minTime = useMemo(() => Math.min(...analyzedTrips.map(t => t.timestamps[0])), []);
  const maxTime = useMemo(() => Math.max(...analyzedTrips.map(t => t.timestamps[1])), []);

  useEffect(() => {
    // 1초에 약 60번 업데이트 (애니메이션 속도 조절 가능)
    const ANIMATION_SPEED = 1;

    let animationFrame: number;
    const animate = () => {
      setCurrentTime(time => {
        const nextTime = time + ANIMATION_SPEED;
        // 시간이 최대값을 넘으면 처음으로 돌아가 무한 반복
        return nextTime > maxTime ? minTime : nextTime;
      });
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);

    // 컴포넌트가 언마운트될 때 애니메이션 정리
    return () => cancelAnimationFrame(animationFrame);
  }, [minTime, maxTime]);

  const renderTooltip = () => {
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
            <div><strong>경로: {(object as AnalyzedTrip).product}</strong></div>
            <div>출발: {(object as AnalyzedTrip).from}</div>
            <div>도착: {(object as AnalyzedTrip).to}</div>
          </>
        )}
      </div>
    );
  };

  const handleWidgetClick = () => {
    // '/graph' 또는 원하는 상세 페이지 경로로 설정
    router.push('/graph');

  };

  if (!user || user.role !== 'ADMIN') {
    return null; // 권한 없거나 초기 로딩 중이면 아무것도 안 보이게
  }

  return (
    <div className="space-y-6 px-4">

      {/* --- 주요 통계 카드 섹션 --- */}
      <div className='flex items-start justify-between'>
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-white text-[50px] whitespace-nowrap">Supervisor<br />DashBoard</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 p-4">
          <StatCard title="총 이상 이벤트(건)" value="58" change="+3" changeType="increase" icon={<AlertTriangle className="text-white" />} />
          <StatCard title="판매율(%)" value="89.5" change="-1.2" changeType="decrease" icon={<TrendingDown className="text-white" />} />
          <StatCard title="출고율(%)" value="95.1" change="+2.5" changeType="increase" icon={<Truck className="text-white" />} />
          <StatCard title="전체 재고 비율(%)" value="78.2" icon={<Boxes className="text-white" />} />
        </div>
      </div>


      {/* --- 지도 및 차트 섹션 --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 지도 위젯 */}
        <div className="lg:col-span-2 bg-[rgba(40,40,40)] p-1 rounded-lg shadow-lg h-[624px]">
          {/* 
              실제로는 여기에 가벼운 버전의 SupplyChainMap을 렌더링해야 합니다.
              SupplyChainMap 컴포넌트가 100% 높이를 차지하도록 스타일을 조정해야 할 수 있습니다.
           */}
          <div className="w-full h-full rounded-md overflow-hidden" onClick={handleWidgetClick}>
            <SupplyChainMap
              currentTime={currentTime}
              selectedObject={selectedObject}
              onObjectSelect={setSelectedObject}
              onObjectHover={setHoverInfo}
              flyToLocation={flyToLocation}
              visibleTypes={visibleTypes}
            />
            <div className="w-full h-full bg-black flex items-center justify-center text-white">지도 컴포넌트 위치</div>
          </div>
        </div>

        {/* 오른쪽 차트 및 통계 */}
        <div className="space-y-6">
          <AnomalyEventsChart />
          <WarehouseDistributionChart />
        </div>
      </div>

      {/* --- 추가 통계 섹션 --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[rgba(40,40,40)] p-6 rounded-lg shadow-lg text-white">
          <h3 className="text-xl font-semibold mb-4">평균 입고 처리 시간</h3>
          <p className="text-3xl font-bold">1시간 24분</p>
        </div>
        <div className="bg-[rgba(40,40,40)] p-6 rounded-lg shadow-lg text-white">
          <h3 className="text-xl font-semibold mb-4">평균 출고 처리 시간</h3>
          <p className="text-3xl font-bold">45분</p>
        </div>
      </div>
    </div>
  );
}