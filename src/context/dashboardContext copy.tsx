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
import { selectedFileIdAtom } from '@/stores/mapDataAtoms';

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
import { StageBarDataPoint } from '../types/chart';

const factoryCodeNameMap: { [key: number]: string } = { 1: '인천', 2: '화성', 3: '양산', 4: '구미' };
const factoryNameCodeMap: { [key: string]: number } = { '인천': 1, '화성': 2, '양산': 3, '구미': 4 };

interface DashboardContextType {
    coverData: CoverReportData | null;
    kpiData: KpiSummary | null;
    anomalyTrips: AnalyzedTrip[];
    allTripsForMap: AnalyzedTrip[];
    inventoryData: InventoryDataPoint[];
    nodes: LocationNode[];
    productAnomalyData: ByProductResponse;
    anomalyChartData: any[];
    stageChartData: StageBarDataPoint[];
    eventTimelineData: any[];
    isLoading: boolean;
    isFetchingMore: boolean;
    nextCursor: string | null;
    selectedFileId: number | null;
    selectedFactoryName: string | null;
    uploadHistory: UploadFile[];
    selectedFileName: string | null;
    isAuthLoading: boolean;
    user: User | null;
    minTime: number;
    maxTime: number;
    isHistoryModalOpen: boolean;
    viewProps: { factoryName: string | null };
    handleFileSelect: (fileId: number) => void;
    handleLoadMore: () => Promise<void>;
    clearFilters: () => void;
    openHistoryModal: () => Promise<void>;
    closeHistoryModal: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [coverData, setCoverData] = useState<CoverReportData | null>(null);
    const [kpiData, setKpiData] = useState<KpiSummary | null>(null);
    const [anomalyTrips, setAnomalyTrips] = useState<AnalyzedTrip[]>([]);
    const [allTripsForMap, setAllTripsForMap] = useState<AnalyzedTrip[]>([]);
    const [inventoryData, setInventoryData] = useState<InventoryDataPoint[]>([]);
    const [nodes, setNodes] = useState<LocationNode[]>([]);
    const [productAnomalyData, setProductAnomalyData] = useState<ByProductResponse>([]);
    const [uploadHistory, setUploadHistory] = useState<UploadFile[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    const [selectedFileId, setSelectedFileId] = useAtom(selectedFileIdAtom);
    const routeGeometries = useAtomValue(routeGeometriesAtom);
    const loadGeometries = useSetAtom(loadRouteGeometriesAtom);

    const [isInitialized, setIsInitialized] = useState(false);

    const selectedFactoryName = useMemo(() => {
        if (!selectedFileId || uploadHistory.length === 0) return null;
        const selectedFile = uploadHistory.find(file => file.fileId === selectedFileId);
        if (selectedFile?.locationId) {
            return factoryCodeNameMap[selectedFile.locationId] || '정보 없음';
        }
        return '정보 없음';
    }, [selectedFileId, uploadHistory]);

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

    useEffect(() => {
        if (!user || isInitialized) return;
        const initializeDashboard = async () => {
            const fileIdFromUrl = searchParams.get('fileId');
            if (fileIdFromUrl) {
                setSelectedFileId(Number(fileIdFromUrl));
                setIsInitialized(true);
                return;
            }
            if (selectedFileId) {
                setIsInitialized(true);
                return;
            }
            try {
                const history = await getUploadHistory();
                setUploadHistory(history);
                if (history && history.length > 0) {
                    const latestFileId = history[0].fileId;
                    setSelectedFileId(latestFileId);
                    const role = user.role.toUpperCase() === 'ADMIN' ? 'supervisor' : 'admin';
                    router.replace(`/${role}/report?fileId=${latestFileId}`);
                } else {
                    router.replace('/upload');
                }
            } catch (error) {
                console.error("초기 파일 목록 로딩 실패:", error);
            } finally {
                setIsInitialized(true);
            }
        };

        initializeDashboard();
    }, [user, searchParams, isInitialized, selectedFileId, setSelectedFileId, router]);

    useEffect(() => {
        if (!user || !routeGeometries) return;
        if (typeof selectedFileId === 'number') {
            const loadData = async () => {
                setIsLoading(true);
                const params = { fileId: selectedFileId };
                try {
                    if (uploadHistory.length === 0) {
                        const history = await getUploadHistory();
                        setUploadHistory(history);
                    }
                    const apiCalls: Promise<any>[] = [
                        getKpiSummary(params),
                        getInventoryDistribution(params),
                        getNodes(),
                        getAnomalies({ ...params, limit: 50 }),
                        getTrips({ ...params, limit: 50 }),
                        getAnomalyCountsByProduct(params),
                        getCoverReportData({ fileId: params.fileId })
                    ];
                    const [kpiRes, inventoryRes, nodesRes, anomaliesRes, allTripsRes, productAnomalyRes, coverRes] = await Promise.all(apiCalls);
                    setKpiData(kpiRes);
                    setInventoryData(inventoryRes.inventoryDistribution);
                    setNodes(nodesRes);
                    setAnomalyTrips(mergeAndGenerateTimestamps(anomaliesRes.data, routeGeometries));
                    setNextCursor(anomaliesRes.nextCursor);
                    setAllTripsForMap(mergeAndGenerateTimestamps(allTripsRes.data, routeGeometries));
                    setProductAnomalyData(productAnomalyRes);
                    setCoverData(coverRes);
                } catch (error) {
                    console.error("데이터 로딩 실패:", error);
                    setKpiData(null); setCoverData(null); setAnomalyTrips([]);
                } finally {
                    setIsLoading(false);
                }
            };
            loadData();
        } else {
            setKpiData(null);
            setCoverData(null);
            setAnomalyTrips([]);
            setAllTripsForMap([]);
            setInventoryData([]);
            setProductAnomalyData([]);
            setIsLoading(false);
        }
    }, [user, selectedFileId, routeGeometries]);

    useEffect(() => {
        if (!isInitialized || !user || !routeGeometries) {
            return;
        }
        if (typeof selectedFileId === 'number') {
            const loadData = async () => {
                setIsLoading(true);
                const params = { fileId: selectedFileId };
                try {
                    if (uploadHistory.length === 0) {
                        const history = await getUploadHistory();
                        setUploadHistory(history);
                    }
                    const apiCalls: Promise<any>[] = [
                        getKpiSummary(params),
                        getInventoryDistribution(params),
                        getNodes(),
                        getAnomalies({ ...params, limit: 50 }),
                        getTrips({ ...params, limit: 50 }),
                        getAnomalyCountsByProduct(params),
                        getCoverReportData({ fileId: params.fileId })
                    ];
                    const [
                        kpiRes,
                        inventoryRes,
                        nodesRes,
                        anomaliesRes,
                        allTripsRes,
                        productAnomalyRes,
                        coverRes
                    ] = await Promise.all(apiCalls);
                    setKpiData(kpiRes);
                    setInventoryData(inventoryRes.inventoryDistribution);
                    setNodes(nodesRes);
                    setAnomalyTrips(mergeAndGenerateTimestamps(anomaliesRes.data, routeGeometries));
                    setNextCursor(anomaliesRes.nextCursor);
                    setAllTripsForMap(mergeAndGenerateTimestamps(allTripsRes.data, routeGeometries));
                    setProductAnomalyData(productAnomalyRes);
                    setCoverData(coverRes);
                } catch (error) {
                    console.error("데이터 로딩 실패:", error);
                    setKpiData(null);
                    setCoverData(null);
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
            setIsLoading(false);
            setKpiData(null);
            setCoverData(null);
            setAnomalyTrips([]);
            setAllTripsForMap([]);
            setInventoryData([]);
            setProductAnomalyData([]);
            setNodes([]); 
            setNextCursor(null);
        }
    }, [isInitialized, user, selectedFileId, routeGeometries, uploadHistory.length]);

    // useEffect(() => {
    //     // fileId가 선택되지 않았을 때의 기본 activeFactory 설정
    //     if (!selectedFileId) {
    //         if (user) {
    //             if (user.role.toUpperCase() === 'MANAGER' && factoryTabs.length > 0) {
    //                 setActiveFactory(factoryTabs[0]);
    //             } else if (user.role.toUpperCase() === 'ADMIN') {
    //                 setActiveFactory('전체');
    //             }
    //         }
    //     }
    // }, [user, factoryTabs, selectedFileId]);

    // useEffect(() => {
    //     if (!routeGeometries) {
    //         loadGeometries();
    //     }

    //     const fileIdFromUrl = searchParams.get('fileId');
    //     const fileIdNum = fileIdFromUrl ? Number(fileIdFromUrl) : null;

    //     // 1. selectedFileId 상태를 URL과 동기화
    //     if (selectedFileId !== fileIdNum) {
    //         setSelectedFileId(fileIdNum);
    //     }

    //     // 2. activeFactory 상태를 결정
    //     if (fileIdNum && uploadHistory.length > 0) {
    //         // Case A: URL에 fileId가 있으면, 파일의 locationId를 기반으로 factory 설정
    //         const selectedFile = uploadHistory.find(file => file.fileId === fileIdNum);

    //         if (selectedFile && typeof selectedFile.locationId === 'number') {
    //             const factoryName = factoryCodeNameMap[selectedFile.locationId];
    //             if (factoryName) {
    //                 setActiveFactory(factoryName);
    //             } else {
    //                 setActiveFactory('전체'); // 매핑되는 공장이 없는 경우
    //             }
    //         } else {
    //             setActiveFactory('전체'); // 파일에 locationId가 없는 경우
    //         }
    //     } else {
    //         // Case B: URL에 fileId가 없으면, 사용자 역할 기반으로 기본 factory 설정
    //         if (user) {
    //             if (user.role.toUpperCase() === 'MANAGER' && factoryTabs.length > 0) {
    //                 setActiveFactory(factoryTabs[0]);
    //             } else if (user.role.toUpperCase() === 'ADMIN') {
    //                 setActiveFactory('전체');
    //             }
    //         }
    //     }
    // }, [
    //     user,
    //     searchParams,
    //     factoryTabs,
    //     uploadHistory,
    //     routeGeometries,
    //     loadGeometries,
    //     selectedFileId,
    //     setSelectedFileId
    // ]);

    // useEffect(() => {
    //     if (!user || !activeFactory || !routeGeometries) {
    //         return;
    //     }

    //     const loadData = async () => {
    //         setIsLoading(true);
    //         const params: Record<string, any> = {};
    //         if (selectedFileId) {
    //             params.fileId = selectedFileId;
    //         } else {
    //             const factoryId = factoryNameCodeMap[activeFactory];
    //             if (user.role.toUpperCase() === 'ADMIN' && factoryId) params.locationId = factoryId;
    //         }

    //         try {
    //             const apiCalls: Promise<any>[] = [
    //                 getKpiSummary(params),
    //                 getInventoryDistribution(params),
    //                 getNodes(),
    //                 getAnomalies({ ...params, limit: 50 }),
    //                 getTrips({ ...params, limit: 50 }),
    //                 getAnomalyCountsByProduct(params),
    //             ];
    //             if (params.fileId && typeof params.fileId === 'number') {
    //                 apiCalls.unshift(getCoverReportData({ fileId: params.fileId }));
    //             } else {
    //                 apiCalls.unshift(Promise.resolve(null));
    //             }

    //             const [coverRes, kpiRes, inventoryRes, nodesRes, anomaliesRes, allTripsRes, productAnomalyRes] = await Promise.all(apiCalls);
    //             setCoverData(coverRes);
    //             setKpiData(kpiRes);
    //             setInventoryData(inventoryRes.inventoryDistribution);
    //             setNodes(nodesRes);
    //             setAnomalyTrips(mergeAndGenerateTimestamps(anomaliesRes.data, routeGeometries));
    //             setNextCursor(anomaliesRes.nextCursor);
    //             setAllTripsForMap(mergeAndGenerateTimestamps(allTripsRes.data, routeGeometries));
    //             setProductAnomalyData(productAnomalyRes);
    //         } catch (error) {
    //             console.error("데이터 로딩 실패:", error);
    //             setKpiData(null); setCoverData(null); setAnomalyTrips([]);
    //         } finally {
    //             setIsLoading(false);
    //         }
    //     };
    //     loadData();
    // }, [user, activeFactory, selectedFileId, routeGeometries]);

    const { anomalyChartData, stageChartData, eventTimelineData } = useMemo(() => {
        if (isLoading || !nodes.length || !anomalyTrips.length) {
            return { anomalyChartData: [], stageChartData: [], eventTimelineData: [] };
        }
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

    const handleLoadMore = useCallback(async () => {
        if (!nextCursor || isFetchingMore) return;
        if (!selectedFileId) {
            console.warn("파일이 선택되지 않아 '더 보기'를 실행할 수 없습니다.");
            return;
        }
        setIsFetchingMore(true);
        const params = {
            cursor: nextCursor,
            limit: 50,
            fileId: selectedFileId,
        };

        try {
            console.log('--- 추가 데이터 로딩 파라미터 ---', params);
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
    }, [nextCursor, isFetchingMore, selectedFileId, routeGeometries, setAnomalyTrips, setNextCursor]);

    const clearFilters = useCallback(() => { setSelectedFileId(null); }, []);
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