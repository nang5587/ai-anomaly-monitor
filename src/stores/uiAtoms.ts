import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const tutorialSeenAtom = atomWithStorage<boolean>('tutorialSeen', false);

export interface StatusBarState {
    visible: boolean;
    status: 'idle' | 'parsing' | 'uploading' | 'success' | 'error';
    message: string;
    progress: number;
}

// 상태 바의 초기 상태
const initialStatusBarState: StatusBarState = {
    visible: false,
    status: 'idle',
    message: '',
    progress: 0,
};

// ✨ 상태 바의 모든 상태를 관리하는 단일 아톰
export const statusBarAtom = atom<StatusBarState>(initialStatusBarState);

// ✨ 상태 바를 리셋하는 쓰기 전용 액션 아톰 (편의용)
export const resetStatusBarAtom = atom(null, (get, set) => {
    set(statusBarAtom, initialStatusBarState);
});