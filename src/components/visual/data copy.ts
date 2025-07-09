// Data.ts

/**
 * 시각화에 사용될 각 노드(위치)의 타입 정의
 * @param id - 고유 식별자 (데이터 연결에 사용)
 * @param name - 화면에 표시될 이름 (툴팁 등)
 * @param type - 노드의 종류 (색상이나 크기를 다르게 할 때 사용)
 * @param coord - 지도 위에 표시될 좌표 [경도, 위도]
 */
export interface Node {
    id: string;
    name: string;
    type: 'Factory' | 'WMS' | 'LogiHub' | 'Wholesaler' | 'Reseller';
    coord: [number, number];
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

export type AnomalyType = 'jump' | 'evtOrderErr' | 'epcFake' | 'epcDup' | 'locErr';

// 각 위변조 유형에 따른 추가 정보 타입 정의
export interface JumpInfo {
    type: 'jump';
    travelTime: number; // 실제 이동 시간 (분)
    distance: number; // 실제 이동 거리 (km)
}
export interface EvtOrderErrInfo {
    type: 'evtOrderErr';
    previousEventTime: number; // 이전 이벤트 발생 시각
    currentEventTime: number; // 현재 이벤트 발생 시각
}
export interface EpcFakeInfo {
    type: 'epcFake';
    invalidRule: string; // 위반한 EPC 생성 규칙
}
export interface EpcDupInfo {
    type: 'epcDup';
    conflictingTripId: string; // 충돌이 발생한 다른 Trip의 ID
}
export interface LocErrInfo {
    type: 'locErr';
    expectedPath: [[number, number], [number, number]]; // 예정 경로
    bypassedNode: { name: string; coord: [number, number] }; // 경유한 의심 지점
}

// ✨ AI 분석 결과를 포함하는 확장된 Trip 타입 (Anomaly 정보 타입 유니언 업데이트)
export interface AnalyzedTrip extends Trip {
    id: string; // 각 Trip에 고유 ID 부여
    anomaly?: JumpInfo | EvtOrderErrInfo | EpcFakeInfo | EpcDupInfo | LocErrInfo; // 위변조 정보 (옵셔널)
}

// --- 1. 노드 데이터 (58개 지점 최종 버전) ---
export const nodes: Node[] = [
    // 공장
    { id: 'ICN_Factory', name: '인천공장', type: 'Factory', coord: [126.65, 37.45] },
    { id: 'HWS_Factory', name: '화성공장', type: 'Factory', coord: [126.83, 37.20] },
    { id: 'YGS_Factory', name: '양산공장', type: 'Factory', coord: [129.04, 35.33] },
    { id: 'KUM_Factory', name: '구미공장', type: 'Factory', coord: [128.40, 36.13] },

    // 창고
    { id: 'ICN_WMS', name: '인천공장창고', type: 'WMS', coord: [126.66, 37.46] },
    { id: 'HWS_WMS', name: '화성공장창고', type: 'WMS', coord: [126.84, 37.21] },
    { id: 'YGS_WMS', name: '양산공장창고', type: 'WMS', coord: [129.05, 35.34] },
    { id: 'KUM_WMS', name: '구미공장창고', type: 'WMS', coord: [128.41, 36.14] },

    // 물류 허브
    { id: 'SEL_Logi_HUB', name: '수도권물류센터', type: 'LogiHub', coord: [127.20, 37.35] },
    { id: 'JB_Logi_HUB', name: '전북물류센터', type: 'LogiHub', coord: [127.15, 35.82] },
    { id: 'JN_Logi_HUB', name: '전남물류센터', type: 'LogiHub', coord: [126.90, 35.15] },
    { id: 'KB_Logi_HUB', name: '경북물류센터', type: 'LogiHub', coord: [128.52, 35.87] },

    // 도매상
    { id: 'SEL_WS1', name: '수도권_도매상1', type: 'Wholesaler', coord: [127.05, 37.55] },
    { id: 'SEL_WS2', name: '수도권_도매상2', type: 'Wholesaler', coord: [126.95, 37.60] },
    { id: 'SEL_WS3', name: '수도권_도매상3', type: 'Wholesaler', coord: [127.15, 37.50] },
    { id: 'JB_WS1', name: '전북_도매상1', type: 'Wholesaler', coord: [127.10, 35.90] },
    { id: 'JB_WS2', name: '전북_도매상2', type: 'Wholesaler', coord: [126.98, 35.80] },
    { id: 'JB_WS3', name: '전북_도매상3', type: 'Wholesaler', coord: [127.25, 35.75] },
    { id: 'JN_WS1', name: '전남_도매상1', type: 'Wholesaler', coord: [126.85, 35.25] },
    // { id: 'JN_WS2', ... } // JN_WS2는 58개 목록에 없으므로 주석 처리
    { id: 'JN_WS3', name: '전남_도매상3', type: 'Wholesaler', coord: [127.05, 35.10] },
    { id: 'KB_WS1', name: '경북_도매상1', type: 'Wholesaler', coord: [128.60, 35.95] },
    { id: 'KB_WS2', name: '경북_도매상2', type: 'Wholesaler', coord: [128.45, 36.00] },
    // { id: 'KB_WS3', ... } // KB_WS3는 58개 목록에 없지만 하위 리셀러가 있어 남겨둠.
    // 만약 `scan_location` 목록에 `경북_도매상3`이 없다면 이 노드도 제거해야 합니다. (우선 남겨둠)
    { id: 'KB_WS3', name: '경북_도매상3', type: 'Wholesaler', coord: [128.70, 35.80] },

    // 소매상
    { id: 'SEL_WS1_R1', name: '수도권_도매상1_권역_소매상1', type: 'Reseller', coord: [127.055, 37.555] },
    { id: 'SEL_WS1_R2', name: '수도권_도매상1_권역_소매상2', type: 'Reseller', coord: [127.045, 37.555] },
    { id: 'SEL_WS1_R3', name: '수도권_도매상1_권역_소매상3', type: 'Reseller', coord: [127.050, 37.560] },
    { id: 'SEL_WS2_R1', name: '수도권_도매상2_권역_소매상1', type: 'Reseller', coord: [126.955, 37.605] },
    { id: 'SEL_WS2_R2', name: '수도권_도매상2_권역_소매상2', type: 'Reseller', coord: [126.945, 37.605] },
    { id: 'SEL_WS2_R3', name: '수도권_도매상2_권역_소매상3', type: 'Reseller', coord: [126.950, 37.610] },
    { id: 'SEL_WS3_R1', name: '수도권_도매상3_권역_소매상1', type: 'Reseller', coord: [127.155, 37.505] },
    { id: 'SEL_WS3_R2', name: '수도권_도매상3_권역_소매상2', type: 'Reseller', coord: [127.145, 37.505] },
    { id: 'SEL_WS3_R3', name: '수도권_도매상3_권역_소매상3', type: 'Reseller', coord: [127.150, 37.510] },
    { id: 'JB_WS1_R1', name: '전북_도매상1_권역_소매상1', type: 'Reseller', coord: [127.105, 35.905] },
    { id: 'JB_WS1_R2', name: '전북_도매상1_권역_소매상2', type: 'Reseller', coord: [127.095, 35.905] },
    { id: 'JB_WS1_R3', name: '전북_도매상1_권역_소매상3', type: 'Reseller', coord: [127.100, 35.910] },
    { id: 'JB_WS2_R1', name: '전북_도매상2_권역_소매상1', type: 'Reseller', coord: [126.985, 35.805] },
    { id: 'JB_WS2_R2', name: '전북_도매상2_권역_소매상2', type: 'Reseller', coord: [126.975, 35.805] },
    { id: 'JB_WS2_R3', name: '전북_도매상2_권역_소매상3', type: 'Reseller', coord: [126.980, 35.810] },
    { id: 'JB_WS3_R1', name: '전북_도매상3_권역_소매상1', type: 'Reseller', coord: [127.255, 35.755] },
    { id: 'JB_WS3_R2', name: '전북_도매상3_권역_소매상2', type: 'Reseller', coord: [127.245, 35.755] },
    { id: 'JB_WS3_R3', name: '전북_도매상3_권역_소매상3', type: 'Reseller', coord: [127.250, 35.760] },
    { id: 'JN_WS1_R1', name: '전남_도매상1_권역_소매상1', type: 'Reseller', coord: [126.855, 35.255] },
    { id: 'JN_WS1_R2', name: '전남_도매상1_권역_소매상2', type: 'Reseller', coord: [126.845, 35.255] },
    { id: 'JN_WS1_R3', name: '전남_도매상1_권역_소매상3', type: 'Reseller', coord: [126.850, 35.260] },
    { id: 'JN_WS2_R1', name: '전남_도매상2_권역_소매상1', type: 'Reseller', coord: [126.755, 35.055] }, // 이 노드의 부모 JN_WS2가 없으므로 경로 생성 시 주의
    { id: 'JN_WS2_R2', name: '전남_도매상2_권역_소매상2', type: 'Reseller', coord: [126.745, 35.055] }, // 이 노드의 부모 JN_WS2가 없으므로 경로 생성 시 주의
    { id: 'JN_WS2_R3', name: '전남_도매상2_권역_소매상3', type: 'Reseller', coord: [126.750, 35.060] }, // 이 노드의 부모 JN_WS2가 없으므로 경로 생성 시 주의
    { id: 'JN_WS3_R1', name: '전남_도매상3_권역_소매상1', type: 'Reseller', coord: [127.055, 35.105] },
    { id: 'JN_WS3_R2', name: '전남_도매상3_권역_소매상2', type: 'Reseller', coord: [127.045, 35.105] },
    { id: 'JN_WS3_R3', name: '전남_도매상3_권역_소매상3', type: 'Reseller', coord: [127.050, 35.110] },
    { id: 'KB_WS1_R1', name: '경북_도매상1_권역_소매상1', type: 'Reseller', coord: [128.605, 35.955] },
    { id: 'KB_WS1_R2', name: '경북_도매상1_권역_소매상2', type: 'Reseller', coord: [128.595, 35.955] },
    { id: 'KB_WS1_R3', name: '경북_도매상1_권역_소매상3', type: 'Reseller', coord: [128.600, 35.960] },
    { id: 'KB_WS2_R1', name: '경북_도매상2_권역_소매상1', type: 'Reseller', coord: [128.455, 36.005] },
    { id: 'KB_WS2_R2', name: '경북_도매상2_권역_소매상2', type: 'Reseller', coord: [128.445, 36.005] },
    { id: 'KB_WS2_R3', name: '경북_도매상2_권역_소매상3', type: 'Reseller', coord: [128.450, 36.010] },
    { id: 'KB_WS3_R1', name: '경북_도매상3_권역_소매상1', type: 'Reseller', coord: [128.705, 35.805] },
    { id: 'KB_WS3_R2', name: '경북_도매상3_권역_소매상2', type: 'Reseller', coord: [128.695, 35.805] },
    { id: 'KB_WS3_R3', name: '경북_도매상3_권역_소매상3', type: 'Reseller', coord: [128.700, 35.810] },
];


// --- 2. 이동 경로 데이터 (Trips) ---
// ✅ 헬퍼 맵을 사용하여 안전하게 좌표를 가져옵니다.
const nodeCoords = new Map<string, [number, number]>(nodes.map(n => [n.id, n.coord]));

// ✅ Trip 생성을 위한 헬퍼 함수 추가: 좌표가 없는 경우를 방지
function createTrip(from: string, to: string, timestamps: [number, number], product: string): Trip | null {
    const fromCoords = nodeCoords.get(from);
    const toCoords = nodeCoords.get(to);

    if (!fromCoords || !toCoords) {
        // console.warn(`좌표를 찾을 수 없어 Trip 생성을 건너뜁니다: from=${from}, to=${to}`);
        return null;
    }

    return { from, to, path: [fromCoords, toCoords], timestamps, product };
}


// ✅ 헬퍼 함수를 사용하여 trips 배열을 생성합니다.
const trips: Trip[] = [
    // === 시나리오 1: 인천공장(ICN) -> 수도권허브(SEL) -> 수도권 도매상(SEL_WS) ===
    createTrip('ICN_WMS', 'SEL_Logi_HUB', [10, 120], 'Product A'),
    createTrip('SEL_Logi_HUB', 'SEL_WS1', [150, 180], 'Product A'),
    createTrip('SEL_Logi_HUB', 'SEL_WS2', [160, 200], 'Product B'),
    
    // === 시나리오 2: 화성공장(HWS) -> 수도권허브(SEL) -> 각 지역 도매상 ===
    // ❌ 경남(KN) 관련 시나리오 제거
    createTrip('HWS_WMS', 'SEL_Logi_HUB', [50, 100], 'Product C'),
    createTrip('SEL_Logi_HUB', 'SEL_WS3', [120, 150], 'Product C'),

    // === 시나리오 3: 구미공장(KUM) -> 경북허브(KB) & 전북허브(JB)로 분산 ===
    createTrip('KUM_WMS', 'KB_Logi_HUB', [30, 80], 'Product E'),
    createTrip('KUM_WMS', 'JB_Logi_HUB', [40, 290], 'Product F'),
    createTrip('KB_Logi_HUB', 'KB_WS1', [100, 110], 'Product E'),
    createTrip('KB_Logi_HUB', 'KB_WS2', [110, 150], 'Product E'),
    createTrip('KB_Logi_HUB', 'KB_WS3', [120, 130], 'Product E'),
    createTrip('JB_Logi_HUB', 'JB_WS1', [320, 330], 'Product F'),
    createTrip('JB_Logi_HUB', 'JB_WS2', [330, 370], 'Product F'),

    // === 시나리오 4: 양산공장(YGS) -> 전남허브(JN) & 전북허브(JB) ===
    createTrip('YGS_WMS', 'JN_Logi_HUB', [20, 90], 'Product G'),
    createTrip('YGS_WMS', 'JB_Logi_HUB', [30, 150], 'Product G'),
    createTrip('JN_Logi_HUB', 'JN_WS1', [110, 120], 'Product G'),
    // ❌ JN_WS2는 없으므로 해당 경로 제거
    createTrip('JN_Logi_HUB', 'JN_WS3', [130, 220], 'Product G'),
    createTrip('JB_Logi_HUB', 'JB_WS3', [180, 250], 'Product G'),

    // === 시나리오 5: 도매상 -> 리셀러 (모든 유효한 경로) ===
    // SEL_WS1
    createTrip('SEL_WS1', 'SEL_WS1_R1', [220, 225], 'Product A'),
    createTrip('SEL_WS1', 'SEL_WS1_R2', [230, 235], 'Product A'),
    createTrip('SEL_WS1', 'SEL_WS1_R3', [240, 245], 'Product A'),
    // SEL_WS2
    createTrip('SEL_WS2', 'SEL_WS2_R1', [250, 255], 'Product B'),
    createTrip('SEL_WS2', 'SEL_WS2_R2', [260, 265], 'Product B'),
    createTrip('SEL_WS2', 'SEL_WS2_R3', [270, 275], 'Product B'),
    // SEL_WS3
    createTrip('SEL_WS3', 'SEL_WS3_R1', [190, 195], 'Product C'),
    createTrip('SEL_WS3', 'SEL_WS3_R2', [200, 205], 'Product C'),
    createTrip('SEL_WS3', 'SEL_WS3_R3', [210, 215], 'Product C'),
    // JB_WS1
    createTrip('JB_WS1', 'JB_WS1_R1', [350, 355], 'Product F'),
    createTrip('JB_WS1', 'JB_WS1_R2', [360, 365], 'Product F'),
    createTrip('JB_WS1', 'JB_WS1_R3', [370, 375], 'Product F'),
    // JB_WS2
    createTrip('JB_WS2', 'JB_WS2_R1', [400, 405], 'Product F'),
    createTrip('JB_WS2', 'JB_WS2_R2', [410, 415], 'Product F'),
    createTrip('JB_WS2', 'JB_WS2_R3', [420, 425], 'Product F'),
    // JB_WS3
    createTrip('JB_WS3', 'JB_WS3_R1', [280, 285], 'Product G'),
    createTrip('JB_WS3', 'JB_WS3_R2', [290, 295], 'Product G'),
    createTrip('JB_WS3', 'JB_WS3_R3', [300, 305], 'Product G'),
    // JN_WS1
    createTrip('JN_WS1', 'JN_WS1_R1', [140, 145], 'Product G'),
    createTrip('JN_WS1', 'JN_WS1_R2', [150, 155], 'Product G'),
    createTrip('JN_WS1', 'JN_WS1_R3', [160, 165], 'Product G'),
    // ❌ JN_WS2는 없으므로 해당 리셀러 경로 제거
    // JN_WS3
    createTrip('JN_WS3', 'JN_WS3_R1', [240, 245], 'Product G'),
    createTrip('JN_WS3', 'JN_WS3_R2', [250, 255], 'Product G'),
    createTrip('JN_WS3', 'JN_WS3_R3', [260, 265], 'Product G'),
    // KB_WS1
    createTrip('KB_WS1', 'KB_WS1_R1', [130, 135], 'Product E'),
    createTrip('KB_WS1', 'KB_WS1_R2', [140, 145], 'Product E'),
    createTrip('KB_WS1', 'KB_WS1_R3', [150, 155], 'Product E'),
    // KB_WS2
    createTrip('KB_WS2', 'KB_WS2_R1', [170, 175], 'Product E'),
    createTrip('KB_WS2', 'KB_WS2_R2', [180, 185], 'Product E'),
    createTrip('KB_WS2', 'KB_WS2_R3', [190, 195], 'Product E'),
    // KB_WS3
    createTrip('KB_WS3', 'KB_WS3_R1', [150, 155], 'Product E'),
    createTrip('KB_WS3', 'KB_WS3_R2', [160, 165], 'Product E'),
    createTrip('KB_WS3', 'KB_WS3_R3', [170, 175], 'Product E'),

].filter((trip): trip is Trip => trip !== null); // null인 항목(좌표 없는 경로)을 최종 배열에서 제거

// --- 3. 위변조 데이터 생성 로직 (수정됨) ---
const baseTrips: Omit<AnalyzedTrip, 'anomaly'>[] = trips.map((trip, index) => ({
    ...trip,
    id: `trip-${index}`
}));

export const analyzedTrips: AnalyzedTrip[] = [...baseTrips];

// 시나리오 적용 (try-catch 또는 if문으로 안정성 강화)

try {
    // 1. 시공간 점프 (jump): 화성 -> 수도권 허브 (시간 단축)
    const jumpTrip = analyzedTrips.find(t => t.from === 'HWS_WMS' && t.to === 'SEL_Logi_HUB');
    if (jumpTrip) {
        jumpTrip.timestamps = [50, 60]; // 100 -> 60으로 단축
        jumpTrip.anomaly = { type: 'jump', travelTime: 10, distance: 40 };
    }

    // 2. 이벤트 순서 오류 (evtOrderErr): 전남 도매상 -> 리셀러
    const evtOrderErrTrip = analyzedTrips.find(t => t.from === 'JN_WS1' && t.to === 'JN_WS1_R1');
    if (evtOrderErrTrip) {
        evtOrderErrTrip.timestamps = [130, 145]; // [140, 145] -> [130, 145]로 조작
        evtOrderErrTrip.anomaly = { type: 'evtOrderErr', previousEventTime: 120, currentEventTime: 130 };
    }
    
    // 3. 위조 (epcFake): Product C
    const epcFakeTrip = analyzedTrips.find(t => t.product === 'Product C');
    if (epcFakeTrip) {
        epcFakeTrip.anomaly = { type: 'epcFake', invalidRule: 'Company Prefix Mismatch' };
    }
    
    // 4. 복제 (epcDup): Product E
    const dupTrip1 = analyzedTrips.find(t => t.from === 'KB_Logi_HUB' && t.to === 'KB_WS1');
    const dupTrip2 = analyzedTrips.find(t => t.from === 'KB_Logi_HUB' && t.to === 'KB_WS2');
    if (dupTrip1 && dupTrip2) {
        dupTrip2.anomaly = { type: 'epcDup', conflictingTripId: dupTrip1.id };
    }

    // 5. 경로 위조 (locErr): 구미 -> 전북 허브
    const locErrTrip = analyzedTrips.find(t => t.from === 'KUM_WMS' && t.to === 'JB_Logi_HUB');
    if (locErrTrip) {
        const originalPath = locErrTrip.path;
        const bypassedNodeCoords: [number, number] = [127.8, 36.0];
        locErrTrip.path = [originalPath[0], bypassedNodeCoords];
        locErrTrip.anomaly = { type: 'locErr', expectedPath: originalPath, bypassedNode: { name: '미승인 경유지', coord: bypassedNodeCoords } };
    }

    // ... (이하 다른 위변조 시나리오도 if문으로 감싸서 안정성 확보)
    const dupTripOriginal = analyzedTrips.find(t => t.from === 'JB_WS2' && t.to === 'JB_WS2_R1' && t.product === 'Product F');
    // 중복 시나리오에 필요한 다른 trip을 정의해야 합니다. 예를 들어, 다른 장소에서 동일 제품이 발견되는 경우.
    // 임시로 Product C를 사용하는 trip을 복제 대상으로 지정합니다.
    const dupTripCloneTarget = analyzedTrips.find(t => t.from === 'SEL_WS3' && t.to === 'SEL_WS3_R1' && t.product === 'Product C');
    if(dupTripOriginal && dupTripCloneTarget) {
        // Product F가 이동 중인데, 다른 곳에서 Product F가 발견된 것처럼 anomaly를 만듭니다.
        // 실제 시나리오에서는 이 부분의 로직을 더 정교하게 만들어야 합니다.
        dupTripCloneTarget.product = 'Product F'; // 강제로 제품명을 같게 만듦
        dupTripCloneTarget.anomaly = { type: 'epcDup', conflictingTripId: dupTripOriginal.id };
    }


} catch (error) {
    console.error("위변조 데이터 생성 중 오류 발생:", error);
}