import { atom } from 'jotai';
import { getUsers, type AdminUser } from '@/api/adminApi';

const _usersAtom = atom<AdminUser[]>([]);

// ✨ 2. 외부 컴포넌트들이 사용할 `usersAtom`은 이제 읽기 전용 파생 아톰입니다.
//    이 아톰의 값은 항상 `_usersAtom`의 값이므로, 항상 배열입니다.
export const usersAtom = atom((get) => get(_usersAtom));


// 로딩 상태를 관리할 아톰 (기존과 동일)
export const usersLoadingAtom = atom<boolean>(true); // ✨ 초기값을 true로 변경하는 것이 좋습니다.

// 데이터를 로드하고 "private" 아톰을 업데이트하는 액션 아톰
export const loadUsersAtom = atom(
    null,
    async (get, set) => {
        set(usersLoadingAtom, true);
        try {
            const usersData = await getUsers();
            
            // ✨✨✨ 여기에 로그를 추가하여 API 응답을 직접 확인합니다. ✨✨✨
            console.log('[loadUsersAtom] getUsers() API 응답:', usersData);
            if (!Array.isArray(usersData)) {
                console.error('[loadUsersAtom] 치명적 오류: getUsers()가 배열을 반환하지 않았습니다!');
            }
            
            set(_usersAtom, usersData || []); // 혹시라도 
        } finally {
            set(usersLoadingAtom, false); // 로딩 끝
        }
    }
);

export const pendingUserCountAtom = atom((get) => {
    const users = get(usersAtom);
    // 방어 코드 없이 직접 호출
    return users.filter(user => user.status === 'pending').length;
});

// refetchUsersAtom은 단순히 loadUsersAtom을 호출하는 역할 (기존과 동일)
export const refetchUsersAtom = atom(
    null,
    (get, set) => {
        // loadUsersAtom 액션을 다시 실행시킵니다.
        set(loadUsersAtom);
    }
);