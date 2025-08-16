import { apiServer } from '@/api/apiServer'; 
import type { AxiosError } from 'axios';
import * as jose from 'jose';

const DUMMY_USERS = [
    { userId: 'nang5587', password: 'password123', role: 'ADMIN', location_id: 0, userName: '강나현', email: 'super@logistics.com' },
    { userId: 'sion511', password: 'password123', role: 'MANAGER', location_id: 1, userName: '오시온', email: 'icn@logistics.com' },
    { userId: 'dae0621', password: 'password123', role: 'MANAGER', location_id: 2, userName: '김대영', email: 'hws@logistics.com' },
];

const FAKE_SECRET_KEY = new TextEncoder().encode('a-super-secret-key-for-portfolio-demo');

const useMock = process.env.NEXT_PUBLIC_MOCK_API === 'true';

interface LoginResult {
    success: boolean;
    token?: string;
    message?: string;
}

export async function handleLoginRequest(userId: string, password: string): Promise<LoginResult> {
    if (useMock) {
        const foundUser = DUMMY_USERS.find(u => u.userId === userId && u.password === password);

        if (!foundUser) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return { success: false, message: '아이디 또는 비밀번호가 잘못되었습니다.' };
        }

        const payload = {
            userId: foundUser.userId,
            role: foundUser.role,
            location_id: foundUser.location_id,
        };

        const token = await new jose.SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('2h')
            .sign(FAKE_SECRET_KEY);
        
        const tempStorage = { userName: foundUser.userName, email: foundUser.email };

        return { success: true, token, ...tempStorage };
    } else {
        try {
            const response = await apiServer.post('/public/login', { userId, password });
            const authHeader = response.headers['authorization'] || response.headers['Authorization'];

            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                return { success: true, token };
            }
            throw new Error('인증 토큰이 없습니다.');
        } catch (err) {
            const error = err as AxiosError<{ message: string }> | Error;
            const message = (error as AxiosError<{ message: string }>)?.response?.data?.message || error.message || '로그인에 실패했습니다.';
            return { success: false, message };
        }
    }
}