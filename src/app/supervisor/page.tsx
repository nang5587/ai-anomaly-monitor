'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// import { useAuth } from '@/context/AuthContext'; 백이랑 연결 시 주석 풀기

import { motion, type Variants } from 'framer-motion';

import {
  getNodes,
  getAnomalies,
  getKpiSummary,
  getInventoryDistribution,
  type Node,
  type AnalyzedTrip,
  type KpiSummary,
  type InventoryDataPoint,
  type AnomalyType
} from '@/components/visual/data'

import StatCard from '@/components/dashboard/StatCard';
import AnomalyList from '@/components/dashboard/AnomalyList';
import { SupplyChainMapWidget } from '@/components/visual/SupplyChainMapWidget';
import FactoryDetailView from '@/components/dashboard/FactoryDetailView';
import { getAnomalyName, getAnomalyColor } from '@/components/visual/colorUtils';

import dynamic from 'next/dynamic';

const DynamicAnomalyChart = dynamic(
  () => import('@/components/dashboard/AnomalyEventsChart'),
  { ssr: false }
);
const DynamicInventoryChart = dynamic(
  () => import('@/components/dashboard/DataBalanceRadarChart'),
  { ssr: false }
);
const DynamicTimelineChart = dynamic(
  () => import('@/components/dashboard/AnomalyTimelineChart'),
  { ssr: false }); // 새로 추가

const DynamicStageLollipopChart = dynamic(
  () => import('@/components/dashboard/StageLollipopChart'),
  { ssr: false }
);

// 2. ✨ import하는 데이터 타입도 해당 파일에서 가져오는지 확인합니다.
import { StageBarDataPoint } from '@/components/dashboard/StageLollipopChart';

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
// type InventoryDataPoint = { name: string; value: number; };
// type UserRole = 'ADMIN' | 'MANAGER';
// type MockUser = { role: UserRole; factory: string; };

type EventTimelineDataPoint = {
  time: string;
  count: number;
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

  const [nodes, setNodes] = useState<Node[]>([]);
  const [anomalyTrips, setAnomalyTrips] = useState<AnalyzedTrip[]>([]); // 이상 징후 데이터만 저장
  const [kpiData, setKpiData] = useState<KpiSummary | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryDataPoint[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // 차트 전용 상태
  const [anomalyChartData, setAnomalyChartData] = useState<any[]>([]);
  const [stageChartData, setStageChartData] = useState<StageBarDataPoint[]>([]);
  const [eventTimelineData, setEventTimelineData] = useState<any[]>([]);

  // 필터 상태
  const [activeFactory, setActiveFactory] = useState('전체');

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const [nodesData, anomaliesData, kpiData, inventoryResp] = await Promise.all([
          getNodes(),
          getAnomalies(), // 초기에는 필터 없이 이상 징후 전체 로드
          getKpiSummary(),
          getInventoryDistribution(),
        ]);

        setNodes(nodesData);
        setAnomalyTrips(anomaliesData);
        setKpiData(kpiData);
        setInventoryData(inventoryResp.inventoryDistribution);

      } catch (error) {
        console.error("대시보드 초기 데이터 로딩 실패:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    // 초기 로딩 시에는 실행하지 않음
    if (isLoading) return;

    async function refetchData() {
      // 선택된 공장에 따라 파라미터 생성
      const params = activeFactory === '전체'
        ? {}
        : { factoryCode: factoryPrefixMap[activeFactory] };

      // 필요한 API들을 다시 호출
      const [kpiData, inventoryResp, anomaliesData] = await Promise.all([
        getKpiSummary(params),
        getInventoryDistribution(params),
        getAnomalies(params), // 필터 적용된 이상 징후 목록
      ]);

      setKpiData(kpiData);
      setInventoryData(inventoryResp.inventoryDistribution);
      setAnomalyTrips(anomaliesData);
    }
    refetchData();
  }, [activeFactory]);

  const nodeMap = useMemo(() => new Map<string, Node>(nodes.map(n => [n.hubType, n])), [nodes]);

  useEffect(() => {
    // isLoading이 true이거나, nodeMap이 아직 준비되지 않았으면 계산을 건너뜁니다.
    if (isLoading || nodeMap.size === 0) {
      // 데이터가 없는 경우, 차트 데이터를 빈 배열로 초기화할 수 있습니다.
      setAnomalyChartData([]);
      setStageChartData([]);
      setEventTimelineData([]);
      return;
    }

    // --- 1. 이상 탐지 유형별 건수 (도넛 차트용) ---
    const countsByType = anomalyTrips.reduce((acc, trip) => {
      // anomaly 필드가 null이 아닌 경우에만 계산
      if (trip.anomaly) {
        acc[trip.anomaly] = (acc[trip.anomaly] || 0) + 1;
      }
      return acc;
    }, {} as Record<AnomalyType, number>);

    const newAnomalyChartData = Object.entries(countsByType).map(([type, count]) => {
      const anomalyType = type as AnomalyType;
      const rgbColor = getAnomalyColor(anomalyType); // [r, g, b]
      const colorString = `rgb(${rgbColor.join(', ')})`; // "rgb(255, 99, 132)"

      return {
        type: anomalyType,
        name: getAnomalyName(anomalyType),
        count: count,
        color1: colorString, // 그라데이션 대신 단색으로 표시
        color2: colorString,
      };
    });
    setAnomalyChartData(newAnomalyChartData);


    // --- 2. 공급망 단계별 이상 이벤트 (롤리팝 차트용) ---
    const STAGES = [
      { from: 'Factory', to: 'WMS' },
      { from: 'WMS', to: 'LogiHub' },
      { from: 'LogiHub', to: 'Wholesaler' },
      { from: 'Wholesaler', to: 'Reseller' },
    ];

    const newStageChartData = STAGES.map(stage => {
      const stageAnomalies = anomalyTrips.filter(trip => {
        // from과 to 노드가 모두 존재하고, businessStep이 일치하는지 확인
        const fromNode = nodeMap.get(trip.from);
        const toNode = nodeMap.get(trip.to);
        return fromNode?.businessStep === stage.from && toNode?.businessStep === stage.to;
      });
      return {
        stageName: `${stage.from}→${stage.to}`,
        count: stageAnomalies.length
      };
    });
    setStageChartData(newStageChartData);


    // --- 3. 시간대별 이상 발생 추이 (타임라인 차트용) ---
    const timeIntervals: { [key: string]: number } = {
      '00:00': 0, '03:00': 0, '06:00': 0, '09:00': 0,
      '12:00': 0, '15:00': 0, '18:00': 0, '21:00': 0,
    };

    anomalyTrips.forEach(trip => {
      // 실제 timestamps[0] (출발 시간)을 사용합니다.
      const startTime = new Date(trip.timestamps[0] * 1000); // 초 단위를 밀리초로 변환
      const hour = startTime.getHours();
      const interval = Math.floor(hour / 3) * 3;
      const intervalKey = interval.toString().padStart(2, '0') + ':00';

      if (timeIntervals.hasOwnProperty(intervalKey)) {
        timeIntervals[intervalKey]++;
      }
    });

    const newEventTimelineData = Object.entries(timeIntervals).map(([time, count]) => ({
      time,
      count,
    }));
    setEventTimelineData(newEventTimelineData);

  }, [anomalyTrips, nodeMap, isLoading]);

  const { minTime, maxTime } = useMemo(() => {
    // anomalyTrips 데이터가 없으면 기본값 반환
    if (anomalyTrips.length === 0) {
      return { minTime: 0, maxTime: 1 }; // 0, 0 대신 0, 1로 하여 분모가 0이 되는 것을 방지
    }

    const startTimes = anomalyTrips.map(t => t.timestamps[0]);
    const endTimes = anomalyTrips.map(t => t.timestamps[1]);

    return {
      minTime: Math.min(...startTimes),
      maxTime: Math.max(...endTimes),
    };
  }, [anomalyTrips]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
        <p className="text-xl">데이터를 불러오는 중입니다...</p>
      </div>
    );
  }
  if (!kpiData) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
        <p className="text-xl">데이터를 불러오는 데 실패했습니다.</p>
      </div>
    );
  }

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
            <motion.div variants={itemVariants}><StatCard title="총 이상 이벤트(건)" value={kpiData.anomalyCount.toString()} changeType="increase" icon={<AlertTriangle className="text-[#E0E0E0]" />} /></motion.div>
            <motion.div variants={itemVariants}><StatCard title="판매율(%)" value={kpiData.salesRate.toFixed(1)} icon={<TrendingUp className="text-[#E0E0E0]" />} /></motion.div>
            <motion.div variants={itemVariants}><StatCard title="출고율(%)" value={kpiData.dispatchRate.toFixed(1)} icon={<Truck className="text-[#E0E0E0]" />} /></motion.div>
            <motion.div variants={itemVariants}><StatCard title="전체 재고 비율(%)" value={kpiData.inventoryRate.toFixed(1)} icon={<Package className="text-[#E0E0E0]" />} /></motion.div>
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
            <motion.div variants={itemVariants} className="lg:col-span-3 h-full">
              <FactoryDetailView activeFactory={activeFactory} onTabClick={setActiveFactory} kpiData={kpiData} />
            </motion.div>

            {/* 2열: 중앙 분석 패널 */}
            <motion.div variants={itemVariants} className="lg:col-span-6">
              {/* 
                - grid-cols-2: 전체 공간을 왼쪽, 오른쪽 두 개의 열로 나눕니다.
                - gap-6: 두 열 사이에 간격을 줍니다.
              */}
              <div className="grid grid-cols-2 gap-6">

                {/* --- 왼쪽 열 --- */}
                {/* 
                  - space-y-6: 이 열 안의 아이템들(차트) 사이에 수직 간격을 줍니다.
                  - flex flex-col: 내부 아이템을 수직으로 쌓기 위해 추가할 수 있습니다.
                */}
                <div className="space-y-6">

                  {/* 1. 이상 탐지 유형별 건수 */}
                  {/* ✅ 여기에 원하는 높이를 직접 지정하세요! (예: h-[260px]) */}
                  <div className="bg-[rgba(40,40,40)] p-4 rounded-2xl shadow h-[380px] flex flex-col">
                    <h3 className="font-noto-400 text-white text-xl px-3 pb-3 mb-2 flex-shrink-0">이상 탐지 유형별 건수</h3>
                    <div className="flex-grow overflow-hidden">
                      <DynamicAnomalyChart data={anomalyChartData} />
                    </div>
                  </div>

                  {/* 2. 시간대별 이상 발생 추이 */}
                  {/* ✅ 여기에 원하는 높이를 직접 지정하세요! (예: h-[260px]) */}
                  <div className="bg-[rgba(111,131,175)] p-4 rounded-2xl shadow h-[260px] flex flex-col">
                    <h3 className="font-noto-400 text-white text-xl px-3 pb-3 mb-2 flex-shrink-0">시간대별 이상 발생 추이</h3>
                    <div className="flex-grow overflow-hidden">
                      <DynamicTimelineChart data={eventTimelineData} />
                    </div>
                  </div>
                </div>

                {/* --- 오른쪽 열 --- */}
                <div className="space-y-6">

                  {/* 3. 위험 요소 분석 */}
                  {/* ✅ 여기에 원하는 높이를 직접 지정하세요! (예: h-[360px]) */}
                  <div className="bg-[rgba(40,40,40)] p-4 rounded-2xl shadow h-[260px] flex flex-col">
                    <h3 className="font-noto-400 text-white text-xl px-3 pb-3 mb-2 flex-shrink-0">공급망 단계별 이상 이벤트</h3>
                    <div className="flex-grow overflow-hidden">
                      <DynamicStageLollipopChart data={stageChartData} />
                    </div>
                  </div>

                  {/* 3. 유형별 재고 분산 */}
                  {/* ✅ 여기에 원하는 높이를 직접 지정하세요! (예: h-[360px]) */}
                  <div className="bg-[rgba(40,40,40)] p-4 rounded-2xl shadow h-[380px] flex flex-col">
                    <h3 className="font-noto-400 text-white text-xl px-3 pb-3 mb-2 flex-shrink-0">유형별 재고 분산</h3>
                    <div className="flex-grow overflow-hidden">
                      <DynamicInventoryChart data={inventoryData} />
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>

            {/* 3열: 지도 */}
            <motion.div variants={itemVariants} className="lg:col-span-3 h-full">
              <div className="w-full h-full rounded-3xl overflow-hidden">
                <SupplyChainMapWidget nodes={nodes}
                  analyzedTrips={anomalyTrips} minTime={minTime} maxTime={maxTime} onWidgetClick={() => handleWidgetClick('/graph')} />
              </div>
            </motion.div>
          </div>

          {/* 하단 리스트 */}
          <motion.div variants={itemVariants}>
            <h3 className="font-vietnam text-white text-2xl mb-4">Anomaly List</h3>
            <div className="font-vietnam"><AnomalyList data={anomalyTrips} nodeMap={nodeMap} /></div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}