import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// 1. Next.js 환경변수 사용
const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!baseURL) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL 환경변수를 찾을 수 없습니다.');
}

// 2. AxiosInstance 타입으로 인스턴스 생성
const api: AxiosInstance = axios.create({
    baseURL: `${baseURL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    // 타임아웃 설정 (선택 사항)
    timeout: 5000, 
});

// 3. 요청 인터셉터에 타입 추가
api.interceptors.request.use(
    // config 파라미터에 타입을 명시하여 자동완성 및 타입 안정성 확보
    (config: InternalAxiosRequestConfig) => {
        // localStorage는 브라우저 환경에서만 사용 가능하므로 확인
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('accessToken');
            if (token) {
                // 헤더에 인증 토큰 추가
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    // error 파라미터에도 타입을 명시
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

export default api;