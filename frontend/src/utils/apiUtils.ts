// Utilitaires centralisés pour les requêtes API
export const DEFAULT_TIMEOUT = 30000; // 30 secondes

// Configuration de l'API backend
const API_BASE_URL = 'http://localhost:8000';

// Fonction utilitaire pour la gestion des erreurs
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Erreur inconnue';
};

// Fonction utilitaire pour les requêtes API avec timeout
export const apiRequest = async (url: string, options?: RequestInit, timeout: number = DEFAULT_TIMEOUT): Promise<unknown> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Construire l'URL complète avec la base URL
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  // Récupérer le token d'authentification depuis le localStorage
  const authStore = JSON.parse(localStorage.getItem('auth-storage') || '{}');
  const accessToken = authStore.state?.accessToken;

  // Debug: Afficher les informations d'authentification
  console.log('[apiRequest] URL:', fullUrl);
  console.log('[apiRequest] Token présent:', !!accessToken);
  console.log('[apiRequest] Auth store:', authStore);

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    // Ajouter le token d'authentification s'il existe
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
      headers,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Debug: Afficher plus d'informations sur l'erreur
      console.error('[apiRequest] Erreur HTTP:', response.status, response.statusText);
      console.error('[apiRequest] URL:', fullUrl);
      console.error('[apiRequest] Headers envoyés:', headers);
      
      // Essayer de récupérer le détail de l'erreur
      let errorDetail = response.statusText;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || response.statusText;
      } catch {
        // Si on ne peut pas parser la réponse, utiliser le status text
      }
      
      throw new Error(`Erreur HTTP: ${response.status} - ${errorDetail}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Requête expirée');
    }
    throw error;
  }
}; 