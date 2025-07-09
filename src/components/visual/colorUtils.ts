import { Node, AnomalyType } from '../visual/data';

// 노드 타입에 따른 색상을 반환하는 함수
export const getNodeColor = (type: Node['hubType']): [number, number, number, number] => {
    const alpha = 100;
    switch (type) {
        case 'Factory': return [0, 255, 255, alpha];
        case 'WMS': return [255, 0, 255, alpha];
        case 'LogiHub': return [186, 255, 0, alpha];
        case 'Wholesaler': return [0, 255, 128, alpha];
        case 'Reseller': return [255, 64, 128, alpha];
        case 'POS': return [255, 69, 0, alpha];
        default: return [180, 180, 180, alpha];
    }
};

// 위변조 타입에 따른 색상을 반환하는 함수
export const getAnomalyColor = (type?: AnomalyType): [number, number, number] => {
    switch (type) {
        case 'jump':        return [215, 189, 226]; // 연한 라벤더
        case 'evtOrderErr': return [250, 215, 160]; // 부드러운 살구
        case 'epcFake':     return [245, 183, 177]; // 매우 연한 핑크
        case 'epcDup':      return [252, 243, 207]; // 부드러운 크림
        case 'locErr':      return [169, 204, 227]; // 매우 연한 하늘색
        default:            return [229, 231, 233];

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