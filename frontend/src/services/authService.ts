
import { apiRequest } from '../utils/apiUtils';
import { logService } from './logService';

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  message?: string;
}

class AuthService {
  private token: string | null = null;
  private isAuthenticated: boolean = false;

  // Détecter si l'utilisateur est local ou distant
  isLocalUser(): boolean {
    // Si on accède via localhost, on est local
    return window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('192.168.') ||
           window.location.hostname.includes('172.');
  }

  // Vérifier si l'utilisateur est authentifié
  getAuthStatus(): boolean {
    return this.isAuthenticated;
  }

  // Obtenir le token d'authentification
  getToken(): string | null {
    return this.token;
  }

  // Authentifier l'utilisateur
  async authenticate(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      logService.info('Tentative d\'authentification', 'AuthService', {
        username: credentials.username,
        timestamp: new Date().toISOString()
      });

      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      }) as any;

      if (data.token) {
        this.token = data.token;
        this.isAuthenticated = true;

        // Stocker le token dans le localStorage pour la persistance
        localStorage.setItem('session_token', this.token);

        logService.info('Authentification réussie', 'AuthService', {
          username: credentials.username,
          timestamp: new Date().toISOString()
        });

        return {
          success: true,
          token: this.token,
        };
      } else {
        logService.warning('Échec de l\'authentification', 'AuthService', {
          username: credentials.username,
          error: data.detail || 'Échec de l\'authentification',
          timestamp: new Date().toISOString()
        });

        return {
          success: false,
          message: data.detail || 'Échec de l\'authentification',
        };
      }
    } catch (error) {
      logService.error('Erreur de connexion lors de l\'authentification', 'AuthService', {
        username: credentials.username,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        message: 'Erreur de connexion au serveur',
      };
    }
  }

  // Déconnecter l'utilisateur
  logout(): void {
    this.token = null;
    this.isAuthenticated = false;
    localStorage.removeItem('session_token');
  }

  // Restaurer l'authentification depuis le localStorage
  restoreAuth(): boolean {
    const savedToken = localStorage.getItem('session_token');
    if (savedToken) {
      this.token = savedToken;
      this.isAuthenticated = true;
      return true;
    }
    return false;
  }

  // Vérifier si l'authentification est encore valide
  async validateToken(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      await apiRequest('/api/auth/session-info', {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });
      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  // Obtenir les headers d'authentification pour les requêtes API
  getAuthHeaders(): Record<string, string> {
    if (this.token) {
      return {
        'Authorization': `Bearer ${this.token}`,
      };
    }
    return {};
  }
}

export const authService = new AuthService();