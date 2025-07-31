import { LocationNode, AnomalyType } from './data';
import type { Color } from 'deck.gl';

export const ALL_ANOMALY_TYPES: AnomalyType[] = ['fake', 'tamper', 'clone', 'other'];

export const ANOMALY_TYPE_COLORS: Record<AnomalyType, Color> = {
    'fake': [215, 189, 226, 200],   // 시공간 점프 (연한 라벤더)
    'tamper': [250, 215, 160, 200], // 이벤트 순서 오류 (부드러운 살구)
    'clone': [255, 214, 214, 200],   // EPC 복제 (부드러운 크림)
    'other': [174, 214, 241], // 부드러운 크림
};

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
        case 'fake': return [215, 189, 226]; // 연한 라벤더
        case 'tamper': return [250, 215, 160]; // 부드러운 살구
        case 'clone': return [255, 214, 214]; // 부드러운 크림
        case 'other': return [174, 214, 241];
        default: return [229, 231, 233];
    }
};



// 위변조 타입의 한글 이름을 반환하는 함수
export const getAnomalyName = (type?: AnomalyType): string => {
    switch (type) {
        case 'fake': return '위조';
        case 'tamper': return '변조';
        case 'clone': return '복제';
        case 'other': return '신규 유형';
        default: return '알 수 없는 유형';
    }
};

export const getNodeName = (type?: LocationNode['hubType']): string => {
    switch (type) {
        case 'Factory': return '공장';
        case 'WMS': return '창고';
        case 'LogiHub': return '물류';
        case 'Wholesaler': return '도매';
        case 'Reseller': return '소매';
        case 'POS': return '판매';
        default: return '알 수 없는 유형';
    }
};