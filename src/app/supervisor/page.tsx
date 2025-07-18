'use client';

// import { useAuth } from '@/context/AuthContext'; ℹ️ 백이랑 연결 시 주석 풀기
import { useRouter } from 'next/navigation';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  nodesAtom,
  mergeAndGenerateTimestamps,
  loadRouteGeometriesAtom,
  routeGeometriesAtom,
} from '@/stores/mapDataAtoms';

import { motion, type Variants } from 'framer-motion';

import {
  getNodes,
  getAnomalies,
  getTrips,
  getKpiSummary,
  getInventoryDistribution,
  getUploadHistory,
  type Node,
  type AnalyzedTrip,
  type KpiSummary,
  type InventoryDataPoint,
  type AnomalyType,
  type PaginatedTripsResponse,
  type UploadFile,
} from '@/components/visual/data';

import StatCard from '@/components/dashboard/StatCard';
import AnomalyList from '@/components/dashboard/AnomalyList';
import { SupplyChainMapWidget } from '@/components/visual/SupplyChainMapWidget';
import FactoryDetailView from '@/components/dashboard/FactoryDetailView';
import UploadHistoryModal from '@/components/dashboard/UploadHistoryModal';

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
  Play,
  ArrowRightCircle,
  FileText,
  X
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
  locationId: number;
}

const MOCK_USER_ADMIN: User = { role: 'ADMIN', locationId: 0 };
const MOCK_USER_MANAGER: User = { role: 'MANAGER', locationId: 1 };

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


  const nodes = useAtomValue(nodesAtom);
  const setNodes = useSetAtom(nodesAtom);

  const [anomalyTrips, setAnomalyTrips] = useState<TripWithId[]>([]);
  const [allTripsForMap, setAllTripsForMap] = useState<TripWithId[]>([]);

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  const [kpiData, setKpiData] = useState<KpiSummary | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryDataPoint[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const routeGeometries = useAtomValue(routeGeometriesAtom);
  const loadGeometries = useSetAtom(loadRouteGeometriesAtom);

  const [replayTrigger, setReplayTrigger] = useState(0);

  // 차트 전용 상태
  const [anomalyChartData, setAnomalyChartData] = useState<any[]>([]);
  const [stageChartData, setStageChartData] = useState<StageBarDataPoint[]>([]);
  const [eventTimelineData, setEventTimelineData] = useState<any[]>([]);

  // 날짜 선택
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 필터 상태
  const [activeFactory, setActiveFactory] = useState<string>('');

  // ✨ 모달 및 파일 필터 관련 상태 추가
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);

  const factoryTabs = useMemo(() => {
    if (user.role === 'ADMIN') {
      return ['전체', '화성', '인천', '구미', '양산'];
    }
    if (user.role === 'MANAGER') {
      const myFactoryName = factoryCodeNameMap[user.locationId];
      return myFactoryName ? [myFactoryName] : [];
    }
    return [];
  }, [user]);

  const viewProps = useMemo(() => {
    // 1. 파일이 선택된 경우
    if (selectedFileId) {
      const selectedFile = uploadHistory.find(file => file.fileId === selectedFileId);

      // 파일 정보와 locationId가 유효한지 확인
      if (selectedFile && selectedFile.locationId) {
        const factoryName = factoryCodeNameMap[selectedFile.locationId];
        if (factoryName) {
          // 해당 공장 탭 하나만 표시하고, 그 탭을 활성화
          return {
            tabs: [factoryName],
            active: factoryName
          };
        }
      }
      // 만약의 경우 (파일 정보가 없거나 locationId가 없을 때)
      // 파일 선택을 무시하고 기본 상태로 돌아갑니다.
      return {
        tabs: factoryTabs,
        active: '전체' // 또는 activeFactory 상태
      };
    }

    // 2. 파일이 선택되지 않은 경우 (기본 상태)
    // 기존의 factoryTabs와 activeFactory 상태를 그대로 사용
    return {
      tabs: factoryTabs,
      active: activeFactory
    };
  }, [selectedFileId, uploadHistory, factoryTabs, activeFactory]);

  const handleTabClick = (factory: string) => {
    // 탭을 클릭하면 항상 파일 필터가 해제됩니다.
    if (selectedFileId !== null) {
      setSelectedFileId(null);
    }
    setActiveFactory(factory);
  };

  useEffect(() => {
    if (user.role === 'MANAGER' && factoryTabs.length > 0) {
      setActiveFactory(factoryTabs[0]); // MANAGER는 자기 공장 탭을 기본값으로 설정
    } else {
      setActiveFactory('전체'); // ADMIN은 '전체' 탭을 기본값으로 설정
    }
  }, [user, factoryTabs]);

  useEffect(() => {
    // 상세 경로 데이터가 먼저 로드되도록 합니다.
    loadGeometries();
  }, [loadGeometries]);

  useEffect(() => {
    if (!activeFactory) return;

    async function loadData() {
      setIsLoading(true);
      setAnomalyTrips([]);
      setAllTripsForMap([]);
      setNextCursor(null);

      const params: Record<string, any> = {};
      const factoryId = factoryNameCodeMap[activeFactory];
      if (user.role === 'ADMIN' && factoryId) {
        params.locationId = factoryId;
      }

      // ✨ 중요: 파일 필터와 날짜 필터는 상호 배타적으로 동작
      if (selectedFileId) {
        params.fileId = selectedFileId;
      } else if (selectedDate) {
        params.date = selectedDate.toLocaleDateString('sv-SE');
      }

      console.log('--- 1. API에 전달되는 파라미터 ---', { ...params, limit: 50, cursor: null });

      try {
        const [kpiRes, inventoryRes, nodesRes, anomaliesRes, allTripsRes] = await Promise.all([
          getKpiSummary(params),
          getInventoryDistribution(params),
          getNodes(),
          getAnomalies({ ...params, limit: 50, cursor: null }),
          getTrips({ ...params, limit: 50 })
        ]);

        // ... 데이터 설정 로직 ...
        setKpiData(kpiRes);
        setInventoryData(inventoryRes.inventoryDistribution);
        setNodes(nodesRes);

        const mergedTrips = mergeAndGenerateTimestamps(anomaliesRes.data, routeGeometries);

        // 가공된 최종 데이터를 상태에 저장합니다.
        setAnomalyTrips(mergedTrips);
        setNextCursor(anomaliesRes.nextCursor);
        const mergedAllTrips = mergeAndGenerateTimestamps(allTripsRes.data, routeGeometries);
        setAllTripsForMap(mergedAllTrips);

      } catch (error) {
        console.error("대시보드 데이터 로딩 실패:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (routeGeometries) {
      loadData();
    }
  }, [user, activeFactory, selectedDate, selectedFileId, routeGeometries]);

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || isFetchingMore) return;
    setIsFetchingMore(true);

    const params: Record<string, any> = {};
    const factoryId = factoryNameCodeMap[activeFactory];
    if (user.role === 'ADMIN' && factoryId) {
      params.locationId = factoryId;
    }

    if (selectedFileId) {
      params.fileId = selectedFileId;
    } else if (selectedDate) {
      params.date = selectedDate.toLocaleDateString('sv-SE');
    }

    try {
      // getAnomalies 호출 시 cursor 정보도 함께 전달
      const response = await getAnomalies({ ...params, cursor: nextCursor });
      const newTripsWithId = response.data.map(trip => ({ ...trip, id: uuidv4() }));
      setAnomalyTrips(prev => [...prev, ...newTripsWithId]);
      setNextCursor(response.nextCursor);
    } catch (error) {
      console.error("추가 데이터 로딩 실패:", error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [user, activeFactory, selectedDate, selectedFileId, nextCursor, isFetchingMore]);

  const handleHistoryClick = async () => {
    try {
      const historyData = await getUploadHistory();
      setUploadHistory(historyData);
      setIsHistoryModalOpen(true);
    } catch (error) {
      alert('업로드 내역을 불러오는데 실패했습니다.');
    }
  };

  const handleFileSelect = (fileId: number) => {
    // 선택된 파일의 전체 정보를 찾습니다.
    const selectedFile = uploadHistory.find(file => file.fileId === fileId);

    if (selectedFile) {
      // 1. fileId 상태를 업데이트합니다.
      setSelectedFileId(selectedFile.fileId);

      // 2. 해당 파일의 locationId를 기반으로 activeFactory 상태를 업데이트합니다.
      if (selectedFile.locationId) {
        // locationId가 있으면 해당 공장 이름으로 탭을 설정합니다.
        const factoryName = factoryCodeNameMap[selectedFile.locationId];
        if (factoryName) {
          setActiveFactory(factoryName);
        }
      } else {
        // locationId가 null이면 '전체' 탭으로 설정합니다.
        setActiveFactory('전체');
      }
    }

    // 3. 날짜 필터는 초기화하고 모달을 닫습니다.
    setSelectedDate(null);
    setIsHistoryModalOpen(false);
  };

  // 필터 초기화 함수
  const clearFilters = () => {
    setSelectedDate(null);
    setSelectedFileId(null);
    setActiveFactory('전체');
  };

  const selectedFileName = useMemo(() => {
    if (!selectedFileId) return null;
    return uploadHistory.find(file => file.fileId === selectedFileId)?.fileName || `File ID: ${selectedFileId}`;
  }, [selectedFileId, uploadHistory]);

  useEffect(() => {
    if (isLoading || !nodes.length || !anomalyTrips.length) {
      setAnomalyChartData([]);
      setStageChartData([]);
      setEventTimelineData([]);
      return;
    }

    // 1. 이상 탐지 유형별 건수 (변경 필요 없음, anomalyTrips는 이미 ID 포함)
    const countsByType = anomalyTrips.reduce((acc, trip) => {
      // 기존: trip.anomaly (단일 값) -> 변경: trip.anomalyTypeList (배열)
      // 배열의 각 이상 유형에 대해 카운트를 1씩 증가시킵니다.
      if (trip.anomalyTypeList && trip.anomalyTypeList.length > 0) {
        trip.anomalyTypeList.forEach(anomalyCode => {
          acc[anomalyCode] = (acc[anomalyCode] || 0) + 1;
        });
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
    if (!allTripsForMap || allTripsForMap.length === 0) {
      return { minTime: 0, maxTime: 1 };
    }
    // timestamp가 없는 데이터를 필터링하여 안정성 확보
    const validTimestamps = allTripsForMap.flatMap(trip => [
      trip.from.eventTime,
      trip.to.eventTime
    ].filter(t => typeof t === 'number'));

    if (validTimestamps.length === 0) return { minTime: 0, maxTime: 1 };

    return {
      minTime: Math.min(...validTimestamps),
      maxTime: Math.max(...validTimestamps),
    };
  }, [allTripsForMap]);

  const handleReplayAnimation = () => {
    setReplayTrigger(prev => prev + 1);
  };

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
      <UploadHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        files={uploadHistory}
        onFileSelect={handleFileSelect}
      />
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
            {selectedFileId ? (
              <div className="flex items-center gap-2 bg-[rgba(91,111,155,0.5)] text-white border border-[rgba(111,131,175)] px-4 py-2 rounded-[50px]">
                <FileText size={16} className="text-blue-300" />
                <span className="text-sm font-semibold truncate max-w-[200px]">{selectedFileName}</span>
                <button onClick={clearFilters} className="ml-2 p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[rgba(30,30,30)] text-white border border-gray-400 px-4 py-2 rounded-[50px]">
                <CalendarIcon size={20} className="text-gray-300" />
                <DatePicker
                  selected={selectedDate}
                  onChange={(date: Date | null) => {
                    setSelectedDate(date);
                    setSelectedFileId(null);
                  }}
                  dateFormat="yyyy/MM/dd"
                  isClearable
                  placeholderText="날짜 선택"
                  className="bg-transparent text-white outline-none w-28"
                  popperPlacement="bottom-start"
                  maxDate={new Date()}
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 pr-4">
            <button onClick={handleHistoryClick} className="cursor-pointer w-14 h-14 flex items-center justify-center hover:bg-[rgba(30,30,30)] text-white border border-gray-400 rounded-full"
              title='csv 업로드 목록'
            >
              <History size={22} />
            </button>
            <button className="cursor-pointer py-4 flex items-center gap-2 hover:bg-[rgba(30,30,30)] text-white border border-gray-400 px-6 rounded-[50px]" title='보고서 다운로드'><Download size={18} />Download Report</button>
            <button className="cursor-pointer flex items-center gap-2 bg-[rgba(111,131,175,1)] hover:bg-[rgba(91,111,155,1)] text-white py-4 px-6 rounded-[50px]" title='csv 업로드'><Upload size={18} />Upload CSV</button>
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
              <FactoryDetailView
                factoryTabs={viewProps.tabs}
                activeFactory={viewProps.active}
                onTabClick={handleTabClick}
                kpiData={kpiData}
              />
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
              <div className="relative w-full h-full rounded-3xl overflow-hidden">
                <SupplyChainMapWidget
                  key={replayTrigger}
                  nodes={nodes}
                  analyzedTrips={allTripsForMap} minTime={minTime} maxTime={maxTime} onWidgetClick={() => handleWidgetClick('/graph')} />
                <button
                  onClick={handleReplayAnimation}
                  style={{
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'}
                  className="absolute top-4 left-4 text-white p-2 rounded-full"
                  title="애니메이션 다시 재생"
                >
                  <Play size={20} />
                </button>
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