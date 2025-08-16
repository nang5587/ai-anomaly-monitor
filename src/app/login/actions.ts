'use server'

import { handleLoginRequest } from '@/services/authService';

interface FormState {
    message: string;
    success: boolean;
    token?: string;
    rememberMe?: boolean;
}

export async function loginAction(prevState: FormState, formData: FormData): Promise<FormState> {
    const userId = formData.get('userId') as string;
    const password = formData.get('password') as string;
    const rememberMe = formData.get('rememberMe') === 'on';
    
    const result = await handleLoginRequest(userId, password);

    if (result.success && result.token) {
        return {
            message: '로그인 성공!',
            success: true,
            token: result.token,
            rememberMe: rememberMe,
        };
    } else {
        return {
            message: result.message || '아이디 또는 비밀번호가 잘못되었습니다.',
            success: false,
        };
    }
}