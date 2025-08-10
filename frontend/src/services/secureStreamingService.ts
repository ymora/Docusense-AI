/**
 * Service de streaming sécurisé pour la visualisation et le téléchargement de fichiers
 */

import { FileInfo } from '../utils/fileUtils';

export interface SecureFileInfo {
  name: string;
  path: string;
  size: number;
  size_mb: number;
  modified: string;
  mime_type: string;
  extension: string;
  hash: string;
  is_streamable: boolean;
  is_downloadable: boolean;
}

export interface TempTokenResponse {
  temp_token: string;
  expires_in: number;
  file_path: string;
}

export interface StreamingStats {
  active_temp_tokens: number;
  max_file_size_gb: number;
  max_stream_size_gb: number;
  allowed_extensions_count: number;
  dangerous_extensions_count: number;
  chunk_size_kb: number;
}

class SecureStreamingService {
  private baseUrl = '/api/secure-streaming';

  /**
   * Récupère les informations sécurisées d'un fichier
   */
  async getFileInfo(file: FileInfo): Promise<SecureFileInfo> {
    try {
      const encodedPath = encodeURIComponent(file.path);
      const response = await fetch(`${this.baseUrl}/file-info/${encodedPath}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des informations sécurisées:', error);
      throw error;
    }
  }

  /**
   * Stream un fichier pour la visualisation
   */
  async streamForViewing(file: FileInfo, chunkSize: number = 8192): Promise<Response> {
    try {
      const encodedPath = encodeURIComponent(file.path);
      const response = await fetch(
        `${this.baseUrl}/view/${encodedPath}?chunk_size=${chunkSize}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error('❌ Erreur lors du streaming pour visualisation:', error);
      throw error;
    }
  }

  /**
   * Télécharge un fichier de manière sécurisée
   */
  async downloadFile(file: FileInfo): Promise<void> {
    try {
      const encodedPath = encodeURIComponent(file.path);
      const response = await fetch(`${this.baseUrl}/download/${encodedPath}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Créer un blob et télécharger
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement sécurisé:', error);
      throw error;
    }
  }

  /**
   * Crée un token temporaire pour l'accès à un fichier
   */
  async createTempToken(file: FileInfo, expiresIn: number = 300): Promise<TempTokenResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/create-temp-token?expires_in=${expiresIn}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: file.path,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Erreur lors de la création du token temporaire:', error);
      throw error;
    }
  }

  /**
   * Accède à un fichier avec un token temporaire
   */
  async accessWithTempToken(
    tempToken: string,
    mode: 'view' | 'download' = 'view',
    chunkSize: number = 8192
  ): Promise<Response> {
    try {
      const response = await fetch(
        `${this.baseUrl}/temp-access/${tempToken}?mode=${mode}&chunk_size=${chunkSize}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error('❌ Erreur lors de l\'accès avec token temporaire:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques du service
   */
  async getStats(): Promise<StreamingStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Génère une URL de visualisation sécurisée
   */
  getViewUrl(file: FileInfo): string {
    const encodedPath = encodeURIComponent(file.path);
    return `${this.baseUrl}/view/${encodedPath}`;
  }

  /**
   * Génère une URL de téléchargement sécurisée
   */
  getDownloadUrl(file: FileInfo): string {
    const encodedPath = encodeURIComponent(file.path);
    return `${this.baseUrl}/download/${encodedPath}`;
  }

  /**
   * Génère une URL d'accès avec token temporaire
   */
  getTempAccessUrl(tempToken: string, mode: 'view' | 'download' = 'view'): string {
    return `${this.baseUrl}/temp-access/${tempToken}?mode=${mode}`;
  }

  /**
   * Vérifie si un fichier peut être streamé
   */
  async canStream(file: FileInfo): Promise<boolean> {
    try {
      const fileInfo = await this.getFileInfo(file);
      return fileInfo.is_streamable;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de streamabilité:', error);
      return false;
    }
  }

  /**
   * Vérifie si un fichier peut être téléchargé
   */
  async canDownload(file: FileInfo): Promise<boolean> {
    try {
      const fileInfo = await this.getFileInfo(file);
      return fileInfo.is_downloadable;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de téléchargeabilité:', error);
      return false;
    }
  }
}

// Instance singleton
export const secureStreamingService = new SecureStreamingService();
