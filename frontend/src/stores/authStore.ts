import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'guest' | 'user' | 'admin';
  is_active: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  // Actions d'état
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  logout: () => void;

  // Actions de permissions
  hasPermission: (permission: string) => boolean;
  isGuest: () => boolean;
  isUser: () => boolean;
  isAdmin: () => boolean;
}

export type AuthStore = AuthState & AuthActions;

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // État initial
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions d'état
      setUser: (user: User | null) => set({ user }),
      setTokens: (accessToken: string, refreshToken: string) => set({ accessToken, refreshToken }),
      setAuthenticated: (authenticated: boolean) => set({ isAuthenticated: authenticated }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
      logout: () => set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }),

      // Actions de permissions
      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        
        switch (permission) {
          case 'admin':
            return user.role === 'admin';
          case 'user':
            return user.role === 'user' || user.role === 'admin';
          case 'guest':
            return user.role === 'guest' || user.role === 'user' || user.role === 'admin';
          default:
            return false;
        }
      },

      isGuest: () => {
        const { user } = get();
        return user?.role === 'guest';
      },

      isUser: () => {
        const { user } = get();
        return user?.role === 'user' || user?.role === 'admin';
      },

      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
