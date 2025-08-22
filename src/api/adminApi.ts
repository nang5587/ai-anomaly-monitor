import apiClient from "./apiClient";

// 1. 타입 정의 (기존과 동일)
export type AdminUser = {
    userId: string;
    userName: string;
    email: string;
    locationId: string; 
    role: 'ADMIN' | 'MANAGER' | 'UNAUTH';
    status: 'pending' | 'active' | 'inactive' | 'rejected' | 'del';
    createdAt: string;
};

interface GetUsersApiResponse {
    users: AdminUser[];
}

const isMockMode = process.env.NEXT_PUBLIC_MOCK_API === 'true';

let mockUsers: AdminUser[] = [
    { userId: 'user002', userName: '이매니저', email: 'manager_lee@example.com', locationId: '2', role: 'MANAGER', status: 'active', createdAt: new Date('2023-11-05T11:20:00Z').toISOString() },
    { userId: 'user003', userName: '박대기', email: 'pending_park@example.com', locationId: '3', role: 'UNAUTH', status: 'pending', createdAt: new Date('2024-01-15T09:30:00Z').toISOString() },
    { userId: 'user004', userName: '최승인', email: 'new_choi@example.com', locationId: '4', role: 'UNAUTH', status: 'pending', createdAt: new Date('2024-02-20T14:00:00Z').toISOString() },
    { userId: 'user005', userName: '정비활성', email: 'inactive_jung@example.com', locationId: '1', role: 'MANAGER', status: 'inactive', createdAt: new Date('2023-12-10T18:00:00Z').toISOString() },
    { userId: 'user006', userName: '강거절', email: 'rejected_kang@example.com', locationId: '2', role: 'UNAUTH', status: 'rejected', createdAt: new Date('2024-03-01T12:00:00Z').toISOString() },
];

const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getUsers = async (): Promise<AdminUser[]> => {
    if (isMockMode) {
        console.log(" MOCK API: getUsers() called");
        await simulateDelay(500); 
        return [...mockUsers]; 
    }
    try {
        const response = await apiClient.get<GetUsersApiResponse>('/admin/users');
        return response.data?.users || [];
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
};

export const updateUser = async (userId: string, data: Partial<Pick<AdminUser, 'status' | 'role'>>): Promise<AdminUser> => {
    if (isMockMode) {
        console.log(` MOCK API: updateUser() called for userId: ${userId}`, data);
        await simulateDelay(300);
        const userIndex = mockUsers.findIndex(u => u.userId === userId);
        if (userIndex > -1) {
            mockUsers[userIndex] = { ...mockUsers[userIndex], ...data };
            return { ...mockUsers[userIndex] };
        }
        throw new Error("Mock User not found");
    }
    const requestBody = { userId, ...data };
    const response = await apiClient.patch(`/admin/users/status`, requestBody);
    return response.data;
};

export const changeUserFactory = async (userId: string, locationId: number): Promise<AdminUser> => {
    if (isMockMode) {
        console.log(` MOCK API: changeUserFactory() called for userId: ${userId}, locationId: ${locationId}`);
        await simulateDelay(300);
        const userIndex = mockUsers.findIndex(u => u.userId === userId);
        if (userIndex > -1) {
            mockUsers[userIndex].locationId = String(locationId); 
            return { ...mockUsers[userIndex] };
        }
        throw new Error("Mock User not found");
    }
    const response = await apiClient.patch('/admin/users/factory', { userId, locationId });
    return response.data;
};