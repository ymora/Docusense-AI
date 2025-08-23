// Utilitaires centralisés pour les requêtes API
export const DEFAULT_TIMEOUT = 30000; // 30 secondes

// Configuration de l'API backend
// En développement, utiliser le proxy Vite pour éviter les problèmes CORS
const BACKEND_URL = (import.meta as any).env?.DEV ? '' : 'http://localhost:8000';

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

// Fonction utilitaire pour les requêtes API avec timeout et sécurité
export const apiRequest = async (url: string, options?: RequestInit, timeout: number = DEFAULT_TIMEOUT): Promise<unknown> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Construire l'URL complète
  let fullUrl;
  if (url.startsWith('http')) {
    fullUrl = url;
  } else if (url === '/health') {
    // Endpoint health avec préfixe /api/ et slash final
    fullUrl = `${BACKEND_URL}/api${url}/`;
  } else if (url.startsWith('/api/')) {
    // Si l'URL commence déjà par /api/, utiliser directement la base du backend
    fullUrl = `${BACKEND_URL}${url}`;
  } else {
    // Sinon, ajouter le préfixe /api/
    fullUrl = `${BACKEND_URL}/api${url}`;
  }

  // Récupérer le token depuis le store unifié
  const getAuthToken = () => {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsedAuth = JSON.parse(authStorage);
        return parsedAuth.state?.accessToken || null;
      }
      return null;
    } catch {
      return null;
    }
  };
  
  const accessToken = getAuthToken();

  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // Protection CSRF
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
      credentials: 'same-origin', // Protection CSRF
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Gestion spécifique des codes d'erreur HTTP
      let errorDetail = response.statusText;
      let errorData = null;
      
      try {
        errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || response.statusText;
      } catch {
        // Si on ne peut pas parser la réponse, utiliser le status text
      }
      
      // Gestion spécifique des erreurs d'authentification
      if (response.status === 401) {
        // Token expiré ou invalide - déconnecter l'utilisateur
        localStorage.removeItem('auth-storage');
        window.location.reload();
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      // Gestion des erreurs de rate limiting
      if (response.status === 429) {
        // Utiliser le message détaillé du backend si disponible
        const rateLimitMessage = errorDetail || 'Trop de requêtes. Veuillez ralentir.';
        throw new Error(rateLimitMessage);
      }
      
      // Gestion des erreurs serveur
      if (response.status >= 500) {
        throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
      }
      
      throw new Error(`Erreur HTTP: ${response.status} - ${errorDetail}`);
    }

    // Validation de la réponse
    const data = await response.json();
    
    // Vérifier si la réponse contient des données valides
    if (data === null || data === undefined) {
      throw new Error('Réponse serveur invalide');
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Requête expirée - veuillez réessayer');
    }
    
    // Log de l'erreur pour le debugging
    console.error('API Request Error:', {
      url: fullUrl,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}; 

// Endpoints autorisés sans authentification
const PUBLIC_ENDPOINTS = [
  '/api/health/',
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/guest-login',
  '/api/auth/guest-usage'
];

// Fonction pour vérifier si un endpoint nécessite une authentification
function requiresAuth(endpoint: string): boolean {
  return !PUBLIC_ENDPOINTS.some(publicEndpoint => 
    endpoint.startsWith(publicEndpoint)
  );
}

// Fonction pour vérifier si l'utilisateur est connecté
function isUserAuthenticated(): boolean {
  try {
    const authStore = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    return authStore.state?.isAuthenticated === true;
  } catch {
    return false;
  }
}

// Utilitaires pour les appels API authentifiés

export async function authenticatedApiRequest(
  endpoint: string, 
  options: RequestInit = {}
): Promise<any> {
  const url = `${BACKEND_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Récupérer le token depuis le store unifié
  const getAuthToken = () => {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsedAuth = JSON.parse(authStorage);
        return parsedAuth.state?.accessToken || null;
      }
      return null;
    } catch {
      return null;
    }
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
} 