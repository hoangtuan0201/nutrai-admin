import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminAuthUser } from '@/types/admin.types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AdminAuthUser | null;
  setSession: (payload: {
    accessToken: string;
    refreshToken: string;
    user: AdminAuthUser;
  }) => void;
  setAccessToken: (accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'nutrai-admin-auth',
    },
  ),
);

