'use server';

import { checkUserId_server, joinUser_server } from '@/api/apiServer';
import type { JoinFormData } from '@/types/join';

import type { ServerActionResponse } from '@/types/api';

export async function checkUserIdAction(userId: string): Promise<ServerActionResponse> {
    if (!userId) {
        return { success: false, error: "아이디를 입력해주세요!" };
    }
    try {
        const responseData = await checkUserId_server(userId);
        return { success: true, message: responseData.message || "사용 가능한 아이디입니다." };

    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || '아이디 중복 검사에 실패했습니다.';
        return { success: false, error: errorMessage };
    }
}

export async function joinUserAction(formData: JoinFormData): Promise<ServerActionResponse> {
    if (!formData.password || formData.password.length < 4) {
        return { success: false, error: "비밀번호는 4자 이상이어야 합니다." };
    }
    if (!formData.userId || !formData.userName || !formData.email) {
        return { success: false, error: "필수 항목을 모두 입력해주세요." };
    }
    const completeFormData: JoinFormData = {
        ...formData,
        role: formData.role || 'MANAGER',
        locationId: formData.locationId || 1,
    };
    try {
        const responseData = await joinUser_server(completeFormData);
        return { success: true, message: responseData.message || "회원가입이 성공적으로 완료되었습니다." };
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || '회원가입 처리 중 오류가 발생했습니다.';
        return { success: false, error: errorMessage };
    }
}