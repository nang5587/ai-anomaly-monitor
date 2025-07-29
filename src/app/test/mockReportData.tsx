// lib/mockReportData.ts

// 이 파일은 ReportView 컴포넌트 테스트를 위한 가짜 데이터를 정의합니다.
// 실제 데이터 구조와 최대한 비슷하게 만듭니다.

export const mockCoverData = {
    fileName: "테스트용-리포트.csv",
    userName: "테스터",
    locationId: 1,
    createdAt: new Date().toISOString(),
    period: [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), new Date().toISOString()]
};

export const mockKpiData = {
    totalTripCount: 12345,
    uniqueProductCount: 56,
    codeCount: 1200,
    anomalyCount: 78,
    anomalyRate: 0.63,
    salesRate: 95.2,
    dispatchRate: 98.1,
    inventoryRate: 85.5,
    avgLeadTime: 7.5
};

export const mockAnomalyTrips = [
    { anomalyTypeList: ['fake'], epcCode: 'EPC_FAKE_001', productName: '테스트 제품 A', from: { scanLocation: '공장' }, to: { scanLocation: '창고' }, eventType: 'Aggregation', toEventTime: Date.now() / 1000 },
    { anomalyTypeList: ['tamper'], epcCode: 'EPC_TAMPER_002', productName: '테스트 제품 B', from: { scanLocation: '창고' }, to: { scanLocation: '물류센터' }, eventType: 'Observation', toEventTime: Date.now() / 1000 },
    { anomalyTypeList: ['clone'], epcCode: 'EPC_CLONE_003', productName: '테스트 제품 C', from: { scanLocation: '물류센터' }, to: { scanLocation: '도매상' }, eventType: 'Observation', toEventTime: Date.now() / 1000 },
    { anomalyTypeList: ['clone'], epcCode: 'EPC_CLONE_003', productName: '테스트 제품 C', from: { scanLocation: '다른경로' }, to: { scanLocation: '다른곳' }, eventType: 'Observation', toEventTime: Date.now() / 1000 },
];

export const mockAnomalyChartData = [
    { name: '위조(Fake)', count: 25 },
    { name: '변조(Tamper)', count: 15 },
    { name: '복제(Clone)', count: 38 },
];

export const mockStageChartData = [
    { name: '공장 → 창고', count: 30 },
    { name: '창고 → 물류', count: 20 },
    { name: '물류 → 도매', count: 28 },
];

export const mockProductAnomalyData = [
    { productName: '테스트 제품 A', total: 10 },
    { productName: '테스트 제품 B', total: 50 },
    { productName: '테스트 제품 C', total: 18 },
];

export const mockInventoryData = [
    { businessStep: "Factory", value: 100 },
    { businessStep: "WMS", value: 200 },
    { businessStep: "LogiHub", value: 150 },
    { businessStep: "LogiHub2", value: 0 },
];

export const mockUser = {
    userId: 'test_user',
    userName: '테스트 사용자',
    role: 'ADMIN',
};