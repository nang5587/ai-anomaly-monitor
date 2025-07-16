import { atom } from 'jotai';
import { getUsers, type AdminUser } from '@/api/adminApi';

export const usersAtom = atom<AdminUser[]>([]);

// 로딩 상태를 관리할 아톰
export const usersLoadingAtom = atom<boolean>(false);

// 데이터를 로드하고 상태를 업데이트하는 '액션' 아톰
export const loadUsersAtom = atom(
    null, // 읽기 값은 null
    async (get, set) => {
        set(usersLoadingAtom, true); // 로딩 시작
        try {
            const usersData = await getUsers();
            set(usersAtom, usersData); // 성공 시 usersAtom에 데이터 저장
        } catch (error) {
            console.error("Failed to fetch users:", error);
            set(usersAtom, []); // 실패 시 빈 배열로 초기화
        } finally {
            set(usersLoadingAtom, false); // 로딩 끝
        }
    }
);

// '승인 대기자 수' 파생 아톰 (이제 더 이상 async일 필요 없음)
// usersAtom의 값이 바뀔 때마다 동기적으로 재계산됩니다.
export const pendingUserCountAtom = atom((get) => {
    const users = get(usersAtom);
    return users.filter(user => user.status === 'pending').length;
});

// refetchUsersAtom은 단순히 loadUsersAtom을 호출하는 역할
export const refetchUsersAtom = atom(
    null,
    (get, set) => {
        set(loadUsersAtom); // loadUsersAtom 액션을 실행시킴
    }
);