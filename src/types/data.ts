import apiClient from "@/api/apiClient";
// --- 1. 타입 정의 ---
export interface LocationNode {
    hubType: string;
    scanLocation: string;
    businessStep: 'Factory' | 'WMS' | 'LogiHub' | 'Wholesaler' | 'Reseller' | 'POS';
    coord: [number, number];
}

export type AnomalyType = 'fake' | 'tamper' | 'clone' | 'other';
export const anomalyCodeToNameMap: Record<AnomalyType, string> = {
    fake: '위조',
    tamper: '변조',
    clone: '복제',
    other: '신규 유형'
};

export interface TripEndpoint {
    scanLocation: string;
    coord: [number, number];
    eventTime: number; // 더미 데이터에서는 Unix 타임스탬프(초)를 사용합니다.
    businessStep: string;
}

export interface AnalyzedTrip {
    roadId: number;
    from: TripEndpoint;
    to: TripEndpoint;
    epcCode: string;
    productName: string;
    epcLot: string;
    eventType: string;
    anomalyTypeList: AnomalyType[];
}

export interface PaginatedTripsResponse {
    data: AnalyzedTrip[];
    nextCursor: string | null;
}

export interface KpiSummary {
    totalTripCount: number;
    uniqueProductCount: number;
    codeCount: number;
    anomalyCount: number;
    anomalyRate: number;
    salesRate: number;
    dispatchRate: number;
    inventoryRate: number;
    avgLeadTime: number;
}

export interface InventoryDataPoint {
    businessStep: string;
    value: number;
}
export interface InventoryDistributionResponse {
    inventoryDistribution: InventoryDataPoint[];
}

// ✨ 최종 확정된 필터 옵션 타입
export interface FilterOptions {
    scanLocations: string[];
    eventTimeRange: [string, string]; // [min, max] 날짜-시간 문자열 배열
    businessSteps: string[];
    productNames: string[];
    eventTypes: string[];
    anomalyTypes: string[]; // 코드 문자열 배열
}

export interface UploadFile {
    fileId: number;
    fileName: string;
    userId: string;
    fileSize: number;
    createdAt: string;
    locationId: number;
}

export interface ProductCount {
    productName: string;
    fake: number;
    tamper: number;
    clone: number;
    other: number;
    total: number;
}

// 제품별 추이 응답
export type ByProductResponse = ProductCount[];

// 페이지네이션 없는 이상 trips 응답
export interface AllAnomaliesResponse {
    data: AnalyzedTrip[];
}

// --- 2. API 호출 함수 (더미 데이터 시뮬레이션) ---
/**
 * ✨ [신규] 특정 출발지를 기준으로 가능한 도착지 목록을 반환합니다. (더미)
 * @param scanLocation 선택된 출발지 이름
 */
// export async function getToLocations(scanLocation: string): Promise<string[]> {
//     if (!scanLocation) {
//         return [];
//     }
//     try {
//         // 전체 trip 데이터를 가져와서 클라이언트 측에서 필터링합니다.
//         const response = await fetch('/api/trips.json');
//         if (!response.ok) {
//             throw new Error('Failed to fetch trips for dynamic location filtering');
//         }
//         const allTrips: AnalyzedTrip[] = await response.json();

//         const possibleToLocations = allTrips
//             .filter(trip => trip.from.scanLocation === scanLocation) // 출발지가 일치하는 trip만 찾기
//             .map(trip => trip.to.scanLocation); // 해당 trip들의 도착지만 추출

//         // Set을 사용하여 중복된 도착지를 제거한 후 배열로 반환
//         return [...new Set(possibleToLocations)];
//     } catch (error) {
//         console.error("Error fetching dynamic 'to' locations:", error);
//         return [];
//     }
// }
export async function getToLocations(fromLocation: string): Promise<string[]> {
    try {
        // fromScanLocation이라는 쿼리 파라미터로 선택된 출발지를 전달합니다.
        const response = await apiClient.get<{ toLocation: string[] }>('/manager/trips/from', {
            params: { scanLocation: fromLocation }
        });
        console.log(response.data.toLocation, "도착지 목록 로딩")
        return response.data?.toLocation || [];
    } catch (error) {
        console.error('도착지 목록 로딩 실패:', error);
        return []; // 에러 발생 시 빈 배열 반환
    }
}

/**
 * 필터 옵션 목록을 가져옵니다. (더미)
 * 이 함수는 /public/api/filter.json 파일을 fetch합니다.
 */
// export async function getFilterOptions(): Promise<FilterOptions> {
//     const response = await fetch('/api/filter.json');
//     if (!response.ok) throw new Error('Failed to fetch filter options');
//     return response.json();
// }
//*️⃣
export async function getFilterOptions(params?: { fileId: number }): Promise<FilterOptions> {
    try {
        // 이 엔드포인트는 예시입니다. 실제 엔드포인트로 변경해야 합니다.
        const response = await apiClient.get<FilterOptions>('/manager/trips/filter', {params});
        return response.data;
    } catch (error) {
        console.error('필터 옵션 로딩 실패:', error);
        throw error;
    }
}
/**
 * *️⃣ 필터링된 이상 징후 Trip 목록을 가져옵니다. (real)
 */
export async function getAnomalies(params?: Record<string, any>): Promise<PaginatedTripsResponse> {
    try {
        const response = await apiClient.get<PaginatedTripsResponse>('/manager/anomalies', { params });
        console.log("이상징후 페이지네이션O ", response)
        return response.data;
    } catch (error) {
        console.error('이상 징후 데이터 로딩 실패:', error);
        throw error;
    }
}
// export async function getAnomalies(params?: { fileId?: number, [key: string]: any }): Promise<PaginatedTripsResponse> {
//     console.log('Fetching Anomalies with params:', params);
//     const response = await fetch('/api/anomalies.json');
//     console.log(response, 'test 입니다.')
//     if (!response.ok) throw new Error('Failed to fetch anomalies');

//     const responseJson: { data: AnalyzedTrip[] } = await response.json();
//     let allAnomalies: AnalyzedTrip[] = responseJson.data || [];

//     const filterKeys = Object.keys(params || {}).filter(k => k !== 'limit' && k !== 'cursor');

//     if (filterKeys.length > 0) {
//         allAnomalies = allAnomalies.filter(trip => {
//             return filterKeys.every(key => {
//                 const value = params![key];
//                 if (!value) return true;
//                 switch (key) {
//                     case 'fromScanLocation': return trip.from.scanLocation === value;
//                     case 'toScanLocation': return trip.to.scanLocation === value;
//                     case 'min': return trip.from.eventTime >= (new Date(value).getTime() / 1000);
//                     case 'max': return trip.to.eventTime <= (new Date(value).getTime() / 1000);
//                     case 'businessStep': return trip.from.businessStep === value || trip.to.businessStep === value;
//                     case 'epcCode': return trip.epcCode.includes(String(value));
//                     case 'productName': return trip.productName === value;
//                     case 'epcLot': return trip.epcLot.includes(String(value));
//                     case 'eventType': return trip.eventType === value;
//                     case 'anomalyType':
//                         return trip.anomalyTypeList.includes(value);
//                     default: return true;
//                 }
//             });
//         });
//     }

//     const limit = params?.limit || 50;
//     const startIndex = params?.cursor ? Number(params.cursor) : 0;
//     const paginatedData = allAnomalies.slice(startIndex, startIndex + limit);
//     const nextCursor = (startIndex + limit < allAnomalies.length) ? (startIndex + limit).toString() : null;

//     return {
//         data: paginatedData,
//         nextCursor,
//     };
// }

/**
 * 필터링 및 페이지네이션된 전체 Trip 목록을 가져옵니다. (더미)
 * @param params 필터 조건 및 페이지네이션 커서
 */
export async function getTrips(params?: { fileId?: number, [key: string]: any }): Promise<PaginatedTripsResponse> {
    console.log('Fetching Trips with params:', params);
    const response = await fetch('/api/trips.json');
    if (!response.ok) throw new Error('Failed to fetch trips');

    const responseJson: { data: AnalyzedTrip[] } = await response.json();
    let allTrips: AnalyzedTrip[] = responseJson.data || [];

    const filterKeys = Object.keys(params || {}).filter(k => k !== 'limit' && k !== 'cursor');

    if (filterKeys.length > 0) {
        allTrips = allTrips.filter(trip => {
            return filterKeys.every(key => {
                const value = params![key];
                if (!value) return true;
                switch (key) {
                    case 'fromScanLocation': return trip.from.scanLocation === value;
                    case 'toScanLocation': return trip.to.scanLocation === value;
                    // ✨ 시간 필터링: 파라미터(문자열)를 Unix 타임스탬프(숫자)로 변환하여 비교
                    case 'min': return trip.from.eventTime >= (new Date(value).getTime() / 1000);
                    case 'max': return trip.to.eventTime <= (new Date(value).getTime() / 1000);
                    case 'businessStep': return trip.from.businessStep === value || trip.to.businessStep === value;
                    case 'epcCode': return trip.epcCode.includes(String(value));
                    case 'productName': return trip.productName === value;
                    case 'epcLot': return trip.epcLot.includes(String(value));
                    case 'eventType': return trip.eventType === value;
                    case 'anomalyType':
                        return trip.anomalyTypeList.includes(value);
                    default: return true;
                }
            });
        });
    }

    const limit = params?.limit || 50;
    const startIndex = params?.cursor ? Number(params.cursor) : 0;
    const paginatedData = allTrips.slice(startIndex, startIndex + limit);
    const nextCursor = (startIndex + limit < allTrips.length) ? (startIndex + limit).toString() : null;

    return {
        data: paginatedData,
        nextCursor,
    };
}
//*️⃣
// export async function getTrips(params?: Record<string, any>): Promise<PaginatedTripsResponse> {
//     try {
//         // Axios는 params 객체를 자동으로 쿼리 문자열로 변환해줍니다.
//         // { anomalyType: ['jump', 'locErr'] } -> ?anomalyType=jump&anomalyType=locErr
//         const response = await apiClient.get<PaginatedTripsResponse>('/manager/trips', { params });
//         return response.data;
//     } catch (error) {
//         console.error('전체 Trip 데이터 로딩 실패:', error);
//         throw error;
//     }
// }

// --- 나머지 더미 API 함수들 (수정 필요 없음) ---

// export async function getNodes(): Promise<LocationNode[]> {
//     const response = await fetch('/api/nodes.json');
//     if (!response.ok) {
//         throw new Error('Failed to fetch nodes');
//     }
//     return response.json();
// }
//*️⃣
export async function getNodes(params?: Record<string, any>): Promise<LocationNode[]> {
    try {
        const response = await apiClient.get<LocationNode[]>('/manager/nodes', {params});
        console.log('노드들 이걸로 api 요청하던가',response.data)
        return response.data;
    } catch (error) {
        console.error('노드 데이터 로딩 실패:', error);
        throw error; // 에러를 상위로 전파하여 컴포넌트에서 처리할 수 있도록 함
    }
}
// *️⃣ 백 연동
export async function getKpiSummary(params?: Record<string, any>): Promise<KpiSummary> {
    try {
        const response = await apiClient.get<KpiSummary>('/manager/kpi', { params });
        console.log('받은 kpi ', response)
        return response.data;
    } catch (error) {
        console.error('KPI 요약 정보 로딩 실패:', error);
        throw error;
    }
}
// export async function getKpiSummary(params?: Record<string, any>): Promise<KpiSummary> {
//     console.log('Fetching KPI Summary with params:', params);
//     return {
//         totalTripCount: 854320000,
//         uniqueProductCount: 128,
//         codeCount: 2000000,
//         anomalyCount: 125,
//         anomalyRate: 0.0146,
//         salesRate: 92.5,
//         dispatchRate: 95.1,
//         inventoryRate: 78.2,
//         avgLeadTime: 12.5
//     };
// }

// export async function getInventoryDistribution(params?: Record<string, any>): Promise<InventoryDistributionResponse> {
//     console.log('Fetching Inventory Distribution with params:', params);
//     return {
//         inventoryDistribution: [
//             { "businessStep": "Factory", "value": 12050 },
//             { "businessStep": "WMS", "value": 25800 },
//             { "businessStep": "LogiHub", "value": 17300 },
//             { "businessStep": "Wholesaler", "value": 35100 },
//             { "businessStep": "Reseller", "value": 48200 },
//             { "businessStep": "POS", "value": 31540 }
//         ]
//     };
// }
//*️⃣
export async function getInventoryDistribution(params?: Record<string, any>): Promise<InventoryDistributionResponse> {
    try {
        const response = await apiClient.get<InventoryDistributionResponse>('/manager/inventory', { params });
        return response.data;
    } catch (error) {
        console.error('재고 분산 데이터 로딩 실패:', error);
        throw error;
    }
}

export async function getUploadHistory(): Promise<UploadFile[]> {
    try {
        const response = await fetch('/api/upload_history.json');
        if (!response.ok) {
            throw new Error('Failed to fetch upload history');
        }
        return response.json();
    } catch (error) {
        console.error("Error fetching upload history:", error);
        // 실제 운영 환경에서는 alert보다는 UI에 에러 메시지를 표시하는 것이 좋습니다.
        // alert('업로드 내역을 불러오는 데 실패했습니다.');
        return []; // 에러 발생 시 빈 배열 반환
    }
}


export async function getAnomalyCountsByProduct(params?: Record<string, any>): Promise<ByProductResponse> {
    try {
        const response = await fetch('/api/byproduct.json');
        if (!response.ok) {
            throw new Error('Failed to fetch byproduct history');
        }
        return response.json();
    } catch (error) {
        console.error("Error fetching byproduct history:", error);
        // 실제 운영 환경에서는 alert보다는 UI에 에러 메시지를 표시하는 것이 좋습니다.
        // alert('업로드 내역을 불러오는 데 실패했습니다.');
        return []; // 에러 발생 시 빈 배열 반환
    }
}

/**
 * @param params fileId를 포함하는 객체. 더미 환경에서는 이 값이 사용되지 않습니다.
 * @returns AnalyzedTrip 객체의 배열
 */
// export async function getAllAnomalies(params: { fileId: number }): Promise<AnalyzedTrip[]> {
//     try {
//         console.log(`[DUMMY] Fetching all anomalies for fileId: ${params.fileId}`);
//         const response = await fetch('/api/anomalies.json');

//         if (!response.ok) {
//             throw new Error('Failed to fetch dummy allanomalies.json');
//         }
//         const responseJson: { data: AnalyzedTrip[] } = await response.json();

//         return responseJson.data || [];
//     } catch (error) {
//         console.error(`더미 전체 이상 징후 데이터 로딩 실패 (fileId: ${params.fileId}):`, error);
//         return [];
//     }
// }
// *️⃣
export async function getAllAnomalies(params: { fileId: number }): Promise<AnalyzedTrip[]> {
    try {
        console.log(`Requesting all anomalies with params:`, params);

        // apiClient.get을 사용하여 '/manager/allanomalies' 엔드포인트에 요청합니다.
        // 두 번째 인자로 { params }를 전달하면 axios가 자동으로 쿼리 스트링으로 변환해줍니다.
        // 예: /manager/allanomalies?fileId=some-id
        const response = await apiClient.get<AllAnomaliesResponse>('/manager/allanomalies', { params });

        return response.data.data || [];
    } catch (error) {
        console.error(`fileId [${params.fileId}]의 전체 이상 징후 데이터 로딩 실패:`, error);
        throw error;
    }
}