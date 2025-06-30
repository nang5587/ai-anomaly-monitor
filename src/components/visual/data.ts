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

// --- 1. 노드 데이터 (모든 지점 포함) ---
// 한국 지도 위에 논리적으로 그럴듯한 가상 좌표를 부여했습니다.
export const nodes: Node[] = [
    // 공장 (Factories)
    { id: 'ICN_Factory', name: '인천 공장', type: 'Factory', coordinates: [126.65, 37.45] },
    { id: 'HWS_Factory', name: '화성 공장', type: 'Factory', coordinates: [126.83, 37.20] },
    { id: 'YGS_Factory', name: '영광 공장', type: 'Factory', coordinates: [126.51, 35.27] },
    { id: 'KUM_Factory', name: '구미 공장', type: 'Factory', coordinates: [128.33, 36.11] },

    // 창고 (WMS) - 공장과 같은 위치로 가정
    { id: 'ICN_WMS', name: '인천 창고', type: 'WMS', coordinates: [126.65, 37.45] },
    { id: 'HWS_WMS', name: '화성 창고', type: 'WMS', coordinates: [126.83, 37.20] },
    { id: 'YGS_WMS', name: '영광 창고', type: 'WMS', coordinates: [126.51, 35.27] },
    { id: 'KUM_WMS', name: '구미 창고', type: 'WMS', coordinates: [128.33, 36.11] },

    // 물류 허브 (Logistics Hubs)
    { id: 'SEL_Logi_HUB', name: '수도권 허브', type: 'LogiHub', coordinates: [127.10, 37.40] }, // 군포/의왕 근처
    { id: 'JB_Logi_HUB', name: '전북 허브', type: 'LogiHub', coordinates: [127.14, 35.82] },   // 전주
    { id: 'JN_Logi_HUB', name: '전남 허브', type: 'LogiHub', coordinates: [126.85, 35.16] },   // 광주
    { id: 'KB_Logi_HUB', name: '경북 허브', type: 'LogiHub', coordinates: [128.59, 35.87] },   // 대구
    { id: 'KN_Logi_HUB', name: '경남 허브', type: 'LogiHub', coordinates: [128.88, 35.22] },   // 김해/부산 근처

    // 수도권 도매상 (Wholesalers - SEL)
    { id: 'SEL_WS1', name: '수도권 도매상1', type: 'Wholesaler', coordinates: [127.02, 37.58] }, // 서울 북부
    { id: 'SEL_WS2', name: '수도권 도매상2', type: 'Wholesaler', coordinates: [126.84, 37.50] }, // 서울 서부
    { id: 'SEL_WS3', name: '수도권 도매상3', type: 'Wholesaler', coordinates: [127.10, 37.51] }, // 서울 동부

    // 전북 도매상 (Wholesalers - JB)
    { id: 'JB_WS1', name: '전북 도매상1', type: 'Wholesaler', coordinates: [127.15, 35.84] },
    { id: 'JB_WS2', name: '전북 도매상2', type: 'Wholesaler', coordinates: [126.88, 35.94] }, // 군산 근처
    { id: 'JB_WS3', name: '전북 도매상3', type: 'Wholesaler', coordinates: [127.08, 35.47] }, // 남원 근처

    // 전남 도매상 (Wholesalers - JN)
    { id: 'JN_WS1', name: '전남 도매상1', type: 'Wholesaler', coordinates: [126.90, 35.15] },
    { id: 'JN_WS2', name: '전남 도매상2', type: 'Wholesaler', coordinates: [126.39, 34.81] }, // 목포
    { id: 'JN_WS3', name: '전남 도매상3', type: 'Wholesaler', coordinates: [127.49, 34.90] }, // 여수/순천

    // 경북 도매상 (Wholesalers - KB)
    { id: 'KB_WS1', name: '경북 도매상1', type: 'Wholesaler', coordinates: [128.62, 35.88] },
    { id: 'KB_WS2', name: '경북 도매상2', type: 'Wholesaler', coordinates: [129.21, 36.01] }, // 포항
    { id: 'KB_WS3', name: '경북 도매상3', type: 'Wholesaler', coordinates: [128.35, 36.13] }, // 구미

    // 경남 도매상 (Wholesalers - KN)
    { id: 'KN_WS1', name: '경남 도매상1', type: 'Wholesaler', coordinates: [128.95, 35.20] },
    { id: 'KN_WS2', name: '경남 도매상2', type: 'Wholesaler', coordinates: [128.69, 35.23] }, // 창원
    { id: 'KN_WS3', name: '경남 도매상3', type: 'Wholesaler', coordinates: [128.10, 35.18] }, // 진주

    // 리셀러 (Resellers) - 도매상 주변에 가상으로 배치
    { id: 'SEL_WS1_R1', name: '리셀러 (수도권1-1)', type: 'Reseller', coordinates: [127.03, 37.60] },
    { id: 'SEL_WS1_R2', name: '리셀러 (수도권1-2)', type: 'Reseller', coordinates: [127.01, 37.59] },
    { id: 'KN_WS2_R1', name: '리셀러 (경남2-1)', type: 'Reseller', coordinates: [128.70, 35.25] },
    { id: 'KB_WS2_R1', name: '리셀러 (경북2-1)', type: 'Reseller', coordinates: [129.23, 36.03] },
];

// --- 2. 이동 경로 데이터 (Trips) ---
// 실제 데이터에서는 event_time을 파싱하여 동적으로 생성해야 합니다.
// 여기서는 0부터 시작하는 가상의 시간(분)을 타임스탬프로 사용합니다.

// 좌표를 쉽게 찾기 위한 헬퍼 맵
const nodeCoords = new Map<string, [number, number]>(nodes.map(n => [n.id, n.coordinates]));

export const trips: Trip[] = [
    // === 시나리오 1: 인천공장(ICN) -> 수도권허브(SEL) -> 수도권 도매상(SEL_WS) -> 리셀러 ===
    { from: 'ICN_WMS', to: 'SEL_Logi_HUB', path: [nodeCoords.get('ICN_WMS')!, nodeCoords.get('SEL_Logi_HUB')!], timestamps: [10, 120], product: 'Product A' },
    { from: 'SEL_Logi_HUB', to: 'SEL_WS1', path: [nodeCoords.get('SEL_Logi_HUB')!, nodeCoords.get('SEL_WS1')!], timestamps: [150, 180], product: 'Product A' },
    { from: 'SEL_Logi_HUB', to: 'SEL_WS2', path: [nodeCoords.get('SEL_Logi_HUB')!, nodeCoords.get('SEL_WS2')!], timestamps: [160, 200], product: 'Product B' },
    { from: 'SEL_WS1', to: 'SEL_WS1_R1', path: [nodeCoords.get('SEL_WS1')!, nodeCoords.get('SEL_WS1_R1')!], timestamps: [220, 225], product: 'Product A' },
    { from: 'SEL_WS1', to: 'SEL_WS1_R2', path: [nodeCoords.get('SEL_WS1')!, nodeCoords.get('SEL_WS1_R2')!], timestamps: [230, 235], product: 'Product A' },

    // === 시나리오 2: 화성공장(HWS) -> 수도권허브(SEL) & 경남허브(KN)로 분산 -> 각 지역 도매상 ===
    { from: 'HWS_WMS', to: 'SEL_Logi_HUB', path: [nodeCoords.get('HWS_WMS')!, nodeCoords.get('SEL_Logi_HUB')!], timestamps: [50, 100], product: 'Product C' },
    { from: 'HWS_WMS', to: 'KN_Logi_HUB', path: [nodeCoords.get('HWS_WMS')!, nodeCoords.get('KN_Logi_HUB')!], timestamps: [60, 480], product: 'Product D' },
    { from: 'SEL_Logi_HUB', to: 'SEL_WS3', path: [nodeCoords.get('SEL_Logi_HUB')!, nodeCoords.get('SEL_WS3')!], timestamps: [120, 150], product: 'Product C' },
    { from: 'KN_Logi_HUB', to: 'KN_WS1', path: [nodeCoords.get('KN_Logi_HUB')!, nodeCoords.get('KN_WS1')!], timestamps: [500, 520], product: 'Product D' },
    { from: 'KN_Logi_HUB', to: 'KN_WS2', path: [nodeCoords.get('KN_Logi_HUB')!, nodeCoords.get('KN_WS2')!], timestamps: [510, 540], product: 'Product D' },
    { from: 'KN_WS2', to: 'KN_WS2_R1', path: [nodeCoords.get('KN_WS2')!, nodeCoords.get('KN_WS2_R1')!], timestamps: [580, 585], product: 'Product D' },

    // === 시나리오 3: 구미공장(KUM) -> 경북허브(KB) & 전북허브(JB)로 분산 (지역간 이동) ===
    { from: 'KUM_WMS', to: 'KB_Logi_HUB', path: [nodeCoords.get('KUM_WMS')!, nodeCoords.get('KB_Logi_HUB')!], timestamps: [30, 80], product: 'Product E' },
    { from: 'KUM_WMS', to: 'JB_Logi_HUB', path: [nodeCoords.get('KUM_WMS')!, nodeCoords.get('JB_Logi_HUB')!], timestamps: [40, 290], product: 'Product F' },
    { from: 'KB_Logi_HUB', to: 'KB_WS1', path: [nodeCoords.get('KB_Logi_HUB')!, nodeCoords.get('KB_WS1')!], timestamps: [100, 110], product: 'Product E' },
    { from: 'KB_Logi_HUB', to: 'KB_WS2', path: [nodeCoords.get('KB_Logi_HUB')!, nodeCoords.get('KB_WS2')!], timestamps: [110, 150], product: 'Product E' },
    { from: 'KB_Logi_HUB', to: 'KB_WS3', path: [nodeCoords.get('KB_Logi_HUB')!, nodeCoords.get('KB_WS3')!], timestamps: [120, 130], product: 'Product E' },
    { from: 'JB_Logi_HUB', to: 'JB_WS1', path: [nodeCoords.get('JB_Logi_HUB')!, nodeCoords.get('JB_WS1')!], timestamps: [320, 330], product: 'Product F' },
    { from: 'JB_Logi_HUB', to: 'JB_WS2', path: [nodeCoords.get('JB_Logi_HUB')!, nodeCoords.get('JB_WS2')!], timestamps: [330, 370], product: 'Product F' },

    // === 시나리오 4: 영광공장(YGS) -> 전남허브(JN) & 전북허브(JB) -> 각 지역 도매상 ===
    { from: 'YGS_WMS', to: 'JN_Logi_HUB', path: [nodeCoords.get('YGS_WMS')!, nodeCoords.get('JN_Logi_HUB')!], timestamps: [20, 90], product: 'Product G' },
    { from: 'YGS_WMS', to: 'JB_Logi_HUB', path: [nodeCoords.get('YGS_WMS')!, nodeCoords.get('JB_Logi_HUB')!], timestamps: [30, 150], product: 'Product G' },
    { from: 'JN_Logi_HUB', to: 'JN_WS1', path: [nodeCoords.get('JN_Logi_HUB')!, nodeCoords.get('JN_WS1')!], timestamps: [110, 120], product: 'Product G' },
    { from: 'JN_Logi_HUB', to: 'JN_WS2', path: [nodeCoords.get('JN_Logi_HUB')!, nodeCoords.get('JN_WS2')!], timestamps: [120, 180], product: 'Product G' },
    { from: 'JN_Logi_HUB', to: 'JN_WS3', path: [nodeCoords.get('JN_Logi_HUB')!, nodeCoords.get('JN_WS3')!], timestamps: [130, 220], product: 'Product G' },
    { from: 'JB_Logi_HUB', to: 'JB_WS3', path: [nodeCoords.get('JB_Logi_HUB')!, nodeCoords.get('JB_WS3')!], timestamps: [180, 250], product: 'Product G' },

];