import { atomWithStorage } from 'jotai/utils';

export const tutorialSeenAtom = atomWithStorage<boolean>('tutorialSeen', false);