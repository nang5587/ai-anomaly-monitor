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
import { useAtom, useAtomValue, useSetAtom, useStore } from 'jotai';
import {
    KpiSummary,
    AnalyzedTrip,
    InventoryDataPoint,
    ByProductResponse,
    AnomalyType,
    LocationNode
} from '@/types/data';
import { FileItem } from '@/types/file';
import { CoverReportData } from "@/types/api";
import {
    getKpiSummary,
    getAnomalies,
    getAllAnomalies,
    getInventoryDistribution,
    getNodes,
    getTrips,
    getAnomalyCountsByProduct
} from '@/services/dataService';

import { getCoverReportData, getFiles_client } from '@/api/apiClient';

import {
    mergeAndGenerateTimestamps,
    routeGeometriesAtom,
    fetchGeometriesAndMergeTrips,
    selectedFileIdAtom,
    selectedFactoryNameAtom,
} from '@/stores/mapDataAtoms';
import { getAnomalyName, getAnomalyColor, ALL_ANOMALY_TYPES } from '@/types/colorUtils';
import { StageBarDataPoint } from '../types/chart';

const factoryCodeNameMap: { [key: number]: string } = { 1: '인천공장', 2: '화성공장', 3: '양산공장', 4: '구미공장' };

interface DashboardContextType {
    coverData: CoverReportData | null;
    kpiData: KpiSummary | null;
    anomalyTrips: AnalyzedTrip[];
    allTripsForMap: AnalyzedTrip[];
    inventoryData: InventoryDataPoint[];
    nodes: LocationNode[];
    productAnomalyData: ByProductResponse;
    anomalyChartData: any[];
    vennDiagramData: { sets: string[]; value: number }[];
    stageChartData: StageBarDataPoint[];
    eventTimelineData: any[];
    calculatedReportKpis: {
        mostProblematicRoute: string;
        mostAffectedProduct: string;
    };
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
    isHistoryModalOpen: boolean;
    viewProps: { factoryName: string | null };
    handleFileSelect: (fileId: number) => void;
    handleLoadMore: () => Promise<void>;
    clearFilters: () => void;
    openHistoryModal: () => Promise<void>;
    closeHistoryModal: () => void;
}

export const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const store = useStore();

    const [coverData, setCoverData] = useState<CoverReportData | null>(null);
    const [kpiData, setKpiData] = useState<KpiSummary | null>(null);
    const [anomalyTrips, setAnomalyTrips] = useState<AnalyzedTrip[]>([]);
    const [allTripsForMap, setAllTripsForMap] = useState<AnalyzedTrip[]>([]);
    const [inventoryData, setInventoryData] = useState<InventoryDataPoint[]>([]);
    const [nodes, setNodes] = useState<LocationNode[]>([]);
    const [productAnomalyData, setProductAnomalyData] = useState<ByProductResponse>([]);
    const [uploadHistory, setUploadHistory] = useState<FileItem[]>([]);
    const [chartDataSource, setChartDataSource] = useState<AnalyzedTrip[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const [selectedFileId, setSelectedFileId] = useAtom(selectedFileIdAtom);
    const [selectedFactoryName, setSelectedFactoryName] = useAtom(selectedFactoryNameAtom);

    const viewProps = useMemo(() => {
        return { factoryName: selectedFactoryName };
    }, [selectedFactoryName]);

    const selectedFileName = useMemo(() => {
        if (!selectedFileId) return null;
        return uploadHistory.find(file => file.fileId === selectedFileId)?.fileName || null;
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
        if (selectedFileId && uploadHistory.length > 0) {
            const selectedFile = uploadHistory.find(file => file.fileId === selectedFileId);
            if (selectedFile?.locationId && factoryCodeNameMap[selectedFile.locationId]) {
                setSelectedFactoryName(factoryCodeNameMap[selectedFile.locationId]);
            } else {
                setSelectedFactoryName('정보 없음');
            }
        } else if (!selectedFileId) {
            setSelectedFactoryName(null);
        }
    }, [selectedFileId, uploadHistory, setSelectedFactoryName]);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user) {
            return;
        }

        const fileIdFromUrl = searchParams.get('fileId');
        if (fileIdFromUrl) {
            const fileIdNum = Number(fileIdFromUrl);
            if (selectedFileId !== fileIdNum) {
                console.log(`URL fileId(${fileIdNum}) 감지. 전역 상태 업데이트.`);
                setSelectedFileId(fileIdNum);
            }
        }
        else {
            console.log("URL에 fileId 없음. 최신 파일로 리다이렉션 시도.");
            if (selectedFileId !== null) return;
            const initializeAndRedirect = async () => {
                try {
                    const history = await getFiles_client();
                    const role = user.role.toUpperCase() === 'ADMIN' ? 'supervisor' : 'admin';
                    if (history.length > 0) {
                        const latestFileId = history[0].fileId;
                        router.replace(`/${role}?fileId=${latestFileId}`);
                    } else {
                        router.replace('/upload');
                    }
                } catch (error) {
                    console.error("초기 파일 목록 로딩 실패:", error);
                }
            };
            initializeAndRedirect();
        }
    }, [user, isAuthLoading, searchParams, selectedFileId, setSelectedFileId, router]);

    useEffect(() => {
        if (!user) {
            return;
        }

        if (typeof selectedFileId === 'number') {
            const loadData = async () => {
                setIsLoading(true);
                const params = { fileId: selectedFileId };

                try {
                    const jotaiGet = store.get;
                    const jotaiSet = store.set;

                    const coverRes = await getCoverReportData({ fileId: params.fileId });
                    const kpiRes = await getKpiSummary(params);
                    const inventoryRes = await getInventoryDistribution(params);
                    const nodesRes = await getNodes();
                    const productAnomalyRes = await getAnomalyCountsByProduct(params);

                    const [allAnomaliesRes, anomaliesRes, allTripsRes] = await Promise.all([
                        getAllAnomalies(params),
                        getAnomalies({ ...params, limit: 50 }),
                        getTrips({ ...params, limit: 50 }),
                    ]);

                    const [mergedChartData, mergedAnomalyTrips, mergedAllTrips] = await Promise.all([
                        fetchGeometriesAndMergeTrips(allAnomaliesRes, jotaiGet, jotaiSet),
                        fetchGeometriesAndMergeTrips(anomaliesRes.data, jotaiGet, jotaiSet),
                        fetchGeometriesAndMergeTrips(allTripsRes.data, jotaiGet, jotaiSet)
                    ]);

                    setCoverData(coverRes);
                    setKpiData(kpiRes);
                    setInventoryData(inventoryRes.inventoryDistribution);
                    setNodes(nodesRes);
                    setChartDataSource(mergedChartData);
                    setAnomalyTrips(mergedAnomalyTrips);
                    setNextCursor(anomaliesRes.nextCursor);
                    setAllTripsForMap(mergedAllTrips);
                    setProductAnomalyData(productAnomalyRes);
                } catch (error) {
                    setChartDataSource([]);
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
        }
        else {
            console.log("선택된 파일이 없어 모든 데이터 상태를 초기화합니다.");
            setIsLoading(false);
            setChartDataSource([]);
            setCoverData(null);
            setKpiData(null);
            setAnomalyTrips([]);
            setAllTripsForMap([]);
            setInventoryData([]);
            setProductAnomalyData([]);
            setNodes([]);
            setNextCursor(null);
        }
    }, [user, selectedFileId, store]);

    const { anomalyChartData, stageChartData, eventTimelineData, vennDiagramData } = useMemo(() => {
        if (isLoading || !nodes.length || !chartDataSource.length) {
            return { anomalyChartData: [], stageChartData: [], eventTimelineData: [], vennDiagramData: [] };
        }

        const thresholdValue = parseFloat(process.env.NEXT_PUBLIC_ANOMALY_THRESHOLD || '50');
        const countsByType: Record<AnomalyType, number> = { fake: 0, tamper: 0, clone: 0, other: 0 };
        let ruleBasedOnlyCount = 0;
        let aiBasedOnlyCount = 0;
        let intersectionCount = 0; 

        chartDataSource.forEach(trip => {
            const isRuleBased = trip.anomalyTypeList && trip.anomalyTypeList.length > 0;
            const isAiBased = typeof trip.anomaly === 'number' && trip.anomaly >= thresholdValue;

            if (isRuleBased) {
                trip.anomalyTypeList?.forEach(code => {
                    if (code in countsByType) {
                        countsByType[code] = (countsByType[code] || 0) + 1;
                    }
                });
            }
            if (isAiBased) {
                countsByType.other = (countsByType.other || 0) + 1;
            }

            if (isRuleBased && isAiBased) {
                intersectionCount++;
            } else if (isRuleBased) {
                ruleBasedOnlyCount++;
            } else if (isAiBased) {
                aiBasedOnlyCount++;
            }
        });

        const ALL_CHART_TYPES: (AnomalyType)[] = [...ALL_ANOMALY_TYPES, 'other'];
        const newAnomalyChartData = ALL_CHART_TYPES.map(type => {
            const name = type === 'other' ? 'AI 탐지' : getAnomalyName(type as AnomalyType);
            const color = type === 'other' ? [255, 159, 64] : getAnomalyColor(type as AnomalyType);
            return {
                type: type,
                name: name,
                count: countsByType[type] || 0,
                color1: `rgb(${color.join(', ')})`,
                color2: `rgb(${color.join(', ')})`,
            };
        });

        const newVennDiagramData = [
            { sets: ['룰 기반'], value: ruleBasedOnlyCount },
            { sets: ['AI 기반'], value: aiBasedOnlyCount },
            { sets: ['룰 기반', 'AI 기반'], value: intersectionCount },
        ];

        const STAGES = [
            { from: 'Factory', to: 'WMS', name: '공장 → 창고' },
            { from: 'WMS', to: 'LogiHub', name: '창고 → 물류' },
            { from: 'LogiHub', to: 'Wholesaler', name: '물류 → 도매' },
            { from: 'Wholesaler', to: 'Reseller', name: '도매 → 소매' },
            { from: 'Reseller', to: 'POS', name: '소매 → 판매' },
        ];
        const newStageChartData = STAGES.map(stage => {
            const stageAnomaliesCount = chartDataSource.filter(trip =>
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
        chartDataSource.forEach(trip => {
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
            eventTimelineData: newEventTimelineData,
            vennDiagramData: newVennDiagramData,
        };
    }, [chartDataSource, nodes, isLoading]);

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
                const newMergedTrips = await fetchGeometriesAndMergeTrips(response.data, store.get, store.set);
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
    }, [nextCursor, isFetchingMore, selectedFileId, store]);

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

    const calculatedReportKpis = useMemo(() => {
        const routeCounts = chartDataSource.reduce((acc, trip) => {
            const route = `${trip.from.scanLocation} → ${trip.to.scanLocation}`;
            acc[route] = (acc[route] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const mostProblematicRoute = Object.entries(routeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        const mostAffectedProduct = [...productAnomalyData].sort((a, b) => b.total - a.total)[0]?.productName || 'N/A';

        return {
            mostProblematicRoute,
            mostAffectedProduct
        };
    }, [chartDataSource, productAnomalyData]);

    const value: DashboardContextType = {
        user, isAuthLoading, coverData,
        kpiData, anomalyTrips, allTripsForMap, inventoryData, nodes, productAnomalyData,
        anomalyChartData, stageChartData, eventTimelineData, vennDiagramData,
        isLoading, isFetchingMore, nextCursor, selectedFileId, selectedFactoryName, uploadHistory, selectedFileName,
        isHistoryModalOpen, calculatedReportKpis,
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