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
  errorType: 'auth' | 'backend' | 'timeout' | 'server' | 'generic' | null;
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
      errorType: null,

      // Actions d'authentification
      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/auth/login', {
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
          // Améliorer la détection des erreurs de connexion au backend
          let errorMessage = 'Erreur de connexion';
          let errorType: 'timeout' | 'auth' | 'backend' | 'server' | 'generic' = 'auth'; // Type d'erreur pour l'affichage
          
          if (error instanceof Error) {
            // Erreur de connexion réseau (backend non disponible)
            if (error.message.includes('Failed to fetch') || 
                error.message.includes('NetworkError') ||
                error.message.includes('ERR_NETWORK') ||
                error.message.includes('ERR_CONNECTION_REFUSED') ||
                error.message.includes('ERR_INTERNET_DISCONNECTED')) {
              errorMessage = 'Backend indisponible';
              errorType = 'backend';
            }
            // Erreur de timeout
            else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
              errorMessage = 'Le serveur met trop de temps à répondre.';
              errorType = 'timeout';
            }
            // Erreur d'authentification
            else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
              errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect';
              errorType = 'auth';
            }
            // Erreur de serveur
            else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
              errorMessage = 'Erreur temporaire du serveur.';
              errorType = 'server';
            }
            // Autres erreurs spécifiques
            else if (error.message.includes('Compte désactivé')) {
              errorMessage = 'Ce compte a été désactivé.';
              errorType = 'auth';
            }
            // Erreur générique avec plus de détails si disponible
            else if (error.message !== 'Erreur de connexion' && error.message !== 'Erreur inconnue') {
              errorMessage = error.message;
              errorType = 'generic';
            }
          }
          
          set({
            isLoading: false,
            error: errorMessage,
            errorType: errorType,
          });
          throw new Error(errorMessage);
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/auth/register', {
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
          // Améliorer la détection des erreurs de connexion au backend
          let errorMessage = 'Erreur d\'inscription';
          let errorType: 'timeout' | 'auth' | 'backend' | 'server' | 'generic' = 'auth';
          
          if (error instanceof Error) {
            // Erreur de connexion réseau (backend non disponible)
            if (error.message.includes('Failed to fetch') || 
                error.message.includes('NetworkError') ||
                error.message.includes('ERR_NETWORK') ||
                error.message.includes('ERR_CONNECTION_REFUSED') ||
                error.message.includes('ERR_INTERNET_DISCONNECTED')) {
              errorMessage = 'Backend indisponible';
              errorType = 'backend';
            }
            // Erreur de timeout
            else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
              errorMessage = 'Le serveur met trop de temps à répondre.';
              errorType = 'timeout';
            }
            // Erreur de validation des données
            else if (error.message.includes('déjà')) {
              errorMessage = 'Ce nom d\'utilisateur existe déjà';
              errorType = 'auth';
            }
            else if (error.message.includes('email') || error.message.includes('Email')) {
              errorMessage = 'Cette adresse email est déjà utilisée';
              errorType = 'auth';
            }
            else if (error.message.includes('mot de passe') || error.message.includes('password')) {
              errorMessage = 'Le mot de passe doit contenir au moins 8 caractères';
              errorType = 'auth';
            }
            // Erreur de serveur
            else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
              errorMessage = 'Erreur temporaire du serveur.';
              errorType = 'server';
            }
            // Erreur d'authentification
            else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
              errorMessage = 'Erreur d\'authentification.';
              errorType = 'auth';
            }
            // Erreur générique avec plus de détails si disponible
            else if (error.message !== 'Erreur d\'inscription' && error.message !== 'Erreur inconnue') {
              errorMessage = error.message;
              errorType = 'generic';
            }
          }
          
          set({
            isLoading: false,
            error: errorMessage,
            errorType: errorType,
          });
          throw new Error(errorMessage);
        }
      },

      loginAsGuest: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Essayer d'abord le backend si disponible
          const response = await fetch('/api/auth/guest-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            // Backend disponible - utiliser la réponse du serveur
            const data = await response.json();
            
            set({
              user: data.user,
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return;
          }
        } catch (error) {
          // Backend non disponible - continuer en mode local
          // OPTIMISATION: Suppression des console.log pour éviter la surcharge
        }

        // Mode local - créer un utilisateur invité sans backend
        const guestUser: User = {
          id: 0,
          username: 'invité',
          role: 'guest',
          is_active: true,
        };

        set({
          user: guestUser,
          accessToken: 'local-guest-token',
          refreshToken: 'local-guest-refresh',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
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
          const response = await fetch('/api/auth/refresh', {
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
