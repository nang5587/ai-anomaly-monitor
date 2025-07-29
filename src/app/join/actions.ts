'use server';

import { checkUserId_server, joinUser_server } from '@/api/apiServer';
import type { JoinFormData } from '@/types/join';

import type { ServerActionResponse } from '@/types/api';

/**
 * 아이디 중복 검사 서버 액션
 * @param userId - 확인할 사용자 아이디
 * @returns 표준 응답 객체 (ServerActionResponse)
 */
export async function checkUserIdAction(userId: string): Promise<ServerActionResponse> {
    if (!userId) {
        return { success: false, error: "아이디를 입력해주세요!" };
    }

    try {
        // apiServer.ts의 함수를 호출합니다. 이 함수는 axios를 사용합니다.
        const responseData = await checkUserId_server(userId);

        // 백엔드 API가 성공적으로 응답했을 때의 로직
        // 백엔드 응답 형식에 따라 키를 조정해야 합니다. (예: responseData.message)
        return { success: true, message: responseData.message || "사용 가능한 아이디입니다." };

    } catch (error: any) {
        // apiServer.ts의 serverRequest 함수에서 던진 에러를 여기서 잡습니다.
        // axios 에러인 경우, 에러 응답 본문을 포함할 수 있습니다.
        const errorMessage = error.response?.data?.message || error.response?.data?.error || '아이디 중복 검사에 실패했습니다.';

        console.error("ID Check Action Error: ", error.response?.data || error.message);
        return { success: false, error: errorMessage };
    }
}

/**
 * 회원가입 처리 서버 액션
 * @param formData - 회원가입 폼 데이터
 * @returns 표준 응답 객체 (ServerActionResponse)
 */
export async function joinUserAction(formData: JoinFormData): Promise<ServerActionResponse> {
    // 서버 사이드 유효성 검사 (예시)
    if (!formData.password || formData.password.length < 4) {
        return { success: false, error: "비밀번호는 4자 이상이어야 합니다." };
    }
    if (!formData.userId || !formData.userName || !formData.email) {
        return { success: false, error: "필수 항목을 모두 입력해주세요." };
    }

    // API 명세에 따라 role, locationId 등 기본값 설정
    const completeFormData: JoinFormData = {
        ...formData,
        role: formData.role || 'MANAGER', // 기본값 설정
        locationId: formData.locationId || 1, // 기본값 설정
    };

    try {
        const responseData = await joinUser_server(completeFormData);

        return { success: true, message: responseData.message || "회원가입이 성공적으로 완료되었습니다." };

    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || '회원가입 처리 중 오류가 발생했습니다.';

        console.error("Join Action Error: ", error.response?.data || error.message);
        return { success: false, error: errorMessage };
    }
}