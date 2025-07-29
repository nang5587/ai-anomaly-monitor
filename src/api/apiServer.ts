import axios, { AxiosInstance } from 'axios';
import { cookies } from 'next/headers';
import path from 'path';
import { promises as fs } from 'fs';

import type { LocationNode, PaginatedTripsResponse, KpiSummary, InventoryDistributionResponse, FilterOptions } from '../types/data';
import type { FileItem } from '@/types/file';
import type { JoinFormData } from '@/types/join';

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!baseURL) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL 환경변수를 찾을 수 없습니다.');
}

export const apiServer: AxiosInstance = axios.create({
    baseURL: `${baseURL}/api`,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

// =================================================================
// 🚀 실제 백엔드 API 호출을 위한 함수 (나중에 사용할 코드)
// =================================================================
export const serverRequest = async <T>(config: import('axios').AxiosRequestConfig): Promise<T> => {
    try {
        const token = cookies().get('accessToken')?.value;
        if (token) {
            config.headers = { ...config.headers, 'Authorization': `Bearer ${token}` };
        }
        const response = await apiServer(config);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            console.error('Server API Error: 401 Unauthorized.');
        } else {
            console.error('Server API Error:', error);
        }
        throw error;
    }
};


// =================================================================
// 📝 더미 데이터(.json 파일)를 읽기 위한 함수 (지금 사용할 코드)
// =================================================================
async function readJsonFile_server(filePath: string) {
    try {
        const jsonDirectory = path.join(process.cwd(), 'public');
        const fullPath = jsonDirectory + filePath;
        console.log(`[readJsonFile_server] Reading file from: ${fullPath}`);
        const fileContents = await fs.readFile(fullPath, 'utf8');
        console.log(`[readJsonFile_server] File contents:`, fileContents);
        return JSON.parse(fileContents);
    } catch (error) {
        console.error(`[readJsonFile_server] Error reading JSON file at ${filePath}:`, error);
        throw error;
    }
}

// -----------------------------------------------------------------
// ✨ 프로젝트의 모든 서버용 데이터 함수들
// -----------------------------------------------------------------
// 지금은 더미 데이터 함수를 사용하고, 나중에 실제 백엔드 함수로 교체하면 됩니다.

export const getNodes_server = async (): Promise<LocationNode[]> => {
    // return serverRequest<LocationNode[]>({ url: '/nodes', method: 'GET' }); // 🚀 실제 백엔드용
    return readJsonFile_server('/api/nodes.json'); // 📝 더미 데이터용
};

export const getAnomalies_server = async (params?: any): Promise<PaginatedTripsResponse> => {
    // return serverRequest<PaginatedTripsResponse>({ url: '/anomalies', method: 'GET', params }); // 🚀 실제 백엔드용
    const data: PaginatedTripsResponse['data'] = await readJsonFile_server('/api/anomalies.json'); // 📝 더미 데이터용
    // (더미 데이터는 페이지네이션/필터링 로직이 필요하다면 여기에 추가)
    return { data: data.slice(0, params?.limit || 50), nextCursor: null };
};

export const getTrips_server = async (params?: any): Promise<PaginatedTripsResponse> => {
    // return serverRequest<PaginatedTripsResponse>({ url: '/trips', method: 'GET', params }); // 🚀 실제 백엔드용
    const data: PaginatedTripsResponse['data'] = await readJsonFile_server('/api/trips.json'); // 📝 더미 데이터용
    return { data: data.slice(0, params?.limit || 50), nextCursor: null };
};

export const getRouteGeometries_server = async (): Promise<any> => {
    // return serverRequest<any>({ url: '/route-geometries', method: 'GET' }); // 🚀 실제 백엔드용
    return readJsonFile_server('/api/route-geometries.json'); // 📝 더미 데이터용
}

// fetch를 사용하지 않는 순수 더미 데이터 함수들은 그대로 사용 가능
export const getKpiSummary_server = async (params?: Record<string, any>): Promise<KpiSummary> => {
    return { totalTripCount: 854320000, uniqueProductCount: 128, codeCount: 2000000, anomalyCount: 125, anomalyRate: 0.0146, salesRate: 92.5, dispatchRate: 95.1, inventoryRate: 78.2, avgLeadTime: 12.5 };
}
export const getInventoryDistribution_server = async (params?: Record<string, any>): Promise<InventoryDistributionResponse> => {
    return { inventoryDistribution: [{ "businessStep": "Factory", "value": 12050 }, { "businessStep": "WMS", "value": 25800 }, { "businessStep": "LogiHub", "value": 17300 }, { "businessStep": "Wholesaler", "value": 35100 }, { "businessStep": "Reseller", "value": 48200 }, { "businessStep": "POS", "value": 31540 }] };
}

// ... lib/apiServer.ts 파일의 기존 코드 맨 아래 ...

// =================================================================
// 📝 admin.ts의 서버 버전 함수들
// =================================================================

import type { AdminUser } from '@/api/adminApi';

export const getUsers_server = async (): Promise<AdminUser[]> => {
    // 🚀 실제 백엔드용
    // return serverRequest<AdminUser[]>({ url: '/admin/users', method: 'GET' });

    // 📝 더미 데이터용
    return readJsonFile_server('/api/admin_users.json'); // public/api/admin_users.json 파일이 필요합니다.
};

export const updateUser_server = async (userId: string, data: Partial<AdminUser>): Promise<AdminUser> => {
    // 🚀 실제 백엔드용
    // return serverRequest<AdminUser>({ url: `/admin/users/${userId}`, method: 'PATCH', data });

    // 📝 더미 데이터용 (업데이트 시뮬레이션 - 실제 파일 변경은 안 함)
    console.log(`[Server Dummy] Updating user ${userId} with`, data);
    const users: AdminUser[] = await readJsonFile_server('/api/admin_users.json');
    const user = users.find(u => u.userId === userId);
    if (!user) throw new Error('User not found');
    return { ...user, ...data };
};

export const changeUserFactory_server = async (userId: string, locationId: number) => {
    // 🚀 실제 백엔드용
    // return serverRequest<any>({ url: '/admin/users/factory', method: 'PATCH', data: { userId, locationId } });

    // 📝 더미 데이터용
    console.log(`[Server Dummy] Changing factory for user ${userId} to ${locationId}`);
    return { success: true, message: 'Factory changed successfully' };
};


// =================================================================
// 📝 settings.ts의 서버 버전 함수들
// =================================================================

import type { User } from '@/context/AuthContext';

export const getMyProfile_server = async (): Promise<{ userName: string; email: string; }> => {
    // 🚀 실제 백엔드용
    // return serverRequest<{ userName: string; email: string; }>({ url: '/manager/settings/user', method: 'GET' });

    // 📝 더미 데이터용
    // 이 API는 "현재 로그인한 나"의 정보를 가져오므로, 쿠키를 읽어 사용자 ID를 알아내야 합니다.
    const token = cookies().get('accessToken')?.value;
    if (!token) throw new Error('Not authenticated');
    // const { userId } = jwtDecode(token); // 토큰에서 userId 추출

    // 더미 데이터에서는 특정 사용자 정보를 그냥 반환합니다.
    return { userName: '테스트 관리자', email: 'admin@test.com' };
};

export const updateProfileInfo_server = async (data: { userName: string; email: string }) => {
    // 🚀 실제 백엔드용
    // return serverRequest<any>({ url: '/manager/settings/info', method: 'PATCH', data });

    // 📝 더미 데이터용
    console.log('[Server Dummy] Updating profile with', data);
    return { success: true, message: 'Profile updated' };
};

export const changePassword_server = async (data: { password: string; newPassword: string; }) => {
    // 🚀 실제 백엔드용
    // return serverRequest<any>({ url: '/manager/settings/password', method: 'POST', data });

    // 📝 더미 데이터용
    console.log('[Server Dummy] Changing password');
    return { success: true, message: 'Password changed successfully' };
};


/**
 * [더미 데이터용] 필터 옵션 목록을 가져옵니다.
 */
export const getFilterOptions_server = async (): Promise<FilterOptions> => {
    // 🚀 실제 백엔드용 (나중에 사용할 코드)
    // return serverRequest<FilterOptions>({ url: '/filters', method: 'GET' });

    // 📝 더미 데이터용 (지금 사용할 코드)
    return readJsonFile_server('/api/filter.json');
};


// =================================================================
// 📝 filelist page
// =================================================================
// export async function getFiles_server(): Promise<FileItem[]> {
//     return serverRequest<FileItem[]>({ 
//         url: '/manager/upload/filelist', 
//         method: 'GET' 
//     });

//     // 📝 더미 데이터용 (개발 시 사용)
//     // const response = await readJsonFile_server('/api/upload_history.json');
//     // return response.files || []; 
// }

export async function getFiles_server(): Promise<FileItem[]> {
    try {
        // serverRequest는 response.data를 반환합니다. 
        // 이 data의 실제 타입을 any로 받고 구조를 확인합니다.
        const responseData: any = await serverRequest({ 
            url: '/manager/upload/filelist', 
            method: 'GET' 
        });

        // ✨ 1. 응답 데이터가 있고, 그 안에 'data' 또는 'files' 키가 배열인지 확인합니다.
        if (responseData && Array.isArray(responseData.data)) {
            return responseData.data;
        }
        if (responseData && Array.isArray(responseData.files)) {
            return responseData.files;
        }
        // ✨ 2. 응답 데이터 자체가 배열인 경우를 확인합니다.
        if (Array.isArray(responseData)) {
            return responseData;
        }

        // ✨ 3. 위의 모든 경우에 해당하지 않으면, 빈 배열을 반환하여 에러를 방지합니다.
        console.warn("getFiles_server: API 응답이 예상된 배열 형식이 아닙니다.", responseData);
        return [];

    } catch (error) {
        console.error("getFiles_server에서 에러 발생:", error);
        // 에러 발생 시에도 빈 배열을 반환하여 프론트엔트가 깨지지 않도록 합니다.
        return [];
    }
}

// =================================================================
// 📝 회원가입(join) 관련 서버 버전 함수들
// =================================================================

/**
 * [서버용] 회원가입을 요청하는 함수
 * @param data - 회원가입 폼 데이터
 * @returns API 응답 데이터
 */
export const joinUser_server = async (data: JoinFormData) => {
    // serverRequest 헬퍼는 내부적으로 에러 처리 및 토큰 관리를 하므로
    // 간단하게 호출만 하면 됩니다.
    // 회원가입은 보통 토큰이 필요 없지만, serverRequest는 토큰이 없어도 잘 동작합니다.
    return serverRequest<any>({
        url: '/public/join',
        method: 'POST',
        data: data, // POST 요청의 body가 됩니다.
    });
};

/**
 * [서버용] 아이디 중복 검사를 요청하는 함수
 * @param userId - 확인할 사용자 아이디
 * @returns API 응답 데이터
 */
export const checkUserId_server = async (userId: string) => {
    return serverRequest<any>({
        url: '/public/join/idsearch',
        method: 'POST',
        data: { userId },
    });
};