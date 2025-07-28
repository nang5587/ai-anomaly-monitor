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
import { StageBarDataPoint } from '../types/chart';

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
    selectedFactoryName: string | null;
    uploadHistory: UploadFile[];
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
    const [uploadHistory, setUploadHistory] = useState<UploadFile[]>([]);

    // --- 로딩 및 필터 상태 ---
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // --- Jotai 상태 ---
    const [selectedFileId, setSelectedFileId] = useAtom(selectedFileIdAtom);
    const routeGeometries = useAtomValue(routeGeometriesAtom);
    const loadGeometries = useSetAtom(loadRouteGeometriesAtom);

    // ✨ 1. "교통정리 요원" 상태 플래그 추가
    const [isInitialized, setIsInitialized] = useState(false);

    // ⚠️ MOCK_USER는 실제 useAuth() 훅으로 대체해야 합니다.
    // const user = { role: 'ADMIN', locationId: 0 };

    const selectedFactoryName = useMemo(() => {
        if (!selectedFileId || uploadHistory.length === 0) return null;
        const selectedFile = uploadHistory.find(file => file.fileId === selectedFileId);
        if (selectedFile?.locationId) {
            return factoryCodeNameMap[selectedFile.locationId] || '정보 없음';
        }
        return '정보 없음'; // 파일은 있지만 공장 정보가 없는 경우
    }, [selectedFileId, uploadHistory]);

    const viewProps = useMemo(() => {
        return { factoryName: selectedFactoryName };
    }, [selectedFactoryName]);

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

    // ===================================================================
    // HOOK 1: 초기화 로직 (Initialization)
    // "모든 초기 설정을 끝내고, isInitialized를 true로 설정한다."
    // ===================================================================
    useEffect(() => {
        // user가 로드되지 않았거나, 이미 초기화가 끝났으면 실행하지 않음
        if (!user || isInitialized) return;

        const initializeDashboard = async () => {
            const fileIdFromUrl = searchParams.get('fileId');

            if (fileIdFromUrl) {
                // 시나리오 A: URL에 fileId가 있으면, atom 동기화하고 초기화 완료
                setSelectedFileId(Number(fileIdFromUrl));
                setIsInitialized(true);
                return;
            }

            // 시나리오 B: atom에 이미 fileId가 있으면 (예: 페이지 이동 후), 초기화 완료
            if (selectedFileId) {
                setIsInitialized(true);
                return;
            }

            // 시나리오 C: URL과 atom 모두 비어있으면, 최신 파일 검색
            try {
                const history = await getUploadHistory();
                setUploadHistory(history);
                if (history && history.length > 0) {
                    const latestFileId = history[0].fileId;
                    setSelectedFileId(latestFileId);
                    // URL 업데이트는 선택적이지만, 상태 일관성을 위해 추천
                    const role = user.role.toUpperCase() === 'ADMIN' ? 'supervisor' : 'admin';
                    router.replace(`/${role}/report?fileId=${latestFileId}`);
                } else {
                    router.replace('/upload');
                }
            } catch (error) {
                console.error("초기 파일 목록 로딩 실패:", error);
            } finally {
                // 성공하든, 실패하든, 업로드 페이지로 가든, 모든 초기화 작업이 끝났음을 알림
                setIsInitialized(true);
            }
        };

        initializeDashboard();
    }, [user, searchParams, isInitialized, selectedFileId, setSelectedFileId, router]);

    // --- 데이터 로딩 로직 (HOOK 3) ---
    useEffect(() => {
        if (!user || !routeGeometries) return;

        // 오직 selectedFileId가 유효한 숫자일 때만 데이터를 로드!
        if (typeof selectedFileId === 'number') {
            const loadData = async () => {
                setIsLoading(true);
                // params는 이제 fileId만 가집니다. activeFactory는 사용되지 않습니다.
                const params = { fileId: selectedFileId };

                try {
                    // uploadHistory가 아직 로드되지 않았을 수 있으므로 여기서 한 번 더 확인하고 로드
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
                        getCoverReportData({ fileId: params.fileId }) // fileId는 params에 이미 있음
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
            // selectedFileId가 없으면 모든 데이터를 비우고 로딩을 멈춤
            setKpiData(null);
            setCoverData(null);
            setAnomalyTrips([]);
            setAllTripsForMap([]);
            setInventoryData([]);
            setProductAnomalyData([]);
            setIsLoading(false);
        }
    }, [user, selectedFileId, routeGeometries]);

    // ===================================================================
    // HOOK 2: 데이터 로딩 로직 (Data Fetching)
    // "초기화가 끝났고, fileId가 있을 때만 데이터를 불러온다."
    // ===================================================================
    useEffect(() => {
        // 1. 초기화가 끝나지 않았거나, 필수 데이터가 없으면 중단
        if (!isInitialized || !user || !routeGeometries) {
            return;
        }

        // 2. 오직 selectedFileId가 유효한 숫자일 때만 데이터를 로드
        if (typeof selectedFileId === 'number') {
            const loadData = async () => {
                setIsLoading(true);
                const params = { fileId: selectedFileId };
                try {
                    // uploadHistory 로드가 필요하면 여기서 한 번 더 확인
                    if (uploadHistory.length === 0) {
                        const history = await getUploadHistory();
                        setUploadHistory(history);
                    }
                    
                    // ✨ 생략되었던 API 호출 목록 전체
                    const apiCalls: Promise<any>[] = [
                        getKpiSummary(params),
                        getInventoryDistribution(params),
                        getNodes(),
                        getAnomalies({ ...params, limit: 50 }),
                        getTrips({ ...params, limit: 50 }),
                        getAnomalyCountsByProduct(params),
                        getCoverReportData({ fileId: params.fileId }) // 보고서 커버 데이터 추가
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

                    // 상태 설정
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
                    // 에러 발생 시 모든 관련 상태를 깨끗하게 초기화
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
            // 초기화는 끝났지만, 분석할 파일이 없는 경우 (uploadHistory가 비어있었을 때)
            // 또는 필터가 초기화된 경우
            setIsLoading(false);
            // ✨ 생략되었던 상태 초기화 로직 전체
            setKpiData(null);
            setCoverData(null);
            setAnomalyTrips([]);
            setAllTripsForMap([]);
            setInventoryData([]);
            setProductAnomalyData([]);
            // nodes는 공통 데이터일 수 있으므로 유지할지 여부 결정 (여기서는 초기화)
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
                name: stage.name,
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
        // ✨ 1. isFetchingMore와 nextCursor 체크는 그대로 유지
        if (!nextCursor || isFetchingMore) return;

        // ✨ 2. selectedFileId가 없으면 '더 보기'를 실행할 수 없으므로 안전장치 추가
        if (!selectedFileId) {
            console.warn("파일이 선택되지 않아 '더 보기'를 실행할 수 없습니다.");
            return;
        }

        setIsFetchingMore(true);

        // ✨ 3. params 객체는 이제 cursor, limit, fileId만 가집니다.
        const params = {
            cursor: nextCursor,
            limit: 50,
            fileId: selectedFileId,
        };

        try {
            console.log('--- 추가 데이터 로딩 파라미터 ---', params);
            // ✨ 4. getAnomalies 함수에 단순화된 params 전달
            const response = await getAnomalies(params);

            if (response.data && response.data.length > 0) {
                const newMergedTrips = mergeAndGenerateTimestamps(response.data, routeGeometries);
                setAnomalyTrips(prevTrips => [...prevTrips, ...newMergedTrips]);
                setNextCursor(response.nextCursor);
            } else {
                // 더 이상 데이터가 없으면 nextCursor를 null로 설정
                setNextCursor(null);
            }

        } catch (error) {
            console.error("추가 데이터 로딩 실패:", error);
        } finally {
            setIsFetchingMore(false);
        }
        // ✨ 5. 의존성 배열에서 activeFactory 제거
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


    // --- 5. Context에 전달할 최종 값 객체 ---
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