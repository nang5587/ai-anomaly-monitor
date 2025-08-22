'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSetAtom } from 'jotai';
import { activeTabAtom } from '@/stores/mapDataAtoms';
import { motion } from 'framer-motion';

import { useDashboard } from '@/context/dashboardContext';
import { AnomalyTripTable } from '@/components/visual/AnomalyTripTable';
import GaugeChart from '@/components/dashboard/GaugeChart';
import UploadHistoryModal from '@/components/dashboard/UploadHistoryModal';
import { MergeTrip } from '@/context/MapDataContext';

// -- 위젯들을 감싸는 공용 컴포넌트 (코드 재사용성 향상) --
const DashboardWidget = ({ title, children, className }: { title: string, children: React.ReactNode, className?: string }) => (
    <div className={`bg-[rgba(45,45,45)] rounded-2xl p-4 flex flex-col ${className}`}>
        <h3 className="text-white font-noto-500 mb-2 text-center">{title}</h3>
        <div className="flex-grow flex items-center justify-center w-full h-full">
            {children}
        </div>
    </div>
);

// -- 오른쪽 KPI 알약들을 위한 컴포넌트 --
const KpiPill = ({ label, value }: { label: string, value: string | number }) => (
    <div className="bg-[rgba(45,45,45)] rounded-full text-center py-3 px-6">
        <p className="text-white text-lg font-noto-500">{label}</p>
        <p className="text-gray-300 text-sm">{value}</p>
    </div>
);


export default function SupervisorDashboard() {
    const router = useRouter();
    const setActiveTab = useSetAtom(activeTabAtom);

    const {
        kpiData,
        anomalyTrips,
        isLoading,
        user,
        selectedFileName,
        selectedFileId,
        isHistoryModalOpen,
        uploadHistory,
        handleFileSelect,
        handleLoadMore,
        openHistoryModal,
        closeHistoryModal,
    } = useDashboard();

    // -- 로딩 및 인증 상태 처리는 기존과 동일 --
    if (isLoading && !kpiData) return <div className="h-screen bg-black flex items-center justify-center text-white"><p>대시보드 데이터를 불러오는 중입니다...</p></div>;
    if (!user) return <div className="h-screen bg-black flex items-center justify-center text-white"><p>접근 권한이 없습니다.</p></div>;
    if (!kpiData) return <div className="h-screen bg-black flex items-center justify-center text-white"><p>분석할 파일을 선택해주세요.</p></div>;

    // --- 새로운 레이아웃을 위한 데이터 계산 ---
    const totalEvents = 1000000;
    const anomalyEvents = kpiData.anomalyCount;
    const anomalyPercentage = (anomalyEvents / totalEvents) * 100;

    return (
        <div className="bg-black text-white w-full h-full p-6 font-noto-400 overflow-y-auto">
            <UploadHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={closeHistoryModal}
                files={uploadHistory}
                onFileSelect={handleFileSelect}
            />

            {/* 1. 최상단 정보 바 */}
            <header className="bg-[rgba(45,45,45)] w-full p-3 rounded-t-2xl flex justify-between items-center text-lg">
                <p>2025.08.23. 오후 8:00</p>
                <p>File: {selectedFileName || '선택된 파일 없음'}</p>
            </header>

            {/* 2. 메인 대시보드 그리드 */}
            <main className="grid grid-cols-12 grid-rows-3 gap-6 h-[75vh]">

                {/* 왼쪽 게이지 차트 섹션 (3컬럼, 3로우 차지) */}
                <div className="col-span-3 row-span-3 bg-[rgba(30,30,30)] rounded-2xl flex flex-col items-center justify-around p-4">
                    <h2 className="text-xl font-noto-500">방금 만든 반원 차트 들어갈 곳</h2>
                    <div className="relative">
                        <GaugeChart
                            progress={anomalyPercentage}
                            size={280} // 크기 조절
                            strokeWidth={30}
                            segments={30}
                            gradientFrom="#3b82f6" // 파란색 계열로 변경
                            gradientTo="#60a5fa"
                        />
                        <p className="absolute bottom-[25%] right-0 text-blue-400 font-bold text-lg">
                            {anomalyPercentage.toFixed(1)}%
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-400 text-lg">총 이상탐지 이벤트</p>
                        <p className="text-white text-6xl font-bold my-1">{anomalyEvents}</p>
                        <p className="text-gray-600">/ {totalEvents.toLocaleString()}</p>
                    </div>
                </div>

                {/* 중앙 그리드 아이템들 */}
                <div className="col-span-6 row-span-2 rounded-2xl bg-[rgba(91,111,155,0.7)] flex items-center justify-center">
                    <p className="text-2xl">만들 예정...</p>
                </div>

                <div className="col-span-2 row-span-2">
                    <DashboardWidget title="지도 위젯">
                        {/* 여기에 지도 관련 컴포넌트나 이미지를 넣을 수 있습니다. */}
                        <p className="text-gray-400">지도 위젯</p>
                    </DashboardWidget>
                </div>

                <div className="col-span-2">
                    <DashboardWidget title="요일별 추이">
                        <p className="text-gray-400">차트</p>
                    </DashboardWidget>
                </div>

                <div className="col-span-2 bg-[rgba(91,111,155,0.7)] rounded-2xl flex items-center justify-center">
                    <p className="text-white">제품별 추이</p>
                </div>

                <div className="col-span-2">
                    <DashboardWidget title="공급별 추이">
                        <p className="text-gray-400">차트</p>
                    </DashboardWidget>
                </div>

                <div className="col-span-2">
                    <DashboardWidget title="재고분산">
                        <p className="text-gray-400">차트</p>
                    </DashboardWidget>
                </div>

                {/* 오른쪽 KPI 알약 섹션 (1컬럼, 3로우 차지) */}
                <div className="col-span-1 row-span-3 flex flex-col justify-around">
                    <KpiPill label="판매율" value={`${kpiData.salesRate.toFixed(1)}%`} />
                    <KpiPill label="출고율" value={`${kpiData.dispatchRate.toFixed(1)}%`} />
                    <KpiPill label="리드타임" value="미정" />
                    <KpiPill label="EPC 수" value="미정" />
                    <KpiPill label="제품 수" value="미정" />
                </div>
            </main>

            {/* 3. 하단 AI 분석 결과 리스트 */}
            <footer className="mt-6">
                <h2 className="text-xl text-gray-400 mb-4">AI 분석 결과 리스트 (스크롤해서 내려야 보일듯)</h2>
                <div className="bg-[rgba(30,30,30)] p-4 rounded-2xl">
                    <AnomalyTripTable
                        trips={anomalyTrips}
                        onRowClick={() => { }} // 행 클릭 이벤트 핸들러 연결 필요
                        isLoading={isLoading}
                        itemsPerPage={10}
                    />
                </div>
            </footer>
        </div>
    );
}