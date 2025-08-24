// Utilitaires centralisés pour les requêtes API
export const DEFAULT_TIMEOUT = 10000; // 10 secondes (réduit de 30s à 10s)

// Configuration de l'API backend - Utilise le proxy Vite
const BACKEND_URL = '';

// Fonction utilitaire pour la gestion des erreurs
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    // Détecter les erreurs de connexion au backend
    const message = error.message;
    
    // Erreur de connexion réseau (backend non disponible)
    if (message.includes('Failed to fetch') || 
        message.includes('NetworkError') ||
        message.includes('ERR_NETWORK') ||
        message.includes('ERR_CONNECTION_REFUSED') ||
        message.includes('ERR_INTERNET_DISCONNECTED')) {
      return 'Le serveur n\'est pas accessible. Veuillez vérifier que l\'application est bien démarrée.';
    }
    
    // Erreur de timeout
    if (message.includes('timeout') || message.includes('Timeout') || message.includes('Requête expirée')) {
      return 'Le serveur met trop de temps à répondre. Veuillez réessayer dans quelques instants.';
    }
    
    // Erreur d'authentification
    if (message.includes('401') || message.includes('Unauthorized')) {
      return 'Nom d\'utilisateur ou mot de passe incorrect';
    }
    
    // Erreur de serveur
    if (message.includes('500') || message.includes('Internal Server Error')) {
      return 'Erreur temporaire du serveur. Veuillez réessayer dans quelques instants.';
    }
    
    // Erreur de validation
    if (message.includes('déjà')) {
      return 'Ce nom d\'utilisateur existe déjà';
    }
    
    if (message.includes('email') || message.includes('Email')) {
      return 'Cette adresse email est déjà utilisée';
    }
    
    if (message.includes('mot de passe') || message.includes('password')) {
      return 'Le mot de passe doit contenir au moins 8 caractères';
    }
    
    // Erreur de compte désactivé
    if (message.includes('Compte désactivé')) {
      return 'Ce compte a été désactivé. Contactez l\'administrateur.';
    }
    
    // Retourner le message d'erreur original si aucune correspondance
    return message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Erreur inconnue';
};

// Fonction pour vérifier la validité du token d'authentification
export const checkAuthToken = (): boolean => {
  try {
    const authStore = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const accessToken = authStore.state?.accessToken;
    return !!accessToken;
  } catch {
    return false;
  }
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
      
      // Gestion spéciale pour les erreurs d'authentification
      if (response.status === 401) {
        // Token invalide ou expiré - déconnecter l'utilisateur
        try {
          const authStore = JSON.parse(localStorage.getItem('auth-storage') || '{}');
          if (authStore.state?.isAuthenticated) {
            // Nettoyer le localStorage
            localStorage.removeItem('auth-storage');
            // Rediriger vers la page de connexion
            window.location.href = '/';
          }
            } catch (e) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
    }
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