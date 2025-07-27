import { LocationNode, AnomalyType } from './data';

export const ALL_ANOMALY_TYPES: AnomalyType[] = ['fake', 'tamper', 'clone'];

// 노드 타입에 따른 색상을 반환하는 함수
export const getNodeColor = (type: LocationNode['hubType']): [number, number, number, number] => {
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
        case 'fake':        return [215, 189, 226]; // 연한 라벤더
        case 'tamper': return [250, 215, 160]; // 부드러운 살구
        case 'clone':      return [252, 243, 207]; // 부드러운 크림
        default:            return [229, 231, 233];

    }
};



// 위변조 타입의 한글 이름을 반환하는 함수
export const getAnomalyName = (type?: AnomalyType): string => {
    switch (type) {
        case 'fake':        return '위조';
        case 'tamper': return '변조';
        case 'clone':      return '복제';
        default:            return '알 수 없는 유형';
    }
};