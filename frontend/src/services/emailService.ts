import { useBackendConnection } from '../hooks/useBackendConnection';

// Service de base pour les emails
const baseEmailService = {
  async parseEmail(filePath: string) {
    const response = await fetch(`/api/emails/parse/${encodeURIComponent(filePath)}`, {
      method: 'GET'
    });
    return await response.json();
  },

  async getAttachmentPreview(filePath: string, attachmentIndex: number) {
    const response = await fetch(`/api/emails/attachment-preview/${encodeURIComponent(filePath)}/${attachmentIndex}`, {
      method: 'GET'
    });
    return response;
  }
};

// Hook pour utiliser le service avec guards de connexion
export const useEmailService = () => {
  const { conditionalRequest } = useBackendConnection();

  return {
    parseEmail: (filePath: string) => conditionalRequest(
      () => baseEmailService.parseEmail(filePath),
      { success: false, error: 'Backend déconnecté', email: null }
    ),

    getAttachmentPreview: (filePath: string, attachmentIndex: number) => conditionalRequest(
      () => baseEmailService.getAttachmentPreview(filePath, attachmentIndex),
      null
    )
  };
};

// Export du service de base pour compatibilité
export const emailService = baseEmailService;
