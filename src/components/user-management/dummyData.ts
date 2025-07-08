// lib/dummyData.ts 또는 components/features/user-management/dummyData.ts

// User 타입을 API 명세와 동일하게 정의합니다.
export type User = {
    userId: string;
    userName: string;
    email: string;
    requestedAt: string;
};

// 승인 대기 사용자 목록 더미 데이터
export const dummyPendingUsers: User[] = [
    {
        userId: 'user-uuid-001',
        userName: '김이노베이션',
        email: 'kim.inno@example.com',
        requestedAt: '2023-11-01T10:00:00Z',
    },
    {
        userId: 'user-uuid-002',
        userName: '박테크',
        email: 'park.tech@example.com',
        requestedAt: '2023-10-31T15:30:00Z',
    },
    {
        userId: 'user-uuid-003',
        userName: '최미래',
        email: 'choi.mirae@example.com',
        requestedAt: '2023-10-31T09:00:00Z',
    },
    {
        userId: 'user-uuid-004',
        userName: '정솔루션',
        email: 'jung.solution@example.com',
        requestedAt: '2023-10-30T11:20:00Z',
    },
    {
        userId: 'user-uuid-005',
        userName: '강데이터',
        email: 'kang.data@example.com',
        requestedAt: '2023-10-29T18:45:00Z',
    },
];

// 활성 사용자 목록 더미 데이터
export const dummyActiveUsers: User[] = [
    {
        userId: 'user-uuid-101',
        userName: '관리자',
        email: 'admin@ourcompany.com',
        requestedAt: '2023-01-01T00:00:00Z',
    },
    {
        userId: 'user-uuid-102',
        userName: '이매니저',
        email: 'lee.manager@ourcompany.com',
        requestedAt: '2023-09-15T14:00:00Z',
    },
];