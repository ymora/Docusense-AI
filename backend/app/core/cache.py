"""
Cache intelligent pour DocuSense AI
"""

import time
import json
import hashlib
from typing import Any, Optional, Dict, List
from datetime import datetime, timedelta
import logging
from pathlib import Path
import threading

logger = logging.getLogger(__name__)


class CacheItem:
    """Élément de cache avec métadonnées"""
    
    def __init__(self, key: str, value: Any, ttl: int = 300):
        self.key = key
        self.value = value
        self.created_at = datetime.now()
        self.last_accessed = datetime.now()
        self.ttl = ttl  # Time to live en secondes
        self.access_count = 0
    
    def is_expired(self) -> bool:
        """Vérifie si l'élément a expiré"""
        return datetime.now() > self.created_at + timedelta(seconds=self.ttl)
    
    def access(self):
        """Marque l'élément comme accédé"""
        self.last_accessed = datetime.now()
        self.access_count += 1
    
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


class IntelligentCache:
    """Cache intelligent avec gestion automatique de la mémoire"""
    
    def __init__(self, max_size: int = 1000, max_memory_mb: int = 100):
        self.max_size = max_size
        self.max_memory_bytes = max_memory_mb * 1024 * 1024
        self.cache: Dict[str, CacheItem] = {}
        self.lock = threading.RLock()
        self.stats = {
            'hits': 0,
            'misses': 0,
            'evictions': 0,
            'size': 0
        }
        
        # Nettoyage périodique
        self._start_cleanup_thread()
    
    def _start_cleanup_thread(self):
        """Démarre le thread de nettoyage automatique"""
        def cleanup_worker():
            while True:
                try:
                    time.sleep(60)  # Nettoyage toutes les minutes
                    self._cleanup_expired()
                except Exception as e:
                    logger.error(f"Erreur dans le thread de nettoyage: {e}")
        
        cleanup_thread = threading.Thread(target=cleanup_worker, daemon=True)
        cleanup_thread.start()
    
    def _cleanup_expired(self):
        """Nettoie les éléments expirés"""
        with self.lock:
            expired_keys = [
                key for key, item in self.cache.items()
                if item.is_expired()
            ]
            
            for key in expired_keys:
                del self.cache[key]
                self.stats['evictions'] += 1
            
            if expired_keys:
                logger.debug(f"Cache: {len(expired_keys)} éléments expirés supprimés")
    
    def _evict_lru(self):
        """Supprime les éléments les moins récemment utilisés"""
        if len(self.cache) <= self.max_size:
            return
        
        # Trier par dernière utilisation
        sorted_items = sorted(
            self.cache.items(),
            key=lambda x: x[1].last_accessed
        )
        
        # Supprimer les plus anciens
        items_to_remove = len(self.cache) - self.max_size
        for i in range(items_to_remove):
            key, _ = sorted_items[i]
            del self.cache[key]
            self.stats['evictions'] += 1
        
        logger.debug(f"Cache: {items_to_remove} éléments LRU supprimés")
    
    def get(self, key: str) -> Optional[Any]:
        """Récupère une valeur du cache"""
        with self.lock:
            if key in self.cache:
                item = self.cache[key]
                if not item.is_expired():
                    item.access()
                    self.stats['hits'] += 1
                    return item.value
                else:
                    # Supprimer l'élément expiré
                    del self.cache[key]
            
            self.stats['misses'] += 1
            return None
    
    def set(self, key: str, value: Any, ttl: int = 300) -> None:
        """Stocke une valeur dans le cache"""
        with self.lock:
            # Nettoyer si nécessaire
            if len(self.cache) >= self.max_size:
                self._evict_lru()
            
            self.cache[key] = CacheItem(key, value, ttl)
            self.stats['size'] = len(self.cache)
    
    def delete(self, key: str) -> bool:
        """Supprime une clé du cache"""
        with self.lock:
            if key in self.cache:
                del self.cache[key]
                self.stats['size'] = len(self.cache)
                return True
            return False
    
    def clear(self) -> None:
        """Vide le cache"""
        with self.lock:
            self.cache.clear()
            self.stats['size'] = 0
    
    def get_stats(self) -> Dict[str, Any]:
        """Récupère les statistiques du cache"""
        with self.lock:
            total_requests = self.stats['hits'] + self.stats['misses']
            hit_rate = (self.stats['hits'] / total_requests * 100) if total_requests > 0 else 0
            
            return {
                **self.stats,
                'hit_rate_percent': round(hit_rate, 2),
                'current_size': len(self.cache),
                'max_size': self.max_size
            }
    
    def generate_key(self, *args, **kwargs) -> str:
        """Génère une clé de cache basée sur les arguments"""
        # Créer une chaîne unique à partir des arguments
        def serialize_arg(arg):
            if hasattr(arg, '__dict__'):
                # Pour les objets, utiliser le nom de la classe
                return f"{arg.__class__.__name__}"
            elif callable(arg):
                # Pour les fonctions, utiliser le nom
                return f"func:{arg.__name__}"
            else:
                return str(arg)
        
        # Sérialiser les arguments de manière sécurisée
        safe_args = [serialize_arg(arg) for arg in args]
        safe_kwargs = {k: serialize_arg(v) for k, v in kwargs.items()}
        
        key_data = {
            'args': safe_args,
            'kwargs': sorted(safe_kwargs.items())
        }
        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()


# Instance globale du cache
cache = IntelligentCache()


def cached(ttl: int = 300):
    """Décorateur pour mettre en cache les résultats de fonctions"""
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
    return decorator 