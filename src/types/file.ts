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
    analysisPeriod: string; 
    createdAt: string;   
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
    total: '#FFFFFF',   
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

export const formatPdfDateTime = (dateInput: string | number | Date | undefined | null): string => {
    if (!dateInput) return '-';
    try {
        const date = typeof dateInput === 'number' ? new Date(dateInput * 1000) : new Date(dateInput);
        if (isNaN(date.getTime())) return '유효하지 않은 날짜';
        return date.toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: true,
        }); 
    } catch { return '날짜 변환 오류'; }
};

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
        fillColor: [243, 244, 246],
        textColor: 10,
        fontSize: 9,
    };

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
    if (cloneGroups.length > 0) {
        body.push([{ content: '다. 복제(Clone) 의심 목록', colSpan: 6, styles: groupHeaderStyles }]);
        cloneGroups.forEach(group => {
            group.forEach((trip, index) => {
                if (index === 0) {
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
                    const row = [
                        `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                        formatPdfDateTime(trip.to.eventTime),
                    ];
                    body.push(row);
                }
            });
        });
    }

    if (otherTrips.length > 0) {
        body.push([{ content: '라. AI탐지(other) 목록', colSpan: 6, styles: groupHeaderStyles }]);
        fakeTrips.forEach(trip => {
            body.push([
                counter++,
                'AI탐지(other)',
                trip.epcCode,
                trip.productName,
                `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                formatPdfDateTime(trip.to.eventTime),
            ]);
        });
    }

    return { head, body };
};


export const preparePdfData = (
    fakeTrips: MergeTrip[],
    tamperTrips: MergeTrip[],
    cloneGroups: MergeTrip[][],
    otherTrips: MergeTrip[]
) => {
    const head = [['#', '유형', 'EPC Code', '제품명', '탐지 경로', '탐지 시간']];
    const body: any[] = [];
    const groupHeaderStyles = {
        halign: 'left', fontStyle: 'bold', fillColor: [243, 244, 246],
        textColor: 10, fontSize: 9,
    };
    const noDataStyles = {
        halign: 'center', textColor: 150, fontSize: 8,
    };
    const anomalyGroupConfigs = [
        { title: '가. 위조(Fake) 의심 목록', type: '위조(Fake)', data: fakeTrips },
        { title: '나. 변조(Tamper) 의심 목록', type: '변조(Tamper)', data: tamperTrips },
    ];
    anomalyGroupConfigs.forEach(group => {
        let counter = 1;

        body.push([{ content: group.title, colSpan: 6, styles: groupHeaderStyles }]);

        if (group.data.length > 0) {
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
            body.push([{ content: '해당 유형의 이상 징후가 없습니다.', colSpan: 6, styles: noDataStyles }]);
        }
    });

    let cloneCounter = 1;
    body.push([{ content: '다. 복제(Clone) 의심 목록', colSpan: 6, styles: groupHeaderStyles }]);

    if (cloneGroups.length > 0) {
        cloneGroups.forEach(group => {
            group.forEach((trip, index) => {
                const rowContent = (index === 0)
                    ? [ 
                        { content: cloneCounter, rowSpan: group.length, styles: { valign: 'middle', halign: 'center' } },
                        { content: '복제(Clone)', rowSpan: group.length, styles: { valign: 'middle' } },
                        { content: trip.epcCode, rowSpan: group.length, styles: { valign: 'middle' } },
                        { content: trip.productName, rowSpan: group.length, styles: { valign: 'middle' } },
                        `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                        formatPdfDateTime(trip.to.eventTime),
                    ]
                    : [ 
                        `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                        formatPdfDateTime(trip.to.eventTime),
                    ];
                body.push(rowContent);
            });
            cloneCounter++;
        });
    } else {
        body.push([{ content: '해당 유형의 이상 징후가 없습니다.', colSpan: 6, styles: noDataStyles }]);
    }

    let counter = 1;

    const otherGroupType = 'AI탐지(Other)';
    body.push([{ content: '라. AI탐지(Other) 목록', colSpan: 6, styles: groupHeaderStyles }]);

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
        body.push([{ content: '해당 유형의 이상 징후가 없습니다.', colSpan: 6, styles: noDataStyles }]);
    }

    return { head, body };
};