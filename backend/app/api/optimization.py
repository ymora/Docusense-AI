"""
API endpoints pour les optimisations et métriques de performance
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
import logging

from app.core.optimization import (
    performance_optimizer, 
    file_optimizer, 
    cache_optimizer,
    get_optimization_config
)
from app.middleware.optimization_middleware import (
    optimization_middleware,
    performance_monitoring_middleware,
    resource_optimization_middleware
)
from app.core.auth import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/performance")
async def get_performance_metrics(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Récupère les métriques de performance actuelles"""
    try:
        return {
            "status": "success",
            "data": performance_optimizer.get_performance_report(),
            "message": "Métriques de performance récupérées avec succès"
        }
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des métriques: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération des métriques")


@router.get("/cache")
async def get_cache_stats(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Récupère les statistiques du cache"""
    try:
        return {
            "status": "success",
            "data": cache_optimizer.get_stats(),
            "message": "Statistiques du cache récupérées avec succès"
        }
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des stats du cache: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération des stats du cache")


@router.get("/system")
async def get_system_metrics(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Récupère les métriques système"""
    try:
        return {
            "status": "success",
            "data": performance_optimizer.get_system_metrics(),
            "message": "Métriques système récupérées avec succès"
        }
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des métriques système: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération des métriques système")


@router.get("/config")
async def get_optimization_config(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Récupère la configuration d'optimisation complète"""
    try:
        return {
            "status": "success",
            "data": get_optimization_config(),
            "message": "Configuration d'optimisation récupérée avec succès"
        }
    except Exception as e:
        logger.error(f"Erreur lors de la récupération de la config: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération de la configuration")


@router.post("/cache/clear")
async def clear_cache(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Vide le cache"""
    try:
        cache_optimizer.clear()
        return {
            "status": "success",
            "message": "Cache vidé avec succès"
        }
    except Exception as e:
        logger.error(f"Erreur lors du vidage du cache: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors du vidage du cache")


@router.post("/memory/cleanup")
async def cleanup_memory(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Force le nettoyage de la mémoire"""
    try:
        performance_optimizer.cleanup_memory()
        return {
            "status": "success",
            "message": "Nettoyage mémoire effectué avec succès"
        }
    except Exception as e:
        logger.error(f"Erreur lors du nettoyage mémoire: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors du nettoyage mémoire")


@router.get("/health")
async def get_optimization_health(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Vérifie la santé du système d'optimisation"""
    try:
        # Récupérer toutes les métriques
        performance_metrics = performance_optimizer.get_performance_report()
        system_metrics = performance_optimizer.get_system_metrics()
        cache_stats = cache_optimizer.get_stats()
        
        # Déterminer l'état de santé
        health_status = "healthy"
        warnings = []
        
        # Vérifier l'utilisation mémoire
        memory_usage = system_metrics.get('memory_percent', 0)
        if memory_usage > 80:
            health_status = "warning"
            warnings.append(f"Utilisation mémoire élevée: {memory_usage:.1f}%")
        
        # Vérifier l'utilisation CPU
        cpu_usage = system_metrics.get('cpu_percent', 0)
        if cpu_usage > 90:
            health_status = "warning"
            warnings.append(f"Utilisation CPU élevée: {cpu_usage:.1f}%")
        
        # Vérifier le temps de réponse moyen
        avg_response_time = performance_metrics.get('avg_response_time_ms', 0)
        if avg_response_time > 2000:  # 2 secondes
            health_status = "warning"
            warnings.append(f"Temps de réponse élevé: {avg_response_time:.1f}ms")
        
        return {
            "status": "success",
            "data": {
                "health_status": health_status,
                "warnings": warnings,
                "performance": performance_metrics,
                "system": system_metrics,
                "cache": cache_stats
            },
            "message": f"Système d'optimisation: {health_status}"
        }
    except Exception as e:
        logger.error(f"Erreur lors de la vérification de santé: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la vérification de santé")


@router.get("/recommendations")
async def get_optimization_recommendations(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Génère des recommandations d'optimisation basées sur les métriques actuelles"""
    try:
        recommendations = []
        performance_metrics = performance_optimizer.get_performance_report()
        system_metrics = performance_optimizer.get_system_metrics()
        
        # Recommandations basées sur l'utilisation mémoire
        memory_usage = system_metrics.get('memory_percent', 0)
        if memory_usage > 80:
            recommendations.append({
                "type": "memory",
                "priority": "high",
                "message": "Utilisation mémoire élevée détectée",
                "action": "Considérer l'augmentation de la RAM ou l'optimisation du cache",
                "current_value": f"{memory_usage:.1f}%",
                "recommended_threshold": "80%"
            })
        
        # Recommandations basées sur l'utilisation CPU
        cpu_usage = system_metrics.get('cpu_percent', 0)
        if cpu_usage > 90:
            recommendations.append({
                "type": "cpu",
                "priority": "high",
                "message": "Utilisation CPU élevée détectée",
                "action": "Considérer l'augmentation du nombre de workers ou l'optimisation des requêtes",
                "current_value": f"{cpu_usage:.1f}%",
                "recommended_threshold": "90%"
            })
        
        # Recommandations basées sur le temps de réponse
        avg_response_time = performance_metrics.get('avg_response_time_ms', 0)
        if avg_response_time > 1000:
            recommendations.append({
                "type": "performance",
                "priority": "medium",
                "message": "Temps de réponse élevé détecté",
                "action": "Optimiser les requêtes de base de données et activer le cache",
                "current_value": f"{avg_response_time:.1f}ms",
                "recommended_threshold": "1000ms"
            })
        
        # Recommandations basées sur le cache
        cache_stats = cache_optimizer.get_stats()
        hit_rate = cache_stats.get('hit_rate', 0)
        if hit_rate < 50:
            recommendations.append({
                "type": "cache",
                "priority": "medium",
                "message": "Taux de hit du cache faible",
                "action": "Optimiser la stratégie de cache et augmenter la TTL",
                "current_value": f"{hit_rate:.1f}%",
                "recommended_threshold": "50%"
            })
        
        return {
            "status": "success",
            "data": {
                "recommendations": recommendations,
                "total_recommendations": len(recommendations),
                "high_priority": len([r for r in recommendations if r["priority"] == "high"]),
                "medium_priority": len([r for r in recommendations if r["priority"] == "medium"])
            },
            "message": f"{len(recommendations)} recommandations générées"
        }
    except Exception as e:
        logger.error(f"Erreur lors de la génération des recommandations: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la génération des recommandations")
