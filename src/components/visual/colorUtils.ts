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
        case 'SPACE_JUMP':   // Vivid Purple (#722ed1)
            return [114, 46, 209];
        case 'CLONE':        // Lemon Yellow (#ffeb3b)
            return [255, 235, 59];
        case 'ORDER_ERROR':  // Strong Orange (#fa8c16)
            return [250, 140, 22];
        case 'PATH_FAKE':    // Alert Red (#cf1322)
            return [207, 19, 34];
        default:             // Light Lime Green (#90ee90)
            return [144, 238, 144];
    }
};

// 위변조 타입의 한글 이름을 반환하는 함수
export const getAnomalyName = (type?: AnomalyType): string => {
    switch (type) {
        case 'SPACE_JUMP': return '시공간 점프';
        case 'CLONE': return '제품 복제';
        case 'ORDER_ERROR': return '이벤트 순서 오류';
        case 'PATH_FAKE': return '경로 위조';
        default: return '알 수 없는 오류';
    }
};