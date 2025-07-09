// components/visual/data.ts (또는 lib/data.ts)

// --- 1. 타입 정의 (최종 API 명세 기준) ---
// 이 타입들은 실제 API와 연동될 때도 그대로 사용됩니다.

export interface Node {
    hubType: string;
    scanLocation: string;
    businessStep: 'Factory' | 'WMS' | 'LogiHub' | 'Wholesaler' | 'Reseller' | 'POS';
    coord: [number, number];
}

export type AnomalyType = 'jump' | 'evtOrderErr' | 'epcFake' | 'epcDup' | 'locErr';

export interface TripEndpoint {
    scanLocation: string;
    coord: [number, number];
    eventTime: number;
    businessStep: string;
}

export interface AnalyzedTrip {
    from: TripEndpoint;
    to: TripEndpoint;
    epcCode: string;
    productName: string;
    epcLot: string;
    eventType: string;
    anomaly: AnomalyType | null;
    anomalyDescription: string | null;
}

export interface PaginatedTripsResponse {
    data: AnalyzedTrip[];
    nextCursor: string | null;
}

export interface KpiSummary {
    totalTripCount: number;
    uniqueProductCount: number;
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


// --- 2. "가짜" API 호출 함수들 (더미 데이터 사용) ---
// 컴포넌트는 이 함수들을 실제 API처럼 호출합니다.
// 나중에 이 함수 내부의 fetch URL만 실제 API 엔드포인트로 바꾸면 됩니다.

/**
 * 노드 목록을 가져옵니다. (더미)
 * @returns {Promise<Node[]>}
 */
export async function getNodes(): Promise<Node[]> {
    // public 폴더의 더미 JSON 파일을 fetch합니다.
    const response = await fetch('/api/nodes.json');
    if (!response.ok) {
        throw new Error('Failed to fetch nodes');
    }
    return response.json();
}

/**
 * KPI 요약 정보를 가져옵니다. (더미)
 * @returns {Promise<KpiSummary>}
 */
export async function getKpiSummary(params?: Record<string, any>): Promise<KpiSummary> {
    // 실제 API라면 params를 사용해 필터링하겠지만, 지금은 더미 데이터를 반환합니다.
    console.log('Fetching KPI Summary with params:', params); // 파라미터 확인용 로그
    return {
        totalTripCount: 85432,
        uniqueProductCount: 128,
        anomalyCount: 125,
        anomalyRate: 0.0146,
        salesRate: 92.5,
        dispatchRate: 95.1,
        inventoryRate: 78.2,
        avgLeadTime: "12.5"
    };
}

/**
 * 재고 분산 데이터를 가져옵니다. (더미)
 * @returns {Promise<InventoryDistributionResponse>}
 */
export async function getInventoryDistribution(params?: Record<string, any>): Promise<InventoryDistributionResponse> {
    console.log('Fetching Inventory Distribution with params:', params);
    return {
        inventoryDistribution: [
            { "businessStep": "Factory", "value": 12050 },
            { "businessStep": "WMS", "value": 25800 },
            { "businessStep": "LogiHub", "value": 17300 },
            { "businessStep": "Wholesaler", "value": 35100 },
            { "businessStep": "Reseller", "value": 48200 },
            { "businessStep": "POS", "value": 31540 }
        ]
    };
}


/**
 * 이상 징후 Trip 목록을 가져옵니다. (더미)
 * @returns {Promise<AnalyzedTrip[]>}
 */
export async function getAnomalies(params?: Record<string, any>): Promise<AnalyzedTrip[]> {
    console.log('Fetching Anomalies with params:', params);
    const response = await fetch('/api/anomalies.json'); // public/api/anomalies.json
    if (!response.ok) {
        throw new Error('Failed to fetch anomalies');
    }
    return response.json();
}

/**
 * 전체 Trip 목록을 필터링하여 가져옵니다. (더미, 페이지네이션 흉내)
 * @returns {Promise<PaginatedTripsResponse>}
 */
export async function getTrips(params?: Record<string, any>): Promise<PaginatedTripsResponse> {
    console.log('Fetching Trips with params:', params);
    const response = await fetch('/api/trips.json'); // public/api/trips.json
    if (!response.ok) {
        throw new Error('Failed to fetch trips');
    }
    const allTrips: AnalyzedTrip[] = await response.json();

    // 간단한 더미 페이지네이션 로직
    const limit = params?.limit ? Number(params.limit) : 10;
    const startIndex = params?.cursor ? Number(params.cursor) : 0;
    const paginatedData = allTrips.slice(startIndex, startIndex + limit);
    const nextCursor = (startIndex + limit < allTrips.length) ? (startIndex + limit).toString() : null;

    return {
        data: paginatedData,
        nextCursor,
    };
}