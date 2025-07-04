import { Node, AnomalyType } from '../visual/data';

// 노드 타입에 따른 색상을 반환하는 함수
export const getNodeColor = (type: Node['type']): [number, number, number, number] => {
    const alpha = 100;
    switch (type) {
        case 'Factory': return [0, 255, 255, alpha];
        case 'WMS': return [255, 0, 255, alpha];
        case 'LogiHub': return [186, 255, 0, alpha];
        case 'Wholesaler': return [0, 255, 128, alpha];
        case 'Reseller': return [255, 64, 128, alpha];
        default: return [180, 180, 180, alpha];
    }
};

// 위변조 타입에 따른 색상을 반환하는 함수
export const getAnomalyColor = (type?: AnomalyType): [number, number, number] => {
    switch (type) {
        case 'jump':        return [114, 46, 209]; // 시공간 점프 (Purple)
        case 'evtOrderErr': return [250, 140, 22]; // 이벤트 순서 오류 (Orange)
        case 'epcFake':     return [255, 7, 58];   // 위조 (Pink)
        case 'epcDup':      return [255, 235, 59]; // 복제 (Yellow)
        case 'locErr':      return [24, 144, 255];  // 경로 위조 (Red)
        default:            return [180, 180, 180]; // 알 수 없음 또는 정상

    }
};

// 위변조 타입의 한글 이름을 반환하는 함수
export const getAnomalyName = (type?: AnomalyType): string => {
    switch (type) {
        case 'jump':        return '시공간 점프';
        case 'evtOrderErr': return '이벤트 순서 오류';
        case 'epcFake':     return 'EPC 위조';
        case 'epcDup':      return 'EPC 복제';
        case 'locErr':      return '경로 위조';
        default:            return '알 수 없는 유형';
    }
};