/**
 * Hook d'authentification unifié - Système centralisé
 * Remplace tous les autres systèmes d'authentification
 */

import { useEffect, useState, useRef } from 'react';
import useAuthStore from '../stores/authStore';
import { unifiedApiService } from '../services/unifiedApiService';
import { logService } from '../services/logService';

// Flag global pour éviter les boucles infinies
let globalAuthInitialized = false;

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  is_active: boolean;
}

export interface AuthResponse {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  user?: User;
  error?: string;
}

export const useUnifiedAuth = () => {
  const {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    error,
    setUser,
    setTokens,
    setAuthenticated,
    setLoading,
    setError,
    clearError,
    logout: storeLogout,
    hasPermission,
    isAdmin,
    isUser,
    isGuest
  } = useAuthStore();

  // Protection contre les boucles infinies
  const [isInitializing, setIsInitializing] = useState(false);
  const hasInitializedRef = useRef(false);

  // Fonction de connexion unifiée
  const login = async (username: string, password: string): Promise<AuthResponse> => {
    try {
      setLoading(true);
      clearError();
      
      logService.info('Tentative de connexion utilisateur', 'UnifiedAuth', {
        username,
        timestamp: new Date().toISOString()
      });

      // Si l'utilisateur tape "invite", utiliser la connexion invité
      if (username.toLowerCase() === 'invite') {
        logService.info('Connexion invité demandée via login', 'UnifiedAuth', {
          timestamp: new Date().toISOString()
        });
        return await loginAsGuest();
      }

      const response = await unifiedApiService.post('/api/auth/login', {
        username,
        password
      }) as AuthResponse;
      
      if (response.access_token && response.refresh_token && response.user) {
        // Stocker dans le store Zustand (avec persistance automatique)
        setUser(response.user);
        setTokens(response.access_token, response.refresh_token);
        setAuthenticated(true);
        
        // Configurer le token dans le service API
        unifiedApiService.setAuthToken(response.access_token);
        
        logService.info('Connexion utilisateur réussie', 'UnifiedAuth', {
          username,
          userId: response.user.id,
          role: response.user.role,
          timestamp: new Date().toISOString()
        });
        
        return { success: true, ...response };
      } else {
        const errorMsg = 'Échec de la connexion - réponse invalide';
        setError(errorMsg);
        logService.error('Échec de la connexion - réponse invalide', 'UnifiedAuth', {
          username,
          response: response,
          timestamp: new Date().toISOString()
        });
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(errorMessage);
      
      logService.error('Erreur de connexion utilisateur', 'UnifiedAuth', {
        username,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'inscription unifiée
  const register = async (username: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      setLoading(true);
      clearError();
      
      logService.info('Tentative d\'inscription', 'UnifiedAuth', {
        username,
        email,
        timestamp: new Date().toISOString()
      });

      const response = await unifiedApiService.post('/api/auth/register', {
        username,
        email,
        password
      }) as AuthResponse;
      
      if (response.access_token && response.user) {
        // Stocker dans le store Zustand (avec persistance automatique)
        setUser(response.user);
        setTokens(response.access_token, response.refresh_token || '');
        setAuthenticated(true);
        
        // Configurer le token dans le service API
        unifiedApiService.setAuthToken(response.access_token);
        
        logService.info('Inscription réussie', 'UnifiedAuth', {
          username,
          userId: response.user.id,
          role: response.user.role,
          timestamp: new Date().toISOString()
        });
        
        return { success: true, ...response };
      } else {
        const errorMsg = 'Échec de l\'inscription - réponse invalide';
        setError(errorMsg);
        logService.error('Échec de l\'inscription - réponse invalide', 'UnifiedAuth', {
          username,
          email,
          response: response,
          timestamp: new Date().toISOString()
        });
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(errorMessage);
      
      logService.error('Erreur d\'inscription', 'UnifiedAuth', {
        username,
        email,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Fonction de connexion invité unifiée
  const loginAsGuest = async (): Promise<AuthResponse> => {
    try {
      setLoading(true);
      clearError();
      
      logService.info('Tentative de connexion invité explicite', 'UnifiedAuth', {
        timestamp: new Date().toISOString()
      });

      const response = await unifiedApiService.post('/api/auth/guest-login', {}) as AuthResponse;
      
      if (response.access_token && response.user) {
        // Stocker dans le store Zustand (avec persistance automatique)
        setUser(response.user);
        setTokens(response.access_token, response.refresh_token || '');
        setAuthenticated(true);
        
        // Configurer le token dans le service API
        unifiedApiService.setAuthToken(response.access_token);
        
        logService.info('Connexion invité réussie', 'UnifiedAuth', {
          userId: response.user.id,
          username: response.user.username,
          timestamp: new Date().toISOString()
        });
        
        return { success: true, ...response };
      } else {
        const errorMsg = 'Échec de la connexion invité - réponse invalide';
        setError(errorMsg);
        logService.error('Échec de la connexion invité - réponse invalide', 'UnifiedAuth', {
          response: response,
          timestamp: new Date().toISOString()
        });
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(errorMessage);
      
      logService.error('Erreur de connexion invité', 'UnifiedAuth', {
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion unifiée
  const logout = () => {
    logService.info('Déconnexion explicite', 'UnifiedAuth', {
      userId: user?.id,
      username: user?.username,
      timestamp: new Date().toISOString()
    });

    // Nettoyer le store
    storeLogout();
    
    // Nettoyer le service API
    unifiedApiService.clearAuthToken();
    
    // Nettoyer complètement le localStorage pour empêcher la reconnexion automatique
    localStorage.removeItem('auth-storage');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Réinitialiser le flag global pour permettre une nouvelle initialisation
    globalAuthInitialized = false;
    
    logService.info('Déconnexion terminée - localStorage nettoyé', 'UnifiedAuth', {
      timestamp: new Date().toISOString()
    });
  };

  // Vérification de l'authentification au démarrage - SEULEMENT vérifier les tokens existants
  const checkAuth = async () => {
    // Protection contre les boucles infinies - niveau global
    if (globalAuthInitialized) {
      logService.info('Vérification d\'authentification déjà effectuée (global)', 'UnifiedAuth', {
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Protection contre les boucles infinies - niveau local
    if (isInitializing || hasInitializedRef.current) {
      logService.info('Vérification d\'authentification déjà effectuée (local)', 'UnifiedAuth', {
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    try {
      setIsInitializing(true);
      hasInitializedRef.current = true;
      globalAuthInitialized = true;
      
      logService.info('Début de la vérification d\'authentification', 'UnifiedAuth', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        isAuthenticated,
        timestamp: new Date().toISOString()
      });
      
      // Si on a un token, on essaie de l'utiliser d'abord
      if (accessToken) {
        logService.info('Token d\'accès trouvé, vérification de validité', 'UnifiedAuth', {
          tokenLength: accessToken.length,
          timestamp: new Date().toISOString()
        });
        
        // Configurer le token dans le service API
        unifiedApiService.setAuthToken(accessToken);

        try {
          // Vérifier si le token est valide
          const response = await unifiedApiService.get('/api/auth/me') as { user: User };
          
          if (response && response.user) {
            setUser(response.user);
            setAuthenticated(true);
            
            logService.info('Token valide - utilisateur authentifié automatiquement', 'UnifiedAuth', {
              userId: response.user.id,
              username: response.user.username,
              role: response.user.role,
              timestamp: new Date().toISOString()
            });
            return; // Token valide, on sort
          }
        } catch (tokenError) {
          logService.info('Token invalide, nettoyage de l\'état', 'UnifiedAuth', {
            error: tokenError instanceof Error ? tokenError.message : 'Token invalide',
            timestamp: new Date().toISOString()
          });
          // Token invalide, on nettoie et on sort
          storeLogout();
          unifiedApiService.clearAuthToken();
          localStorage.removeItem('auth-storage');
          return;
        }
      }

      // Aucun token valide trouvé, on reste déconnecté
      logService.info('Aucun token valide trouvé - utilisateur non authentifié', 'UnifiedAuth', {
        timestamp: new Date().toISOString()
      });
      
      // S'assurer que l'état est cohérent
      if (isAuthenticated) {
        logService.info('État incohérent détecté - correction', 'UnifiedAuth', {
          isAuthenticated,
          hasUser: !!user,
          timestamp: new Date().toISOString()
        });
        storeLogout();
        unifiedApiService.clearAuthToken();
      }
      
    } catch (error) {
      logService.error('Erreur lors de la vérification d\'authentification', 'UnifiedAuth', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  };

  // Vérifier l'authentification au montage - UNE SEULE FOIS
  useEffect(() => {
    if (!globalAuthInitialized) {
      logService.info('Initialisation du hook useUnifiedAuth', 'UnifiedAuth', {
        timestamp: new Date().toISOString()
      });
      checkAuth();
    }
  }, []); // Dépendances vides pour s'exécuter une seule fois

  return {
    // État
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login,
    register,
    loginAsGuest,
    logout,
    checkAuth,
    clearError,
    
    // Permissions
    hasPermission,
    isAdmin,
    isUser,
    isGuest
  };
};

export default useUnifiedAuth;
