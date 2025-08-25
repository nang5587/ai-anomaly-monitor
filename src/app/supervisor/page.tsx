'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAtomValue, useSetAtom } from 'jotai';
import {
    tripsAtom,
    selectTripAndFocusAtom
} from '@/stores/mapDataAtoms';
import { activeTabAtom } from '@/stores/mapDataAtoms';

import { motion, type Variants } from 'framer-motion';

import { type Tab } from '@/components/visual/SupplyChainDashboard';
import { MergeTrip } from '@/context/MapDataContext';

import { useDashboard } from '@/context/dashboardContext';

import StatCard from '@/components/dashboard/StatCard';
import { DashboardMapWidget } from '../../components/dashboard/widget/DashboardMapWidget';
import { AnomalyTripTable } from '@/components/visual/AnomalyTripTable';
import Loading from '@/components/Loading';
import UploadHistoryModal from '@/components/dashboard/UploadHistoryModal';
import FactoryIcon from '@/components/ui/FactoryIcon';
import VennDiagramChart from '@/components/dashboard/VennDiagramChart';
import AnomalyRateBar from '@/components/dashboard/AnomalyRateBar';
import dynamic from 'next/dynamic';

const DynamicAnomalyChart = dynamic(
    () => import('@/components/dashboard/AnomalyEventsChart'),
    { ssr: false }
);
const DynamicInventoryChart = dynamic(
    () => import('@/components/dashboard/DataBalanceRadarChart'),
    { ssr: false }
);
const DynamicProductChart = dynamic(
    () => import('@/components/dashboard/ProductAnomalyChart'),
    { ssr: false });
const DynamicTimelineChart = dynamic(
    () => import('@/components/dashboard/AnomalyTimelineChart'),
    { ssr: false });
const DynamicStageLollipopChart = dynamic(
    () => import('@/components/dashboard/StageLollipopChart'),
    { ssr: false }
);

import {
    AlertTriangle, CircleHelp,
    History, Download
} from "lucide-react";

export default function SupervisorDashboard() {
    const router = useRouter();
    const setActiveTab = useSetAtom(activeTabAtom);

    const {
        kpiData,
        anomalyTrips,
        allTripsForMap,
        inventoryData,
        nodes,
        productAnomalyData,
        anomalyChartData,
        vennDiagramData,
        stageChartData,
        eventTimelineData,
        isAuthLoading,
        isLoading,
        user,
        isFetchingMore,
        nextCursor,
        selectedFileName,
        selectedFileId,
        isHistoryModalOpen,
        uploadHistory,
        viewProps,
        minTime,
        maxTime,
        handleFileSelect,
        handleLoadMore,
        clearFilters,
        openHistoryModal,
        closeHistoryModal,
    } = useDashboard();

    const [isTooltipVisible, setIsTooltipVisible] = useState(false);

    const trips = useAtomValue(tripsAtom);
    const selectTripAndFocus = useSetAtom(selectTripAndFocusAtom);

    const handleWidgetClick = () => {
        setActiveTab('heatmap');
        router.push(`/map?fileId=${selectedFileId}`);
    };

    const handleFileUpload = async () => {
        router.push('/upload');
    };

    const handleDownloadReport = () => {
        if (!selectedFileId) {
            alert("보고서를 생성할 파일을 먼저 선택해주세요.");
            return;
        }
        router.push(`/supervisor/report?fileId=${selectedFileId}`);
    };

    const formatNumberCompact = (num: number): string => {
        if (isNaN(num)) return '0';

        const formatter = new Intl.NumberFormat('en-US', {
            notation: 'compact',
            maximumFractionDigits: 1,
        });
        return formatter.format(num);
    };

    if (!user) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
                <p>접근 권한이 없습니다. 로그인 페이지로 이동합니다.</p>
            </div>
        );
    }

    if (isLoading && !kpiData) {
        return (
            <Loading />
        );
    }

    if (!kpiData) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
                <p className="text-xl"></p>
            </div>
        )
    }

    const containerVariants: Variants = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: {
            y: 30,
            opacity: 0,
            scale: 0.98
        },
        visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                damping: 15,
                stiffness: 100,
                duration: 0.8,
            },
        },
    };

    const handleRowClick = (trip: MergeTrip) => {
        if (!selectedFileId) {
            console.error("파일 ID가 선택되지 않아 지도로 이동할 수 없습니다.");
            return;
        }
        setActiveTab('anomalies');
        selectTripAndFocus(trip);
        router.push(`/map?fileId=${selectedFileId}`);
    };

    const anomalyPercentage = kpiData.anomalyRate * 100;

    return (
        <div className="h-screen grid grid-rows-[auto_1fr] bg-black overflow-y-auto hide-scrollbar">
            <UploadHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={closeHistoryModal}
                files={uploadHistory}
                onFileSelect={handleFileSelect}
            />
            <motion.div
                className="px-8 space-y-4 "
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    className='grid grid-cols-4 items-end gap-8 mb-6'
                    variants={containerVariants}
                >
                    <motion.h2
                        variants={itemVariants}
                        className="col-span-1 font-vietnam text-white text-[50px] whitespace-nowrap"
                    >
                        Supervisor<br />DashBoard
                    </motion.h2>
                    <motion.div
                        variants={itemVariants}
                        className="col-span-2"
                    >
                        <AnomalyRateBar
                            title="이상 발생 비율"
                            percentage={anomalyPercentage}
                        />
                    </motion.div>
                    <motion.div
                        variants={itemVariants}
                        className="col-span-1 flex items-center justify-end gap-4"
                    >
                        <div className="flex items-end justify-end gap-2">
                            <button onClick={openHistoryModal} className="cursor-pointer w-14 h-14 flex items-center justify-center hover:bg-[rgba(30,30,30)] text-white border border-gray-400 rounded-full"
                                title='최근 csv 업로드 목록'
                            >
                                <History size={22} />
                            </button>
                            <button onClick={handleDownloadReport} className="cursor-pointer py-4 flex items-center gap-2 hover:bg-[rgba(30,30,30)] text-white border border-gray-400 px-6 rounded-[50px]" title='보고서 다운로드'><Download size={18} />Download Report</button>
                        </div>
                        {/* <StatCard
                            title="탐지된 이상 이벤트(건)"
                            value={kpiData.anomalyCount.toString()}
                            icon={<AlertTriangle className="text-[#E0E0E0]" />}
                        /> */}
                    </motion.div>
                </motion.div>
            </motion.div>

            <div className="px-8 pb-[0px]">
                <motion.div
                    className="space-y-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <motion.div variants={itemVariants} className="lg:col-span-6 h-full flex flex-col">
                            <div className="grid grid-cols-2 gap-6 h-full">
                                <div className="relative bg-[rgba(40,40,40)] p-4 rounded-2xl shadow flex flex-col gap-6">
                                    <div
                                        className="absolute top-4 right-4"
                                        onMouseEnter={() => setIsTooltipVisible(true)}
                                        onMouseLeave={() => setIsTooltipVisible(false)}
                                    >
                                        <button title="도움말 보기">
                                            <CircleHelp className="w-6 h-6 text-[rgba(111,131,175)] cursor-pointer" />
                                        </button>
                                        {isTooltipVisible && (
                                            <div className="absolute top-12 right-0 mb-2 w-80 p-4 bg-[rgba(40,40,40)] border-2 border-[rgba(111,131,175)] text-white rounded-lg shadow-xl z-20">
                                                <h4 className="font-noto-500 text-[rgba(111,131,175)] text-lg mb-2 border-b border-[rgba(111,131,175)] pb-2">탐지 유형 안내</h4>

                                                <div className="mb-3">
                                                    <p className="text-lg text-[rgba(111,131,175)]">룰 기반 탐지 (Rule-based)</p>
                                                    <p className="text-md text-[#E0E0E0] mt-1">
                                                        사전에 정의된 명확한 비즈니스 규칙(Rule)을 위반하는 이벤트를 식별합니다.
                                                    </p>
                                                    <ul className="list-disc list-inside text-md text-[#e0e0e0c7] mt-2 space-y-1">
                                                        <li><strong>위조(Fake):</strong> 등록되지 않은 EPC 코드가 시스템에 등장</li>
                                                        <li><strong>변조(Tamper):</strong> EPC 코드의 구조적 비정상성 감지</li>
                                                        <li><strong>복제(Clone):</strong> 동일 코드가 비정상적 시간/장소에서 동시 사용</li>
                                                    </ul>
                                                </div>

                                                <div>
                                                    <p className="text-lg text-[rgba(111,131,175)]">AI 기반 탐지 (AI-based)</p>
                                                    <p className="text-md text-[#E0E0E0] mt-1">
                                                        과거 물류 데이터의 복합적인 패턴을 학습한 AI 모델이 정상 범주를 벗어나는 이벤트를 '이상치(Anomaly)'로 판단하여 탐지합니다.<br />
                                                        이는 개별 규칙으로는 식별하기 어려운 미묘하고 복합적인 이상 신호를 찾아내는 데 효과적입니다.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col flex-1 min-h-[300px]">
                                        <h3 className="font-noto-400 text-white text-2xl px-2 pb-2 flex-shrink-0">
                                            이상 탐지 유형별 건수
                                        </h3>
                                        <div className="flex-grow relative">
                                            <div className="absolute inset-0">
                                                <DynamicAnomalyChart data={anomalyChartData} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col flex-1 min-h-[300px]">
                                        <h3 className="font-noto-400 text-white text-2xl px-2 pb-2 flex-shrink-0">
                                            룰 기반 vs AI 기반 탐지 분석
                                        </h3>
                                        <div className="flex-grow relative">
                                            <div className="absolute inset-0 p-2">
                                                <VennDiagramChart data={vennDiagramData} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-6">
                                    <div className="bg-[rgba(40,40,40)] px-4 pt-4 rounded-2xl shadow min-h-[240px] flex flex-col flex-grow">
                                        <h3 className="font-noto-400 text-white text-2xl px-3 pb-3 mb-2 flex-shrink-0">공급망 단계별 이상 이벤트 추이</h3>
                                        <div className="flex-grow overflow-hidden">
                                            <DynamicStageLollipopChart data={stageChartData} />
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-b from-[rgba(111,131,175)] to-[#8895b2] p-4 rounded-2xl shadow min-h-[240px] flex flex-col flex-grow">
                                        <h3 className="font-noto-400 text-white text-2xl px-3 pb-3 mb-2 flex-shrink-0">요일별 이상 이벤트 추이</h3>
                                        <div className="flex-grow overflow-hidden">
                                            <DynamicTimelineChart data={eventTimelineData} />
                                        </div>
                                    </div>
                                    <div className="bg-[rgba(40,40,40)] p-4 rounded-2xl shadow min-h-[240px] flex flex-col flex-grow">
                                        <h3 className="font-noto-400 text-white text-2xl px-3 pb-3 mb-2 flex-shrink-0">제품별 이상 이벤트 추이</h3>
                                        <div className="flex-grow overflow-hidden">
                                            <DynamicProductChart data={productAnomalyData} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div variants={itemVariants} className="flex flex-col lg:col-span-3 h-full gap-6">
                            <div className="bg-[rgba(40,40,40)] rounded-2xl shadow pl-6 py-6 flex flex-col h-[380px]">
                                <h3 className="font-noto-400 text-white text-2xl mb-4 flex-shrink-0">전체 물류 성과</h3>
                                <div className="flex-grow flex items-center justify-between gap-6 h-full overflow-hidden">
                                    <div className="flex-1 grid grid-cols-1 grid-rows-4 gap-2 h-full">
                                        <div className="flex flex-col justify-center items-center rounded-lg py-2 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 cursor-pointer">
                                            <p className="text-sm text-white/70">판매율</p>
                                            <p className="text-2xl font-bold font-lato text-white mt-1">{kpiData.salesRate}<span className="text-lg">%</span></p>
                                        </div>
                                        <div className="flex flex-col justify-center items-center rounded-lg py-2 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 cursor-pointer">
                                            <p className="text-sm text-white/70">출고율</p>
                                            <p className="text-2xl font-bold font-lato text-white mt-1">{kpiData.dispatchRate}<span className="text-lg">%</span></p>
                                        </div>
                                        <div className="flex flex-col justify-center items-center rounded-lg py-2 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 cursor-pointer">
                                            <p className="text-sm text-white/70">평균 리드타임</p>
                                            <p className="text-2xl font-bold font-lato text-white mt-1">{kpiData.avgLeadTime.toFixed(1)}<span className="text-lg">일</span></p>
                                        </div>
                                        <div className="flex flex-col justify-center items-center rounded-lg py-2 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 cursor-pointer">
                                            <p className="text-sm text-white/70">총 EPC 수</p>
                                            <p className="text-2xl font-bold font-lato text-white mt-1">{formatNumberCompact(kpiData.codeCount)}<span className="text-lg">개</span></p>
                                        </div>
                                    </div>
                                    <div className="w-3/5 h-full flex-shrink-0">
                                        <img
                                            src="/images/car4.png"
                                            alt="미래형 물류 트럭"
                                            className="w-full h-full object-contain rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[rgba(40,40,40)] p-4 rounded-2xl shadow min-h-[380px] flex flex-col flex-grow">
                                <h3 className="font-noto-400 text-white text-2xl px-3 pb-3 mb-2 flex-shrink-0">비지니스 스탭별 재고 분산</h3>
                                <div className="flex-grow overflow-hidden">
                                    <DynamicInventoryChart data={inventoryData} />
                                </div>
                            </div>
                        </motion.div>
                        <motion.div variants={itemVariants} className="lg:col-span-3 h-full">
                            <DashboardMapWidget
                                onWidgetClick={handleWidgetClick}
                            />
                        </motion.div>
                    </div>
                    <motion.div variants={itemVariants}>
                        <h3 className="font-noto-400 text-white text-2xl mb-4 font-vietnam mt-20">Anomaly List</h3>
                        <AnomalyTripTable
                            trips={anomalyTrips}
                            onRowClick={handleRowClick}
                            isLoading={isLoading}
                            itemsPerPage={15}
                        />
                    </motion.div>
                </motion.div>
            </div >
        </div >
    );
}