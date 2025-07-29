// components/report/AnomalyDetailsPage.tsx

import React, { ReactNode, useMemo, forwardRef, useImperativeHandle } from 'react';
import { MergeTrip } from '@/context/MapDataContext';

// --- 날짜 포맷팅 헬퍼 함수 ---
const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
    });
};

// --- 위조/변조용 재사용 테이블 컴포넌트 ---
const SimpleAnomalyTable: React.FC<{ trips: MergeTrip[] }> = ({ trips }) => {
    if (trips.length === 0) return null; // 해당 유형 데이터가 없으면 렌더링하지 않음

    return (
        <table
            style={{
                width: '100%',
                fontSize: '14px',
                textAlign: 'left',
                color: 'rgb(75, 85, 99)',
                border: '1px solid rgb(229, 231, 235)'
            }}
        >
            <thead
                style={{
                    fontSize: '12px',
                    color: 'rgb(31, 41, 55)',
                    textTransform: 'uppercase',
                    backgroundColor: 'rgb(243, 244, 246)',
                    border: '1px solid rgb(229, 231, 235)'
                }}
            >
                <tr>
                    <th
                        scope="col"
                        style={{
                            padding: '12px 16px',
                            border: '1px solid rgb(229, 231, 235)'
                        }}
                    >
                        EPC 코드
                    </th>
                    <th
                        scope="col"
                        style={{
                            padding: '12px 16px',
                            border: '1px solid rgb(229, 231, 235)'
                        }}
                    >
                        제품명
                    </th>
                    <th
                        scope="col"
                        style={{
                            padding: '12px 16px',
                            border: '1px solid rgb(229, 231, 235)'
                        }}
                    >
                        최종 탐지 위치
                    </th>
                    <th
                        scope="col"
                        style={{
                            padding: '12px 16px',
                            border: '1px solid rgb(229, 231, 235)'
                        }}
                    >
                        최종 탐지 시간
                    </th>
                </tr>
            </thead>
            <tbody>
                {trips.map((trip) => (
                    <tr
                        key={trip.roadId}
                        style={{
                            backgroundColor: 'rgb(255, 255, 255)',
                            borderBottom: '1px solid rgb(229, 231, 235)',
                            border: '1px solid rgb(229, 231, 235)'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgb(249, 250, 251)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgb(255, 255, 255)';
                        }}
                    >
                        <td
                            style={{
                                padding: '12px 16px',
                                border: '1px solid rgb(229, 231, 235)',
                                fontFamily: 'monospace',
                                fontSize: '12px'
                            }}
                        >
                            {trip.epcCode}
                        </td>
                        <td
                            style={{
                                padding: '12px 16px',
                                border: '1px solid rgb(229, 231, 235)'
                            }}
                        >
                            {trip.productName}
                        </td>
                        <td
                            style={{
                                padding: '12px 16px',
                                border: '1px solid rgb(229, 231, 235)'
                            }}
                        >
                            {trip.to.scanLocation}
                        </td>
                        <td
                            style={{
                                padding: '12px 16px',
                                border: '1px solid rgb(229, 231, 235)'
                            }}
                        >
                            {formatDate(trip.to.eventTime)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export interface AnomalyDetailsPageRef {
    getTableDataForPdf: () => { head: string[][]; body: (string | number)[][] };
}

interface AnomalyDetailsPageProps {
    anomalyTrips: MergeTrip[];
}

// --- 메인 페이지 컴포넌트 ---
const AnomalyDetailsPage = forwardRef<AnomalyDetailsPageRef, AnomalyDetailsPageProps>(
    ({ anomalyTrips }, ref) => {

        const { fakeTrips, tamperTrips, cloneGroups } = useMemo(() => {
            // 시간순으로 정렬하는 비교 함수
            const sortByTime = (a: MergeTrip, b: MergeTrip) => a.from.eventTime - b.from.eventTime;

            // 1. 유형별 데이터 분리
            const fakes = anomalyTrips.filter(t => t.anomalyTypeList.includes('fake')).sort(sortByTime);
            const tampers = anomalyTrips.filter(t => t.anomalyTypeList.includes('tamper')).sort(sortByTime);
            const clones = anomalyTrips.filter(t => t.anomalyTypeList.includes('clone')).sort(sortByTime);

            // 2. 복제(Clone) 데이터를 EPC 코드로 그룹화
            const groups: Record<string, MergeTrip[]> = {};
            clones.forEach(trip => {
                if (!groups[trip.epcCode]) {
                    groups[trip.epcCode] = [];
                }
                groups[trip.epcCode].push(trip);
            });

            // Record를 배열로 변환하여 map 함수 사용이 용이하게 함
            const groupedClones = Object.values(groups);

            return {
                fakeTrips: fakes,
                tamperTrips: tampers,
                cloneGroups: groupedClones,
            };
        }, [anomalyTrips]);

        useImperativeHandle(ref, () => ({
            getTableDataForPdf: () => {
                const head = [['#', '유형', 'EPC Code', '제품명', '탐지 경로', '탐지 시간']];
                const body: (string | number)[][] = [];
                let counter = 1;

                // Fake 데이터 추가
                fakeTrips.forEach(trip => {
                    body.push([
                        counter++,
                        '위조(Fake)',
                        trip.epcCode,
                        trip.productName,
                        `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                        formatDate(trip.to.eventTime)
                    ]);
                });

                // Tamper 데이터 추가
                tamperTrips.forEach(trip => {
                    body.push([
                        counter++,
                        '변조(Tamper)',
                        trip.epcCode,
                        trip.productName,
                        `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                        formatDate(trip.to.eventTime)
                    ]);
                });

                // Clone 데이터 추가 (그룹화 유지)
                cloneGroups.forEach(group => {
                    group.forEach((trip, index) => {
                        body.push([
                            index === 0 ? counter++ : '', // 그룹의 첫 번째 행에만 번호와 유형 표시
                            index === 0 ? '복제(Clone)' : '',
                            trip.epcCode,
                            trip.productName,
                            `${trip.from.scanLocation} → ${trip.to.scanLocation}`,
                            formatDate(trip.to.eventTime)
                        ]);
                    });
                });

                return { head, body };
            }
        }));

        const sections = [];

        if (fakeTrips.length > 0) {
            sections.push({
                title: "위조(fake) 의심 목록",
                component: <SimpleAnomalyTable trips={fakeTrips} />
            });
        }
        if (tamperTrips.length > 0) {
            sections.push({
                title: "변조(Tamper) 의심 목록",
                component: <SimpleAnomalyTable trips={tamperTrips} />
            });
        }
        if (cloneGroups.length > 0) {
            sections.push({
                title: "복제(Clone) 의심 목록",
                component: (
                    <table
                        style={{
                            width: '100%',
                            fontSize: '14px',
                            textAlign: 'left',
                            color: 'rgb(75, 85, 99)',
                            border: '1px solid rgb(229, 231, 235)'
                        }}
                    >
                        <thead
                            style={{
                                fontSize: '12px',
                                color: 'rgb(31, 41, 55)',
                                textTransform: 'uppercase',
                                backgroundColor: 'rgb(243, 244, 246)',
                                border: '1px solid rgb(229, 231, 235)'
                            }}
                        >
                            <tr>
                                <th
                                    scope="col"
                                    style={{
                                        padding: '12px 16px',
                                        border: '1px solid rgb(229, 231, 235)'
                                    }}
                                >
                                    EPC 코드
                                </th>
                                <th
                                    scope="col"
                                    style={{
                                        padding: '12px 16px',
                                        border: '1px solid rgb(229, 231, 235)'
                                    }}
                                >
                                    제품명
                                </th>
                                <th
                                    scope="col"
                                    style={{
                                        padding: '12px 16px',
                                        border: '1px solid rgb(229, 231, 235)'
                                    }}
                                >
                                    탐지 경로
                                </th>
                                <th
                                    scope="col"
                                    style={{
                                        padding: '12px 16px',
                                        border: '1px solid rgb(229, 231, 235)'
                                    }}
                                >
                                    탐지 시간
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {cloneGroups.map(group => (
                                <React.Fragment key={group[0].epcCode}>
                                    {group.map((trip, index) => (
                                        <tr
                                            key={trip.roadId}
                                            style={{
                                                backgroundColor: 'rgb(255, 255, 255)',
                                                borderBottom: '1px solid rgb(229, 231, 235)',
                                                border: '1px solid rgb(229, 231, 235)'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgb(249, 250, 251)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgb(255, 255, 255)';
                                            }}
                                        >
                                            {index === 0 && (
                                                <>
                                                    <td
                                                        rowSpan={group.length}
                                                        style={{
                                                            padding: '12px 16px',
                                                            fontFamily: 'monospace',
                                                            fontSize: '12px',
                                                            verticalAlign: 'top',
                                                            borderRight: '1px solid rgb(229, 231, 235)'
                                                        }}
                                                    >
                                                        {trip.epcCode}
                                                    </td>
                                                    <td
                                                        rowSpan={group.length}
                                                        style={{
                                                            padding: '12px 16px',
                                                            verticalAlign: 'top',
                                                            borderRight: '1px solid rgb(229, 231, 235)'
                                                        }}
                                                    >
                                                        {trip.productName}
                                                    </td>
                                                </>
                                            )}
                                            <td
                                                style={{
                                                    padding: '12px 16px',
                                                    border: '1px solid rgb(229, 231, 235)'
                                                }}
                                            >
                                                {`${trip.from.scanLocation} → ${trip.to.scanLocation}`}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '12px 16px',
                                                    border: '1px solid rgb(229, 231, 235)'
                                                }}
                                            >
                                                {formatDate(trip.to.eventTime)}
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )
            });
        }

        const numbering = ['가.', '나.', '다.', '라.'];

        return (
            <div
                style={{
                    padding: '40px',
                    backgroundColor: 'rgb(255, 255, 255)',
                    color: 'rgb(0, 0, 0)',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    width: '210mm',
                    minHeight: '297mm'
                }}
            >
                <main
                    style={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '32px'
                    }}
                >
                    <h2
                        style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            color: 'rgb(75, 85, 99)',
                            margin: '0 0 8px 0'
                        }}
                    >
                        3. 이상 탐지 상세 내역
                    </h2>
                    {sections.map((section, index) => (
                        <div key={index}>
                            <h3
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    color: 'rgb(75, 85, 99)',
                                    margin: '0 0 4px 0'
                                }}
                            >
                                {`${numbering[index]} ${section.title}`}
                            </h3>
                            {section.component}
                        </div>
                    ))}
                </main>

                {/* ✨ 5. footer 스타일을 다른 페이지와 통일합니다. */}
                <footer
                    style={{
                        marginTop: 'auto',
                        paddingTop: '32px',
                        textAlign: 'center',
                        fontSize: '12px',
                        color: 'rgb(107, 114, 128)',
                        flexShrink: 0
                    }}
                >

                </footer>
            </div>
        );
    });

AnomalyDetailsPage.displayName = 'AnomalyDetailsPage';
export default AnomalyDetailsPage;