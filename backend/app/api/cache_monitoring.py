"""
Cache monitoring endpoints for DocuSense AI
Phase 3: Optimisation des Performances
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging

from ..core.advanced_cache import advanced_cache, invalidate_cache
from ..utils.api_utils import APIUtils

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cache", tags=["cache-monitoring"])

@router.get("/stats")
@APIUtils.handle_errors
async def get_cache_stats() -> Dict[str, Any]:
    """
    Get cache performance statistics
    """
    try:
        stats = advanced_cache.get_stats()
        
        # Ajouter des métriques supplémentaires
        stats['performance'] = {
            'hit_rate_percentage': round(stats['hit_rate'] * 100, 2),
            'efficiency': 'excellent' if stats['hit_rate'] > 0.8 else 'good' if stats['hit_rate'] > 0.6 else 'poor',
            'memory_efficiency': 'low' if stats['size'] < stats['max_size'] * 0.5 else 'medium' if stats['size'] < stats['max_size'] * 0.8 else 'high'
        }
        
        return {
            "success": True,
            "data": stats,
            "message": "Cache statistics retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"Error getting cache stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get cache statistics")

@router.post("/clear")
@APIUtils.handle_errors
async def clear_cache() -> Dict[str, Any]:
    """
    Clear all cache entries
    """
    try:
        advanced_cache.clear()
        
        return {
            "success": True,
            "message": "Cache cleared successfully",
            "data": {
                "cleared_at": "now",
                "new_stats": advanced_cache.get_stats()
            }
        }
        
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to clear cache")

@router.post("/cleanup")
@APIUtils.handle_errors
async def cleanup_expired_cache() -> Dict[str, Any]:
    """
    Clean up expired cache entries
    """
    try:
        cleaned_count = advanced_cache.cleanup_expired()
        
        return {
            "success": True,
            "message": f"Cleaned up {cleaned_count} expired cache entries",
            "data": {
                "cleaned_count": cleaned_count,
                "new_stats": advanced_cache.get_stats()
            }
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up cache: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cleanup cache")

@router.post("/invalidate")
@APIUtils.handle_errors
async def invalidate_cache_patterns(patterns: list[str]) -> Dict[str, Any]:
    """
    Invalidate cache entries by patterns
    """
    try:
        total_invalidated = 0
        results = {}
        
        for pattern in patterns:
            count = advanced_cache.invalidate_pattern(pattern)
            results[pattern] = count
            total_invalidated += count
        
        return {
            "success": True,
            "message": f"Invalidated {total_invalidated} cache entries",
            "data": {
                "total_invalidated": total_invalidated,
                "pattern_results": results,
                "new_stats": advanced_cache.get_stats()
            }
        }
        
    except Exception as e:
        logger.error(f"Error invalidating cache: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to invalidate cache")

@router.get("/health")
@APIUtils.handle_errors
async def get_cache_health() -> Dict[str, Any]:
    """
    Get cache health status
    """
    try:
        stats = advanced_cache.get_stats()
        
        # Déterminer le statut de santé
        hit_rate = stats['hit_rate']
        size_ratio = stats['size'] / stats['max_size']
        
        if hit_rate > 0.7 and size_ratio < 0.8:
            health_status = "healthy"
        elif hit_rate > 0.5 and size_ratio < 0.9:
            health_status = "warning"
        else:
            health_status = "critical"
        
        return {
            "success": True,
            "data": {
                "status": health_status,
                "hit_rate": hit_rate,
                "size_ratio": size_ratio,
                "recommendations": _get_cache_recommendations(stats)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting cache health: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get cache health")

def _get_cache_recommendations(stats: Dict[str, Any]) -> list[str]:
    """Génère des recommandations basées sur les statistiques du cache"""
    recommendations = []
    
    hit_rate = stats['hit_rate']
    size_ratio = stats['size'] / stats['max_size']
    
    if hit_rate < 0.5:
        recommendations.append("Cache hit rate is low. Consider increasing cache size or TTL.")
    
    if size_ratio > 0.9:
        recommendations.append("Cache is nearly full. Consider increasing max_size or reducing TTL.")
    
    if stats['evictions'] > stats['total_requests'] * 0.1:
        recommendations.append("High eviction rate. Consider increasing cache size.")
    
    if not recommendations:
        recommendations.append("Cache is performing well. No optimizations needed.")
    
    return recommendations
