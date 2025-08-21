import { useBackendConnection } from '../hooks/useBackendConnection';

// Service de base pour l'usage des invités
const baseAuthUsageService = {
  async getGuestUsage() {
    const response = await fetch('/api/auth/guest-usage');
    return await response.json();
  }
};

// Hook pour utiliser le service avec guards de connexion
export const useAuthUsageService = () => {
  const { conditionalRequest } = useBackendConnection();

  return {
    getGuestUsage: () => conditionalRequest(
      () => baseAuthUsageService.getGuestUsage(),
      { success: false, error: 'Backend déconnecté', usage: null }
    )
  };
};

// Export du service de base pour compatibilité
export const authUsageService = baseAuthUsageService;
