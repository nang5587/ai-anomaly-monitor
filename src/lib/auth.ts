import { cookies } from 'next/headers';
import jwtDecode from 'jwt-decode';

export interface User {
    userId: string;
    role: string;
    locationId?: number;
}
interface JwtPayload {
    userId: string;
    role: string;
    location_id?: number;
}

// 서버 컴포넌트에서만 사용할 수 있는 인증 함수
export async function getAuthStatus(): Promise<User | null> {
    const token = cookies().get('accessToken')?.value;

    if (!token) return null;

    try {
        const { userId, role, location_id } = jwtDecode<JwtPayload>(token);
        return { userId, role, locationId: location_id };
    } catch (error) {
        return null;
    }
}

// =======================================================
// 📝 테스트를 위한 더미(Mock) 인증 함수
// =======================================================
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 더미 데이터를 반환하여 인증 상태를 시뮬레이션합니다.
 * 2초의 딜레이를 포함하여 로딩 화면을 테스트할 수 있습니다.
 */
export async function getAuthStatus_mock(): Promise<User | null> {
    // 👇 여기를 바꿔가면서 테스트하세요!

    // 시나리오 1: 관리자(ADMIN)로 로그인된 상황
    return { userId: 'admin', role: 'ADMIN', locationId: 0 };

    // 시나리오 2: 매니저(MANAGER)로 로그인된 상황
    // return { userId: 'manager', role: 'MANAGER', locationId: 1 };

    // 시나리오 3: 로그아웃된 상황
    // return null;
}