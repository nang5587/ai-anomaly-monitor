import apiClient from './apiClient';
import { type User } from '../context/AuthContext';

// 1. 회원정보 가져오기 (GET /api/settings/user)
export const getMyProfile = async (): Promise<{ userName: string; email: string; }> => {
    const response = await apiClient.get('/manager/settings/user');
    return response.data; // 백엔드가 주는 json 형태 그대로 반환
};

// 2. 이름, 이메일 변경 (PATCH /api/settings/info)
export const updateProfileInfo = async (data: { userName: string; email: string }) => {
    // API 명세에 PATCH가 명시되지 않았지만, 일부만 수정하므로 PATCH가 적합
    const response = await apiClient.patch('/manager/settings/info', data);
    return response.data;
};

// 3. 비밀번호 변경 (POST /api/settings/password)
export const changePassword = async (data: { password: string; newPassword: string; }) => {
    const response = await apiClient.post('/manager/settings/password', data);
    return response.data;
};