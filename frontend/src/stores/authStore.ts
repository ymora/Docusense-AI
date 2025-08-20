import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'guest' | 'user' | 'master';
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
  // Actions d'authentification
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  
  // Actions d'état
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
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

      // Actions d'authentification
      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('http://localhost:8000/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erreur de connexion');
          }

          const data = await response.json();
          
          set({
            user: data.user,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
          throw error;
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('http://localhost:8000/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erreur d\'inscription');
          }

          const data = await response.json();
          
          set({
            user: data.user,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
          throw error;
        }
      },

      loginAsGuest: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('http://localhost:8000/api/auth/guest-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erreur de connexion invité');
          }

          const data = await response.json();
          
          set({
            user: data.user,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          throw new Error('Aucun token de rafraîchissement disponible');
        }

        try {
          const response = await fetch('http://localhost:8000/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (!response.ok) {
            throw new Error('Token de rafraîchissement expiré');
          }

          const data = await response.json();
          
          set({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
          });
        } catch (error) {
          // Si le refresh échoue, déconnecter l'utilisateur
          get().logout();
          throw error;
        }
      },

      // Actions d'état
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      // Actions de permissions
      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;

        const permissions = {
          guest: ['read_analyses', 'view_pdfs'],
          user: ['read_analyses', 'view_pdfs', 'create_analyses', 'delete_own_analyses'],
          admin: ['*'], // Toutes les permissions
        };

        const userPermissions = permissions[user.role] || [];
        return userPermissions.includes('*') || userPermissions.includes(permission);
      },

      isGuest: () => {
        const { user } = get();
        return user?.role === 'guest';
      },

      isUser: () => {
        const { user } = get();
        return user?.role === 'user';
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
