import { DatabaseStatus, CleanupResult, BackupInfo, FileInfo, AnalysisInfo } from './types';

const API_BASE = 'http://localhost:8000/api/database';

export class DatabaseAPI {
  static async getStatus(): Promise<DatabaseStatus> {
    const response = await fetch(`${API_BASE}/status`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du statut');
    }
    return response.json();
  }

  static async cleanupOrphanedFiles(): Promise<CleanupResult> {
    const response = await fetch(`${API_BASE}/cleanup/orphaned-files`, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error('Erreur lors du nettoyage des fichiers orphelins');
    }
    return response.json();
  }

  static async cleanupFailedAnalyses(): Promise<CleanupResult> {
    const response = await fetch(`${API_BASE}/cleanup/failed-analyses`, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error('Erreur lors du nettoyage des analyses échouées');
    }
    return response.json();
  }



  static async cleanupTempFiles(): Promise<CleanupResult> {
    const response = await fetch(`${API_BASE}/cleanup/temp-files`, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error('Erreur lors du nettoyage des fichiers temporaires');
    }
    return response.json();
  }

  static async fixInvalidStatuses(): Promise<CleanupResult> {
    const response = await fetch(`${API_BASE}/fix-invalid-statuses`, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la correction des statuts');
    }
    return response.json();
  }

  static async fullCleanup(): Promise<CleanupResult> {
    const response = await fetch(`${API_BASE}/full-cleanup`, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error('Erreur lors du nettoyage complet');
    }
    return response.json();
  }

  static async createBackup(): Promise<{ success: boolean; backup_name: string }> {
    const response = await fetch(`${API_BASE}/backup/create`, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la création de la sauvegarde');
    }
    return response.json();
  }

  static async getBackups(): Promise<BackupInfo[]> {
    const response = await fetch(`${API_BASE}/backup/list`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des sauvegardes');
    }
    return response.json();
  }

  static async restoreBackup(backupName: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/backup/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ backup_name: backupName })
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la restauration');
    }
    return response.json();
  }

  static async getFiles(status?: string, limit: number = 50): Promise<FileInfo[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    
    const response = await fetch(`${API_BASE}/files?${params}`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des fichiers');
    }
    const data = await response.json();
    return data.files || [];
  }

  static async getAnalyses(status?: string, fileId?: number, limit: number = 50): Promise<AnalysisInfo[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (fileId) params.append('file_id', fileId.toString());
    params.append('limit', limit.toString());
    
    const response = await fetch(`${API_BASE}/analyses?${params}`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des analyses');
    }
    const data = await response.json();
    return data.analyses || [];
  }

  static async getFileAnalyses(fileId: number, status?: string, limit: number = 50): Promise<AnalysisInfo[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    
    const response = await fetch(`${API_BASE}/files/${fileId}/analyses?${params}`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des analyses du fichier');
    }
    const data = await response.json();
    return data.analyses || [];
  }

  static async retryAnalysis(analysisId: number): Promise<void> {
    const response = await fetch(`${API_BASE}/analyses/${analysisId}/retry`, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error('Erreur lors du relancement de l\'analyse');
    }
  }

  static async deleteAnalysis(analysisId: number): Promise<void> {
    const response = await fetch(`${API_BASE}/analyses/${analysisId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la suppression de l\'analyse');
    }
  }

  static async deleteMultipleAnalyses(analysisIds: number[]): Promise<void> {
    const response = await fetch(`${API_BASE}/analyses/bulk-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ analysis_ids: analysisIds })
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la suppression en lot des analyses');
    }
  }

}
