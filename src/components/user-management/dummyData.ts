export type UserStatus = 'pending' | 'active' | 'rejected' | 'inactive' | 'del';
export type UserRole = 'ADMIN' | 'MANAGER' | 'UNAUTH';

export type User = {
    userId: string;
    userName: string;
    email: string;
    role: UserRole;
    locationId: string;
    status: UserStatus;
    createdAt: string;
};


export const dummyAllUsers: User[] = [
    { userId: 'user2', userName: '강나현', email: 'hws@logistics.com', role: 'UNAUTH', locationId: '2', status: 'pending', createdAt: new Date().toISOString() },
    { userId: 'user3', userName: '홍지민', email: 'icn@logistics.com', role: 'MANAGER', locationId: '1', status: 'active', createdAt: new Date().toISOString() },
    { userId: 'user4', userName: '우예은', email: 'ygs@logistics.com', role: 'MANAGER', locationId: '3', status: 'active', createdAt: new Date().toISOString() },
    { userId: 'user5', userName: '이유리', email: 'gum@logistics.com', role: 'UNAUTH', locationId: '2', status: 'rejected', createdAt: new Date().toISOString() },
    { userId: 'user6', userName: '하지원', email: 'rej@logistics.com', role: 'MANAGER', locationId: '1', status: 'inactive', createdAt: new Date().toISOString() },
    { userId: 'user7', userName: '장윤희', email: 'del@logistics.com', role: 'UNAUTH', locationId: '4', status: 'del', createdAt: new Date().toISOString() },
];