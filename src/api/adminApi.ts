import apiClient from "./apiClient";

export type AdminUser = {
    userId: string;
    userName: string;
    email: string;
    locationId: string;
    role: 'ADMIN' | 'MANAGER' | 'UNAUTH';
    status: 'pending' | 'active' | 'inactive' | 'rejected' | 'del';
    createdAt: string;
};

// 1. 모든 사용자 목록 가져오기 (GET /api/admin/users)
interface GetUsersApiResponse {
    users: AdminUser[];
}

export const getUsers = async (): Promise<AdminUser[]> => {
    try {
        // ✨ 1. 제네릭 타입으로 실제 응답 구조를 명시합니다.
        const response = await apiClient.get<GetUsersApiResponse>('/admin/users');
        
        // ✨ 2. 응답 객체에서 'users' 배열을 추출하여 반환합니다.
        //    데이터가 없을 경우를 대비해 기본값으로 빈 배열을 사용합니다.
        return response.data?.users || [];
    } catch (error) {
        console.error("사용자 목록 API 호출 실패:", error);
        return [];
    }
};

// 2. 특정 사용자의 상태/역할 등 정보 업데이트 (PATCH /api/admin/users/{userId})
// Partial<User>를 사용하여 status, role 등 일부만 업데이트 가능
export const updateUser = async (userId: string, data: Partial<AdminUser>): Promise<AdminUser> => {
    // ✨ 1. API 명세에 맞는 요청 본문을 생성합니다.
    //    전달받은 data 객체에 userId를 추가합니다.
    const requestBody = {
        userId: userId,
        ...data // { status: 'active', role: 'MANAGER' } 와 같은 객체의 내용이 여기에 펼쳐짐
    };

    // ✨ 2. API 명세에 맞는 고정된 URL을 사용합니다.
    const response = await apiClient.patch(`/admin/users/status`, requestBody);
    
    return response.data; // 업데이트된 사용자 정보를 반환한다고 가정
};

// 3. 사용자의 소속 공장 변경 (PATCH /api/admin/users/factory)
export const changeUserFactory = async (userId: string, locationId: number) => {
    console.log('i',userId,'locationid', locationId)
    const response = await apiClient.patch('/admin/users/factory', {
        userId,
        locationId,
    });
    return response.data;
};