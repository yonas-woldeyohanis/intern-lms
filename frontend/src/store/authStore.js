import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Holds the current user + short-lived access token in memory (persisted
 * to localStorage only for UX continuity across page reloads — the actual
 * security boundary is the httpOnly refresh-token cookie, which this store
 * never touches).
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setSession: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
      updateUser: (user) => set({ user }),
      clearSession: () => set({ user: null, accessToken: null, isAuthenticated: false })
    }),
    {
      name: 'bmvei-lms-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated })
    }
  )
);
