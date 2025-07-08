// Data.ts (수정 후)

// 1. 타입 정의는 그대로 유지합니다.
// 다른 컴포넌트들이 이 타입들을 계속 사용할 수 있습니다.
export interface Node {
    id: string;
    name: string;
    type: 'Factory' | 'WMS' | 'LogiHub' | 'Wholesaler' | 'Reseller';
    coordinates: [number, number];
}

export interface Trip {
    from: string;
    to: string;
    path: [[number, number], [number, number]];
    timestamps: [number, number];
    product: string;
}

export type AnomalyType = 'jump' | 'evtOrderErr' | 'epcFake' | 'epcDup' | 'locErr';

// ✨ API 명세에 맞춰 anomaly 타입을 단순화합니다.
export interface AnalyzedTrip extends Trip {
    id: string;
    anomaly: AnomalyType | null;
}

// 2. ✨ 데이터를 직접 export하는 대신, 데이터를 불러오는 함수를 export합니다.
let cachedNodes: Node[] | null = null;
let cachedTrips: AnalyzedTrip[] | null = null;

/**
 * 노드 데이터를 가져옵니다. (캐싱 적용)
 * @returns {Promise<Node[]>}
 */
export async function getNodes(): Promise<Node[]> {
    if (cachedNodes) {
        return cachedNodes;
    }
    // public 폴더의 JSON 파일을 fetch
    const response = await fetch('/api/nodes.json');
    const data: Node[] = await response.json();
    cachedNodes = data;
    return data;
}

/**
 * 이동 경로(Trip) 데이터를 가져옵니다. (캐싱 적용)
 * @returns {Promise<AnalyzedTrip[]>}
 */
export async function getAnalyzedTrips(): Promise<AnalyzedTrip[]> {
    if (cachedTrips) {
        return cachedTrips;
    }
    const response = await fetch('/api/trips.json');
    const data: AnalyzedTrip[] = await response.json();
    cachedTrips = data;
    return data;
}