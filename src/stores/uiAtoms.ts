import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const tutorialSeenAtom = atomWithStorage<boolean>('tutorialSeen', false);

export interface StatusBarState {
    visible: boolean;
    status: 'idle' | 'parsing' | 'uploading' | 'success' | 'error';
    message: string;
    progress: number;
}

const initialStatusBarState: StatusBarState = {
    visible: false,
    status: 'idle',
    message: '',
    progress: 0,
};

export const statusBarAtom = atom<StatusBarState>(initialStatusBarState);

export const resetStatusBarAtom = atom(null, (get, set) => {
    set(statusBarAtom, initialStatusBarState);
});