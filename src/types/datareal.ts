// /src/components/visual/data.ts (또는 해당 파일 경로)

import apiClient from '@/api/apiClient'; // 만들어둔 apiClient 인스턴스를 import 합니다.

// --- 1. 타입 정의 ---
// 기존 타입 정의는 API 명세서와 일치하므로 그대로 사용합니다.
export interface LocationNode {
    hubType: string;
    scanLocation: string;
    businessStep: 'Factory' | 'WMS' | 'LogiHub' | 'Wholesaler' | 'Reseller' | 'POS';
    coord: [number, number];
}
export type AnomalyType = 'fake' | 'tamper' | 'clone';
export const anomalyCodeToNameMap: Record<AnomalyType, string> = {
    fake: '위조',
    tamper: '변조',
    clone: '복제',
};

export function getAnomalyName(code: AnomalyType): string {
    return anomalyCodeToNameMap[code] || '알 수 없는 유형';
}

export interface TripEndpoint {
    scanLocation: string;
    coord: [number, number];
    eventTime: number;
    businessStep: string;
}
export interface AnalyzedTrip {
    id?: string; // 프론트엔드에서 사용하는 고유 ID (선택적)
    from: TripEndpoint;
    to: TripEndpoint;
    epcCode: string;
    productName: string;
    epcLot: string;
    eventType: string;
    anomalyTypeList: AnomalyType[];
    anomalyDescription: string | null;
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
    avgLeadTime: string;
}
export interface InventoryDataPoint {
    businessStep: string;
    value: number;
}
export interface InventoryDistributionResponse {
    inventoryDistribution: InventoryDataPoint[];
}
export interface FilterOptions {
    scanLocations: string[];
    eventTimeRange: [string, string];
    businessSteps: string[];
    productNames: string[];
    eventTypes: string[];
    anomalyTypes: string[];
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
    total: number;
}
export interface ByProductApiResponse {
    byProductList: ProductCount[];
}

// 페이지네이션 없는 이상 trips 응답
export interface AllAnomaliesResponse {
    data: AnalyzedTrip[];
}

// --- 2. 실제 API 호출 함수들 ---

/**
 * ✅ 1. 노드(LocationNode) 정보 조회
 * @returns {Promise<LocationNode[]>}
 */
export async function getNodes(): Promise<LocationNode[]> {
    try {
        const response = await apiClient.get<LocationNode[]>('/manager/nodes');
        return response.data;
    } catch (error) {
        console.error('노드 데이터 로딩 실패:', error);
        throw error; // 에러를 상위로 전파하여 컴포넌트에서 처리할 수 있도록 함
    }
}

/**
 * ✅ 2. 이상 징후 Trip 데이터 조회 (Anomalies)
 * @param params { limit, cursor }
 */
export async function getAnomalies(params?: Record<string, any>): Promise<PaginatedTripsResponse> {
    try {
        const response = await apiClient.get<PaginatedTripsResponse>('/manager/anomalies', { params });
        return response.data;
    } catch (error) {
        console.error('이상 징후 데이터 로딩 실패:', error);
        throw error;
    }
}

/**
 * ✅ 3. 전체 Trip 데이터 조회
 * @param params 필터 조건 및 페이지네이션 커서
 */
export async function getTrips(params?: Record<string, any>): Promise<PaginatedTripsResponse> {
    try {
        // Axios는 params 객체를 자동으로 쿼리 문자열로 변환해줍니다.
        // { anomalyType: ['jump', 'locErr'] } -> ?anomalyType=jump&anomalyType=locErr
        const response = await apiClient.get<PaginatedTripsResponse>('/manager/trips', { params });
        return response.data;
    } catch (error) {
        console.error('전체 Trip 데이터 로딩 실패:', error);
        throw error;
    }
}


/**
 * ✅ 4. KPI 요약 정보 조회
 * @param params 필터 조건 (locationId, eventDay 등)
 */
export async function getKpiSummary(params?: Record<string, any>): Promise<KpiSummary> {
    try {
        const response = await apiClient.get<KpiSummary>('/manager/kpi', { params });
        return response.data;
    } catch (error) {
        console.error('KPI 요약 정보 로딩 실패:', error);
        throw error;
    }
}

/**
 * ✅ 5. 재고 분산 현황 조회
 */
export async function getInventoryDistribution(params?: Record<string, any>): Promise<InventoryDistributionResponse> {
    try {
        const response = await apiClient.get<InventoryDistributionResponse>('/manager/inventory', { params });
        return response.data;
    } catch (error) {
        console.error('재고 분산 데이터 로딩 실패:', error);
        throw error;
    }
}

/**
 * ❓ 필터 옵션 목록 조회
 * API 명세서에 필터 옵션을 가져오는 엔드포인트가 명시되어 있지 않습니다.
 * 만약 `/manager/filters` 와 같은 엔드포인트가 있다면 아래와 같이 구현합니다.
 * 없다면, 백엔드 팀과 협의가 필요합니다.
 */
export async function getFilterOptions(): Promise<FilterOptions> {
    try {
        // 이 엔드포인트는 예시입니다. 실제 엔드포인트로 변경해야 합니다.
        const response = await apiClient.get<FilterOptions>('/manager/trips/filter');
        return response.data;
    } catch (error) {
        console.error('필터 옵션 로딩 실패:', error);
        throw error;
    }
}

/**
 * 특정 출발지를 기준으로 이동 가능한 도착지 목록을 가져옵니다.
 * @param scanLocation 선택된 출발지 이름
 * @returns {Promise<string[]>} 도착지 이름 배열
 */
export async function getToLocations(fromLocation: string): Promise<string[]> {
    try {
        // fromScanLocation이라는 쿼리 파라미터로 선택된 출발지를 전달합니다.
        const response = await apiClient.get<{ toLocation: string[] }>('/manager/trips/from', {
            params: { scanLocation: fromLocation }
        });
        return response.data?.toLocation || [];
    } catch (error) {
        console.error('도착지 목록 로딩 실패:', error);
        return []; // 에러 발생 시 빈 배열 반환
    }
}

export async function getUploadHistory(): Promise<UploadFile[]> {
    try {
        const response = await apiClient.get<UploadFile[]>('/manager/upload/filelist');
        return response.data;
    } catch (error) {
        console.error("업로드 내역 로딩 실패:", error);
        throw error; // 에러를 상위로 전파하여 UI에서 처리할 수 있도록 함
    }
}

/**
 * [실제 API] 제품별 이상 건수 데이터를 서버로부터 가져옵니다.
 * @param params - 필터링을 위한 쿼리 파라미터 (예: { startDate: '2023-10-01' })
 */
export async function getAnomalyCountsByProduct(params?: Record<string, any>): Promise<ProductCount[]> {
    try {
        const response = await apiClient.get<ByProductApiResponse>('/manager/byproduct', { params });
        return response.data?.byProductList || [];
    } catch (error) {
        console.error('제품별 이상 건수 데이터 로딩 실패:', error);
        // 에러를 다시 throw하여 호출한 컴포넌트에서 처리할 수 있도록 합니다.
        throw error;
    }
}

/**
 * 특정 파일의 모든 이상 징후 Trip 목록을 가져옵니다. (페이지네이션 없음)
 * @param params fileId를 포함하는 객체. { fileId: 'some-id' }
 * @returns AnalyzedTrip 객체의 배열
 */
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