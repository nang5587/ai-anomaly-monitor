import apiClient from "./apiClient";

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

export const getUsers = async (): Promise<AdminUser[]> => {
    try {
        const response = await apiClient.get<GetUsersApiResponse>('/admin/users');
        return response.data?.users || [];
    } catch (error) {
        return [];
    }
};

export const updateUser = async (userId: string, data: Partial<AdminUser>): Promise<AdminUser> => {
    const requestBody = {
        userId: userId,
        ...data
    };
    const response = await apiClient.patch(`/admin/users/status`, requestBody);
    return response.data;
};

export const changeUserFactory = async (userId: string, locationId: number) => {
    const response = await apiClient.patch('/admin/users/factory', {
        userId,
        locationId,
    });
    return response.data;
};