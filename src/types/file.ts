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

export const COLORS = {
    total: '#FFFFFF',   // 흰색
    fake: '#6A5ACD',
    tamper: '#F5C682',
    clone: '#FFBABA',
    other: '#96C4E8'
};

export const getLocationNameById = (id: number | undefined): string => {
    if (id === undefined) {
        return '알 수 없음';
    }
    return LOCATION_MAP[id] || `미등록 위치 (ID: ${id})`;
};

import type { MergeTrip } from '@/context/MapDataContext';

// 날짜 포맷 함수는 이미 있으므로 그대로 사용합니다.
export const formatPdfDateTime = (dateInput: string | number | Date | undefined | null): string => {
    // ... 기존 formatDateTime 함수와 동일 ...
    if (!dateInput) return '-';
    try {
        const date = typeof dateInput === 'number' ? new Date(dateInput * 1000) : new Date(dateInput);
        if (isNaN(date.getTime())) return '유효하지 않은 날짜';
        return date.toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: true,
        }); // PDF에서 줄바꿈을 위해 공백을 \n으로 변경 (선택사항)
    } catch { return '날짜 변환 오류'; }
};


// 이 함수가 핵심입니다!
export const getAnomalyDetailsForPdf = (
    fakeTrips: MergeTrip[],
    tamperTrips: MergeTrip[],
    cloneGroups: MergeTrip[][],
    otherTrips: MergeTrip[]
) => {
    const head = [['#', '유형', 'EPC Code', '제품명', '탐지 경로', '탐지 시간']];
    const body: any[] = [];
    let counter = 1;

    const groupHeaderStyles = {
        halign: 'left',
        fontStyle: 'bold',
        fillColor: [243, 244, 246], // 밝은 회색 배경
        textColor: 10,
        fontSize: 9,
    };

    // --- 가. 위조(Fake) ---
    if (fakeTrips.length > 0) {
        body.push([{ content: '가. 위조(Fake) 의심 목록', colSpan: 6, styles: groupHeaderStyles }]);
        fakeTrips.forEach(trip => {
            body.push([
                counter++,
                '위조(Fake)',
                trip.epcCode,
                trip.productName,
                `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                formatPdfDateTime(trip.to.eventTime),
            ]);
        });
    }

    // --- 나. 변조(Tamper) ---
    if (tamperTrips.length > 0) {
        body.push([{ content: '나. 변조(Tamper) 의심 목록', colSpan: 6, styles: groupHeaderStyles }]);
        tamperTrips.forEach(trip => {
            body.push([
                counter++,
                '변조(Tamper)',
                trip.epcCode,
                trip.productName,
                `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                formatPdfDateTime(trip.to.eventTime),
            ]);
        });
    }

    // --- 다. 복제(Clone) - rowSpan 사용 ---
    if (cloneGroups.length > 0) {
        body.push([{ content: '다. 복제(Clone) 의심 목록', colSpan: 6, styles: groupHeaderStyles }]);
        cloneGroups.forEach(group => {
            group.forEach((trip, index) => {
                if (index === 0) {
                    // 그룹의 첫 번째 행: rowSpan 적용
                    const row = [
                        { content: counter++, rowSpan: group.length, styles: { valign: 'middle', halign: 'center' } },
                        { content: '복제(Clone)', rowSpan: group.length, styles: { valign: 'middle' } },
                        { content: trip.epcCode, rowSpan: group.length, styles: { valign: 'middle' } },
                        { content: trip.productName, rowSpan: group.length, styles: { valign: 'middle' } },
                        `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                        formatPdfDateTime(trip.to.eventTime),
                    ];
                    body.push(row);
                } else {
                    // 그룹의 두 번째 이후 행: 병합된 셀은 제외하고 추가
                    const row = [
                        `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                        formatPdfDateTime(trip.to.eventTime),
                    ];
                    body.push(row);
                }
            });
        });
    }

    // --- 라. 미분류(other) ---
    if (otherTrips.length > 0) {
        body.push([{ content: '라. 미분류(other) 목록', colSpan: 6, styles: groupHeaderStyles }]);
        fakeTrips.forEach(trip => {
            body.push([
                counter++,
                '미분류(other)',
                trip.epcCode,
                trip.productName,
                `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                formatPdfDateTime(trip.to.eventTime),
            ]);
        });
    }

    return { head, body };
};


// ✨ 이 함수를 아래의 새 코드로 교체해주세요.
export const preparePdfData = (
    fakeTrips: MergeTrip[],
    tamperTrips: MergeTrip[],
    cloneGroups: MergeTrip[][],
    otherTrips: MergeTrip[]
) => {
    const head = [['#', '유형', 'EPC Code', '제품명', '탐지 경로', '탐지 시간']];
    const body: any[] = [];

    // --- 1. 공통 스타일 사전 정의 ---
    const groupHeaderStyles = {
        halign: 'left', fontStyle: 'bold', fillColor: [243, 244, 246],
        textColor: 10, fontSize: 9,
    };
    const noDataStyles = {
        halign: 'center', textColor: 150, fontSize: 8,
    };

    // --- 2. 보고서에 표시할 그룹 정보(순서 포함)를 미리 정의 ---
    const anomalyGroupConfigs = [
        { title: '가. 위조(Fake) 의심 목록', type: '위조(Fake)', data: fakeTrips },
        { title: '나. 변조(Tamper) 의심 목록', type: '변조(Tamper)', data: tamperTrips },
    ];

    // --- 3. 정의된 그룹 순서대로 루프를 돌며 테이블 본문 생성 (Fake, Tamper) ---
    anomalyGroupConfigs.forEach(group => {
        // ✨ 각 그룹이 시작될 때마다 카운터를 1로 리셋!
        let counter = 1;

        // 그룹 헤더는 항상 추가
        body.push([{ content: group.title, colSpan: 6, styles: groupHeaderStyles }]);

        if (group.data.length > 0) {
            // 데이터가 있으면 행 추가
            group.data.forEach((trip: MergeTrip) => {
                body.push([
                    counter++,
                    group.type,
                    trip.epcCode,
                    trip.productName,
                    `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                    formatPdfDateTime(trip.to.eventTime),
                ]);
            });
        } else {
            // ✨ 데이터가 없으면 "내역 없음" 행 추가
            body.push([{ content: '해당 유형의 이상 징후가 없습니다.', colSpan: 6, styles: noDataStyles }]);
        }
    });

    // --- 4. 복제(Clone) 그룹은 구조가 복잡하므로 별도로 처리 ---
    let cloneCounter = 1; // 복제 그룹을 위한 카운터 (그룹 단위)
    body.push([{ content: '다. 복제(Clone) 의심 목록', colSpan: 6, styles: groupHeaderStyles }]);

    if (cloneGroups.length > 0) {
        cloneGroups.forEach(group => {
            group.forEach((trip, index) => {
                const rowContent = (index === 0)
                    ? [ // 그룹의 첫 행
                        { content: cloneCounter, rowSpan: group.length, styles: { valign: 'middle', halign: 'center' } },
                        { content: '복제(Clone)', rowSpan: group.length, styles: { valign: 'middle' } },
                        { content: trip.epcCode, rowSpan: group.length, styles: { valign: 'middle' } },
                        { content: trip.productName, rowSpan: group.length, styles: { valign: 'middle' } },
                        `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                        formatPdfDateTime(trip.to.eventTime),
                    ]
                    : [ // 그룹의 나머지 행
                        `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                        formatPdfDateTime(trip.to.eventTime),
                    ];
                body.push(rowContent);
            });
            cloneCounter++; // ✨ 다음 복제 그룹을 위해 카운터 증가
        });
    } else {
        // 복제 데이터가 없을 경우
        body.push([{ content: '해당 유형의 이상 징후가 없습니다.', colSpan: 6, styles: noDataStyles }]);
    }

    let counter = 1;

    const otherGroupType = '미분류(Other)';
    // 그룹 헤더는 항상 추가
    body.push([{ content: '라. 미분류(Other) 목록', colSpan: 6, styles: groupHeaderStyles }]);

    if (otherTrips.length > 0) {
        otherTrips.forEach((trip: MergeTrip) => {
            body.push([
                counter++,
                otherGroupType,
                trip.epcCode,
                trip.productName,
                `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                formatPdfDateTime(trip.to.eventTime),
            ]);
        });
    } else {
        // ✨ 데이터가 없으면 "내역 없음" 행 추가
        body.push([{ content: '해당 유형의 이상 징후가 없습니다.', colSpan: 6, styles: noDataStyles }]);
    }

    return { head, body };
};