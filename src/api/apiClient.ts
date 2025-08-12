import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { FileItem } from '@/types/file';
import { CoverReportData } from "@/types/api";
import type { JoinFormData } from '@/types/join';

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!baseURL) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL 환경변수를 찾을 수 없습니다.');
}

const apiClient: AxiosInstance = axios.create({
    baseURL: `${baseURL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 5000,
});

apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as any;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const newAccessToken = error.response.headers['authorization'] || error.response.headers['Authorization'];
                if (newAccessToken) {
                    const token = newAccessToken.startsWith('Bearer ') ? newAccessToken.split(' ')[1] : newAccessToken;
                    localStorage.setItem('accessToken', token);
                    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;
                    return apiClient(originalRequest);
                } else {
                    localStorage.removeItem('accessToken');
                    window.location.href = '/login';
                    return Promise.reject(error);
                }
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

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
        const response = await apiClient.get<any>('/manager/upload/filelist');
        const data = response.data;
        if (!data) {
            return [];
        }
        if (Array.isArray(data)) {
            return data as FileItem[];
        }
        if (typeof data === 'object' && data !== null) {
            if (Array.isArray(data.data)) {
                return data.data as FileItem[];
            }
            if (Array.isArray(data.files)) {
                return data.files as FileItem[];
            }
            if (Array.isArray(data.fileList)) {
                return data.fileList as FileItem[];
            }
        }
        return [];
    } catch (error) {
        return [];
    }
}

export const markFileAsDeleted = (fileId: number) => {
    return apiClient.patch(`/upload/del/${fileId}`);
};

// const DUMMY_COVER_DB: Record<number, CoverReportData> = {
//     1: {
//         fileName: "수원-물류센터.csv",
//         userName: "이수원",
//         locationId: 1,
//         createdAt: "2025-07-28T11:00:00Z",
//         period: ["2025-07-21T00:00:00Z", "2025-07-28T00:00:00Z"]
//     }
// };

export async function getCoverReportData(params: { fileId: number }): Promise<CoverReportData> {
    const { fileId } = params;

    if (!fileId || typeof fileId !== 'number') {
        throw new Error('getCoverReportData: 유효하지 않은 fileId입니다.');
    }

    // --- 🚀 실제 API 연동 시 이 블록의 주석을 해제하세요 ---
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

    // --- 🚀 더미 데이터 반환 로직 (개발 및 테스트용) ---
    // console.log(`[더미 데이터] 커버 데이터 요청: fileId ${fileId}`);

    // // 실제 API 호출처럼 약간의 딜레이를 시뮬레이션합니다.
    // await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    // const data = DUMMY_COVER_DB[fileId];

    // if (data) {
    //     // 성공적으로 데이터를 찾으면 반환합니다.
    //     return Promise.resolve(data);
    // } else {
    //     // 해당하는 데이터가 없으면 에러를 발생시켜 실패 상황을 시뮬레이션합니다.
    //     return Promise.reject(new Error(`[더미 데이터] fileId ${fileId}에 대한 커버 데이터를 찾을 수 없습니다.`));
    // }
}

export const checkUserId_client = async (userId: string) => {
    try {
        const response = await apiClient.post('/public/join/idsearch', { userId });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error);
    }
};

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

export const fileResend_client = async (fileId: number) => {
    if (!fileId || typeof fileId !== 'number' || fileId <= 0) {
        return Promise.reject(new Error("유효하지 않은 파일 ID입니다."));
    }
    try {
        const response = await apiClient.post(`/manager/resend/${fileId}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error);
    }
};

export default apiClient;