'use client';

import { useAuth, type User } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
    useCallback,
    ReactNode
} from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

// 필요한 모든 타입과 API 함수들을 import 합니다.
import {
    KpiSummary,
    AnalyzedTrip,
    InventoryDataPoint,
    // UploadFile,
    ByProductResponse,
    AnomalyType,
    LocationNode
} from '@/types/data';
import { FileItem } from '@/types/file';
import { CoverReportData } from "@/types/api";
import {
    getKpiSummary,
    getAnomalies,
    getInventoryDistribution,
    getNodes,
    getTrips,
    getAnomalyCountsByProduct
} from '@/types/data';
import { getCoverReportData, getFiles_client } from '@/api/apiClient';
import {
    mergeAndGenerateTimestamps,
    routeGeometriesAtom,
    loadRouteGeometriesAtom,
    selectedFileIdAtom,
    selectedFactoryNameAtom,
} from '@/stores/mapDataAtoms';
import { getAnomalyName, getAnomalyColor, ALL_ANOMALY_TYPES } from '@/types/colorUtils';
import { StageBarDataPoint } from '../types/chart';

// --- 1. 유틸리티 객체 및 상수 ---
const factoryCodeNameMap: { [key: number]: string } = { 1: '인천공장', 2: '화성공장', 3: '양산공장', 4: '구미공장' };

// --- 2. Context에 담길 값들의 타입을 정의합니다 ---
interface DashboardContextType {
    // 데이터 상태
    coverData: CoverReportData | null;
    kpiData: KpiSummary | null;
    anomalyTrips: AnalyzedTrip[];
    allTripsForMap: AnalyzedTrip[];
    inventoryData: InventoryDataPoint[];
    nodes: LocationNode[];
    productAnomalyData: ByProductResponse;

    // 계산된 차트 데이터
    anomalyChartData: any[];
    stageChartData: StageBarDataPoint[];
    eventTimelineData: any[];

    // 로딩, 필터, 페이지네이션 상태
    isLoading: boolean;
    isFetchingMore: boolean;
    nextCursor: string | null;
    selectedFileId: number | null;
    selectedFactoryName: string | null;
    uploadHistory: FileItem[];
    selectedFileName: string | null;
    isAuthLoading: boolean;
    user: User | null;

    minTime: number;
    maxTime: number;

    // UI 상태
    isHistoryModalOpen: boolean;

    // 계산된 값
    viewProps: { factoryName: string | null };

    // 함수 (액션)
    handleFileSelect: (fileId: number) => void;
    handleLoadMore: () => Promise<void>;
    clearFilters: () => void;
    openHistoryModal: () => Promise<void>;
    closeHistoryModal: () => void;
}

// --- 3. Context 생성 ---
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// --- 4. Provider 컴포넌트 생성 ---
export const DashboardProvider = ({ children }: { children: ReactNode }) => {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // --- 데이터 상태 ---
    const [coverData, setCoverData] = useState<CoverReportData | null>(null);
    const [kpiData, setKpiData] = useState<KpiSummary | null>(null);
    const [anomalyTrips, setAnomalyTrips] = useState<AnalyzedTrip[]>([]);
    const [allTripsForMap, setAllTripsForMap] = useState<AnalyzedTrip[]>([]);
    const [inventoryData, setInventoryData] = useState<InventoryDataPoint[]>([]);
    const [nodes, setNodes] = useState<LocationNode[]>([]);
    const [productAnomalyData, setProductAnomalyData] = useState<ByProductResponse>([]);
    const [uploadHistory, setUploadHistory] = useState<FileItem[]>([]);

    // --- 로딩 및 필터 상태 ---
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // --- Jotai 상태 ---
    const [selectedFileId, setSelectedFileId] = useAtom(selectedFileIdAtom);
    const [selectedFactoryName, setSelectedFactoryName] = useAtom(selectedFactoryNameAtom);
    const routeGeometries = useAtomValue(routeGeometriesAtom);
    const loadGeometries = useSetAtom(loadRouteGeometriesAtom);

    // --- Computed Values ---
    const viewProps = useMemo(() => {
        return { factoryName: selectedFactoryName };
    }, [selectedFactoryName]);

    const selectedFileName = useMemo(() => {
        if (!selectedFileId) return null;
        return uploadHistory.find(file => file.fileId === selectedFileId)?.fileName || `File ID: ${selectedFileId}`;
    }, [selectedFileId, uploadHistory]);

    const { minTime, maxTime } = useMemo(() => {
        if (!allTripsForMap || allTripsForMap.length === 0) {
            return { minTime: 0, maxTime: 1 };
        }

        const validTimestamps = allTripsForMap.flatMap(trip => [
            trip.from.eventTime,
            trip.to.eventTime
        ]).filter((t): t is number => typeof t === 'number');

        if (validTimestamps.length === 0) {
            return { minTime: 0, maxTime: 1 };
        }

        return {
            minTime: Math.min(...validTimestamps),
            maxTime: Math.max(...validTimestamps),
        };
    }, [allTripsForMap]);

    // --- RouteGeometries 로딩 ---
    useEffect(() => {
        if (!routeGeometries) {
            loadGeometries();
        }
    }, [routeGeometries, loadGeometries]);

    // --- 데이터 로딩 로직 ---
    useEffect(() => {
        // 초기화 완료, 사용자 정보, 라우트 지오메트리가 모두 준비되어야 함
        if (!user || !routeGeometries) {
            return;
        }

        // selectedFileId가 유효한 숫자일 때만 데이터 로드
        if (typeof selectedFileId === 'number') {
            const loadData = async () => {
                setIsLoading(true);
                const params = { fileId: selectedFileId };

                try {
                    const apiCalls: Promise<any>[] = [
                        getCoverReportData({ fileId: params.fileId }),
                        getKpiSummary(params),
                        getInventoryDistribution(params),
                        getNodes(),
                        getAnomalies({ ...params, limit: 50 }),
                        getTrips({ ...params, limit: 50 }),
                        getAnomalyCountsByProduct(params),
                    ];

                    const [
                        coverRes,
                        kpiRes,
                        inventoryRes,
                        nodesRes,
                        anomaliesRes,
                        allTripsRes,
                        productAnomalyRes
                    ] = await Promise.all(apiCalls);

                    setCoverData(coverRes);
                    setKpiData(kpiRes);
                    setInventoryData(inventoryRes.inventoryDistribution);
                    setNodes(nodesRes);
                    setAnomalyTrips(mergeAndGenerateTimestamps(anomaliesRes.data, routeGeometries));
                    setNextCursor(anomaliesRes.nextCursor);
                    setAllTripsForMap(mergeAndGenerateTimestamps(allTripsRes.data, routeGeometries));
                    setProductAnomalyData(productAnomalyRes);

                    console.log('데이터 로딩 완료:', params);
                } catch (error) {
                    console.error("데이터 로딩 실패:", error);
                    // 에러 시 상태 초기화
                    setCoverData(null);
                    setKpiData(null);
                    setAnomalyTrips([]);
                    setAllTripsForMap([]);
                    setInventoryData([]);
                    setProductAnomalyData([]);
                    setNodes([]);
                    setNextCursor(null);
                } finally {
                    setIsLoading(false);
                }
            };

            loadData();
        } else {
            // selectedFileId가 없으면 상태 초기화
            if (!searchParams.get('fileId')) {
                setIsLoading(false);
                setCoverData(null);
                setKpiData(null);
                setAnomalyTrips([]);
                setAllTripsForMap([]);
                setInventoryData([]);
                setProductAnomalyData([]);
                setNodes([]);
                setNextCursor(null);
            }
        }
    }, [user, selectedFileId, routeGeometries]);

    // --- 차트 데이터 계산 ---
    const { anomalyChartData, stageChartData, eventTimelineData } = useMemo(() => {
        if (isLoading || !nodes.length || !anomalyTrips.length) {
            return { anomalyChartData: [], stageChartData: [], eventTimelineData: [] };
        }

        // 1. 이상 탐지 유형별 건수 계산
        const countsByType = anomalyTrips.reduce((acc, trip) => {
            trip.anomalyTypeList?.forEach(code => { acc[code] = (acc[code] || 0) + 1; });
            return acc;
        }, {} as Record<AnomalyType, number>);

        const newAnomalyChartData = ALL_ANOMALY_TYPES.map(type => {
            const count = countsByType[type] || 0;
            return {
                type: type,
                name: getAnomalyName(type),
                count: count,
                color1: `rgb(${getAnomalyColor(type).join(', ')})`,
                color2: `rgb(${getAnomalyColor(type).join(', ')})`,
            };
        });

        // 2. 공급망 단계별 이상 건수 계산
        const STAGES = [
            { from: 'Factory', to: 'WMS', name: '공장 → 창고' },
            { from: 'WMS', to: 'LogiHub', name: '창고 → 물류' },
            { from: 'LogiHub', to: 'Wholesaler', name: '물류 → 도매' },
            { from: 'Wholesaler', to: 'Reseller', name: '도매 → 소매' },
            { from: 'Reseller', to: 'POS', name: '소매 → 판매' },
        ];

        const newStageChartData = STAGES.map(stage => {
            const stageAnomaliesCount = anomalyTrips.filter(trip =>
                trip.from?.businessStep === stage.from && trip.to?.businessStep === stage.to
            ).length;

            return {
                name: stage.name,
                count: stageAnomaliesCount
            };
        });

        // 3. 요일별 이상 발생 추이 계산
        const dayOfWeekData = [
            { day: '월', count: 0 }, { day: '화', count: 0 }, { day: '수', count: 0 },
            { day: '목', count: 0 }, { day: '금', count: 0 }, { day: '토', count: 0 },
            { day: '일', count: 0 },
        ];
        const dayIndexMap = [6, 0, 1, 2, 3, 4, 5];

        anomalyTrips.forEach(trip => {
            if (!trip.from || typeof trip.from.eventTime !== 'number') return;

            const startTime = new Date(trip.from.eventTime * 1000);
            const dayOfWeek = startTime.getDay();
            const targetIndex = dayIndexMap[dayOfWeek];

            if (targetIndex !== undefined) {
                dayOfWeekData[targetIndex].count++;
            }
        });

        const newEventTimelineData = dayOfWeekData.map(data => ({
            time: data.day,
            count: data.count
        }));

        return {
            anomalyChartData: newAnomalyChartData,
            stageChartData: newStageChartData,
            eventTimelineData: newEventTimelineData
        };
    }, [anomalyTrips, nodes, isLoading]);

    // --- 콜백 함수들 ---
    const handleLoadMore = useCallback(async () => {
        if (!nextCursor || isFetchingMore || !selectedFileId) return;

        setIsFetchingMore(true);

        const params = {
            cursor: nextCursor,
            limit: 50,
            fileId: selectedFileId,
        };

        try {
            const response = await getAnomalies(params);

            if (response.data && response.data.length > 0) {
                const newMergedTrips = mergeAndGenerateTimestamps(response.data, routeGeometries);
                setAnomalyTrips(prevTrips => [...prevTrips, ...newMergedTrips]);
                setNextCursor(response.nextCursor);
            } else {
                setNextCursor(null);
            }
        } catch (error) {
            console.error("추가 데이터 로딩 실패:", error);
        } finally {
            setIsFetchingMore(false);
        }
    }, [nextCursor, isFetchingMore, selectedFileId, routeGeometries]);

    const clearFilters = useCallback(() => {
        setSelectedFileId(null);
    }, [setSelectedFileId]);

    const closeHistoryModal = useCallback(() => setIsHistoryModalOpen(false), []);

    const openHistoryModal = useCallback(async () => {
        try {
            const fullHistoryData = await getFiles_client();
            const recentHistory = fullHistoryData.slice(0, 5);

            setUploadHistory(recentHistory);
            setIsHistoryModalOpen(true);
        } catch (error) {
            alert('업로드 내역을 불러오는데 실패했습니다.');
        }
    }, []);

    const handleFileSelect = useCallback((fileId: number) => {
        if (!user) {
            alert("로그인 정보가 필요합니다.");
            return;
        }

        const role = user.role.toUpperCase() === 'ADMIN' ? 'supervisor' : 'admin';
        router.push(`/${role}/report?fileId=${fileId}`);
    }, [router, user]);

    // --- Context 값 ---
    const value: DashboardContextType = {
        user, isAuthLoading, coverData,
        kpiData, anomalyTrips, allTripsForMap, inventoryData, nodes, productAnomalyData,
        anomalyChartData, stageChartData, eventTimelineData,
        isLoading, isFetchingMore, nextCursor, selectedFileId, selectedFactoryName, uploadHistory, selectedFileName,
        isHistoryModalOpen,
        viewProps, minTime, maxTime,
        handleFileSelect, handleLoadMore, clearFilters, openHistoryModal, closeHistoryModal,
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};