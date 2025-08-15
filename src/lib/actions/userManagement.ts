'use server';
import apiClient from '@/api/apiClient';

export type User = {
    userId: string;
    userName: string;
    email: string;
    createdAt: string;
};

export const getUsers = async ({ status }: { status: 'pending' | 'active' }): Promise<User[]> => {
    try {
        const response = await apiClient.get(`/admin/users?status=${status}`);
        return response.data.users || [];
    } catch (error) {
        console.error('사용자 목록 조회 실패:', error);
        throw error;
    }
};

interface ApproveUserData {
    userId: string;
    role: 'MANAGER' | 'UNAUTH';
    locationId?: number;
}

export const approveUser = async (data: ApproveUserData) => {
    const { userId, role, locationId } = data;
    const body: any = {
        userId,
        role,
    };
    if (role === 'MANAGER' && locationId) {
        body.factory = locationId;
    }
    const response = await apiClient.post('/admin/users/approve', body);
    return response.data;
};

export const rejectUser = async (userId: string) => {
    const response = await apiClient.post('/admin/users/reject', {
        userId,
    });
    return response.data;
};