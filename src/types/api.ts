// types/api.ts

/**
 * 1. 로그인 요청 시 사용되는 데이터 형식
 */
export interface LoginPayload {
    userId: string;
    password: string;
}

/**
 * 2. API에서 간단한 메시지를 응답으로 보낼 때의 공통 형식
 * (예: CSV 업로드 실패 메시지)
 */
export interface ApiMessageResponse {
    message: string;
}

/**
 * 3. CSV 업로드 내역 조회 시, 파일 한 개의 정보
 */
export interface UploadFile {
    fileId: number;
    fileName: string;
    userId: string;
    fileSize: number;
    createdAt: string; // ISO 8601 형식의 날짜 문자열 (예: "2025-07-10T12:30:00")
    locationId: number | null; // 특정 공장 파일이 아닐 경우 null일 수 있음
}

/**
 * 4. 지도에 표시될 노드(공장, 물류센터 등) 한 개의 정보
 */
export interface LocationNode {
    hubType: string;
    scanLocation: string;
    businessStep: string;
    coord: [number, number]; // [경도, 위도]
}

/**
 * 5 & 6. Trip 데이터의 from, to 지점 정보
 */
export interface TripPoint {
    scanLocation: string;
    coord: [number, number];
    eventTime: number; // Unix 타임스탬프 (초)
    businessStep: string;
}

/**
 * 이상 징후의 유형을 나타내는 타입 (유니언 타입이므로 'type'으로 정의)
 */
export type AnomalyType = "jump" | "evtOrderErr" | "epcFake" | "epcDup" | "locErr";

/**
 * 5 & 6. 이상 징후 및 전체 Trip 조회 시, 운송(Trip) 한 개의 상세 정보
 */
export interface AnalyzedTrip {
    roadId: number;
    from: TripPoint;
    to: TripPoint;
    epcCode: string;
    productName: string;
    epcLot: string;
    eventType: string;
    anomalyTypeList: AnomalyType[];
}

/**
 * 5 & 6. 페이지네이션(무한 스크롤)이 적용된 API 응답의 공통 형식
 */
export interface PaginatedResponse<T> {
    data: T[];
    nextCursor: string | null;
}

/**
 * 5 & 6. Trip 데이터에 대한 페이지네이션 응답 타입 (별칭이므로 'type'으로 정의)
 */
export type PaginatedTripsResponse = PaginatedResponse<AnalyzedTrip>;

/**
 * 7. 필터 패널에 사용될 선택 옵션 목록
 */
export interface FilterOptions {
    scanLocations: string[];
    eventTimeRange: [string, string]; // [시작일, 종료일]
    businessSteps: string[];
    productNames: string[];
    eventTypes: string[];
    anomalyTypes: AnomalyType[];
}

/**
 * 8. 'From' 위치 선택 시, 가능한 'To' 위치 목록 응답 (배열 별칭이므로 'type'으로 정의)
 */
export type ToLocationListResponse = string[];

/**
 * 9. 대시보드 상단 KPI 카드 데이터
 */
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

/**
 * 10. 재고 분산 차트의 데이터 포인트
 */
export interface InventoryDataPoint {
    businessStep: string;
    value: number;
}

/**
 * 10. 노드 유형별 재고 분산 현황 API 응답
 */
export interface InventoryDistributionResponse {
    inventoryDistribution: InventoryDataPoint[];
}

/**
 * 11. 현재 로그인한 사용자의 프로필 정보
 */
export interface UserProfile {
    userName: string;
    email: string;
}

/**
 * 12. 사용자 역할과 상태 (유니언 타입이므로 'type'으로 정의)
 */
export type UserRole = "UNAUTH" | "MANAGER" | "ADMIN" | "SUPERVISOR";
export type UserStatus = "pending" | "active" | "inactive";

/**
 * 12. 사용자 목록 조회 시, 사용자 한 명의 정보
 */
export interface UserListItem {
    role: UserRole;
    locationId: string | null;
    userId: string;
    userName: string;
    email: string;
    status: UserStatus;
    createdAt: string;
}

/**
 * 12. 사용자 목록 조회 API 응답
 */
export interface UserListResponse {
    users: UserListItem[];
}