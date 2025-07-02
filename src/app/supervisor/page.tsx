'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

import StatCard from '@/components/dashboard/StatCard';
import AnomalyEventsChart from '@/components/dashboard/AnomalyEventsChart';
import WarehouseDistributionChart from '@/components/dashboard/WarehouseDistributionChart.tsx';

import { SupplyChainMapWidget } from '@/components/visual/SupplyChainMapWidget';
import { analyzedTrips } from '@/components/visual/data';

import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Truck,
  Boxes,
  Package
} from "lucide-react";

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  // useEffect(() => { 📛서버 연결하면 다시 주석 풀어야 함
  //   if (!user) return; // 아직 로딩 중일 수 있음

  //   if (user.role !== 'ADMIN') {
  //     alert('접근 권한이 없습니다.');
  //     router.push('/login');
  //   }
  // }, [user, router]);

  const [currentTime, setCurrentTime] = useState(0);

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

  const handleWidgetClick = () => {
    // '/graph' 또는 원하는 상세 페이지 경로로 설정
    router.push('/graph');

  };

  // if (!user || user.role !== 'ADMIN') { 📛서버 연결하면 다시 주석 풀어야 함
  //   return null; // 권한 없거나 초기 로딩 중이면 아무것도 안 보이게
  // }

  return (
    <div className="space-y-6 px-8">

      {/* --- 주요 통계 카드 섹션 --- */}
      <div className='flex items-start justify-between'>
        <div className="flex items-center gap-4 mb-4">
          <h2 className="font-vietnam text-white text-[50px] whitespace-nowrap">Supervisor<br />DashBoard</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 p-4">
          <StatCard title="총 이상 이벤트(건)" value="58" change="+3" changeType="increase" icon={<AlertTriangle className="text-[#E0E0E0]" />} />
          <StatCard title="판매율(%)" value="89.5" change="-1.2" changeType="decrease" icon={<TrendingUp className="text-[#E0E0E0]" />} />
          <StatCard title="출고율(%)" value="95.1" change="+2.5" changeType="increase" icon={<Truck className="text-[#E0E0E0]" />} />
          <StatCard title="전체 재고 비율(%)" value="78.2" icon={<Package className="text-[#E0E0E0]" />} />
        </div>
      </div>


      {/* --- 지도 및 차트 섹션 --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 지도 위젯 */}
        <div className="lg:col-span-2 rounded-3xl h-[624px]">
          <div className="w-full h-full rounded-md overflow-hidden cursor-pointer" onClick={handleWidgetClick}>
            <SupplyChainMapWidget currentTime={currentTime} />
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
        <div className="bg-[rgba(40,40,40)] p-6 rounded-3xl shadow-lg text-white">
          <h3 className="text-xl font-semibold mb-4">평균 입고 처리 시간</h3>
          <p className="text-3xl font-bold">1시간 24분</p>
        </div>
        <div className="bg-[rgba(40,40,40)] p-6 rounded-3xl shadow-lg text-white">
          <h3 className="text-xl font-semibold mb-4">평균 출고 처리 시간</h3>
          <p className="text-3xl font-bold">45분</p>
        </div>
      </div>
    </div>
  );
}