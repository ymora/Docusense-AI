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

  try {
    const response = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
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