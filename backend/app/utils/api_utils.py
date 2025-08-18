"""
Utilitaires communs pour les APIs - Utilise les utilitaires de core
"""

import logging
import urllib.parse
from pathlib import Path
from typing import Optional, Dict, Any, Callable
from functools import wraps
from fastapi import HTTPException
from datetime import datetime
import time

# Import des utilitaires de core
from ..core.file_validation import FileValidator
from ..core.performance_monitor import performance_monitor

logger = logging.getLogger(__name__)


class APIUtils:
    """Utilitaires communs pour toutes les APIs"""
    
    @staticmethod
    def handle_errors(func: Callable) -> Callable:
        """Décorateur pour gestion d'erreurs uniforme"""
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                result = func(*args, **kwargs)
                if hasattr(result, '__await__'):
                    return await result
                return result
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error in {func.__name__}: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        return wrapper
    
    @staticmethod
    def validate_file_path(path: str, must_exist: bool = True) -> Path:
        """Validation robuste des chemins de fichiers - utilise FileValidator"""
        try:
            decoded_path = urllib.parse.unquote(path)
            file_path = Path(decoded_path)
            
            # Utiliser FileValidator pour une validation complète
            validation_result = FileValidator.validate_file_path(file_path)
            
            if not validation_result.is_valid:
                # Convertir les erreurs de validation en HTTPException
                error_messages = [error.message for error in validation_result.errors]
                raise HTTPException(status_code=400, detail="; ".join(error_messages))
            
            # Vérifier l'existence si demandé
            if must_exist and not file_path.exists():
                raise HTTPException(status_code=404, detail="Fichier non trouvé")
            
            return file_path
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error validating file path {path}: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Chemin invalide: {str(e)}")
    
    @staticmethod
    def get_system_metrics() -> Dict[str, Any]:
        """Métriques système centralisées - utilise core/performance_monitor"""
        try:
            summary = performance_monitor.get_summary()
            return {
                "cpu_percent": summary.get("system_cpu_percent", 0),
                "memory_mb": summary.get("system_memory_mb", 0),
                "uptime_seconds": summary.get("uptime_seconds", 0),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting system metrics: {str(e)}")
            return {
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    @staticmethod
    def record_api_metric(metric_name: str, value: float, tags: Optional[Dict[str, str]] = None):
        """Enregistre une métrique d'API pour le monitoring"""
        try:
            performance_monitor.record_metric(metric_name, value, tags)
        except Exception as e:
            logger.error(f"Error recording API metric: {str(e)}")
    
    @staticmethod
    def monitor_api_performance(func: Callable) -> Callable:
        """Décorateur pour monitorer les performances des APIs"""
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                if hasattr(result, '__await__'):
                    result = await result
                
                # Enregistrer le temps de réponse
                response_time = time.time() - start_time
                APIUtils.record_api_metric(
                    "api_response_time",
                    response_time,
                    {"endpoint": func.__name__}
                )
                
                return result
            except Exception as e:
                # Enregistrer les erreurs
                APIUtils.record_api_metric(
                    "api_errors",
                    1.0,
                    {"endpoint": func.__name__, "error_type": type(e).__name__}
                )
                raise
        
        return wrapper
    
    @staticmethod
    def validate_pagination_params(limit: int, offset: int, max_limit: int = 1000) -> tuple:
        """Validation des paramètres de pagination"""
        if limit < 1 or limit > max_limit:
            raise HTTPException(status_code=400, detail=f"Limit must be between 1 and {max_limit}")
        if offset < 0:
            raise HTTPException(status_code=400, detail="Offset must be >= 0")
        return limit, offset


class FilePathValidator:
    """Validateur spécialisé pour les chemins de fichiers - utilise core/file_validation"""
    
    @staticmethod
    def validate_email_file(path: str) -> Path:
        """Validation spécifique pour les fichiers .eml"""
        file_path = APIUtils.validate_file_path(path)
        
        # Utiliser le FileValidator de core
        is_valid, error_msg, mime_type = FileValidator.validate_file(file_path)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)
        
        return file_path
    
    @staticmethod
    def validate_multimedia_file(path: str) -> Path:
        """Validation spécifique pour les fichiers multimédia"""
        file_path = APIUtils.validate_file_path(path)
        
        # Utiliser le FileValidator de core
        is_valid, error_msg, mime_type = FileValidator.validate_file(file_path)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Vérifier que c'est un fichier multimédia
        if mime_type:
            file_type = FileValidator.get_file_type(mime_type)
            if file_type not in ['image', 'video', 'audio']:
                raise HTTPException(status_code=400, detail="Fichier non multimédia")
        
        return file_path


class ResponseFormatter:
    """Formatage uniforme des réponses"""
    
    @staticmethod
    def success_response(data: Any = None, message: str = "Success") -> Dict[str, Any]:
        """Format de réponse de succès uniforme"""
        response = {
            "success": True,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        if data is not None:
            response["data"] = data
        return response
    
    @staticmethod
    def error_response(message: str, error_code: str = None) -> Dict[str, Any]:
        """Format de réponse d'erreur uniforme"""
        response = {
            "success": False,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        if error_code:
            response["error_code"] = error_code
        return response
    
    @staticmethod
    def paginated_response(items: list, total: int, limit: int, offset: int, **kwargs) -> Dict[str, Any]:
        """Format de réponse paginée uniforme"""
        return {
            "success": True,
            "data": items,
            "pagination": {
                "total": total,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total
            },
            "timestamp": datetime.now().isoformat(),
            **kwargs
        } 