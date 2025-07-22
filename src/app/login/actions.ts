'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import apiClient from '@/api/apiClient'; // apiClient는 서버에서도 동작 가능해야 함
import jwtDecode from 'jwt-decode';
import type { AxiosError } from 'axios';

interface DecodedToken {
    role: string;
}

function getRedirectUrl(role: string) {
    switch (role) {
        case "ADMIN": return "/supervisor";
        case "MANAGER": return "/manager1";
        default: return "/";
    }
}

// 2. 폼의 상태를 나타내는 타입 정의
interface FormState {
    message: string;
    success: boolean;
}

// 3. 폼 데이터를 받아 서버에서 직접 로그인 처리하는 함수
//    첫 번째 인자로 이전 상태(prevState), 두 번째로 FormData를 받음
export async function loginAction(prevState: FormState, formData: FormData): Promise<FormState> {
    // 4. FormData에서 입력값을 가져옴
    const userId = formData.get('userId') as string;
    const password = formData.get('password') as string;
    const rememberMe = formData.get('rememberMe') === 'on';

    try {
        const response = await apiClient.post('/public/login', { userId, password });
        const authHeader = response.headers['authorization'] || response.headers['Authorization'];

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded: DecodedToken = jwtDecode(token);

            // 5. 로그인 성공 시, 서버에서 직접 쿠키를 설정
            cookies().set('accessToken', token, {
                httpOnly: true, // 클라이언트 JS에서 접근 불가
                secure: process.env.NODE_ENV === 'production', // 프로덕션에서는 https만
                maxAge: rememberMe ? 60 * 60 * 24 * 7 : undefined, // 7일 또는 세션 쿠키
                path: '/',
            });

        } else {
            throw new Error('인증 토큰이 없습니다.');
        }

    } catch (err) {
        const error = err as AxiosError<{ message: string }> | Error;
        // 6. 실패 시, 에러 메시지를 담은 상태를 반환
        const errorMessage = (error as AxiosError<{ message: string }>)?.response?.data?.message || error.message || '아이디 또는 비밀번호가 잘못되었습니다.';
        return { message: errorMessage, success: false };
    }

    // 7. 리디렉션은 try-catch 블록 바깥에서 실행 (성공했을 때만)
    const token = cookies().get('accessToken')?.value;
    if (token) {
        const decoded: DecodedToken = jwtDecode(token);
        redirect(getRedirectUrl(decoded.role));
    }

    // (redirect가 실행되면 이 코드는 도달하지 않음)
    return { message: '로그인 성공!', success: true };
}