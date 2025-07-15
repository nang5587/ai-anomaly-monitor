import { type AnomalyType } from '@/components/visual/data';

// 코드 -> 한글 이름 변환 맵
export const anomalyCodeToNameMap: Record<AnomalyType, string> = {
    jump: '시공간 점프',
    evtOrderErr: '이벤트 순서 오류',
    epcFake: 'EPC 위조',
    epcDup: 'EPC 복제',
    locErr: '경로 이탈',
};

// ✨ 코드 -> 상세 설명 변환 맵 (여기로 이동!)
export const anomalyDescriptionMap: Record<string, string> = {
    jump: "비논리적인 시공간 이동이 감지되었습니다.",
    evtOrderErr: "이벤트 발생 순서가 논리적으로 맞지 않습니다.",
    epcFake: "EPC 생성 규칙에 어긋나는 위조된 코드가 발견되었습니다.",
    epcDup: "동일한 EPC 코드가 같은 시간에 다른 위치에서 중복으로 존재합니다.",
    locErr: "예상 경로를 이탈하여, 잘못된 위치에 상품이 존재합니다.",
};

// 헬퍼 함수
export function getAnomalyName(code: AnomalyType): string {
    return anomalyCodeToNameMap[code] || '알 수 없는 유형';
}