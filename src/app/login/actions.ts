'use server'
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiServer } from '@/api/apiServer';
import jwtDecode from 'jwt-decode';
import type { AxiosError } from 'axios';

interface DecodedToken {
    role: string;
}

function getRedirectUrl(role: string) {
    switch (role) {
        case "ADMIN": return "/supervisor";
        case "MANAGER": return "/admin";
        default: return "/";
    }
}

interface FormState {
    message: string;
    success: boolean;
    token?: string;
    rememberMe?: boolean;
}

export async function loginAction(prevState: FormState, formData: FormData): Promise<FormState> {
    // 4. FormData에서 입력값을 가져옴
    const userId = formData.get('userId') as string;
    const password = formData.get('password') as string;
    const rememberMe = formData.get('rememberMe') === 'on';
    let token: string | null = null;

    try {
        const response = await apiServer.post('/public/login', { userId, password });
        const authHeader = response.headers['authorization'] || response.headers['Authorization'];

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            cookies().set('accessToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: rememberMe ? 60 * 60 * 24 * 7 : undefined,
                path: '/',
                sameSite: 'strict',
            });
            return { message: '로그인 성공!', success: true, token: token, rememberMe };
        } else {
            throw new Error('인증 토큰이 없습니다.');
        }
    } catch (err) {
        const error = err as AxiosError<{ message: string }> | Error;
        const errorMessage = (error as AxiosError<{ message: string }>)?.response?.data?.message || error.message || '아이디 또는 비밀번호가 잘못되었습니다.';
        return { message: errorMessage, success: false };
    }
}