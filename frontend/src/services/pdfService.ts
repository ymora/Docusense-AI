/**
 * PDF Service for DocuSense AI
 * Handles PDF generation and management for analysis results
 */

const API_BASE_URL = 'http://localhost:8000';

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
  private baseUrl = `${API_BASE_URL}/pdf-files`;

  /**
   * Generate PDF for a specific analysis
   */
  async generateAnalysisPDF(analysisId: number): Promise<PDFGenerationResponse> {
    const response = await fetch(`${this.baseUrl}/generate/${analysisId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getSessionToken()}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la génération du PDF');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Generate PDFs for all completed analyses that don't have one
   */
  async generatePDFsForAllCompletedAnalyses(): Promise<BulkPDFGenerationResponse> {
    const response = await fetch(`${this.baseUrl}/generate-all-completed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getSessionToken()}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la génération des PDFs');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Download PDF for a specific analysis
   */
  async downloadAnalysisPDF(analysisId: number): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/download/${analysisId}`, {
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
  }

  /**
   * List analyses with PDFs
   */
  async listAnalysisPDFs(params?: {
    fileId?: number;
    limit?: number;
    offset?: number;
  }): Promise<PDFListResponse> {
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

    const url = `${this.baseUrl}/list${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getSessionToken()}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la récupération de la liste des PDFs');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Delete PDF for a specific analysis
   */
  async deleteAnalysisPDF(analysisId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${analysisId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.getSessionToken()}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la suppression du PDF');
    }
  }

  /**
   * Get PDF download URL for a specific analysis
   */
  getPDFDownloadURL(analysisId: number): string {
    return `${this.baseUrl}/download/${analysisId}`;
  }

  /**
   * Get PDF generation URL for a specific analysis
   */
  getPDFGenerationURL(analysisId: number): string {
    return `${this.baseUrl}/generate/${analysisId}`;
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
      const pdfs = await this.listAnalysisPDFs({ limit: 1000 });
      return pdfs.pdfs.some(pdf => pdf.analysis_id === analysisId && pdf.pdf_exists);
    } catch (error) {
      // Gérer gracieusement les erreurs d'authentification ou autres erreurs
      console.warn(`Impossible de vérifier l'existence du PDF pour l'analyse ${analysisId}:`, error);
      return false;
    }
  }

  /**
   * Get session token from localStorage
   */
  private getSessionToken(): string {
    return localStorage.getItem('session_token') || '';
  }
}

// Export singleton instance
export const pdfService = new PDFService();
export default pdfService;
