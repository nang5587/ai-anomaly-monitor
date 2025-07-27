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
import { useAtomValue, useSetAtom } from 'jotai';

// 필요한 모든 타입과 API 함수들을 import 합니다.
import {
    KpiSummary,
    AnalyzedTrip,
    InventoryDataPoint,
    UploadFile,
    ByProductResponse,
    AnomalyType,
    LocationNode
} from '@/types/data';
import { CoverReportData } from "@/types/api";
import {
    getKpiSummary,
    getAnomalies,
    getInventoryDistribution,
    getUploadHistory,
    getNodes,
    getTrips,
    getAnomalyCountsByProduct
} from '@/types/data';
import { getCoverReportData } from '@/api/apiClient';
import {
    mergeAndGenerateTimestamps,
    routeGeometriesAtom,
    loadRouteGeometriesAtom,
} from '@/stores/mapDataAtoms';
import { getAnomalyName, getAnomalyColor, ALL_ANOMALY_TYPES } from '@/types/colorUtils';
import { StageBarDataPoint } from '@/components/dashboard/StageLollipopChart';

// --- 1. 유틸리티 객체 및 상수 ---
const factoryCodeNameMap: { [key: number]: string } = { 1: '인천', 2: '화성', 3: '양산', 4: '구미' };
const factoryNameCodeMap: { [key: string]: number } = { '인천': 1, '화성': 2, '양산': 3, '구미': 4 };

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
    activeFactory: string;
    uploadHistory: UploadFile[];
    selectedFileName: string | null;
    isAuthLoading: boolean;
    user: User | null;

    minTime: number;
    maxTime: number;

    // UI 상태
    isHistoryModalOpen: boolean;

    // 계산된 값
    factoryTabs: string[];
    viewProps: { tabs: string[]; active: string };

    // 함수 (액션)
    handleFileSelect: (fileId: number) => void;
    handleTabClick: (factory: string) => void;
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
    const [uploadHistory, setUploadHistory] = useState<UploadFile[]>([]);

    // --- 로딩 및 필터 상태 ---
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
    const [activeFactory, setActiveFactory] = useState<string>('');
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // --- Jotai 상태 ---
    const routeGeometries = useAtomValue(routeGeometriesAtom);
    const loadGeometries = useSetAtom(loadRouteGeometriesAtom);

    // ⚠️ MOCK_USER는 실제 useAuth() 훅으로 대체해야 합니다.
    // const user = { role: 'ADMIN', locationId: 0 };

    // --- useMemo 훅들 (계산 로직) ---
    const factoryTabs = useMemo(() => {
        if (!user) return [];
        if (user.role.toUpperCase() === 'ADMIN') return ['전체', '화성', '인천', '구미', '양산'];
        if (user.locationId) {
            const myFactoryName = factoryCodeNameMap[user.locationId];
            return myFactoryName ? [myFactoryName] : [];
        }
        return [];
    }, [user]);

    const viewProps = useMemo(() => {
        if (selectedFileId && uploadHistory.length > 0) {
            const selectedFile = uploadHistory.find(file => file.fileId === selectedFileId);
            if (selectedFile && typeof selectedFile.locationId === 'number') {
                const factoryName = factoryCodeNameMap[selectedFile.locationId];
                if (factoryName) return { tabs: [factoryName], active: factoryName };
            }
            return { tabs: ['정보 없음'], active: '정보 없음' };
        }
        return { tabs: factoryTabs, active: activeFactory };
    }, [selectedFileId, uploadHistory, factoryTabs, activeFactory]);

    const selectedFileName = useMemo(() => {
        if (!selectedFileId) return null;
        return uploadHistory.find(file => file.fileId === selectedFileId)?.fileName || `File ID: ${selectedFileId}`;
    }, [selectedFileId, uploadHistory]);

    const { minTime, maxTime } = useMemo(() => {
        // allTripsForMap 상태를 직접 사용합니다.
        if (!allTripsForMap || allTripsForMap.length === 0) {
            return { minTime: 0, maxTime: 1 }; // 기본값
        }

        // timestamp가 유효한 숫자(number)인 경우만 필터링하여 안정성 확보
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

    useEffect(() => {
        // Jotai routeGeometries 로딩 (최초 1회 또는 필요시)
        if (!routeGeometries) {
            loadGeometries();
        }

        const fileIdFromUrl = searchParams.get('fileId');
        const fileIdNum = fileIdFromUrl ? Number(fileIdFromUrl) : null;

        // 1. selectedFileId 상태를 URL과 동기화
        if (selectedFileId !== fileIdNum) {
            setSelectedFileId(fileIdNum);
        }

        // 2. activeFactory 상태를 결정
        if (fileIdNum && uploadHistory.length > 0) {
            // Case A: URL에 fileId가 있으면, 파일의 locationId를 기반으로 factory 설정
            const selectedFile = uploadHistory.find(file => file.fileId === fileIdNum);

            if (selectedFile && typeof selectedFile.locationId === 'number') {
                const factoryName = factoryCodeNameMap[selectedFile.locationId];
                if (factoryName) {
                    setActiveFactory(factoryName);
                } else {
                    setActiveFactory('전체'); // 매핑되는 공장이 없는 경우
                }
            } else {
                setActiveFactory('전체'); // 파일에 locationId가 없는 경우
            }
        } else {
            // Case B: URL에 fileId가 없으면, 사용자 역할 기반으로 기본 factory 설정
            if (user) {
                if (user.role.toUpperCase() === 'MANAGER' && factoryTabs.length > 0) {
                    setActiveFactory(factoryTabs[0]);
                } else if (user.role.toUpperCase() === 'ADMIN') {
                    setActiveFactory('전체');
                }
            }
        }
    }, [
        searchParams,
        user,
        factoryTabs,
        uploadHistory,
        routeGeometries,
        loadGeometries,
        selectedFileId // selectedFileId 비교를 위해 포함
    ]);

    // 메인 데이터 로딩 useEffect는 그대로 유지 (이제 위 훅 덕분에 올바른 필터값으로 실행됨)
    useEffect(() => {
        if (!user || !activeFactory || !routeGeometries) {
            return;
        }

        const loadData = async () => {
            setIsLoading(true);
            const params: Record<string, any> = {};
            if (selectedFileId) {
                params.fileId = selectedFileId;
            } else {
                const factoryId = factoryNameCodeMap[activeFactory];
                if (user.role.toUpperCase() === 'ADMIN' && factoryId) params.locationId = factoryId;
            }

            try {
                const apiCalls: Promise<any>[] = [
                    getKpiSummary(params),
                    getInventoryDistribution(params),
                    getNodes(),
                    getAnomalies({ ...params, limit: 50 }),
                    getTrips({ ...params, limit: 50 }),
                    getAnomalyCountsByProduct(params),
                ];
                if (params.fileId && typeof params.fileId === 'number') {
                    apiCalls.unshift(getCoverReportData({ fileId: params.fileId }));
                } else {
                    apiCalls.unshift(Promise.resolve(null));
                }

                const [coverRes, kpiRes, inventoryRes, nodesRes, anomaliesRes, allTripsRes, productAnomalyRes] = await Promise.all(apiCalls);
                setCoverData(coverRes);
                setKpiData(kpiRes);
                setInventoryData(inventoryRes.inventoryDistribution);
                setNodes(nodesRes);
                setAnomalyTrips(mergeAndGenerateTimestamps(anomaliesRes.data, routeGeometries));
                setNextCursor(anomaliesRes.nextCursor);
                setAllTripsForMap(mergeAndGenerateTimestamps(allTripsRes.data, routeGeometries));
                setProductAnomalyData(productAnomalyRes);
            } catch (error) {
                console.error("데이터 로딩 실패:", error);
                setKpiData(null); setCoverData(null); setAnomalyTrips([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user, activeFactory, selectedFileId, routeGeometries]);

    // --- 차트 데이터 계산 useEffect ---
    const { anomalyChartData, stageChartData, eventTimelineData } = useMemo(() => {
        // 데이터가 준비되지 않았으면 빈 배열들을 반환
        if (isLoading || !nodes.length || !anomalyTrips.length) {
            return { anomalyChartData: [], stageChartData: [], eventTimelineData: [] };
        }

        // --- 1. 이상 탐지 유형별 건수 계산 (AnomalyChart) ---
        const countsByType = anomalyTrips.reduce((acc, trip) => {
            trip.anomalyTypeList?.forEach(code => { acc[code] = (acc[code] || 0) + 1; });
            return acc;
        }, {} as Record<AnomalyType, number>);

        const newAnomalyChartData = ALL_ANOMALY_TYPES.map(type => {
            const count = countsByType[type] || 0; // 데이터에 없으면 0으로 처리
            return {
                type: type,
                name: getAnomalyName(type), // '변조', '복제' 등 한글 이름
                count: count,
                color1: `rgb(${getAnomalyColor(type).join(', ')})`,
                color2: `rgb(${getAnomalyColor(type).join(', ')})`,
            };
        });

        // 분석할 공급망 단계 정의
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
                stageName: stage.name,
                count: stageAnomaliesCount
            };
        });


        // --- 3. 요일별 이상 발생 추이 계산 (AnomalyTimelineChart) ---
        const dayOfWeekData = [
            { day: '월', count: 0 }, { day: '화', count: 0 }, { day: '수', count: 0 },
            { day: '목', count: 0 }, { day: '금', count: 0 }, { day: '토', count: 0 },
            { day: '일', count: 0 },
        ];
        // getDay() 반환값 (0=일 ~ 6=토)을 dayOfWeekData 인덱스 (0=월 ~ 6=일)로 매핑
        const dayIndexMap = [6, 0, 1, 2, 3, 4, 5];

        anomalyTrips.forEach(trip => {
            // from.eventTime이 유효한 숫자인지 확인
            if (!trip.from || typeof trip.from.eventTime !== 'number') return;

            const startTime = new Date(trip.from.eventTime * 1000); // Unix timestamp는 ms로 변환
            const dayOfWeek = startTime.getDay();
            const targetIndex = dayIndexMap[dayOfWeek];

            if (targetIndex !== undefined) {
                dayOfWeekData[targetIndex].count++;
            }
        });

        // 차트 컴포넌트가 기대하는 { time, count } 형태로 최종 변환
        const newEventTimelineData = dayOfWeekData.map(data => ({
            time: data.day,
            count: data.count
        }));

        // 최종적으로 계산된 모든 차트 데이터를 반환
        return {
            anomalyChartData: newAnomalyChartData,
            stageChartData: newStageChartData,
            eventTimelineData: newEventTimelineData
        };

    }, [anomalyTrips, nodes, isLoading]);

    const handleLoadMore = useCallback(async () => {
        if (!nextCursor || isFetchingMore) return;
        setIsFetchingMore(true);

        const params: Record<string, any> = {
            cursor: nextCursor, // 다음 페이지를 위한 cursor 추가
            limit: 50, // 추가로 가져올 데이터 수
        };

        if (user) {
            const factoryId = factoryNameCodeMap[activeFactory];
            if (user.role.toUpperCase() === 'ADMIN' && factoryId) {
                params.locationId = factoryId;
            }
        }

        if (selectedFileId) {
            params.fileId = selectedFileId;
        }

        try {
            console.log('--- 추가 데이터 로딩 파라미터 ---', params);
            const response = await getAnomalies(params);
            const newMergedTrips = mergeAndGenerateTimestamps(response.data, routeGeometries);

            // 기존 anomalyTrips 배열에 새로 받아온 데이터(newMergedTrips)를 추가합니다.
            setAnomalyTrips(prevTrips => [...prevTrips, ...newMergedTrips]);

            // 다음 페이지를 위한 nextCursor 값을 업데이트합니다.
            setNextCursor(response.nextCursor);

        } catch (error) {
            console.error("추가 데이터 로딩 실패:", error);
        } finally {
            setIsFetchingMore(false);
        }
    }, [nextCursor, isFetchingMore, user, activeFactory, selectedFileId, routeGeometries]);
    const handleTabClick = useCallback((factory: string) => { setSelectedFileId(null); setActiveFactory(factory); }, []);
    const clearFilters = useCallback(() => { setSelectedFileId(null); setActiveFactory('전체'); }, []);
    const closeHistoryModal = useCallback(() => setIsHistoryModalOpen(false), []);

    const openHistoryModal = useCallback(async () => {
        try {
            const historyData = await getUploadHistory();
            setUploadHistory(historyData);
            setIsHistoryModalOpen(true);
        } catch (error) { alert('업로드 내역을 불러오는데 실패했습니다.'); }
    }, []);

    const handleFileSelect = useCallback((fileId: number) => {
        if (!user) {
            alert("로그인 정보가 필요합니다.");
            return;
        }
        let role = '';
        if (user.role.toUpperCase() === 'ADMIN') {
            role = 'supervisor';
        } else if (user.role.toUpperCase() === 'MANAGER') {
            role = 'admin';
        }
        router.push(`/${role}/report?fileId=${fileId}`);
    }, [router]);


    // --- 5. Context에 전달할 최종 값 객체 ---
    const value: DashboardContextType = {
        user, isAuthLoading, coverData,
        kpiData, anomalyTrips, allTripsForMap, inventoryData, nodes, productAnomalyData,
        anomalyChartData, stageChartData, eventTimelineData,
        isLoading, isFetchingMore, nextCursor, selectedFileId, activeFactory, uploadHistory, selectedFileName,
        isHistoryModalOpen,
        factoryTabs, viewProps, minTime, maxTime,
        handleFileSelect, handleTabClick, handleLoadMore, clearFilters, openHistoryModal, closeHistoryModal,
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};

// --- 6. 커스텀 훅 ---
export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};