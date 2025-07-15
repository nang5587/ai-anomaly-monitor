import apiClient from "./apiClient";
import { type User } from '../context/AuthContext';

// 1. 모든 사용자 목록 가져오기 (GET /api/admin/users)
export const getUsers = async (): Promise<User[]> => {
    const response = await apiClient.get('/admin/users');
    return response.data; // 백엔드가 User[] 형태의 배열을 반환한다고 가정
};

// 2. 특정 사용자의 상태/역할 등 정보 업데이트 (PATCH /api/admin/users/{userId})
// Partial<User>를 사용하여 status, role 등 일부만 업데이트 가능
export const updateUser = async (userId: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.patch(`/admin/users/${userId}`, data);
    return response.data; // 업데이트된 사용자 정보를 반환한다고 가정
};

// 3. 사용자의 소속 공장 변경 (PATCH /api/admin/users/factory)
export const changeUserFactory = async (userId: string, locationId: number) => {
    const response = await apiClient.patch('/admin/users/factory', {
        userId,
        locationId,
    });
    return response.data;
};