// Utilitaires centralisés pour les requêtes API
export const DEFAULT_TIMEOUT = 30000; // 30 secondes

// Configuration de l'API backend - Utilise le proxy Vite
const BACKEND_URL = '';

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

  // Construire l'URL complète - Utilise le proxy Vite
  let fullUrl;
  if (url.startsWith('http')) {
    fullUrl = url;
  } else if (url === '/health') {
    // Endpoint health avec préfixe /api/ et slash final
    fullUrl = `/api${url}/`;
  } else if (url.startsWith('/api/')) {
    // Si l'URL commence déjà par /api/, utiliser directement
    fullUrl = url;
  } else {
    // Sinon, ajouter le préfixe /api/
    fullUrl = `/api${url}`;
  }

  // Récupérer le token d'authentification depuis le localStorage
  const authStore = JSON.parse(localStorage.getItem('auth-storage') || '{}');
  const accessToken = authStore.state?.accessToken;



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