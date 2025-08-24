"""
Module d'optimisation pour DocuSense AI
Optimisations de performance et de production
"""

import os
import logging
from typing import Dict, Any, Optional
from functools import lru_cache
import asyncio
import aiofiles
from concurrent.futures import ThreadPoolExecutor
import psutil
import time

logger = logging.getLogger(__name__)

class PerformanceOptimizer:
    """Optimiseur de performance pour DocuSense AI"""
    
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.cache = {}
        self.metrics = {
            'start_time': time.time(),
            'requests_processed': 0,
            'avg_response_time': 0,
            'memory_usage': 0,
            'cpu_usage': 0
        }
    
    def optimize_uvicorn_config(self) -> Dict[str, Any]:
        """Configuration optimisée pour uvicorn en production"""
        return {
            'host': '0.0.0.0',
            'port': int(os.getenv('PORT', 8000)),
            'workers': min(4, (os.cpu_count() or 1) + 1),
            'loop': 'uvloop',
            'http': 'httptools',
            'limit_concurrency': 1000,
            'limit_max_requests': 10000,
            'timeout_keep_alive': 30,
            'access_log': False,  # Désactivé pour les performances
            'log_level': 'warning'
        }
    
    def optimize_database_config(self) -> Dict[str, Any]:
        """Configuration optimisée pour la base de données"""
        return {
            'pool_size': 20,
            'max_overflow': 30,
            'pool_pre_ping': True,
            'pool_recycle': 3600,
            'echo': False,  # Désactivé en production
            'echo_pool': False
        }
    
    def optimize_middleware_config(self) -> Dict[str, Any]:
        """Configuration optimisée pour les middlewares"""
        return {
            'gzip_min_size': 1000,  # Compression pour fichiers > 1KB
            'cors_max_age': 86400,  # Cache CORS 24h
            'rate_limit_requests': 100,  # 100 req/min par IP
            'rate_limit_window': 60
        }
    
    def get_system_metrics(self) -> Dict[str, float]:
        """Récupère les métriques système actuelles"""
        try:
            process = psutil.Process()
            return {
                'cpu_percent': process.cpu_percent(),
                'memory_percent': process.memory_percent(),
                'memory_mb': process.memory_info().rss / 1024 / 1024,
                'open_files': len(process.open_files()),
                'threads': process.num_threads()
            }
        except Exception as e:
            logger.warning(f"Impossible de récupérer les métriques système: {e}")
            return {}
    
    def should_optimize_memory(self) -> bool:
        """Détermine si une optimisation mémoire est nécessaire"""
        metrics = self.get_system_metrics()
        return metrics.get('memory_percent', 0) > 80
    
    def cleanup_memory(self):
        """Nettoie la mémoire si nécessaire"""
        if self.should_optimize_memory():
            logger.info("Optimisation mémoire en cours...")
            # Vider le cache LRU
            self.cache.clear()
            # Forcer le garbage collector
            import gc
            gc.collect()
    
    @lru_cache(maxsize=128)
    def get_optimized_config(self, config_type: str) -> Dict[str, Any]:
        """Récupère une configuration optimisée avec cache"""
        configs = {
            'uvicorn': self.optimize_uvicorn_config,
            'database': self.optimize_database_config,
            'middleware': self.optimize_middleware_config
        }
        return configs.get(config_type, lambda: {})()
    
    def update_metrics(self, response_time: float):
        """Met à jour les métriques de performance"""
        self.metrics['requests_processed'] += 1
        self.metrics['avg_response_time'] = (
            (self.metrics['avg_response_time'] * (self.metrics['requests_processed'] - 1) + response_time) 
            / self.metrics['requests_processed']
        )
        self.metrics['memory_usage'] = self.get_system_metrics().get('memory_mb', 0)
        self.metrics['cpu_usage'] = self.get_system_metrics().get('cpu_percent', 0)
    
    def get_performance_report(self) -> Dict[str, Any]:
        """Génère un rapport de performance"""
        uptime = time.time() - self.metrics['start_time']
        return {
            'uptime_seconds': uptime,
            'uptime_hours': uptime / 3600,
            'requests_per_second': self.metrics['requests_processed'] / uptime if uptime > 0 else 0,
            'avg_response_time_ms': self.metrics['avg_response_time'] * 1000,
            'memory_usage_mb': self.metrics['memory_usage'],
            'cpu_usage_percent': self.metrics['cpu_usage'],
            'system_metrics': self.get_system_metrics()
        }


class FileOptimizer:
    """Optimiseur pour la gestion des fichiers"""
    
    def __init__(self):
        self.chunk_size = 1024 * 1024  # 1MB chunks
        self.max_concurrent_uploads = 5
    
    async def optimize_file_upload(self, file_path: str) -> bool:
        """Optimise l'upload de fichiers"""
        try:
            # Vérifier l'espace disque
            if not self._check_disk_space(file_path):
                return False
            
            # Optimiser le fichier si nécessaire
            await self._optimize_file_size(file_path)
            return True
        except Exception as e:
            logger.error(f"Erreur lors de l'optimisation du fichier: {e}")
            return False
    
    def _check_disk_space(self, file_path: str) -> bool:
        """Vérifie l'espace disque disponible"""
        try:
            # Utiliser shutil.disk_usage qui fonctionne sur Windows et Unix
            import shutil
            total, used, free = shutil.disk_usage(os.path.dirname(file_path))
            return free > 100 * 1024 * 1024  # 100MB minimum
        except Exception:
            return True  # En cas d'erreur, on continue
    
    async def _optimize_file_size(self, file_path: str):
        """Optimise la taille du fichier si nécessaire"""
        try:
            file_size = os.path.getsize(file_path)
            if file_size > 100 * 1024 * 1024:  # 100MB
                logger.info(f"Fichier volumineux détecté: {file_size / 1024 / 1024:.2f}MB")
                # Ici on pourrait implémenter des optimisations spécifiques
        except Exception as e:
            logger.warning(f"Impossible d'optimiser la taille du fichier: {e}")


class CacheOptimizer:
    """Optimiseur de cache pour améliorer les performances"""
    
    def __init__(self):
        self.cache = {}
        self.max_cache_size = 1000
        self.cache_ttl = 3600  # 1 heure
    
    def get(self, key: str) -> Optional[Any]:
        """Récupère une valeur du cache"""
        if key in self.cache:
            value, timestamp = self.cache[key]
            if time.time() - timestamp < self.cache_ttl:
                return value
            else:
                del self.cache[key]
        return None
    
    def set(self, key: str, value: Any):
        """Stocke une valeur dans le cache"""
        if len(self.cache) >= self.max_cache_size:
            # Supprimer les entrées les plus anciennes
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k][1])
            del self.cache[oldest_key]
        
        self.cache[key] = (value, time.time())
    
    def clear(self):
        """Vide le cache"""
        self.cache.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        """Récupère les statistiques du cache"""
        return {
            'size': len(self.cache),
            'max_size': self.max_cache_size,
            'hit_rate': 0,  # À implémenter avec un compteur
            'ttl': self.cache_ttl
        }


# Instances globales
performance_optimizer = PerformanceOptimizer()
file_optimizer = FileOptimizer()
cache_optimizer = CacheOptimizer()


def get_optimization_config() -> Dict[str, Any]:
    """Récupère la configuration d'optimisation complète"""
    return {
        'uvicorn': performance_optimizer.optimize_uvicorn_config(),
        'database': performance_optimizer.optimize_database_config(),
        'middleware': performance_optimizer.optimize_middleware_config(),
        'cache': cache_optimizer.get_stats(),
        'performance': performance_optimizer.get_performance_report()
    }


def optimize_for_production():
    """Applique toutes les optimisations pour la production"""
    logger.info("Application des optimisations de production...")
    
    # Optimisations système
    if os.getenv('ENVIRONMENT') == 'production':
        # Désactiver les logs de debug
        logging.getLogger().setLevel(logging.WARNING)
        
        # Optimiser les performances Python
        import sys
        if hasattr(sys, 'set_int_max_str_digits'):
            sys.set_int_max_str_digits(0)
    
    logger.info("Optimisations de production appliquées")


# Initialisation automatique
optimize_for_production()
