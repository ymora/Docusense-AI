# -*- coding: utf-8 -*-

# CODE MORT EXTRAIT DE: backend/app/core/cache.py
# Fonctions extraites: 4
# Lignes totales extraites: 46
# Date d'extraction: 2025-08-11 01:32:24

# =============================================================================
# FONCTIONS MORTES EXTRAITES
# =============================================================================


# =============================================================================
# FONCTION: to_dict
# Lignes originales: 37-46
# =============================================================================

    def to_dict(self) -> Dict[str, Any]:
        """Convertit en dictionnaire pour la sérialisation"""
        return {
            'key': self.key,
            'value': self.value,
            'created_at': self.created_at.isoformat(),
            'last_accessed': self.last_accessed.isoformat(),
            'ttl': self.ttl,
            'access_count': self.access_count
        }


# =============================================================================
# FONCTION: cleanup_worker
# Lignes originales: 69-75
# =============================================================================

        def cleanup_worker():
            while True:
                try:
                    time.sleep(60)  # Nettoyage toutes les minutes
                    self._cleanup_expired()
                except Exception as e:
                    logger.error(f"Erreur dans le thread de nettoyage: {e}")


# =============================================================================
# FONCTION: decorator
# Lignes originales: 200-215
# =============================================================================

    def decorator(func):
        def wrapper(*args, **kwargs):
            # Générer une clé unique
            cache_key = cache.generate_key(func.__name__, *args, **kwargs)
            
            # Essayer de récupérer du cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Exécuter la fonction et mettre en cache
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            return result
        
        return wrapper


# =============================================================================
# FONCTION: wrapper
# Lignes originales: 201-213
# =============================================================================

        def wrapper(*args, **kwargs):
            # Générer une clé unique
            cache_key = cache.generate_key(func.__name__, *args, **kwargs)
            
            # Essayer de récupérer du cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Exécuter la fonction et mettre en cache
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            return result

