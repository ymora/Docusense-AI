const API_BASE_URL = 'http://localhost:8000/api';

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
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data.session_token;
        this.isAuthenticated = true;
        
        // Stocker le token dans le localStorage pour la persistance
        localStorage.setItem('auth_token', this.token);
        
        return {
          success: true,
          token: this.token,
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.detail || 'Échec de l\'authentification',
        };
      }
    } catch (error) {
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
    localStorage.removeItem('auth_token');
  }

  // Restaurer l'authentification depuis le localStorage
  restoreAuth(): boolean {
    const savedToken = localStorage.getItem('auth_token');
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
      const response = await fetch(`${API_BASE_URL}/auth/session-info`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (response.ok) {
        return true;
      } else {
        this.logout();
        return false;
      }
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