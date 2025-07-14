'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// import { useAuth } from '@/context/AuthContext'; ℹ️ 백이랑 연결 시 주석 풀기

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
  type AnomalyType,
  type PaginatedTripsResponse,
} from '@/components/visual/data'

import StatCard from '@/components/dashboard/StatCard';
import AnomalyList from '@/components/dashboard/AnomalyList';
import { SupplyChainMapWidget } from '@/components/visual/SupplyChainMapWidget';
import FactoryDetailView from '@/components/dashboard/FactoryDetailView';
import { getAnomalyName, getAnomalyColor } from '@/components/visual/colorUtils';

import dynamic from 'next/dynamic';
import { v4 as uuidv4 } from 'uuid';

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
  { ssr: false });

const DynamicStageLollipopChart = dynamic(
  () => import('@/components/dashboard/StageLollipopChart'),
  { ssr: false }
);

import { StageBarDataPoint } from '@/components/dashboard/StageLollipopChart';

import {
  Calendar as CalendarIcon,
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

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

type AnomalyDataPoint = {
  name: string; // 한글 이름
  type: AnomalyType;
  count: number;
  color1: string;
  color2: string;
};

type User = {
  role: 'ADMIN' | 'MANAGER';
  factoryCode: number;
}

const MOCK_USER_ADMIN: User = { role: 'ADMIN', factoryCode: 0 };
const MOCK_USER_MANAGER: User = { role: 'MANAGER', factoryCode: 1 };

// type InventoryDataPoint = { name: string; value: number; };
// type UserRole = 'ADMIN' | 'MANAGER';
// type MockUser = { role: UserRole; factory: string; };

type EventTimelineDataPoint = {
  time: string;
  count: number;
};

type TripWithId = AnalyzedTrip & { id: string };

const factoryCodeNameMap: { [key: number]: string } = {
  1: '인천',
  2: '화성',
  3: '양산',
  4: '구미',
};

const factoryNameCodeMap: { [key: string]: number } = {
  '인천': 1,
  '화성': 2,
  '양산': 3,
  '구미': 4,
};

export type AnomalyListItem = {
  id: string;
  productName: string;
  location: string;
  eventType: string;
  timestamp: string;
};

export default function SupervisorDashboard() {
  const router = useRouter();
  // ℹ️ 테스트 끝나면 주석 풀기
  // const { user } = useAuth();
  // useEffect(() => {
  //   if (!user) return; // 아직 로딩 중일 수 있음

  //   if (user.role !== 'ADMIN') {
  //     alert('접근 권한이 없습니다.');
  //     router.push('/login');
  //   }
  // }, [user, router]);


  //⚠️ 백엔드 연결 시 삭제
  const user = MOCK_USER_ADMIN;
  // const user = MOCK_USER_MANAGER; // 이건 매니저 테스트
  
  
  const [nodes, setNodes] = useState<Node[]>([]);

  const [anomalyTrips, setAnomalyTrips] = useState<TripWithId[]>([]);

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  const [kpiData, setKpiData] = useState<KpiSummary | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryDataPoint[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // 차트 전용 상태
  const [anomalyChartData, setAnomalyChartData] = useState<any[]>([]);
  const [stageChartData, setStageChartData] = useState<StageBarDataPoint[]>([]);
  const [eventTimelineData, setEventTimelineData] = useState<any[]>([]);

  // 날짜 선택
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 필터 상태
  const [activeFactory, setActiveFactory] = useState<string>('');

  const factoryTabs = useMemo(() => {
    if (user.role === 'ADMIN') {
      return ['전체', '화성', '인천', '구미', '양산'];
    }
    if (user.role === 'MANAGER') {
      const myFactoryName = factoryCodeNameMap[user.factoryCode];
      return myFactoryName ? [myFactoryName] : [];
    }
    return [];
  }, [user]);

  useEffect(() => {
    if (user.role === 'MANAGER' && factoryTabs.length > 0) {
      setActiveFactory(factoryTabs[0]); // MANAGER는 자기 공장 탭을 기본값으로 설정
    } else {
      setActiveFactory('전체'); // ADMIN은 '전체' 탭을 기본값으로 설정
    }
  }, [user, factoryTabs]);

  useEffect(() => {
    if (!activeFactory) return;

    async function loadData() {
      setIsLoading(true);
      setAnomalyTrips([]);
      setNextCursor(null);

      const params: Record<string, any> = {};

      if (user.role === 'ADMIN' && activeFactory !== '전체') {
        params.factoryCode = factoryNameCodeMap[activeFactory];
      }

      if (selectedDate) {
        const dateString = selectedDate.toLocaleDateString('sv-SE');
        params.date = dateString;
      }

      try {
        // KPI, 인벤토리, 노드 데이터와 "첫 페이지"의 이상 징후 데이터를 함께 요청합니다.
        const [kpiRes, inventoryRes, nodesRes, anomaliesRes] = await Promise.all([
          getKpiSummary(params),
          getInventoryDistribution(params),
          getNodes(),
          getAnomalies({ ...params, limit: 50, cursor: null }) // 첫 페이지는 50개 로드
        ]);

        setKpiData(kpiRes);
        setInventoryData(inventoryRes.inventoryDistribution);
        setNodes(nodesRes);

        // 첫 페이지 데이터 설정
        const tripsWithId = anomaliesRes.data.map(trip => ({ ...trip, id: uuidv4() }));
        setAnomalyTrips(tripsWithId);
        setNextCursor(anomaliesRes.nextCursor);

      } catch (error) {
        console.error("대시보드 데이터 로딩 실패:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user, activeFactory, selectedDate]);

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || isFetchingMore) return;
    setIsFetchingMore(true);

    const params: Record<string, any> = {};
    if (user.role === 'ADMIN' && activeFactory !== '전체') {
      params.factoryCode = factoryNameCodeMap[activeFactory];
    }

    if (selectedDate) {
      const dateString = selectedDate.toLocaleDateString('sv-SE');
      params.date = dateString;
    }

    try {
      const response = await getAnomalies(params);
      const newTripsWithId = response.data.map(trip => ({ ...trip, id: uuidv4() }));

      setAnomalyTrips(prev => [...prev, ...newTripsWithId]);
      setNextCursor(response.nextCursor);
    } catch (error) {
      console.error("추가 데이터 로딩 실패:", error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [user, activeFactory, nextCursor, isFetchingMore]);

  useEffect(() => {
    if (isLoading || !nodes.length || !anomalyTrips.length) {
      setAnomalyChartData([]);
      setStageChartData([]);
      setEventTimelineData([]);
      return;
    }

    // 1. 이상 탐지 유형별 건수 (변경 필요 없음, anomalyTrips는 이미 ID 포함)
    const countsByType = anomalyTrips.reduce((acc, trip) => {
      if (trip.anomaly) {
        acc[trip.anomaly] = (acc[trip.anomaly] || 0) + 1;
      }
      return acc;
    }, {} as Record<AnomalyType, number>);
    const newAnomalyChartData = Object.entries(countsByType).map(([type, count]) => ({
      type: type as AnomalyType,
      name: getAnomalyName(type as AnomalyType),
      count,
      color1: `rgb(${getAnomalyColor(type as AnomalyType).join(', ')})`,
      color2: `rgb(${getAnomalyColor(type as AnomalyType).join(', ')})`,
    }));
    setAnomalyChartData(newAnomalyChartData);

    // 2. 공급망 단계별 이상 이벤트
    const nodeMapByLocation = new Map<string, Node>(nodes.map(n => [n.businessStep, n]));

    const STAGES = [
      { from: 'Factory', to: 'WMS', name: '공장 → 창고' },
      { from: 'WMS', to: 'LogiHub', name: '창고 → 물류' },
      { from: 'LogiHub', to: 'Wholesaler', name: '물류 → 도매' },
      { from: 'Wholesaler', to: 'Reseller', name: '도매 → 소매' },
      { from: 'Reseller', to: 'POS', name: '소매 → 판매' },
    ];
    const newStageChartData = STAGES.map(stage => {
      const stageAnomalies = anomalyTrips.filter(trip => {
        const fromNode = nodeMapByLocation.get(trip.from.businessStep);
        const toNode = nodeMapByLocation.get(trip.to.businessStep);
        return fromNode?.businessStep === stage.from && toNode?.businessStep === stage.to;
      });
      return {
        stageName: stage.name,
        count: stageAnomalies.length
      };
    });
    setStageChartData(newStageChartData);

    // 3. 시간대별 이상 발생 추이 (변경 필요 없음)
    const timeIntervals: { [key: string]: number } = {
      '00:00': 0, '03:00': 0, '06:00': 0, '09:00': 0,
      '12:00': 0, '15:00': 0, '18:00': 0, '21:00': 0,
    };
    anomalyTrips.forEach(trip => {
      if (!trip.from || typeof trip.from.eventTime !== 'number') return;
      const startTime = new Date(trip.from.eventTime * 1000);
      const hour = startTime.getHours();
      const interval = Math.floor(hour / 3) * 3;
      const intervalKey = interval.toString().padStart(2, '0') + ':00';
      if (timeIntervals.hasOwnProperty(intervalKey)) {
        timeIntervals[intervalKey]++;
      }
    });
    const newEventTimelineData = Object.entries(timeIntervals).map(([time, count]) => ({ time, count }));
    setEventTimelineData(newEventTimelineData);

  }, [anomalyTrips, nodes, isLoading]);


  // minTime, maxTime 계산 (변경 필요 없음)
  const { minTime, maxTime } = useMemo(() => {
    if (!anomalyTrips || anomalyTrips.length === 0) {
      return { minTime: 0, maxTime: 1 };
    }
    // timestamp가 없는 데이터를 필터링하여 안정성 확보
    const validTimestamps = anomalyTrips.flatMap(trip => {
      // 각 trip 객체에서 from.eventTime과 to.eventTime이 유효한 숫자인지 확인
      const times = [];
      if (trip.from && typeof trip.from.eventTime === 'number') {
        times.push(trip.from.eventTime);
      }
      if (trip.to && typeof trip.to.eventTime === 'number') {
        times.push(trip.to.eventTime);
      }
      return times;
    });
    if (validTimestamps.length === 0) return { minTime: 0, maxTime: 1 };

    return {
      minTime: Math.min(...validTimestamps),
      maxTime: Math.max(...validTimestamps),
    };
  }, [anomalyTrips]);

  if (isLoading && anomalyTrips.length === 0) {
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
    <div className="h-screen grid grid-rows-[auto_1fr] bg-black overflow-y-auto hide-scrollbar">

      {/* --- 첫 번째 행: 상단 고정 영역 --- */}
      <motion.div
        className="px-8 pb-6 space-y-4 "
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className='flex items-start justify-between '>
          <motion.h2 variants={itemVariants} className="font-vietnam text-white text-[50px] whitespace-nowrap">Supervisor<br />DashBoard</motion.h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}><StatCard title="총 이상 이벤트(건)" value={kpiData.anomalyCount.toString()} icon={<AlertTriangle className="text-[#E0E0E0]" />} /></motion.div>
            <motion.div variants={itemVariants}><StatCard title="판매율(%)" value={kpiData.salesRate.toFixed(1)} icon={<TrendingUp className="text-[#E0E0E0]" />} /></motion.div>
            <motion.div variants={itemVariants}><StatCard title="출고율(%)" value={kpiData.dispatchRate.toFixed(1)} icon={<Truck className="text-[#E0E0E0]" />} /></motion.div>
            <motion.div variants={itemVariants}><StatCard title="전체 재고 비율(%)" value={kpiData.inventoryRate.toFixed(1)} icon={<Package className="text-[#E0E0E0]" />} /></motion.div>
          </motion.div>
        </div>
        <motion.div variants={itemVariants} className="font-vietnam flex justify-between items-center bg-[rgba(40,40,40)] p-2 rounded-[50px]">
          <div className="flex items-center gap-4 text-white pl-4">
            <MapPin size={22} /><h3>Orders Database</h3>
            <div className="flex items-center gap-2 bg-[rgba(30,30,30)] text-white border border-gray-400 px-4 py-2 rounded-[50px]">
              <CalendarIcon size={20} className="text-gray-300" />
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => setSelectedDate(date)}
                dateFormat="yyyy/MM/dd"
                isClearable
                placeholderText="날짜 선택"
                className="bg-transparent text-white outline-none w-28" // 스타일링
                popperPlacement="bottom-start"
                maxDate={new Date()}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 pr-4">
            <button className="w-14 h-14 flex items-center justify-center hover:bg-[rgba(30,30,30)] text-white border border-gray-400 rounded-full">
              <History size={22} />
            </button>
            <button className="py-4 flex items-center gap-2 hover:bg-[rgba(30,30,30)] text-white border border-gray-400 px-6 rounded-[50px]"><Download size={18} />Download Report</button><button className="flex items-center gap-2 bg-[rgba(111,131,175,1)] hover:bg-[rgba(91,111,155,1)] text-white py-4 px-6 rounded-[50px]">
              <Upload size={18} />Upload CSV
            </button>
          </div>
        </motion.div>
      </motion.div>

      <div className="px-8 pb-[120px]">
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
              <FactoryDetailView factoryTabs={factoryTabs} activeFactory={activeFactory} onTabClick={setActiveFactory} kpiData={kpiData} />
            </motion.div>

            {/* 2열: 중앙 분석 패널 */}
            <motion.div variants={itemVariants} className="lg:col-span-6 h-full flex flex-col">
              {/* 
                - grid-cols-2: 전체 공간을 왼쪽, 오른쪽 두 개의 열로 나눕니다.
                - gap-6: 두 열 사이에 간격을 줍니다.
              */}
              <div className="grid grid-cols-2 gap-6 h-full">

                {/* --- 왼쪽 열 --- */}
                {/* 
                  - space-y-6: 이 열 안의 아이템들(차트) 사이에 수직 간격을 줍니다.
                  - flex flex-col: 내부 아이템을 수직으로 쌓기 위해 추가할 수 있습니다.
                */}
                <div className="flex flex-col gap-6">

                  {/* 1. 이상 탐지 유형별 건수 */}
                  <div className="bg-[#E0E0E0] p-4 rounded-2xl shadow min-h-[380px] flex flex-col flex-grow">
                    <h3 className="font-noto-500 text-[rgba(111,131,175)] text-xl px-3 pb-3 mb-2 flex-shrink-0">이상 탐지 유형별 건수</h3>
                    <div className="flex-grow overflow-hidden">
                      <DynamicAnomalyChart data={anomalyChartData} />
                    </div>
                  </div>

                  {/* 2. 시간대별 이상 발생 추이 */}
                  <div className="bg-[rgba(111,131,175)] p-4 rounded-2xl shadow min-h-[260px] flex flex-col flex-grow">
                    <h3 className="font-noto-400 text-white text-xl px-3 pb-3 mb-2 flex-shrink-0">시간대별 이상 발생 추이</h3>
                    <div className="flex-grow overflow-hidden">
                      <DynamicTimelineChart data={eventTimelineData} />
                    </div>
                  </div>
                </div>

                {/* --- 오른쪽 열 --- */}
                <div className="flex flex-col gap-6">

                  {/* 3. 공급망 */}
                  <div className="bg-[rgba(40,40,40)] p-4 rounded-2xl shadow min-h-[260px] flex flex-col flex-grow">
                    <h3 className="font-noto-400 text-white text-xl px-3 pb-3 mb-2 flex-shrink-0">공급망 단계별 이상 이벤트</h3>
                    <div className="flex-grow overflow-hidden">
                      <DynamicStageLollipopChart data={stageChartData} />
                    </div>
                  </div>

                  {/* 4. 유형별 재고 분산 */}
                  <div className="bg-[rgba(40,40,40)] p-4 rounded-2xl shadow min-h-[380px] flex flex-col flex-grow">
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
            <h3 className="font-noto-400 text-white text-2xl mb-4">이상 탐지 리스트</h3>
            <div className="font-vietnam">
              <AnomalyList anomalies={anomalyTrips} />
              {nextCursor && (
                <div className="mt-4 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isFetchingMore}
                    className="bg-[rgba(111,131,175)] hover:bg-[rgba(91,111,155,1)] text-white font-bold py-2 px-6 rounded-full transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    {isFetchingMore ? '로딩 중...' : '더 보기'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}