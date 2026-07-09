import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '@/utils/firebase-config';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, User } from 'firebase/auth';
import type { BaseUser } from '@/types';

interface AuthState {
  user: BaseUser | null;
  firebaseUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  setUser: (user: BaseUser | null) => void;
  setFirebaseUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  login: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      firebaseUser: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await signInWithEmailAndPassword(auth, email, password);
          set({
            firebaseUser: result.user,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Login failed',
            isLoading: false,
          });
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
        } catch (error: any) {
          set({
            error: error.message || 'Logout failed',
            isLoading: false,
          });
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
