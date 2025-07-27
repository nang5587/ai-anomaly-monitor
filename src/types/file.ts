export interface FileItem {
    fileId: number;
    fileName: string;
    userId: string;
    fileSize: number;
    createdAt: string;
    locationId: number;
}

export interface CoverLetterProps {
    fileName: string;
    analysisPeriod: string; // "시작일 ~ 종료일" 형태의 가공된 문자열
    createdAt: string;      // 가공된 날짜 문자열
    userName: string;
    locationName: string;
    companyName?: string;
    companyLogoUrl?: string;
}

export const LOCATION_MAP: Record<number, string> = {
    1: '인천공장',
    2: '화성공장',
    3: '양산공장',
    4: '구미공장',
};

export const getLocationNameById = (id: number | undefined): string => {
    if (id === undefined) {
        return '알 수 없음';
    }
    return LOCATION_MAP[id] || `미등록 위치 (ID: ${id})`;
};