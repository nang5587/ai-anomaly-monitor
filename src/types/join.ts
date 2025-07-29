export interface JoinFormData {
    userId: string;
    password?: string; // 비밀번호는 선택적으로 받을 수 있게 처리 (중복검사 등)
    userName?: string;
    role?: string;
    locationId?: number;
    email?: string;
    phone?: string;
}