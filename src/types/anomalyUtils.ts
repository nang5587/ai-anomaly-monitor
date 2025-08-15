import { type AnomalyType } from './data';

export const anomalyCodeToNameMap: Record<AnomalyType, string> = {
    fake: '위조',
    tamper: '변조',
    clone: '복제',
    other: '신규 유형'
};

export const anomalyDescriptionMap: Record<string, string> = {
    fake: '존재하지 않는 EPC를 새로 만드는 것',
    tamper: '기존 EPC를 무단으로 변경',
    clone: '기존 EPC를 그대로 복사',
    other: '정상 흐름에서 벗어난 이상 징후로, 기존 유형에 해당하지 않는 경우',
};

export function getAnomalyName(code: AnomalyType): string {
    return anomalyCodeToNameMap[code] || '알 수 없는 유형';
}

export const pastelColorMap: { [key: string]: string } = {
    'fake': '#D7BDE2',
    'tamper': '#FAD7A0',
    'clone': '#FFD6D6',
    'other': '#AED6F1',
    'default': '#E5E7E9',
};
