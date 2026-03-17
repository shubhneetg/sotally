'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { useCreditStore } from '@/stores/credit.store';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  creditBalance?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.auth.login({ email, password }) as {
            success: boolean;
            data: { token: string; user: User & { creditBalance?: number } };
          };
          set({
            token: res.data.token,
            user: res.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
          // Set credit balance from login response
          if (res.data.user.creditBalance !== undefined) {
            useCreditStore.getState().setBalance(res.data.user.creditBalance);
          }
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Login failed',
          });
          throw err;
        }
      },

      register: async (name: string, email: string, password: string, referralCode?: string) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.auth.register({
            name,
            email,
            password,
            referralCode,
          }) as { success: boolean; data: { token: string; user: User & { creditBalance?: number } } };
          set({
            token: res.data.token,
            user: res.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
          // Set credit balance from register response (signup bonus)
          if (res.data.user.creditBalance !== undefined) {
            useCreditStore.getState().setBalance(res.data.user.creditBalance);
          }
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Registration failed',
          });
          throw err;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      loadUser: async () => {
        const { token } = get();
        if (!token) return;
        set({ isLoading: true });
        try {
          const res = (await api.auth.me(token)) as {
            success: boolean;
            data: { user: User };
          };
          set({ user: res.data.user, isAuthenticated: true, isLoading: false });
        } catch {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'sotally-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
