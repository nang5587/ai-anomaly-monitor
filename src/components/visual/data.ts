// Data.ts

/**
 * 시각화에 사용될 각 노드(위치)의 타입 정의
 * @param id - 고유 식별자 (데이터 연결에 사용)
 * @param name - 화면에 표시될 이름 (툴팁 등)
 * @param type - 노드의 종류 (색상이나 크기를 다르게 할 때 사용)
 * @param coordinates - 지도 위에 표시될 좌표 [경도, 위도]
 */
export interface Node {
    id: string;
    name: string;
    type: 'Factory' | 'WMS' | 'LogiHub' | 'Wholesaler' | 'Reseller';
    coordinates: [number, number];
}

/**
 * 상품의 이동 경로(Trip) 타입 정의
 * @param from - 출발지 노드 ID
 * @param to - 도착지 노드 ID
 * @param path - 이동 경로 좌표 배열 [[출발지 경위도], [도착지 경위도]]
 * @param timestamps - 이동 타임스탬프 배열 [출발 시간, 도착 시간]
 * @param product - (옵션) 이동하는 상품 이름
 */
export interface Trip {
    from: string;
    to: string;
    path: [[number, number], [number, number]];
    timestamps: [number, number];
    product: string;
}

export type AnomalyType = 'SPACE_JUMP' | 'CLONE' | 'ORDER_ERROR' | 'PATH_FAKE';

// 각 위변조 유형에 따른 추가 정보 타입 정의
export interface SpaceJumpInfo {
    type: 'SPACE_JUMP';
    travelTime: number; // 실제 이동 시간 (분)
    distance: number; // 실제 이동 거리 (km)
}
export interface CloneInfo {
    type: 'CLONE';
    cloneCount: number; // 몇 개로 복제되었는지
    originalTripId: string; // 원본 Trip의 ID
}
export interface OrderErrorInfo {
    type: 'ORDER_ERROR';
    previousEventTime: number; // 이전 이벤트 발생 시각
    currentEventTime: number; // 현재 이벤트 발생 시각
}
export interface PathFakeInfo {
    type: 'PATH_FAKE';
    expectedPath: [[number, number], [number, number]]; // 예정 경로
    bypassedNode: { name: string; coordinates: [number, number] }; // 경유한 의심 지점
}

// AI 분석 결과를 포함하는 확장된 Trip 타입
export interface AnalyzedTrip extends Trip {
    id: string; // 각 Trip에 고유 ID 부여
    anomaly?: SpaceJumpInfo | CloneInfo | OrderErrorInfo | PathFakeInfo; // 위변조 정보 (옵셔널)
}

// --- 1. 노드 데이터 (모든 지점 포함) ---
// 제공된 CSV 좌표로 업데이트된 데이터
export const nodes: Node[] = [
    // 공장 (Factories)
    { id: 'ICN_Factory', name: '인천 공장', type: 'Factory', coordinates: [126.7053, 37.4561] },
    { id: 'HWS_Factory', name: '화성 공장', type: 'Factory', coordinates: [126.8314, 37.1996] },
    { id: 'YGS_Factory', name: '양산 공장', type: 'Factory', coordinates: [129.0371, 35.3350] },
    { id: 'KUM_Factory', name: '구미 공장', type: 'Factory', coordinates: [128.3445, 36.1195] },

    // 창고 (WMS)
    { id: 'ICN_WMS', name: '인천 창고', type: 'WMS', coordinates: [126.7100, 37.4600] },
    { id: 'HWS_WMS', name: '화성 창고', type: 'WMS', coordinates: [126.8250, 37.1950] },
    { id: 'YGS_WMS', name: '양산 창고', type: 'WMS', coordinates: [129.0400, 35.3400] },
    { id: 'KUM_WMS', name: '구미 창고', type: 'WMS', coordinates: [128.3500, 36.1250] },

    // 물류 허브 (Logistics Hubs)
    { id: 'SEL_Logi_HUB', name: '수도권 허브', type: 'LogiHub', coordinates: [126.9700, 37.5500] },
    { id: 'JB_Logi_HUB', name: '전북 허브', type: 'LogiHub', coordinates: [127.1500, 35.8300] },
    { id: 'JN_Logi_HUB', name: '전남 허브', type: 'LogiHub', coordinates: [126.3900, 34.8200] },
    { id: 'KB_Logi_HUB', name: '경북 허브', type: 'LogiHub', coordinates: [128.3400, 36.1400] },
    { id: 'KN_Logi_HUB', name: '경남 허브', type: 'LogiHub', coordinates: [128.6800, 35.2300] },

    // 도매상 (Wholesalers)
    { id: 'SEL_WS1', name: '수도권 도매상1', type: 'Wholesaler', coordinates: [126.9800, 37.5700] },
    { id: 'SEL_WS2', name: '수도권 도매상2', type: 'Wholesaler', coordinates: [126.9500, 37.6000] },
    { id: 'SEL_WS3', name: '수도권 도매상3', type: 'Wholesaler', coordinates: [127.0200, 37.5400] },
    { id: 'JB_WS1', name: '전북 도매상1', type: 'Wholesaler', coordinates: [127.1500, 35.8200] },
    { id: 'JB_WS2', name: '전북 도매상2', type: 'Wholesaler', coordinates: [127.1300, 35.8400] },
    { id: 'JB_WS3', name: '전북 도매상3', type: 'Wholesaler', coordinates: [127.1700, 35.8000] },
    { id: 'JN_WS1', name: '전남 도매상1', type: 'Wholesaler', coordinates: [126.3900, 34.8100] },
    { id: 'JN_WS2', name: '전남 도매상2', type: 'Wholesaler', coordinates: [126.3700, 34.8300] },
    { id: 'JN_WS3', name: '전남 도매상3', type: 'Wholesaler', coordinates: [126.4100, 34.7900] },
    { id: 'KB_WS1', name: '경북 도매상1', type: 'Wholesaler', coordinates: [128.3500, 36.1200] },
    { id: 'KB_WS2', name: '경북 도매상2', type: 'Wholesaler', coordinates: [128.3300, 36.1400] },
    { id: 'KB_WS3', name: '경북 도매상3', type: 'Wholesaler', coordinates: [128.3700, 36.1000] },
    { id: 'KN_WS1', name: '경남 도매상1', type: 'Wholesaler', coordinates: [128.6800, 35.2300] },
    { id: 'KN_WS2', name: '경남 도매상2', type: 'Wholesaler', coordinates: [128.6600, 35.2500] },
    { id: 'KN_WS3', name: '경남 도매상3', type: 'Wholesaler', coordinates: [128.7000, 35.2100] },

    // 리셀러 (Resellers) - CSV의 모든 데이터를 반영
    // (id는 CSV의 '..._Rsell1'를 '..._R1'과 같이 축약하여 사용)
    { id: 'SEL_WS1_R1', name: '리셀러 (수도권1-1)', type: 'Reseller', coordinates: [126.9810, 37.5620] },
    { id: 'SEL_WS1_R2', name: '리셀러 (수도권1-2)', type: 'Reseller', coordinates: [126.9790, 37.5590] },
    { id: 'SEL_WS1_R3', name: '리셀러 (수도권1-3)', type: 'Reseller', coordinates: [126.9830, 37.5610] },
    { id: 'SEL_WS2_R1', name: '리셀러 (수도권2-1)', type: 'Reseller', coordinates: [126.9510, 37.6010] },
    { id: 'SEL_WS2_R2', name: '리셀러 (수도권2-2)', type: 'Reseller', coordinates: [126.9530, 37.5990] },
    { id: 'SEL_WS2_R3', name: '리셀러 (수도권2-3)', type: 'Reseller', coordinates: [126.9490, 37.6020] },
    { id: 'SEL_WS3_R1', name: '리셀러 (수도권3-1)', type: 'Reseller', coordinates: [127.0210, 37.5410] },
    { id: 'SEL_WS3_R2', name: '리셀러 (수도권3-2)', type: 'Reseller', coordinates: [127.0190, 37.5390] },
    { id: 'SEL_WS3_R3', name: '리셀러 (수도권3-3)', type: 'Reseller', coordinates: [127.0220, 37.5420] },

    { id: 'JB_WS1_R1', name: '리셀러 (전북1-1)', type: 'Reseller', coordinates: [127.1610, 35.8360] },
    { id: 'JB_WS1_R2', name: '리셀러 (전북1-2)', type: 'Reseller', coordinates: [127.1590, 35.8340] },
    { id: 'JB_WS1_R3', name: '리셀러 (전북1-3)', type: 'Reseller', coordinates: [127.1620, 35.8370] },
    { id: 'JB_WS2_R1', name: '리셀러 (전북2-1)', type: 'Reseller', coordinates: [127.1460, 35.8210] },
    { id: 'JB_WS2_R2', name: '리셀러 (전북2-2)', type: 'Reseller', coordinates: [127.1440, 35.8230] },
    { id: 'JB_WS2_R3', name: '리셀러 (전북2-3)', type: 'Reseller', coordinates: [127.1470, 35.8220] },
    { id: 'JB_WS3_R1', name: '리셀러 (전북3-1)', type: 'Reseller', coordinates: [127.1560, 35.8260] },
    { id: 'JB_WS3_R2', name: '리셀러 (전북3-2)', type: 'Reseller', coordinates: [127.1540, 35.8240] },
    { id: 'JB_WS3_R3', name: '리셀러 (전북3-3)', type: 'Reseller', coordinates: [127.1570, 35.8270] },

    { id: 'JN_WS1_R1', name: '리셀러 (전남1-1)', type: 'Reseller', coordinates: [126.3960, 34.8160] },
    { id: 'JN_WS1_R2', name: '리셀러 (전남1-2)', type: 'Reseller', coordinates: [126.3940, 34.8140] },
    { id: 'JN_WS1_R3', name: '리셀러 (전남1-3)', type: 'Reseller', coordinates: [126.3970, 34.8170] },
    { id: 'JN_WS2_R1', name: '리셀러 (전남2-1)', type: 'Reseller', coordinates: [126.3860, 34.8260] },
    { id: 'JN_WS2_R2', name: '리셀러 (전남2-2)', type: 'Reseller', coordinates: [126.3840, 34.8240] },
    { id: 'JN_WS2_R3', name: '리셀러 (전남2-3)', type: 'Reseller', coordinates: [126.3870, 34.8270] },
    { id: 'JN_WS3_R1', name: '리셀러 (전남3-1)', type: 'Reseller', coordinates: [126.4010, 34.8110] },
    { id: 'JN_WS3_R2', name: '리셀러 (전남3-2)', type: 'Reseller', coordinates: [126.3990, 34.8090] },
    { id: 'JN_WS3_R3', name: '리셀러 (전남3-3)', type: 'Reseller', coordinates: [126.4020, 34.8120] },

    { id: 'KB_WS1_R1', name: '리셀러 (경북1-1)', type: 'Reseller', coordinates: [128.3460, 36.1360] },
    { id: 'KB_WS1_R2', name: '리셀러 (경북1-2)', type: 'Reseller', coordinates: [128.3440, 36.1340] },
    { id: 'KB_WS1_R3', name: '리셀러 (경북1-3)', type: 'Reseller', coordinates: [128.3470, 36.1370] },
    { id: 'KB_WS2_R1', name: '리셀러 (경북2-1)', type: 'Reseller', coordinates: [128.3360, 36.1460] },
    { id: 'KB_WS2_R2', name: '리셀러 (경북2-2)', type: 'Reseller', coordinates: [128.3340, 36.1440] },
    { id: 'KB_WS2_R3', name: '리셀러 (경북2-3)', type: 'Reseller', coordinates: [128.3370, 36.1470] },
    { id: 'KB_WS3_R1', name: '리셀러 (경북3-1)', type: 'Reseller', coordinates: [128.3510, 36.1260] },
    { id: 'KB_WS3_R2', name: '리셀러 (경북3-2)', type: 'Reseller', coordinates: [128.3490, 36.1240] },
    { id: 'KB_WS3_R3', name: '리셀러 (경북3-3)', type: 'Reseller', coordinates: [128.3520, 36.1270] },

    { id: 'KN_WS1_R1', name: '리셀러 (경남1-1)', type: 'Reseller', coordinates: [128.6860, 35.2360] },
    { id: 'KN_WS1_R2', name: '리셀러 (경남1-2)', type: 'Reseller', coordinates: [128.6840, 35.2340] },
    { id: 'KN_WS1_R3', name: '리셀러 (경남1-3)', type: 'Reseller', coordinates: [128.6870, 35.2370] },
    { id: 'KN_WS2_R1', name: '리셀러 (경남2-1)', type: 'Reseller', coordinates: [128.6760, 35.2260] },
    { id: 'KN_WS2_R2', name: '리셀러 (경남2-2)', type: 'Reseller', coordinates: [128.6740, 35.2240] },
    { id: 'KN_WS2_R3', name: '리셀러 (경남2-3)', type: 'Reseller', coordinates: [128.6770, 35.2270] },
    { id: 'KN_WS3_R1', name: '리셀러 (경남3-1)', type: 'Reseller', coordinates: [128.6910, 35.2410] },
    { id: 'KN_WS3_R2', name: '리셀러 (경남3-2)', type: 'Reseller', coordinates: [128.6890, 35.2390] },
    { id: 'KN_WS3_R3', name: '리셀러 (경남3-3)', type: 'Reseller', coordinates: [128.6920, 35.2420] },
];

// --- 2. 이동 경로 데이터 (Trips) ---
// 좌표를 쉽게 찾기 위한 헬퍼 맵
const nodeCoords = new Map<string, [number, number]>(nodes.map(n => [n.id, n.coordinates]));

export const trips: Trip[] = [
    // === 시나리오 1: 인천공장(ICN) -> 수도권허브(SEL) -> 수도권 도매상(SEL_WS) -> 리셀러 ===
    { from: 'ICN_WMS', to: 'SEL_Logi_HUB', path: [nodeCoords.get('ICN_WMS')!, nodeCoords.get('SEL_Logi_HUB')!], timestamps: [10, 120], product: 'Product A' },
    { from: 'SEL_Logi_HUB', to: 'SEL_WS1', path: [nodeCoords.get('SEL_Logi_HUB')!, nodeCoords.get('SEL_WS1')!], timestamps: [150, 180], product: 'Product A' },
    { from: 'SEL_Logi_HUB', to: 'SEL_WS2', path: [nodeCoords.get('SEL_Logi_HUB')!, nodeCoords.get('SEL_WS2')!], timestamps: [160, 200], product: 'Product B' },
    
    // === 시나리오 2: 화성공장(HWS) -> 수도권허브(SEL) & 경남허브(KN)로 분산 -> 각 지역 도매상 ===
    { from: 'HWS_WMS', to: 'SEL_Logi_HUB', path: [nodeCoords.get('HWS_WMS')!, nodeCoords.get('SEL_Logi_HUB')!], timestamps: [50, 100], product: 'Product C' },
    { from: 'HWS_WMS', to: 'KN_Logi_HUB', path: [nodeCoords.get('HWS_WMS')!, nodeCoords.get('KN_Logi_HUB')!], timestamps: [60, 480], product: 'Product D' },
    { from: 'SEL_Logi_HUB', to: 'SEL_WS3', path: [nodeCoords.get('SEL_Logi_HUB')!, nodeCoords.get('SEL_WS3')!], timestamps: [120, 150], product: 'Product C' },
    { from: 'KN_Logi_HUB', to: 'KN_WS1', path: [nodeCoords.get('KN_Logi_HUB')!, nodeCoords.get('KN_WS1')!], timestamps: [500, 520], product: 'Product D' },
    { from: 'KN_Logi_HUB', to: 'KN_WS2', path: [nodeCoords.get('KN_Logi_HUB')!, nodeCoords.get('KN_WS2')!], timestamps: [510, 540], product: 'Product D' },
    { from: 'KN_Logi_HUB', to: 'KN_WS3', path: [nodeCoords.get('KN_Logi_HUB')!, nodeCoords.get('KN_WS3')!], timestamps: [515, 545], product: 'Product D' }, // KN_WS3 경로 추가

    // === 시나리오 3: 구미공장(KUM) -> 경북허브(KB) & 전북허브(JB)로 분산 (지역간 이동) ===
    { from: 'KUM_WMS', to: 'KB_Logi_HUB', path: [nodeCoords.get('KUM_WMS')!, nodeCoords.get('KB_Logi_HUB')!], timestamps: [30, 80], product: 'Product E' },
    { from: 'KUM_WMS', to: 'JB_Logi_HUB', path: [nodeCoords.get('KUM_WMS')!, nodeCoords.get('JB_Logi_HUB')!], timestamps: [40, 290], product: 'Product F' },
    { from: 'KB_Logi_HUB', to: 'KB_WS1', path: [nodeCoords.get('KB_Logi_HUB')!, nodeCoords.get('KB_WS1')!], timestamps: [100, 110], product: 'Product E' },
    { from: 'KB_Logi_HUB', to: 'KB_WS2', path: [nodeCoords.get('KB_Logi_HUB')!, nodeCoords.get('KB_WS2')!], timestamps: [110, 150], product: 'Product E' },
    { from: 'KB_Logi_HUB', to: 'KB_WS3', path: [nodeCoords.get('KB_Logi_HUB')!, nodeCoords.get('KB_WS3')!], timestamps: [120, 130], product: 'Product E' },
    { from: 'JB_Logi_HUB', to: 'JB_WS1', path: [nodeCoords.get('JB_Logi_HUB')!, nodeCoords.get('JB_WS1')!], timestamps: [320, 330], product: 'Product F' },
    { from: 'JB_Logi_HUB', to: 'JB_WS2', path: [nodeCoords.get('JB_Logi_HUB')!, nodeCoords.get('JB_WS2')!], timestamps: [330, 370], product: 'Product F' },

    // === 시나리오 4: 양산공장(YGS) -> 전남허브(JN) & 전북허브(JB) -> 각 지역 도매상 ===
    { from: 'YGS_WMS', to: 'JN_Logi_HUB', path: [nodeCoords.get('YGS_WMS')!, nodeCoords.get('JN_Logi_HUB')!], timestamps: [20, 90], product: 'Product G' },
    { from: 'YGS_WMS', to: 'JB_Logi_HUB', path: [nodeCoords.get('YGS_WMS')!, nodeCoords.get('JB_Logi_HUB')!], timestamps: [30, 150], product: 'Product G' },
    { from: 'JN_Logi_HUB', to: 'JN_WS1', path: [nodeCoords.get('JN_Logi_HUB')!, nodeCoords.get('JN_WS1')!], timestamps: [110, 120], product: 'Product G' },
    { from: 'JN_Logi_HUB', to: 'JN_WS2', path: [nodeCoords.get('JN_Logi_HUB')!, nodeCoords.get('JN_WS2')!], timestamps: [120, 180], product: 'Product G' },
    { from: 'JN_Logi_HUB', to: 'JN_WS3', path: [nodeCoords.get('JN_Logi_HUB')!, nodeCoords.get('JN_WS3')!], timestamps: [130, 220], product: 'Product G' },
    { from: 'JB_Logi_HUB', to: 'JB_WS3', path: [nodeCoords.get('JB_Logi_HUB')!, nodeCoords.get('JB_WS3')!], timestamps: [180, 250], product: 'Product G' },

    // === 시나리오 5: 도매상(Wholesaler) -> 리셀러(Reseller) [신규 추가된 전체 경로] ===
    // SEL_WS1 (Product A 도착: 180)
    { from: 'SEL_WS1', to: 'SEL_WS1_R1', path: [nodeCoords.get('SEL_WS1')!, nodeCoords.get('SEL_WS1_R1')!], timestamps: [220, 225], product: 'Product A' },
    { from: 'SEL_WS1', to: 'SEL_WS1_R2', path: [nodeCoords.get('SEL_WS1')!, nodeCoords.get('SEL_WS1_R2')!], timestamps: [230, 235], product: 'Product A' },
    { from: 'SEL_WS1', to: 'SEL_WS1_R3', path: [nodeCoords.get('SEL_WS1')!, nodeCoords.get('SEL_WS1_R3')!], timestamps: [240, 245], product: 'Product A' },
    // SEL_WS2 (Product B 도착: 200)
    { from: 'SEL_WS2', to: 'SEL_WS2_R1', path: [nodeCoords.get('SEL_WS2')!, nodeCoords.get('SEL_WS2_R1')!], timestamps: [250, 255], product: 'Product B' },
    { from: 'SEL_WS2', to: 'SEL_WS2_R2', path: [nodeCoords.get('SEL_WS2')!, nodeCoords.get('SEL_WS2_R2')!], timestamps: [260, 265], product: 'Product B' },
    { from: 'SEL_WS2', to: 'SEL_WS2_R3', path: [nodeCoords.get('SEL_WS2')!, nodeCoords.get('SEL_WS2_R3')!], timestamps: [270, 275], product: 'Product B' },
    // SEL_WS3 (Product C 도착: 150)
    { from: 'SEL_WS3', to: 'SEL_WS3_R1', path: [nodeCoords.get('SEL_WS3')!, nodeCoords.get('SEL_WS3_R1')!], timestamps: [190, 195], product: 'Product C' },
    { from: 'SEL_WS3', to: 'SEL_WS3_R2', path: [nodeCoords.get('SEL_WS3')!, nodeCoords.get('SEL_WS3_R2')!], timestamps: [200, 205], product: 'Product C' },
    { from: 'SEL_WS3', to: 'SEL_WS3_R3', path: [nodeCoords.get('SEL_WS3')!, nodeCoords.get('SEL_WS3_R3')!], timestamps: [210, 215], product: 'Product C' },
    
    // JB_WS1 (Product F 도착: 330)
    { from: 'JB_WS1', to: 'JB_WS1_R1', path: [nodeCoords.get('JB_WS1')!, nodeCoords.get('JB_WS1_R1')!], timestamps: [350, 355], product: 'Product F' },
    { from: 'JB_WS1', to: 'JB_WS1_R2', path: [nodeCoords.get('JB_WS1')!, nodeCoords.get('JB_WS1_R2')!], timestamps: [360, 365], product: 'Product F' },
    { from: 'JB_WS1', to: 'JB_WS1_R3', path: [nodeCoords.get('JB_WS1')!, nodeCoords.get('JB_WS1_R3')!], timestamps: [370, 375], product: 'Product F' },
    // JB_WS2 (Product F 도착: 370)
    { from: 'JB_WS2', to: 'JB_WS2_R1', path: [nodeCoords.get('JB_WS2')!, nodeCoords.get('JB_WS2_R1')!], timestamps: [400, 405], product: 'Product F' },
    { from: 'JB_WS2', to: 'JB_WS2_R2', path: [nodeCoords.get('JB_WS2')!, nodeCoords.get('JB_WS2_R2')!], timestamps: [410, 415], product: 'Product F' },
    { from: 'JB_WS2', to: 'JB_WS2_R3', path: [nodeCoords.get('JB_WS2')!, nodeCoords.get('JB_WS2_R3')!], timestamps: [420, 425], product: 'Product F' },
    // JB_WS3 (Product G 도착: 250)
    { from: 'JB_WS3', to: 'JB_WS3_R1', path: [nodeCoords.get('JB_WS3')!, nodeCoords.get('JB_WS3_R1')!], timestamps: [280, 285], product: 'Product G' },
    { from: 'JB_WS3', to: 'JB_WS3_R2', path: [nodeCoords.get('JB_WS3')!, nodeCoords.get('JB_WS3_R2')!], timestamps: [290, 295], product: 'Product G' },
    { from: 'JB_WS3', to: 'JB_WS3_R3', path: [nodeCoords.get('JB_WS3')!, nodeCoords.get('JB_WS3_R3')!], timestamps: [300, 305], product: 'Product G' },

    // JN_WS1 (Product G 도착: 120)
    { from: 'JN_WS1', to: 'JN_WS1_R1', path: [nodeCoords.get('JN_WS1')!, nodeCoords.get('JN_WS1_R1')!], timestamps: [140, 145], product: 'Product G' },
    { from: 'JN_WS1', to: 'JN_WS1_R2', path: [nodeCoords.get('JN_WS1')!, nodeCoords.get('JN_WS1_R2')!], timestamps: [150, 155], product: 'Product G' },
    { from: 'JN_WS1', to: 'JN_WS1_R3', path: [nodeCoords.get('JN_WS1')!, nodeCoords.get('JN_WS1_R3')!], timestamps: [160, 165], product: 'Product G' },
    // JN_WS2 (Product G 도착: 180)
    { from: 'JN_WS2', to: 'JN_WS2_R1', path: [nodeCoords.get('JN_WS2')!, nodeCoords.get('JN_WS2_R1')!], timestamps: [200, 205], product: 'Product G' },
    { from: 'JN_WS2', to: 'JN_WS2_R2', path: [nodeCoords.get('JN_WS2')!, nodeCoords.get('JN_WS2_R2')!], timestamps: [210, 215], product: 'Product G' },
    { from: 'JN_WS2', to: 'JN_WS2_R3', path: [nodeCoords.get('JN_WS2')!, nodeCoords.get('JN_WS2_R3')!], timestamps: [220, 225], product: 'Product G' },
    // JN_WS3 (Product G 도착: 220)
    { from: 'JN_WS3', to: 'JN_WS3_R1', path: [nodeCoords.get('JN_WS3')!, nodeCoords.get('JN_WS3_R1')!], timestamps: [240, 245], product: 'Product G' },
    { from: 'JN_WS3', to: 'JN_WS3_R2', path: [nodeCoords.get('JN_WS3')!, nodeCoords.get('JN_WS3_R2')!], timestamps: [250, 255], product: 'Product G' },
    { from: 'JN_WS3', to: 'JN_WS3_R3', path: [nodeCoords.get('JN_WS3')!, nodeCoords.get('JN_WS3_R3')!], timestamps: [260, 265], product: 'Product G' },
    
    // KB_WS1 (Product E 도착: 110)
    { from: 'KB_WS1', to: 'KB_WS1_R1', path: [nodeCoords.get('KB_WS1')!, nodeCoords.get('KB_WS1_R1')!], timestamps: [130, 135], product: 'Product E' },
    { from: 'KB_WS1', to: 'KB_WS1_R2', path: [nodeCoords.get('KB_WS1')!, nodeCoords.get('KB_WS1_R2')!], timestamps: [140, 145], product: 'Product E' },
    { from: 'KB_WS1', to: 'KB_WS1_R3', path: [nodeCoords.get('KB_WS1')!, nodeCoords.get('KB_WS1_R3')!], timestamps: [150, 155], product: 'Product E' },
    // KB_WS2 (Product E 도착: 150)
    { from: 'KB_WS2', to: 'KB_WS2_R1', path: [nodeCoords.get('KB_WS2')!, nodeCoords.get('KB_WS2_R1')!], timestamps: [170, 175], product: 'Product E' },
    { from: 'KB_WS2', to: 'KB_WS2_R2', path: [nodeCoords.get('KB_WS2')!, nodeCoords.get('KB_WS2_R2')!], timestamps: [180, 185], product: 'Product E' },
    { from: 'KB_WS2', to: 'KB_WS2_R3', path: [nodeCoords.get('KB_WS2')!, nodeCoords.get('KB_WS2_R3')!], timestamps: [190, 195], product: 'Product E' },
    // KB_WS3 (Product E 도착: 130)
    { from: 'KB_WS3', to: 'KB_WS3_R1', path: [nodeCoords.get('KB_WS3')!, nodeCoords.get('KB_WS3_R1')!], timestamps: [150, 155], product: 'Product E' },
    { from: 'KB_WS3', to: 'KB_WS3_R2', path: [nodeCoords.get('KB_WS3')!, nodeCoords.get('KB_WS3_R2')!], timestamps: [160, 165], product: 'Product E' },
    { from: 'KB_WS3', to: 'KB_WS3_R3', path: [nodeCoords.get('KB_WS3')!, nodeCoords.get('KB_WS3_R3')!], timestamps: [170, 175], product: 'Product E' },

    // KN_WS1 (Product D 도착: 520)
    { from: 'KN_WS1', to: 'KN_WS1_R1', path: [nodeCoords.get('KN_WS1')!, nodeCoords.get('KN_WS1_R1')!], timestamps: [540, 545], product: 'Product D' },
    { from: 'KN_WS1', to: 'KN_WS1_R2', path: [nodeCoords.get('KN_WS1')!, nodeCoords.get('KN_WS1_R2')!], timestamps: [550, 555], product: 'Product D' },
    { from: 'KN_WS1', to: 'KN_WS1_R3', path: [nodeCoords.get('KN_WS1')!, nodeCoords.get('KN_WS1_R3')!], timestamps: [560, 565], product: 'Product D' },
    // KN_WS2 (Product D 도착: 540)
    { from: 'KN_WS2', to: 'KN_WS2_R1', path: [nodeCoords.get('KN_WS2')!, nodeCoords.get('KN_WS2_R1')!], timestamps: [580, 585], product: 'Product D' },
    { from: 'KN_WS2', to: 'KN_WS2_R2', path: [nodeCoords.get('KN_WS2')!, nodeCoords.get('KN_WS2_R2')!], timestamps: [590, 595], product: 'Product D' },
    { from: 'KN_WS2', to: 'KN_WS2_R3', path: [nodeCoords.get('KN_WS2')!, nodeCoords.get('KN_WS2_R3')!], timestamps: [600, 605], product: 'Product D' },
    // KN_WS3 (Product D 도착: 545)
    { from: 'KN_WS3', to: 'KN_WS3_R1', path: [nodeCoords.get('KN_WS3')!, nodeCoords.get('KN_WS3_R1')!], timestamps: [570, 575], product: 'Product D' },
    { from: 'KN_WS3', to: 'KN_WS3_R2', path: [nodeCoords.get('KN_WS3')!, nodeCoords.get('KN_WS3_R2')!], timestamps: [580, 585], product: 'Product D' },
    { from: 'KN_WS3', to: 'KN_WS3_R3', path: [nodeCoords.get('KN_WS3')!, nodeCoords.get('KN_WS3_R3')!], timestamps: [590, 595], product: 'Product D' },
];

const baseTrips: Omit<AnalyzedTrip, 'anomaly'>[] = trips.map((trip, index) => ({
    ...trip,
    id: `trip-${index}`
}));

// 위변조 데이터를 생성할 가상의 AI 분석 로직
export const analyzedTrips: AnalyzedTrip[] = [...baseTrips];

// --- 시나리오 적용 ---

// 1. 시공간 점프 (Space Jump): 화성 -> 경남 허브
// 가장 장거리인 경로를 선정하여, 비정상적으로 빠른 도착 시간으로 조작
const spaceJumpTrip = analyzedTrips.find(t => t.from === 'HWS_WMS' && t.to === 'KN_Logi_HUB');
if (spaceJumpTrip) {
    spaceJumpTrip.timestamps = [60, 90]; // 도착 시간을 480 -> 90으로 극단적으로 단축
    spaceJumpTrip.anomaly = {
        type: 'SPACE_JUMP',
        travelTime: 30, // 30 단위 시간 (30시간)
        distance: 280 // 대략적인 거리 (km)
    };
}

// 2. 경로 위조 (Path Fake): 구미 -> 전북 허브
// 중간에 가상의 '의심 지역'을 경유하도록 실제 경로를 수정하고, 예정 경로 정보를 추가
const pathFakeTrip = analyzedTrips.find(t => t.from === 'KUM_WMS' && t.to === 'JB_Logi_HUB');
if (pathFakeTrip) {
    const originalPath = pathFakeTrip.path;
    const bypassedNodeCoords: [number, number] = [127.8, 36.0]; // 충북 영동군 어딘가
    pathFakeTrip.path = [originalPath[0], bypassedNodeCoords]; // 실제 경로는 의심 지역까지
    // 참고: 시각화를 위해선 의심지역->도착지 경로도 추가 데이터로 필요하지만, 여기선 개념만 표현
    pathFakeTrip.anomaly = {
        type: 'PATH_FAKE',
        expectedPath: originalPath, // 원래 갔어야 할 경로
        bypassedNode: { name: '미승인 경유지', coordinates: bypassedNodeCoords }
    };
}

// 3. 이벤트 순서 오류 (Order Error): 전남 도매상 -> 리셀러
// '도착'보다 '출발'이 늦게 일어난 것처럼 타임스탬프를 뒤집음
const orderErrorTrip = analyzedTrips.find(t => t.from === 'JN_WS1' && t.to === 'JN_WS1_R1');
if (orderErrorTrip) {
    orderErrorTrip.timestamps = [150, 145]; // [140, 145] -> [150, 145]
    orderErrorTrip.anomaly = {
        type: 'ORDER_ERROR',
        previousEventTime: 120, // 도매상 도착 시간
        currentEventTime: 150, // 리셀러로 출발한 시간 (오류)
    };
}

// 4. 복제 (Cloning): 경남 허브 -> 도매상들
// 한 허브에서 여러 곳으로 가는 경로 중 일부를 '복제'된 것으로 가정
const cloneTrips = analyzedTrips.filter(t => t.from === 'KN_Logi_HUB');
if (cloneTrips.length > 1) {
    const originalTripId = cloneTrips[0].id;
    cloneTrips.forEach((trip, index) => {
        if (index > 0) { // 첫 번째를 제외한 나머지를 복제품으로 처리
            trip.anomaly = {
                type: 'CLONE',
                cloneCount: cloneTrips.length,
                originalTripId: originalTripId
            };
        }
    });
}