"""
Système de cache avancé pour DocuSense AI
Phase 3: Optimisation des Performances
"""

import time
import json
import hashlib
from typing import Any, Dict, Optional, Callable
from functools import wraps
import logging
from datetime import datetime, timedelta
from collections import OrderedDict

logger = logging.getLogger(__name__)

class CacheEntry:
    """Représente une entrée de cache avec métadonnées"""
    
    def __init__(self, value: Any, ttl: int = 300):
        self.value = value
        self.created_at = time.time()
        self.last_accessed = time.time()
        self.access_count = 0
        self.ttl = ttl  # Time To Live en secondes
    
    def is_expired(self) -> bool:
        """Vérifie si l'entrée a expiré"""
        return time.time() - self.created_at > self.ttl
    
    def access(self):
        """Marque l'entrée comme accédée"""
        self.last_accessed = time.time()
        self.access_count += 1
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertit l'entrée en dictionnaire pour la sérialisation"""
        return {
            'value': self.value,
            'created_at': self.created_at,
            'last_accessed': self.last_accessed,
            'access_count': self.access_count,
            'ttl': self.ttl
        }

class AdvancedCache:
    """Système de cache avancé avec invalidation intelligente"""
    
    def __init__(self, max_size: int = 1000, default_ttl: int = 300):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self.stats = {
            'hits': 0,
            'misses': 0,
            'evictions': 0,
            'total_requests': 0
        }
        self.prefix_patterns = {
            'files': 'file:',
            'analyses': 'analysis:',
            'users': 'user:',
            'configs': 'config:',
            'directories': 'dir:'
        }
    
    def _generate_key(self, *args, **kwargs) -> str:
        """Génère une clé de cache unique"""
        def serialize_value(value):
            """Sérialise une valeur de manière sécurisée"""
            try:
                # Essayer de sérialiser directement
                json.dumps(value)
                return value
            except (TypeError, ValueError):
                # Si c'est un objet non sérialisable, utiliser sa représentation
                if hasattr(value, '__class__'):
                    return f"{value.__class__.__name__}:{id(value)}"
                else:
                    return str(value)
        
        # Sérialiser les arguments de manière sécurisée
        safe_args = [serialize_value(arg) for arg in args]
        safe_kwargs = {k: serialize_value(v) for k, v in kwargs.items()}
        
        key_data = {
            'args': safe_args,
            'kwargs': sorted(safe_kwargs.items())
        }
        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def get(self, key: str, default: Any = None) -> Any:
        """Récupère une valeur du cache"""
        self.stats['total_requests'] += 1
        
        if key in self.cache:
            entry = self.cache[key]
            
            if entry.is_expired():
                # Supprimer l'entrée expirée
                del self.cache[key]
                self.stats['misses'] += 1
                return default
            
            # Marquer comme accédée et déplacer en fin
            entry.access()
            self.cache.move_to_end(key)
            self.stats['hits'] += 1
            return entry.value
        
        self.stats['misses'] += 1
        return default
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Stocke une valeur dans le cache"""
        if ttl is None:
            ttl = self.default_ttl
        
        # Gérer la limite de taille
        if len(self.cache) >= self.max_size:
            self._evict_least_used()
        
        entry = CacheEntry(value, ttl)
        self.cache[key] = entry
        self.cache.move_to_end(key)
    
    def _evict_least_used(self):
        """Supprime l'entrée la moins utilisée"""
        if not self.cache:
            return
        
        # Trouver l'entrée avec le moins d'accès
        least_used_key = min(
            self.cache.keys(),
            key=lambda k: (self.cache[k].access_count, self.cache[k].last_accessed)
        )
        
        del self.cache[least_used_key]
        self.stats['evictions'] += 1
        logger.debug(f"Cache eviction: {least_used_key}")
    
    def invalidate_pattern(self, pattern: str) -> int:
        """Invalide toutes les clés correspondant à un pattern"""
        count = 0
        keys_to_remove = []
        
        for key in self.cache.keys():
            if pattern in key:
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self.cache[key]
            count += 1
        
        logger.info(f"Invalidated {count} cache entries for pattern: {pattern}")
        return count
    
    def invalidate_by_prefix(self, prefix: str) -> int:
        """Invalide toutes les clés avec un préfixe donné"""
        return self.invalidate_pattern(self.prefix_patterns.get(prefix, f"{prefix}:"))
    
    def clear(self) -> None:
        """Vide complètement le cache"""
        self.cache.clear()
        logger.info("Cache cleared")
    
    def get_stats(self) -> Dict[str, Any]:
        """Retourne les statistiques du cache"""
        hit_rate = 0
        if self.stats['total_requests'] > 0:
            hit_rate = self.stats['hits'] / self.stats['total_requests']
        
        return {
            'size': len(self.cache),
            'max_size': self.max_size,
            'hits': self.stats['hits'],
            'misses': self.stats['misses'],
            'evictions': self.stats['evictions'],
            'total_requests': self.stats['total_requests'],
            'hit_rate': hit_rate,
            'memory_usage': len(self.cache) * 100  # Estimation approximative
        }
    
    def cleanup_expired(self) -> int:
        """Nettoie les entrées expirées"""
        count = 0
        keys_to_remove = []
        
        for key, entry in self.cache.items():
            if entry.is_expired():
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self.cache[key]
            count += 1
        
        if count > 0:
            logger.info(f"Cleaned up {count} expired cache entries")
        
        return count

# Instance globale du cache
advanced_cache = AdvancedCache(max_size=2000, default_ttl=600)

def cached(ttl: Optional[int] = None, key_prefix: Optional[str] = None):
    """
    Décorateur pour mettre en cache les résultats de fonctions
    
    Args:
        ttl: Time To Live en secondes
        key_prefix: Préfixe pour la clé de cache
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Générer la clé de cache en excluant 'self' pour les méthodes de classe
            # Pour les méthodes de classe, 'self' est le premier argument
            if args and hasattr(args[0], '__class__'):
                # C'est une méthode de classe, exclure 'self'
                cache_args = args[1:]  # Exclure le premier argument (self)
            else:
                # C'est une fonction normale
                cache_args = args
            
            cache_key = advanced_cache._generate_key(func.__name__, *cache_args, **kwargs)
            if key_prefix:
                cache_key = f"{key_prefix}:{cache_key}"
            
            # Essayer de récupérer du cache
            cached_result = advanced_cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {func.__name__}")
                return cached_result
            
            # Exécuter la fonction et mettre en cache
            result = func(*args, **kwargs)
            advanced_cache.set(cache_key, result, ttl)
            logger.debug(f"Cache miss for {func.__name__}, stored result")
            
            return result
        
        return wrapper
    return decorator

def invalidate_cache(patterns: list[str]) -> None:
    """
    Invalide le cache pour les patterns donnés
    
    Args:
        patterns: Liste des patterns à invalider
    """
    for pattern in patterns:
        advanced_cache.invalidate_pattern(pattern)

# Fonctions utilitaires pour l'invalidation
def invalidate_file_cache():
    """Invalide le cache des fichiers"""
    advanced_cache.invalidate_by_prefix('files')

def invalidate_analysis_cache():
    """Invalide le cache des analyses"""
    advanced_cache.invalidate_by_prefix('analyses')

def invalidate_user_cache():
    """Invalide le cache des utilisateurs"""
    advanced_cache.invalidate_by_prefix('users')

def invalidate_config_cache():
    """Invalide le cache des configurations"""
    advanced_cache.invalidate_by_prefix('configs')

def invalidate_directory_cache():
    """Invalide le cache des répertoires"""
    advanced_cache.invalidate_by_prefix('directories')
