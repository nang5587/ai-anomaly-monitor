export type UserStatus = 'pending' | 'active' | 'rejected' | 'inactive' | 'del';
export type UserRole = 'ADMIN' | 'MANAGER' | 'UNAUTH';

export type User = {
    userId: string;
    userName: string;
    email: string;
    role: UserRole;
    locationId: string;
    status: UserStatus;
    createdAt: string;
};

// --- 더미 데이터 (새로운 상태 추가) ---
export const dummyAllUsers: User[] = [
    // 승인 대기
    { userId: 'user-1', userName: '김대기', email: 'pending@test.com', role: 'UNAUTH', locationId: '1', status: 'pending', createdAt: new Date().toISOString() },
    { userId: 'user-2', userName: '박신청', email: 'request@test.com', role: 'UNAUTH', locationId: '2', status: 'pending', createdAt: new Date().toISOString() },
    // 활성 사용자
    { userId: 'user-3', userName: '이활성', email: 'active@test.com', role: 'MANAGER', locationId: '1', status: 'active', createdAt: new Date().toISOString() },
    { userId: 'user-4', userName: '최관리', email: 'manager@test.com', role: 'MANAGER', locationId: '3', status: 'active', createdAt: new Date().toISOString() },
    // 거절된 사용자
    { userId: 'user-5', userName: '정거절', email: 'rejected@test.com', role: 'UNAUTH', locationId: '2', status: 'rejected', createdAt: new Date().toISOString() },
    // 삭제된 사용자 (비활성)
    { userId: 'user-6', userName: '강삭제', email: 'deleted@test.com', role: 'MANAGER', locationId: '1', status: 'inactive', createdAt: new Date().toISOString() },
    // 삭제된 사용자 (소프트 삭제)
    { userId: 'user-7', userName: '오소프트', email: 'softdel@test.com', role: 'UNAUTH', locationId: '4', status: 'del', createdAt: new Date().toISOString() },
];