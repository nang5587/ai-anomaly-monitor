import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!baseURL) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL 환경변수를 찾을 수 없습니다.');
}

// 2. AxiosInstance 타입으로 인스턴스 생성
const apiClient: AxiosInstance = axios.create({
    baseURL: `${baseURL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    // 타임아웃 설정 (선택 사항)
    timeout: 5000,
});

apiClient.interceptors.request.use(
    // config 파라미터에 타입을 명시
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

// 4. 응답 인터셉터: 401 에러 처리 및 토큰 갱신 로직
apiClient.interceptors.response.use(
    // 성공적인 응답은 그대로 반환
    (response: AxiosResponse) => {
        return response;
    },
    // 에러 응답 처리
    async (error: AxiosError) => {
        // error.config는 원래 요청에 대한 설정 정보를 담고 있습니다.
        // as any를 사용하여 _retry 커스텀 속성을 추가합니다.
        const originalRequest = error.config as any;

        // 1. 401 에러이고, 아직 재시도하지 않은 요청일 경우
        if (error.response?.status === 401 && !originalRequest._retry) {

            // 재시도 플래그를 설정하여 무한 재요청 루프 방지
            originalRequest._retry = true;

            console.log('Access Token 만료 감지. 토큰 갱신을 시도합니다.');

            try {
                // 백엔드에서 새로운 Access Token을 응답 헤더에 담아준다고 가정합니다.
                // 이 부분은 백엔드 API 명세에 따라 달라질 수 있습니다.
                // 예를 들어, 별도의 /refresh 엔드포인트를 호출해야 할 수도 있습니다.
                // 여기서는 401 응답 헤더에 새 토큰이 담겨 오는 경우를 가정합니다.
                const newAccessToken = error.response.headers['authorization'] || error.response.headers['Authorization'];

                if (newAccessToken) {
                    const token = newAccessToken.startsWith('Bearer ') ? newAccessToken.split(' ')[1] : newAccessToken;
                    console.log('새로운 Access Token을 받았습니다.');

                    // 2. 새로운 토큰을 localStorage에 저장
                    localStorage.setItem('accessToken', token);

                    // 3. 원래 요청의 헤더에 새로운 토큰을 설정
                    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;

                    // 4. 원래 실패했던 요청을 새로운 토큰으로 다시 시도
                    console.log('원래 요청을 새로운 토큰으로 재시도합니다.');
                    return apiClient(originalRequest);
                } else {
                    // 헤더에 새 토큰이 없는 경우 (예: Refresh Token도 만료)
                    console.error('새로운 Access Token이 헤더에 없습니다. 로그아웃 처리합니다.');
                    localStorage.removeItem('accessToken');
                    // 필요하다면 refreshToken도 삭제
                    // localStorage.removeItem('refreshToken');
                    window.location.href = '/login'; // 로그인 페이지로 리디렉션
                    return Promise.reject(error);
                }
            } catch (refreshError) {
                // 토큰 갱신 과정 자체에서 에러가 발생한 경우
                console.error('토큰 갱신 중 에러 발생:', refreshError);
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // 401 에러가 아니거나 다른 조건이 맞지 않으면, 에러를 그대로 반환
        return Promise.reject(error);
    }
);

export default apiClient;