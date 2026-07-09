import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/utils/firebase-config';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, User } from 'firebase/auth';
import type { BaseUser, UserRole } from '@/types';
import { COLLECTIONS } from '@/utils/constants';

const ROLE_COLLECTION_MAP: Partial<Record<UserRole, string>> = {
  SUPERADMIN: COLLECTIONS.SUPERADMINS,
  ACCOUNT_MANAGER: COLLECTIONS.ACCOUNT_MANAGERS,
  SERVICE_PROVIDER: COLLECTIONS.SERVICE_PROVIDERS,
  CUSTOMER: COLLECTIONS.CUSTOMERS,
};

interface AuthState {
  user: BaseUser | null;
  firebaseUser: User | null;
  isLoading: boolean;
  isAuthReady: boolean;
  isProfileLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  setUser: (user: BaseUser | null) => void;
  setFirebaseUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  loadUserProfile: (firebaseUser: User) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      firebaseUser: null,
      isLoading: false,
      isAuthReady: false,
      isProfileLoading: false,
      isAuthenticated: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      loadUserProfile: async (firebaseUser: User) => {
        set({ isProfileLoading: true, error: null });
        try {
          const tokenResult = await firebaseUser.getIdTokenResult(true);
          const role = tokenResult.claims.role as UserRole | undefined;

          if (!role) {
            set({ user: null, isAuthenticated: false, isProfileLoading: false });
            return;
          }

          const collectionName = ROLE_COLLECTION_MAP[role];
          let profileData: Record<string, unknown> | null = null;

          if (collectionName) {
            const profileDoc = await getDoc(doc(db, collectionName, firebaseUser.uid));
            if (profileDoc.exists()) {
              profileData = profileDoc.data();
            }
          }

          const user: BaseUser = {
            uid: firebaseUser.uid,
            email: (profileData?.email as string) || firebaseUser.email || '',
            phone: (profileData?.phone as string) || '',
            name:
              (profileData?.name as string) ||
              firebaseUser.displayName ||
              firebaseUser.email ||
              'User',
            role,
            createdAt:
              (profileData?.createdAt as { toDate?: () => Date })?.toDate?.() || new Date(),
            updatedAt:
              (profileData?.updatedAt as { toDate?: () => Date })?.toDate?.() || new Date(),
          };

          set({ user, isAuthenticated: true, isProfileLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to load user profile';
          set({
            user: null,
            isAuthenticated: false,
            isProfileLoading: false,
            error: message,
          });
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await signInWithEmailAndPassword(auth, email, password);
          set({ firebaseUser: result.user, isLoading: false });
          await get().loadUserProfile(result.user);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          await firebaseSignOut(auth);
          set({
            user: null,
            firebaseUser: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Logout failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
