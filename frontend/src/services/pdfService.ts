/**
 * PDF Service for DocuSense AI
 * Handles PDF generation and management for analysis results
 */

import { apiRequest, handleApiError } from '../utils/apiUtils';

export interface PDFInfo {
  analysis_id: number;
  file_id: number;
  file_name: string;
  analysis_type: string;
  provider: string;
  model: string;
  pdf_path: string;
  pdf_filename: string;
  pdf_exists: boolean;
  completed_at: string;
}

export interface PDFListResponse {
  pdfs: PDFInfo[];
  total: number;
  limit: number;
  offset: number;
}

export interface PDFGenerationResponse {
  analysis_id: number;
  pdf_path: string;
  pdf_filename: string;
}

export interface BulkPDFGenerationResponse {
  generated_count: number;
}

class PDFService {

  /**
   * Generate PDF for a specific analysis
   */
  async generateAnalysisPDF(analysisId: number): Promise<PDFGenerationResponse> {
    try {
      const response = await apiRequest(`/api/pdf-files/generate/${analysisId}`, {
        method: 'POST'
      });
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la génération du PDF: ${handleApiError(error)}`);
    }
  }

  /**
   * Generate PDFs for all completed analyses that don't have one
   */
  async generatePDFsForAllCompletedAnalyses(): Promise<BulkPDFGenerationResponse> {
    try {
      const response = await apiRequest('/api/pdf-files/generate-all-completed', {
        method: 'POST'
      });
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la génération des PDFs: ${handleApiError(error)}`);
    }
  }

  /**
   * Download PDF for a specific analysis
   */
  async downloadAnalysisPDF(analysisId: number): Promise<Blob> {
    try {
      const response = await fetch(`/api/pdf-files/download/${analysisId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getSessionToken()}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erreur lors du téléchargement du PDF');
      }

      return response.blob();
    } catch (error) {
      throw new Error(`Erreur lors du téléchargement du PDF: ${handleApiError(error)}`);
    }
  }

  /**
   * List analyses with PDFs
   */
  async listAnalysisPDFs(params?: {
    fileId?: number;
    limit?: number;
    offset?: number;
  }): Promise<PDFListResponse> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.fileId) {
        searchParams.append('file_id', params.fileId.toString());
      }
      if (params?.limit) {
        searchParams.append('limit', params.limit.toString());
      }
      if (params?.offset) {
        searchParams.append('offset', params.offset.toString());
      }

      const url = `/api/pdf-files/list${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      
      const response = await apiRequest(url, {
        method: 'GET'
      });
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de la liste des PDFs: ${handleApiError(error)}`);
    }
  }

  /**
   * Delete PDF for a specific analysis
   */
  async deleteAnalysisPDF(analysisId: number): Promise<void> {
    try {
      await apiRequest(`/api/pdf-files/${analysisId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du PDF: ${handleApiError(error)}`);
    }
  }

  /**
   * Get PDF download URL for a specific analysis
   */
  getPDFDownloadURL(analysisId: number): string {
    return `/api/pdf-files/download/${analysisId}`;
  }

  /**
   * Get PDF generation URL for a specific analysis
   */
  getPDFGenerationURL(analysisId: number): string {
    return `/api/pdf-files/generate/${analysisId}`;
  }

  /**
   * Download PDF and save it to the user's device
   */
  async downloadAndSavePDF(analysisId: number, filename?: string): Promise<void> {
    try {
      const blob = await this.downloadAnalysisPDF(analysisId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `analyse_${analysisId}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement du PDF:', error);
      throw error;
    }
  }

  /**
   * Check if an analysis has a PDF
   */
  async hasPDF(analysisId: number): Promise<boolean> {
    try {
      // Vérifier d'abord si le backend est disponible
      const response = await fetch('/api/health/', { 
        method: 'GET',
        signal: AbortSignal.timeout(3000) // Timeout de 3 secondes
      });
      
      if (!response.ok) {
        console.warn(`Backend non disponible pour vérifier le PDF de l'analyse ${analysisId}`);
        return false;
      }

      const pdfs = await this.listAnalysisPDFs({ limit: 1000 });
      return pdfs.pdfs.some(pdf => pdf.analysis_id === analysisId && pdf.pdf_exists);
    } catch (error) {
      // Gérer gracieusement les erreurs de connexion
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn(`Backend non accessible pour vérifier le PDF de l'analyse ${analysisId}`);
      } else {
        console.warn(`Impossible de vérifier l'existence du PDF pour l'analyse ${analysisId}:`, error);
      }
      return false;
    }
  }


}

// Export singleton instance
export const pdfService = new PDFService();
export default pdfService;
