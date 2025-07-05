'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

import { motion, type Variants } from 'framer-motion';

import { nodes, analyzedTrips, AnalyzedTrip, Node, AnomalyType } from '@/components/visual/data';

import StatCard from '@/components/dashboard/StatCard';
import AnomalyList from '@/components/dashboard/AnomalyList';
import { SupplyChainMapWidget } from '@/components/visual/SupplyChainMapWidget';
import FactoryDetailView, { KpiData } from '@/components/dashboard/FactoryDetailView';
import DataBuildingBlocksChart from '@/components/dashboard/DataBuildingBlocksChart';
import { getAnomalyName, getAnomalyColor } from '@/components/visual/colorUtils';

import dynamic from 'next/dynamic';

const DynamicAnomalyChart = dynamic(
  () => import('@/components/dashboard/AnomalyEventsChart'),
  { ssr: false }
);
const DynamicInventoryChart = dynamic(
  () => import('@/components/dashboard/InventoryDistributionChart'),
  { ssr: false }
);
const DynamicTimelineChart = dynamic(() => import('@/components/dashboard/AnomalyTimelineChart'), { ssr: false }); // 새로 추가
const DynamicRadarChart = dynamic(() => import('@/components/dashboard/FactoryRiskRadarChart'), { ssr: false }); // 새로 추가

import {
  AlertTriangle,
  TrendingUp,
  Truck,
  Package,
  Upload,
  Download,
  MapPin,
  History,
  Clock,
  ArrowRightCircle,
} from "lucide-react";

type AnomalyDataPoint = {
  name: string; // 한글 이름
  type: AnomalyType;
  count: number;
  color1: string;
  color2: string;
};
type InventoryDataPoint = { name: string; value: number; };
// type UserRole = 'ADMIN' | 'MANAGER';
// type MockUser = { role: UserRole; factory: string; };
type TimelineDataPoint = {
  time: string;
  count: number;
};
type RadarDataPoint = {
  subject: string;
  A: number;
  fullMark: number;
};

const factoryPrefixMap: { [key: string]: string } = {
  '화성공장': 'HWS', '인천공장': 'ICN', '구미공장': 'KUM', '양산공장': 'YGS',
};

export type AnomalyListItem = {
  id: string;
  productName: string;
  location: string;
  eventType: string;
  timestamp: string;
};


export default function SupervisorDashboard() {
  // const { user } = useAuth(); // 테스트 끝나면 주석 풀기
  const router = useRouter();

  // useEffect(() => { 📛서버 연결하면 다시 주석 풀어야 함
  //   if (!user) return; // 아직 로딩 중일 수 있음

  //   if (user.role !== 'ADMIN') {
  //     alert('접근 권한이 없습니다.');
  //     router.push('/login');
  //   }
  // }, [user, router]);

  const [activeFactory, setActiveFactory] = useState('전체');
  const [anomalyChartData, setAnomalyChartData] = useState<AnomalyDataPoint[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryDataPoint[]>([]);
  const [anomalyListData, setAnomalyListData] = useState<AnalyzedTrip[]>([]);

  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);
  const [radarData, setRadarData] = useState<RadarDataPoint[]>([]);

 const [kpiData, setKpiData] = useState<KpiData>({
    totalEvents: 0,
    uniqueProducts: 0,
    anomalyCount: 0,
    anomalyRate: 0, // string에서 number로 변경하는 것을 추천합니다 (FactoryDetailView와 일치)
    anomalyChange: 0, // 더미 데이터
    avgLeadTime: '0h',
    salesRate: '0.0', // string으로 유지
  });


  const nodeMap = useMemo(() => new Map<string, Node>(nodes.map(n => [n.id, n])), []);

  useEffect(() => {
    const prefix = factoryPrefixMap[activeFactory];
    const filteredTrips = activeFactory === '전체'
      ? analyzedTrips
      : analyzedTrips.filter(trip => trip.from.startsWith(prefix));

    // 1. KPI 데이터 계산
    const totalEvents = filteredTrips.length;
    const uniqueProducts = new Set(filteredTrips.map(t => t.product)).size;
    const anomalyTrips = filteredTrips.filter(t => t.anomaly);
    const anomalyCount = anomalyTrips.length;
    
    // [타입 개선] anomalyRate를 숫자로 계산합니다. FactoryDetailView가 숫자를 기대할 수 있습니다.
    const anomalyRate = totalEvents > 0 ? (anomalyCount / totalEvents) * 100 : 0;

    const leadTimes = filteredTrips.map(t => t.timestamps[1] - t.timestamps[0]);
    const avgLeadTimeRaw = leadTimes.length > 0 ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length : 0;
    const avgLeadTime = `${(avgLeadTimeRaw / 60).toFixed(1)}h`;

    const salesRate = (Math.random() * (95 - 80) + 80).toFixed(1);

    // [수정] 2. 계산된 값들을 kpiData 상태에 저장합니다.
    setKpiData({
      totalEvents,
      uniqueProducts,
      anomalyCount,
      anomalyRate,
      anomalyChange: Math.random() * 2 - 1, // -1 ~ +1 사이의 더미 변화량
      avgLeadTime,
      salesRate,
    });

    const inventoryCounts = filteredTrips.reduce((acc: Record<string, number>, trip) => {
      const destNode = nodeMap.get(trip.to);
      if (destNode) {
        acc[destNode.type] = (acc[destNode.type] || 0) + 1;
      }
      return acc;
    }, {}); // <-- 초기값은 그대로 {}
    setInventoryData(Object.entries(inventoryCounts).map(([name, value]) => ({ name, value })));

    // 3. 하단 리스트 데이터
    setAnomalyListData(anomalyTrips);

    // 4. 더미 데이터 (Timeline, Radar) - 이 부분도 실제 데이터로 교체 필요
    setTimelineData([{ time: '00:00', count: Math.floor(Math.random() * 2) }, { time: '03:00', count: Math.floor(Math.random() * 3) }, { time: '06:00', count: Math.floor(Math.random() * 2) }, { time: '09:00', count: Math.floor(Math.random() * 4) }, { time: '12:00', count: Math.floor(Math.random() * 2) }, { time: '15:00', count: Math.floor(Math.random() * 5) }, { time: '18:00', count: Math.floor(Math.random() * 3) }, { time: '21:00', count: Math.floor(Math.random() * 2) },]);
    setRadarData([{ subject: '경로 위조', A: Math.round(Math.random() * 50 + 70), fullMark: 150 }, { subject: '시공간 점프', A: Math.round(Math.random() * 50 + 60), fullMark: 150 }, { subject: '이벤트 오류', A: Math.round(Math.random() * 40 + 50), fullMark: 150 }, { subject: '재고 불일치', A: Math.round(Math.random() * 60 + 60), fullMark: 150 }, { subject: '제품 복제', A: Math.round(Math.random() * 40 + 50), fullMark: 150 }, { subject: '온도 이탈', A: Math.round(Math.random() * 30 + 40), fullMark: 150 },]);

  }, [activeFactory, nodeMap]);

  const minTime = useMemo(() => Math.min(...analyzedTrips.map(t => t.timestamps[0])), []);
  const maxTime = useMemo(() => Math.max(...analyzedTrips.map(t => t.timestamps[1])), []);

  const handleWidgetClick = (path: string) => router.push(path);

  // 애니메이션 정의
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3, // 자식 요소들을 0.1초 간격으로 순차적으로 애니메이션합니다.
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 }, // 아래에서 20px 밑에서 시작하고, 투명합니다.
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6, // 0.5초 동안 애니메이션됩니다.
        ease: "easeOut",
      },
    },
  };

  // if (!user || user.role !== 'ADMIN') { 📛서버 연결하면 다시 주석 풀어야 함
  //   return null; // 권한 없거나 초기 로딩 중이면 아무것도 안 보이게
  // }

  return (
    <div className="h-screen grid grid-rows-[auto_1fr] bg-black">

      {/* --- 첫 번째 행: 상단 고정 영역 --- */}
      <motion.div
        className="px-8 pb-6 space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className='flex items-start justify-between'>
          <motion.h2 variants={itemVariants} className="font-vietnam text-white text-[50px] whitespace-nowrap">Supervisor<br />DashBoard</motion.h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4"
            variants={containerVariants} // 여기서 다시 container를 써서 카드들도 순차적으로 나타나게 합니다.
          >
            <motion.div variants={itemVariants}><StatCard title="총 이상 이벤트(건)" value={kpiData.anomalyCount.toString()} change="+3" changeType="increase" icon={<AlertTriangle className="text-[#E0E0E0]" />} /></motion.div>
            <motion.div variants={itemVariants}><StatCard title="판매율(%)" value={kpiData.salesRate} change="-1.2" changeType="decrease" icon={<TrendingUp className="text-[#E0E0E0]" />} /></motion.div>
            <motion.div variants={itemVariants}><StatCard title="출고율(%)" value="95.1" change="+2.5" changeType="increase" icon={<Truck className="text-[#E0E0E0]" />} /></motion.div>
            <motion.div variants={itemVariants}><StatCard title="전체 재고 비율(%)" value="78.2" icon={<Package className="text-[#E0E0E0]" />} /></motion.div>
          </motion.div>
        </div>
        <motion.div variants={itemVariants} className="font-vietnam flex justify-between items-center bg-[rgba(40,40,40)] p-2 rounded-[50px]">
          <div className="flex items-center gap-4 text-white pl-4"><MapPin size={22} /><h3>Orders Database</h3></div>
          <div className="flex items-center gap-4 pr-4"><button className="w-14 h-14 flex items-center justify-center hover:bg-[rgba(30,30,30)] text-white border border-gray-400 rounded-full"><History size={22} /></button><button className="py-4 flex items-center gap-2 hover:bg-[rgba(30,30,30)] text-white border border-gray-400 px-6 rounded-[50px]"><Download size={18} />Download Report</button><button className="flex items-center gap-2 bg-[rgba(111,131,175,1)] hover:bg-[rgba(91,111,155,1)] text-white py-4 px-6 rounded-[50px]"><Upload size={18} />Upload CSV</button></div>
        </motion.div>
      </motion.div>

      {/* --- ✨ 2. 두 번째 행: 스크롤 가능한 메인 콘텐츠 영역 --- */}
      <div className="overflow-y-auto hide-scrollbar px-8 pb-[120px]">
        <motion.div
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >

          {/* --- 메인 그리드 (3단) --- */}
          {/* ✨ 3. 그리드에서 모든 고정 높이 스타일을 제거합니다. */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* 1열: 공장 상세 뷰 */}
            <motion.div variants={itemVariants} className="lg:col-span-3 h-[540px]">
              <FactoryDetailView activeFactory={activeFactory} onTabClick={setActiveFactory} kpiData={kpiData} />
            </motion.div>

            {/* 2열: 중앙 분석 패널 */}
            <motion.div variants={itemVariants} className="lg:col-span-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[rgba(40,40,40)] p-4 rounded-2xl shadow h-[260px] flex flex-col">
                  <h3 className="font-noto-400 text-white text-xl px-3 pb-3 mb-2 flex-shrink-0">이상 탐지 유형별 건수</h3>
                  <div className="flex-grow overflow-hidden h-[200px]">
                    <DynamicAnomalyChart data={anomalyChartData} />
                  </div>
                </div>
                <div className="bg-[rgba(40,40,40)] p-4 rounded-2xl shadow h-[260px] flex flex-col">
                  <h3 className="font-noto-400 text-white text-xl px-3 pb-3 mb-2 flex-shrink-0">유형별 재고 분산</h3>
                  <div className="flex-grow overflow-hidden h-[200px]">
                    {/* <DynamicInventoryChart data={inventoryData} /> */}
                    <DataBuildingBlocksChart />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[rgba(40,40,40)] p-4 rounded-2xl shadow h-[260px] flex flex-col">
                  <h3 className="font-noto-400 text-white text-xl px-3 pb-3 mb-2 flex-shrink-0">위험 요소 분석</h3>
                  <div className="flex-grow overflow-hidden h-[200px]">
                    <DynamicRadarChart data={radarData} />
                  </div>
                </div>
                <div className="bg-[rgba(111,131,175)] p-4 rounded-2xl shadow h-[260px] flex flex-col">
                  <h3 className="font-noto-400 text-white text-xl px-3 pb-3 mb-2 flex-shrink-0">시간대별 이상 발생 추이</h3>
                  <div className="flex-grow overflow-hidden h-[200px]">
                    <DynamicTimelineChart data={timelineData} />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 3열: 지도 */}
            <motion.div variants={itemVariants} className="lg:col-span-3 h-full">
              <div className="w-full h-[540px] rounded-3xl overflow-hidden cursor-pointer" onClick={() => handleWidgetClick('/graph')}>
                <SupplyChainMapWidget minTime={minTime} maxTime={maxTime} onWidgetClick={() => handleWidgetClick('/graph')} />
              </div>
            </motion.div>
          </div>

          {/* 하단 리스트 */}
          <motion.div variants={itemVariants}>
            <h3 className="font-vietnam text-white text-xl mb-4">Anomaly List</h3>
            <div className="font-vietnam"><AnomalyList data={anomalyListData} nodeMap={nodeMap} /></div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}