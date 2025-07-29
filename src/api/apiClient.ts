import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { FileItem } from '@/types/file';
import { CoverReportData } from "@/types/api";
import type { JoinFormData } from '@/types/join';

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

// ===================================================================
// ✨ 여기에 클라이언트 컴포넌트에서 사용할 API 함수들을 정의합니다.
// ===================================================================

/**
 * [클라이언트용] 업로드된 파일 목록을 가져옵니다.
 * apiClient 인터셉터가 localStorage/sessionStorage에서 토큰을 자동으로 주입합니다.
 */
// export async function getFiles_client(): Promise<FileItem[]> {
//     try {
//         const response = await apiClient.get<FileItem[]>('/manager/upload/filelist');
//         // 백엔드 응답이 { data: [...] } 형태일 경우 response.data.data를,
//         // [...] 형태일 경우 response.data를 반환해야 합니다.
//         // API 명세에 따라 조정이 필요할 수 있습니다. 여기서는 배열을 직접 반환한다고 가정합니다.
//         return response.data || [];
//     } catch (error) {
//         console.error("파일 목록 불러오기 실패 (클라이언트):", error);
//         // 에러를 다시 던져서 호출한 쪽(useEffect)에서 catch 할 수 있도록 함
//         throw error;
//     }
// }
export async function getFiles_client(): Promise<FileItem[]> {
    try {
        // 1. API에 데이터를 요청합니다. 응답 타입을 'any'로 하여 유연하게 받습니다.
        const response = await apiClient.get<any>('/manager/upload/filelist');
        const data = response.data;

        // 2. 응답 데이터가 있는지 먼저 확인합니다.
        if (!data) {
            console.warn("getFiles_client: API 응답 데이터가 없습니다.");
            return []; // 데이터가 없으면 빈 배열 반환
        }

        // 3. 가장 이상적인 경우: 데이터가 이미 배열인가?
        if (Array.isArray(data)) {
            return data as FileItem[];
        }
        console.log('파일리스트입니다람쥐 ', data)

        // 4. 흔한 경우: 데이터가 { data: [...] } 또는 { files: [...] } 형태의 객체인가?
        //    (실제 API 응답에 맞는 키 'data', 'files', 'list' 등을 확인하고 수정하세요)
        if (typeof data === 'object' && data !== null) {
            if (Array.isArray(data.data)) {
                return data.data as FileItem[];
            }
            if (Array.isArray(data.files)) {
                return data.files as FileItem[];
            }
            if (Array.isArray(data.fileList)) { // 다른 가능한 키 이름
                return data.fileList as FileItem[];
            }
        }

        // 5. 위 모든 경우에 해당하지 않으면, 예기치 않은 형식이므로 경고 후 빈 배열 반환
        console.warn("getFiles_client: API 응답이 예상된 배열 형식이 아닙니다.", data);
        return [];

    } catch (error) {
        console.error("파일 목록 불러오기 실패 (클라이언트):", error);
        // 6. 에러가 발생했을 때도, 에러를 던지는 대신 항상 빈 배열을 반환합니다.
        //    이렇게 하면 이 함수를 사용하는 컴포넌트가 추가적인 try/catch 없이 안전하게 값을 받을 수 있습니다.
        return [];
    }
}
/**
 * 지정된 fileId의 파일을 논리적으로 삭제 처리합니다. (예: is_deleted 플래그 업데이트)
 * @param fileId 삭제 처리할 파일의 ID
 */
export const markFileAsDeleted = (fileId: number) => {
    // PATCH 요청을 사용하여 리소스의 일부(상태)를 업데이트합니다.
    // 백엔드 API는 /upload/del/{fileId} 엔드포인트에서 PATCH 요청을 처리하도록 구현되어야 합니다.
    return apiClient.patch(`/upload/del/${fileId}`);
};

/**
 * 지정된 fileId에 대한 보고서 커버 데이터를 서버에서 가져옵니다.
 * @param params - fileId를 포함하는 객체
 * @returns {Promise<CoverReportData>} 보고서 커버 데이터
 * @throws {Error} API 호출 실패 시 에러를 던집니다.
 */

const DUMMY_COVER_DB: Record<number, CoverReportData> = {
    4: {
        fileName: "화성-프로젝트.csv",
        userName: "김화성",
        locationId: 2,
        createdAt: "2025-07-27T10:00:00Z",
        period: ["2025-07-20T00:00:00Z", "2025-07-27T00:00:00Z"]
    },
    2: {
        fileName: "수원-물류센터.csv",
        userName: "이수원",
        locationId: 1,
        createdAt: "2025-07-28T11:00:00Z",
        period: ["2025-07-21T00:00:00Z", "2025-07-28T00:00:00Z"]
    },
    9: {
        fileName: "수원-물류센터.csv",
        userName: "이수원",
        locationId: 1,
        createdAt: "2025-07-28T11:00:00Z",
        period: ["2025-07-21T00:00:00Z", "2025-07-28T00:00:00Z"]
    },
    1: {
        fileName: "수원-물류센터.csv",
        userName: "이수원",
        locationId: 1,
        createdAt: "2025-07-28T11:00:00Z",
        period: ["2025-07-21T00:00:00Z", "2025-07-28T00:00:00Z"]
    },
    3: {
        fileName: "수원-물류센터.csv",
        userName: "이수원",
        locationId: 1,
        createdAt: "2025-07-28T11:00:00Z",
        period: ["2025-07-21T00:00:00Z", "2025-07-28T00:00:00Z"]
    },
    5: {
        fileName: "수원-물류센터.csv",
        userName: "이수원",
        locationId: 1,
        createdAt: "2025-07-28T11:00:00Z",
        period: ["2025-07-21T00:00:00Z", "2025-07-28T00:00:00Z"]
    },
    10: {
        fileName: "수원-물류센터.csv",
        userName: "이수원",
        locationId: 1,
        createdAt: "2025-07-28T11:00:00Z",
        period: ["2025-07-21T00:00:00Z", "2025-07-28T00:00:00Z"]
    },
    11: {
        fileName: "수원-물류센터.csv",
        userName: "이수원",
        locationId: 1,
        createdAt: "2025-07-28T11:00:00Z",
        period: ["2025-07-21T00:00:00Z", "2025-07-28T00:00:00Z"]
    },
    // 필요한 만큼 더미 데이터를 추가할 수 있습니다.
};
export async function getCoverReportData(params: { fileId: number }): Promise<CoverReportData> {
    const { fileId } = params;

    if (!fileId || typeof fileId !== 'number') {
        throw new Error('getCoverReportData: 유효하지 않은 fileId입니다.');
    }

    // --- 🚀 실제 API 연동 시 이 블록의 주석을 해제하세요 ---
    /*
    try {
        const response = await apiClient.get<CoverReportData>(`/manager/report/cover/${fileId}`);
        if (!response.data) {
            throw new Error(`fileId ${fileId}에 대한 커버 데이터를 찾을 수 없습니다.`);
        }
        return response.data;
    } catch (error) {
        console.error(`커버 데이터(fileId: ${fileId}) 불러오기 실패:`, error);
        throw error;
    }
    */

    // --- 🚀 더미 데이터 반환 로직 (개발 및 테스트용) ---
    console.log(`[더미 데이터] 커버 데이터 요청: fileId ${fileId}`);

    // 실제 API 호출처럼 약간의 딜레이를 시뮬레이션합니다.
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    const data = DUMMY_COVER_DB[fileId];

    if (data) {
        // 성공적으로 데이터를 찾으면 반환합니다.
        return Promise.resolve(data);
    } else {
        // 해당하는 데이터가 없으면 에러를 발생시켜 실패 상황을 시뮬레이션합니다.
        return Promise.reject(new Error(`[더미 데이터] fileId ${fileId}에 대한 커버 데이터를 찾을 수 없습니다.`));
    }
}

/**
 * [클라이언트용] 아이디 중복 검사를 요청하는 함수
 * @param userId - 확인할 사용자 아이디
 * @returns {Promise<any>} API 응답 데이터 (성공 또는 실패 정보 포함)
 */
export const checkUserId_client = async (userId: string) => {
    try {
        const response = await apiClient.post('/public/join/idsearch', { userId });
        // 성공 시, 백엔드 응답 데이터를 그대로 반환
        // 예: { message: "사용 가능한 아이디입니다." }
        return response.data;
    } catch (error) {
        // Axios 에러인 경우, 에러 응답의 data를 반환하여 컴포넌트에서 활용
        if (axios.isAxiosError(error) && error.response) {
            return Promise.reject(error.response.data);
        }
        // 그 외 네트워크 에러 등
        return Promise.reject(error);
    }
};

/**
 * [클라이언트용] 회원가입을 요청하는 함수
 * @param formData - 회원가입 폼 데이터
 * @returns {Promise<any>} API 응답 데이터
 */
export const joinUser_client = async (formData: JoinFormData) => {
    try {
        const response = await apiClient.post('/public/join', formData);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error);
    }
};

/**
 * [클라이언트용] AI 모듈로 파일 재전송을 요청하는 함수
 * @param fileId 재전송할 파일의 ID
 * @returns {Promise<any>} API 응답 데이터
 */
export const fileResend_client = async (fileId: number) => {
    if (!fileId || typeof fileId !== 'number' || fileId <= 0) {
        console.error("fileResend_client: 유효하지 않은 fileId입니다.", fileId);
        return Promise.reject(new Error("유효하지 않은 파일 ID입니다."));
    }

    try {
        const response = await apiClient.post(`/manager/resend/${fileId}`);
        return response.data;

    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error(`파일(ID: ${fileId}) 재전송 실패:`, error.response.data);
            return Promise.reject(error.response.data);
        }
        console.error(`파일(ID: ${fileId}) 재전송 중 알 수 없는 오류:`, error);
        return Promise.reject(error);
    }
};


export default apiClient;