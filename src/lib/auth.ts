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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getAuthStatus_mock(): Promise<User | null> {
    return { userId: 'admin', role: 'ADMIN', locationId: 0 };
}