// src/data/supplyChainData.ts (파일 경로 예시)

// 1. 각 노드의 ID와 화면 위 고정 좌표 (x, y)
// Deck.gl의 뷰포트 크기(예: 1200x800)에 맞춰 좌표를 설정합니다.
// (0, 0)은 왼쪽 하단이 기본이지만, 뷰 설정에 따라 변경될 수 있습니다.
// 여기서는 왼쪽 상단을 (0,0)으로 가정하고 좌표를 설정했습니다.
export const nodePositions: { [key: string]: { x: number; y: number } } = {
    // 단계 1: 공장 (Factories) - 왼쪽
    'ICN_Factory': { x: 150, y: 150 }, // 인천
    'HWS_Factory': { x: 150, y: 250 }, // 화성
    'YGS_Factory': { x: 150, y: 350 }, // 연기
    'KUM_Factory': { x: 150, y: 450 }, // 구미

    // 단계 2: 창고 (WMS) - 공장 옆
    'ICN_WMS': { x: 300, y: 150 },
    'HWS_WMS': { x: 300, y: 250 },
    'YGS_WMS': { x: 300, y: 350 },
    'KUM_WMS': { x: 300, y: 450 },

    // 단계 3: 물류 허브 (Logistics HUB) - 중앙
    'SEL_Logi_HUB': { x: 600, y: 200 }, // 수도권
    'JB_Logi_HUB': { x: 600, y: 300 },  // 전북
    'JN_Logi_HUB': { x: 600, y: 400 },  // 전남
    'KB_Logi_HUB': { x: 600, y: 500 },  // 경북
    'KN_Logi_HUB': { x: 600, y: 600 },  // 경남

    // 단계 4: 도매상 (Wholesalers) - 오른쪽
    'SEL_WS1': { x: 850, y: 160 }, 'SEL_WS2': { x: 850, y: 200 }, 'SEL_WS3': { x: 850, y: 240 },
    'JB_WS1': { x: 850, y: 280 }, 'JB_WS2': { x: 850, y: 320 }, 'JB_WS3': { x: 850, y: 360 },
    'JN_WS1': { x: 850, y: 400 }, 'JN_WS2': { x: 850, y: 440 }, 'JN_WS3': { x: 850, y: 480 },
    'KB_WS1': { x: 850, y: 520 }, 'KB_WS2': { x: 850, y: 560 }, 'KB_WS3': { x: 850, y: 600 },
    'KN_WS1': { x: 850, y: 640 }, 'KN_WS2': { x: 850, y: 680 }, 'KN_WS3': { x: 850, y: 720 },

    // 단계 5: 소매상 (Retailers) - 맨 오른쪽
    'SEL_Retailer1': { x: 1050, y: 180 }, 'SEL_Retailer2': { x: 1050, y: 220 },
    'KB_Retailer1': { x: 1050, y: 540 }, 'KN_Retailer1': { x: 1050, y: 660 },
};

// 2. 전체 노드 목록 (ID, 이름 등 추가 정보 포함 가능)
// ScatterplotLayer의 data prop에 이 배열의 'position' 값만 넘겨줄 수도 있고,
// 객체 전체를 넘겨주고 accessor 함수에서 position을 꺼내 쓸 수도 있습니다.
export const allNodes = Object.keys(nodePositions).map(id => ({
    id: id,
    name: id, // 나중에 툴팁 등에 표시할 이름
    position: [nodePositions[id].x, nodePositions[id].y], // [x, y] 배열 형태
}));


// 3. 모든 이벤트 데이터: 시간(time) 순서대로 정렬된 공급망 활동
// ArcLayer의 data prop에 이 배열이 필터링되어 전달됩니다.
export const allEvents: { time: number; source: string; target: string }[] = [
    // === 시간 1: 각 공장에서 생산 및 WMS 입고 ===
    { time: 1, source: 'ICN_Factory', target: 'ICN_WMS' },
    { time: 1, source: 'HWS_Factory', target: 'HWS_WMS' },
    { time: 1, source: 'YGS_Factory', target: 'YGS_WMS' },
    { time: 1, source: 'KUM_Factory', target: 'KUM_WMS' },

    // === 시간 2: 각 WMS에서 물류 허브로 출고 ===
    { time: 2, source: 'ICN_WMS', target: 'SEL_Logi_HUB' },
    { time: 2, source: 'HWS_WMS', target: 'SEL_Logi_HUB' },
    { time: 2, source: 'YGS_WMS', target: 'JB_Logi_HUB' },
    { time: 2, source: 'KUM_WMS', target: 'KB_Logi_HUB' },

    // === 시간 3: 다른 지역 허브로 추가 이동 ===
    { time: 3, source: 'SEL_Logi_HUB', target: 'JN_Logi_HUB' },
    { time: 3, source: 'KB_Logi_HUB', target: 'KN_Logi_HUB' },

    // === 시간 4: 각 지역 허브에서 해당 지역 도매상으로 분배 ===
    { time: 4, source: 'SEL_Logi_HUB', target: 'SEL_WS1' },
    { time: 4, source: 'SEL_Logi_HUB', target: 'SEL_WS2' },
    { time: 4, source: 'SEL_Logi_HUB', target: 'SEL_WS3' },
    { time: 4, source: 'JB_Logi_HUB', target: 'JB_WS1' },
    { time: 4, source: 'JB_Logi_HUB', target: 'JB_WS2' },
    { time: 4, source: 'JB_Logi_HUB', target: 'JB_WS3' },
    { time: 4, source: 'JN_Logi_HUB', target: 'JN_WS1' },
    { time: 4, source: 'JN_Logi_HUB', target: 'JN_WS2' },
    { time: 4, source: 'JN_Logi_HUB', target: 'JN_WS3' },
    { time: 4, source: 'KB_Logi_HUB', target: 'KB_WS1' },
    { time: 4, source: 'KB_Logi_HUB', target: 'KB_WS2' },
    { time: 4, source: 'KB_Logi_HUB', target: 'KB_WS3' },
    { time: 4, source: 'KN_Logi_HUB', target: 'KN_WS1' },
    { time: 4, source: 'KN_Logi_HUB', target: 'KN_WS2' },
    { time: 4, source: 'KN_Logi_HUB', target: 'KN_WS3' },

    // === 시간 5: 도매상에서 리셀러(소매상)로 이동 ===
    { time: 5, source: 'SEL_WS1', target: 'SEL_Retailer1' },
    { time: 5, source: 'SEL_WS2', target: 'SEL_Retailer2' },
    { time: 5, source: 'KB_WS1', target: 'KB_Retailer1' },
    { time: 5, source: 'KN_WS3', target: 'KN_Retailer1' },
];