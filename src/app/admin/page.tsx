'use client';

import { useAuth } from '@/context/AuthContext'; // ℹ️ 백이랑 연결 시 주석 풀기
import { useRouter, useSearchParams } from 'next/navigation';
import { useAtom } from 'jotai';

import { selectedFileIdAtom, selectedFactoryNameAtom } from '@/stores/mapDataAtoms';
import { getFiles_client } from '@/api/apiClient';
import { FileItem } from '@/types/file';

import { useState, useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { activeTabAtom } from '@/stores/mapDataAtoms';

import { motion, type Variants } from 'framer-motion';

import { type Tab } from '@/components/visual/SupplyChainDashboard';

import { useDashboard } from '@/context/dashboardContext';

import StatCard from '@/components/dashboard/StatCard';
import AnomalyList from '@/components/dashboard/AnomalyList';
import { DashboardMapWidget } from '../../components/dashboard/widget/DashboardMapWidget';
import FactoryDetailView from '@/components/dashboard/FactoryDetailView';
import UploadHistoryModal from '@/components/dashboard/UploadHistoryModal';
import dynamic from 'next/dynamic';

const factoryCodeNameMap: { [key: number]: string } = { 1: '인천공장', 2: '화성공장', 3: '양산공장', 4: '구미공장' };

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
    AlertTriangle,
    TrendingUp,
    Truck,
    Package,
    Upload,
    Download,
    MapPin,
    History,
    FileText,
    X,
    Repeat,
} from "lucide-react";

type User = {
    role: 'ADMIN' | 'MANAGER';
    locationId: number;
}

const MOCK_USER_ADMIN: User = { role: 'ADMIN', locationId: 0 };
const MOCK_USER_MANAGER: User = { role: 'MANAGER', locationId: 1 };

export default function AdminDashboard() {
    const router = useRouter();
    const setActiveTab = useSetAtom(activeTabAtom);
    const searchParams = useSearchParams();
    const [selectedFileId, setSelectedFileId] = useAtom(selectedFileIdAtom);
    const [, setSelectedFactoryName] = useAtom(selectedFactoryNameAtom);

    const {
        kpiData,
        anomalyTrips,
        allTripsForMap,
        inventoryData,
        nodes,
        productAnomalyData,
        anomalyChartData,
        stageChartData,
        eventTimelineData,
        isAuthLoading,
        isLoading,
        user,
        isFetchingMore,
        nextCursor,
        selectedFileName,
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

    // useEffect(() => {
    //     if (!isAuthLoading && !user) {
    //         router.push('/login');
    //     }
    // }, [user, isAuthLoading, router]);

    useEffect(() => {
        if (!user) return; // 사용자 정보가 로드될 때까지 대기

        const fileIdFromUrl = searchParams.get('fileId');
        const role = user.role.toUpperCase() === 'ADMIN' ? 'supervisor' : 'admin';

        // 시나리오 1: URL에 fileId가 있는 경우
        if (fileIdFromUrl) {
            const fileIdNum = Number(fileIdFromUrl);
            if (selectedFileId !== fileIdNum) {
                setSelectedFileId(fileIdNum);
                getFiles_client().then(history => {
                    const file = history.find(f => f.fileId === fileIdNum);
                    if (file?.locationId) {
                        setSelectedFactoryName(factoryCodeNameMap[file.locationId] || '정보 없음');
                    }
                });
            }
            return;
        }

        // 시나리오 2: URL에 fileId가 없는 경우 (최초 접속 등)
        const initializeAndRedirect = async () => {
            try {
                const history: FileItem[] = await getFiles_client();
                if (history.length > 0) {
                    const latestFile = history[0];
                    // 현재 페이지의 URL만 교체 (예: /supervisor -> /supervisor?fileId=123)
                    router.replace(`/${role}?fileId=${latestFile.fileId}`);
                } else {
                    router.replace(`/upload`);
                }
            } catch (error) {
                console.error("초기 파일 목록 로딩 실패:", error);
            }
        };

        initializeAndRedirect();
    }, [user, searchParams, selectedFileId, setSelectedFileId, setSelectedFactoryName, router]);


    //⚠️ 백엔드 연결 시 삭제
    // const user = MOCK_USER_ADMIN;
    // const user = MOCK_USER_MANAGER; // 이건 매니저 테스트

    const [replayTrigger, setReplayTrigger] = useState(0);

    // 제품별 or 요일별
    const [isShowingProductChart, setIsShowingProductChart] = useState(true);

    const handleWidgetClick = (tab: Tab) => {
        setActiveTab(tab);
        router.push('/graph');
    };

    const handleFileUpload = async () => {
        router.push('/upload');
    };

    const handleDownloadReport = () => {
        if (!selectedFileId) {
            alert("보고서를 생성할 파일을 먼저 선택해주세요.");
            return;
        }
        router.push(`/admin/report?fileId=${selectedFileId}`);
    };

    const handleChartToggle = () => {
        setIsShowingProductChart(prevState => !prevState);
    };

    const handleReplayAnimation = () => {
        setReplayTrigger(prev => prev + 1);
    };

    if (isAuthLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
                <p>사용자 인증 정보를 확인 중입니다...</p>
            </div>
        );
    }

    // 2. 인증 로딩은 끝났지만, 로그인이 안 되어 있거나 권한이 없는 경우
    // (Context에서 리다이렉션하지만, 안전장치로 남겨둠)
    if (!user) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
                <p>접근 권한이 없습니다. 로그인 페이지로 이동합니다.</p>
            </div>
        );
    }

    // 3. 데이터 로딩 중 (kpiData가 아직 없는 초기 로딩 상태)
    if (isLoading && !kpiData) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
                <p className="text-xl">대시보드 데이터를 불러오는 중입니다...</p>
            </div>
        );
    }

    // 4. 로딩이 끝났는데도 kpiData가 없는 경우 (API 호출 실패)
    if (!kpiData) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
                <p className="text-xl">데이터를 불러오는 데 실패했습니다. 네트워크 연결을 확인하거나 관리자에게 문의하세요.</p>
            </div>
        );
    }

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


    return (
        <div className="h-screen grid grid-rows-[auto_1fr] bg-black overflow-y-auto hide-scrollbar">
            <UploadHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={closeHistoryModal}
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
                    <motion.h2 variants={itemVariants} className="font-vietnam text-white text-[50px] whitespace-nowrap">Admin<br />DashBoard</motion.h2>
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
                            </div>
                        ) : (
                            <></>
                        )}
                    </div>
                    <div className="flex items-center gap-4 pr-4">
                        <button onClick={openHistoryModal} className="cursor-pointer w-14 h-14 flex items-center justify-center hover:bg-[rgba(30,30,30)] text-white border border-gray-400 rounded-full"
                            title='최근 csv 업로드 목록'
                        >
                            <History size={22} />
                        </button>
                        <button onClick={handleDownloadReport} className="cursor-pointer py-4 flex items-center gap-2 hover:bg-[rgba(30,30,30)] text-white border border-gray-400 px-6 rounded-[50px]" title='보고서 다운로드'><Download size={18} />Download Report</button>
                        <button onClick={handleFileUpload} className="cursor-pointer flex items-center gap-2 bg-[rgba(111,131,175,1)] hover:bg-[rgba(91,111,155,1)] text-white py-4 px-6 rounded-[50px]" title='csv 업로드'><Upload size={18} />Upload CSV</button>
                    </div>
                </motion.div>
            </motion.div>

            <div className="px-8 pb-[20px]">
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
                                factoryName={viewProps.factoryName} // 탭 대신 단일 공장 이름 전달
                                kpiData={kpiData}
                            />
                        </motion.div>

                        {/* 2열: 중앙 분석 패널 */}
                        <motion.div variants={itemVariants} className="lg:col-span-6 h-full flex flex-col">
                            <div className="grid grid-cols-2 gap-6 h-full">

                                {/* --- 왼쪽 열 --- */}
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
                                        <div className="flex justify-between items-center px-3 pb-3 mb-2 flex-shrink-0">
                                            <h3 className="font-noto-400 text-white text-xl">
                                                {isShowingProductChart ? '제품별 이상 발생 추이' : '요일별 이상 발생 추이'}
                                            </h3>
                                            <button
                                                onClick={handleChartToggle}
                                                className="p-2 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                                                title="차트 전환"
                                            >
                                                <Repeat size={20} />
                                            </button>
                                        </div>
                                        <div className="flex-grow overflow-hidden">
                                            {isShowingProductChart ? (
                                                <DynamicProductChart data={productAnomalyData} />
                                            ) : (
                                                <DynamicTimelineChart data={eventTimelineData} />
                                            )}
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
                            <DashboardMapWidget
                                nodes={nodes}
                                anomalyTrips={anomalyTrips} // 히트맵용 데이터 전달
                                allTripsForMap={allTripsForMap} // 경로 지도용 데이터 전달
                                minTime={minTime}
                                maxTime={maxTime}
                                replayTrigger={replayTrigger}
                                onWidgetClick={handleWidgetClick} // 확대 버튼 핸들러
                                onReplayClick={handleReplayAnimation} // 다시보기 버튼 핸들러
                            />
                        </motion.div>
                    </div>

                    {/* 하단 리스트 */}
                    <motion.div variants={itemVariants}>
                        <h3 className="font-noto-400 text-white text-2xl mb-4">이상 탐지 리스트</h3>
                        <div className="font-vietnam mb-20">
                            <AnomalyList anomalies={anomalyTrips} />
                            {nextCursor && anomalyTrips.length > 0 && (
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
            </div >
        </div >
    );
}