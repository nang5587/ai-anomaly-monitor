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

const isMock = process.env.NEXT_PUBLIC_MOCK_API === 'true';

// --- Mock 데이터 정의 ---
const mockFiles: FileItem[] = [
    { fileId: 1, fileName: '인천공장_물류데이터.csv', userId: 'nang5587', fileSize: 125456, createdAt: new Date('2025-08-21T10:30:00Z').toISOString(), locationId: 0 },
    { fileId: 2, fileName: '인천센터_입출고_기록.csv', userId: 'nang5587', fileSize: 783412, createdAt: new Date('2025-08-20T15:00:00Z').toISOString(), locationId: 0 },
    { fileId: 3, fileName: '인천_재고현황_snapshot.csv', userId: 'nang5587', fileSize: 426678, createdAt: new Date('2025-08-19T09:00:00Z').toISOString(), locationId: 0 },
    { fileId: 4, fileName: '인천_센서데이터_로그.csv', userId: 'nang5587', fileSize: 987454, createdAt: new Date('2025-08-18T18:45:00Z').toISOString(), locationId: 0 },
];

const mockCoverReportDatabase: Record<number, CoverReportData> = {
    1: { fileName: "인천공장_물류데이터.csv", userName: "강나현", locationId: 0, createdAt: "2025-08-21T10:30:00Z", period: ["2025-08-14T00:00:00Z", "2025-08-21T00:00:00Z"] },
    2: { fileName: "인천센터_입출고_기록.csv", userName: "강나현", locationId: 0, createdAt: "2025-08-20T15:00:00Z", period: ["2025-08-13T00:00:00Z", "2025-08-20T00:00:00Z"] },
};


const mockGetFiles_client = (): Promise<FileItem[]> => new Promise(resolve => {
    console.log('%c[MOCK API] getFiles_client', 'color: #10B981');
    setTimeout(() => resolve(mockFiles), 500);
});

const mockMarkFileAsDeleted = (fileId: number): Promise<any> => new Promise(resolve => {
    console.log(`%c[MOCK API] markFileAsDeleted for fileId: ${fileId}`, 'color: #EF4444');
    setTimeout(() => resolve({ success: true, message: `File ${fileId} marked as deleted (Mock)` }), 300);
});

const mockGetCoverReportData = (params: { fileId: number }): Promise<CoverReportData> => new Promise((resolve, reject) => {
    console.log(`%c[MOCK API] getCoverReportData for fileId: ${params.fileId}`, 'color: #10B981');
    const data = mockCoverReportDatabase[params.fileId];
    setTimeout(() => {
        if (data) {
            resolve(data);
        } else {
            reject(new Error(`[Mock Error] fileId ${params.fileId}에 대한 커버 데이터를 찾을 수 없습니다.`));
        }
    }, 400);
});

const mockCheckUserId_client = (userId: string): Promise<any> => new Promise((resolve, reject) => {
    console.log(`%c[MOCK API] checkUserId_client for userId: ${userId}`, 'color: #F59E0B');
    setTimeout(() => {
        if (userId.toLowerCase() === 'taken' || userId.toLowerCase() === 'admin') {
            reject({ message: '이미 사용 중인 아이디입니다. (Mock Error)' });
        } else {
            resolve({ available: true, message: '사용 가능한 아이디입니다. (Mock)' });
        }
    }, 600);
});

const mockJoinUser_client = (formData: JoinFormData): Promise<any> => new Promise(resolve => {
    console.log('%c[MOCK API] joinUser_client with data:', 'color: #10B981', formData);
    setTimeout(() => {
        resolve({ success: true, message: `${formData.userName}님의 회원가입을 환영합니다! (Mock)` });
    }, 1000);
});

const mockFileResend_client = (fileId: number): Promise<any> => new Promise(resolve => {
    console.log(`%c[MOCK API] fileResend_client for fileId: ${fileId}`, 'color: #3B82F6');
    setTimeout(() => {
        resolve({ success: true, message: `File ${fileId} 재전송 요청 완료 (Mock)` });
    }, 800);
});

const realGetFiles_client = async (): Promise<FileItem[]> => {
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

const realMarkFileAsDeleted = (fileId: number) => {
    return apiClient.patch(`/upload/del/${fileId}`);
};

const realGetCoverReportData = async (params: { fileId: number }): Promise<CoverReportData> => {
    const { fileId } = params;
    if (!fileId) throw new Error('getCoverReportData: 유효하지 않은 fileId입니다.');
    const response = await apiClient.get<CoverReportData>(`/manager/report/cover/${fileId}`);
    return response.data;
};

const realCheckUserId_client = async (userId: string) => {
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

const realJoinUser_client = async (formData: JoinFormData) => {
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

const realFileResend_client = async (fileId: number) => {
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

export const getFiles_client = isMock ? mockGetFiles_client : realGetFiles_client;
export const markFileAsDeleted = isMock ? mockMarkFileAsDeleted : realMarkFileAsDeleted;
export const getCoverReportData = isMock ? mockGetCoverReportData : realGetCoverReportData;
export const checkUserId_client = isMock ? mockCheckUserId_client : realCheckUserId_client;
export const joinUser_client = isMock ? mockJoinUser_client : realJoinUser_client;
export const fileResend_client = isMock ? mockFileResend_client : realFileResend_client;

export default apiClient;