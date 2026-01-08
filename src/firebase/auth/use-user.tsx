'use client';

import { useFirebase } from '../provider';

export interface UserHookResult {
  user: import('firebase/auth').User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};
