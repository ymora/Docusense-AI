
import { apiRequest, handleApiError } from '../utils/apiUtils';
import { logService } from './logService';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    email?: string;
    role: string;
    is_active: boolean;
  };
}

export interface UsernameCheckResponse {
  username: string;
  exists: boolean;
  available: boolean;
}

export const authService = {
  // Connexion utilisateur
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      return response as AuthResponse;
    } catch (error) {
      throw new Error(`Erreur de connexion: ${handleApiError(error)}`);
    }
  },

  // Inscription utilisateur
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      return response as AuthResponse;
    } catch (error) {
      throw new Error(`Erreur d'inscription: ${handleApiError(error)}`);
    }
  },

  // Connexion invité
  async guestLogin(): Promise<AuthResponse> {
    try {
      const response = await apiRequest('/api/auth/guest-login', {
        method: 'POST'
      });
      return response as AuthResponse;
    } catch (error) {
      throw new Error(`Erreur de connexion invité: ${handleApiError(error)}`);
    }
  },

  // Vérifier si un nom d'utilisateur existe
  async checkUsername(username: string): Promise<UsernameCheckResponse> {
    try {
      const response = await apiRequest(`/api/auth/check-username/${encodeURIComponent(username)}`, {
        method: 'GET'
      });
      return response as UsernameCheckResponse;
    } catch (error) {
      throw new Error(`Erreur de vérification du nom d'utilisateur: ${handleApiError(error)}`);
    }
  },

  // Rafraîchir le token
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await apiRequest('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      return response as AuthResponse;
    } catch (error) {
      throw new Error(`Erreur de rafraîchissement du token: ${handleApiError(error)}`);
    }
  }
};