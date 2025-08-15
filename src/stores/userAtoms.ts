import { atom } from 'jotai';
import { getUsers, type AdminUser } from '@/api/adminApi';

const _usersAtom = atom<AdminUser[]>([]);

export const usersAtom = atom((get) => get(_usersAtom));

export const usersLoadingAtom = atom<boolean>(true); 

export const loadUsersAtom = atom(
    null,
    async (get, set) => {
        set(usersLoadingAtom, true);
        try {
            const usersData = await getUsers();
            if (!Array.isArray(usersData)) {
                console.error('[loadUsersAtom] 치명적 오류: getUsers()가 배열을 반환하지 않았습니다!');
            }
            set(_usersAtom, usersData || []);
        } finally {
            set(usersLoadingAtom, false); 
        }
    }
);

export const pendingUserCountAtom = atom((get) => {
    const users = get(usersAtom);
    return users.filter(user => user.status === 'pending').length;
});

export const refetchUsersAtom = atom(
    null,
    (get, set) => {
        set(loadUsersAtom);
    }
);