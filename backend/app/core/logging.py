"""
Logging configuration for DocuSense AI
"""

import logging
import sys
import json
import asyncio
import atexit
import signal
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, Optional, List
from .config import settings
import time
import threading

# Variables globales pour éviter les logs répétitifs
_logging_initialized = False
_frontend_loggers: List[callable] = []
_log_cleanup_scheduled = False

class LogCleanupManager:
    """Gestionnaire de nettoyage automatique des logs"""
    
    def __init__(self):
        self.log_dir = Path("logs")
        self.max_log_size_mb = 10  # Taille max par fichier de log
        self.max_log_age_hours = 24  # Âge max des logs
        self.cleanup_interval_hours = 6  # Intervalle de nettoyage
        self._cleanup_thread = None
        self._stop_cleanup = False
        
    def start_cleanup_scheduler(self):
        """Démarre le planificateur de nettoyage automatique"""
        if self._cleanup_thread is None or not self._cleanup_thread.is_alive():
            self._stop_cleanup = False
            self._cleanup_thread = threading.Thread(target=self._cleanup_scheduler, daemon=True)
            self._cleanup_thread.start()
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
    
    def stop_cleanup_scheduler(self):
        """Arrête le planificateur de nettoyage"""
        self._stop_cleanup = True
        if self._cleanup_thread and self._cleanup_thread.is_alive():
            self._cleanup_thread.join(timeout=5)
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
    
    def _cleanup_scheduler(self):
        """Planificateur de nettoyage en arrière-plan"""
        while not self._stop_cleanup:
            try:
                self.cleanup_logs()
                # Attendre l'intervalle de nettoyage
                for _ in range(self.cleanup_interval_hours * 3600):  # Convertir en secondes
                    if self._stop_cleanup:
                        break
                    time.sleep(1)
            except Exception as e:
                sys.stderr.write(f"Erreur dans le planificateur de nettoyage: {e}\n")
                time.sleep(60)  # Attendre 1 minute en cas d'erreur
    
    def cleanup_logs(self, force: bool = False):
        """
        Nettoie les logs selon les critères définis
        
        Args:
            force: Force le nettoyage même si pas nécessaire
        """
        try:
            if not self.log_dir.exists():
                return
            
            now = datetime.now()
            max_age = now - timedelta(hours=self.max_log_age_hours)
            max_size_bytes = self.max_log_size_mb * 1024 * 1024
            
            cleaned_count = 0
            total_size_cleaned = 0
            
            # Nettoyer les fichiers de log
            for log_file in self.log_dir.glob("*.log"):
                try:
                    stat = log_file.stat()
                    file_age = datetime.fromtimestamp(stat.st_mtime)
                    file_size = stat.st_size
                    
                    should_clean = False
                    reason = ""
                    
                    # Vérifier l'âge du fichier
                    if file_age < max_age:
                        should_clean = True
                        reason = "âge"
                    # Vérifier la taille du fichier
                    elif file_size > max_size_bytes:
                        should_clean = True
                        reason = "taille"
                    # Nettoyage forcé
                    elif force:
                        should_clean = True
                        reason = "forcé"
                    
                    if should_clean:
                        log_file.unlink()
                        cleaned_count += 1
                        total_size_cleaned += file_size
                        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                        
                except Exception as e:
                    logger.warning(f"Impossible de nettoyer {log_file}: {e}")
            
            if cleaned_count > 0:
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                pass
            elif force:
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                pass
                
        except Exception as e:
            logger.error(f"Erreur lors du nettoyage des logs: {e}")
    
    def cleanup_on_exit(self):
        """Nettoyage forcé à la fermeture de l'application"""
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
        self.stop_cleanup_scheduler()
        self.cleanup_logs(force=True)
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge

# Instance globale du gestionnaire de nettoyage
log_cleanup_manager = LogCleanupManager()

class FrontendLogHandler(logging.Handler):
    """Handler pour envoyer les logs au frontend via SSE"""
    
    def __init__(self):
        super().__init__()
        self.log_buffer: List[Dict[str, Any]] = []
        self.max_buffer_size = 500  # OPTIMISATION: Réduit de 1000 à 500
        self._last_notification = 0
        self._notification_threshold = 0.1  # Notifier au plus toutes les 100ms
    
    def emit(self, record):
        try:
            # OPTIMISATION: Vérifier si on doit notifier maintenant
            current_time = time.time()
            should_notify = (current_time - self._last_notification) >= self._notification_threshold
            
            # Formater le log pour le frontend
            log_entry = {
                "id": f"backend_{datetime.now().timestamp()}_{id(record)}",
                "timestamp": datetime.now().isoformat(),
                "level": record.levelname.lower(),
                "source": record.name,
                "message": record.getMessage(),
                "details": {
                    "module": record.module,
                    "function": record.funcName,
                    "line": record.lineno,
                    "path": record.pathname
                }
            }
            
            # Ajouter les données d'exception si présentes
            if record.exc_info:
                log_entry["details"]["exception"] = {
                    "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                    "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                    "traceback": self.formatException(record.exc_info)
                }
            
            # Ajouter les données extra si présentes
            if hasattr(record, 'extra_data'):
                log_entry["details"]["extra"] = record.extra_data
            
            # Ajouter au buffer
            self.log_buffer.append(log_entry)
            
            # OPTIMISATION: Limiter la taille du buffer de manière plus efficace
            if len(self.log_buffer) > self.max_buffer_size:
                self.log_buffer = self.log_buffer[-self.max_buffer_size:]
            
            # OPTIMISATION: Notifier seulement si nécessaire
            if should_notify:
                self._notify_frontend(log_entry)
                self._last_notification = current_time
            
        except Exception as e:
            # Éviter les boucles infinies de logging
            sys.stderr.write(f"Erreur dans FrontendLogHandler: {e}\n")
    
    def _notify_frontend(self, log_entry: Dict[str, Any]):
        """Notifier les listeners frontend de manière optimisée"""
        # OPTIMISATION: Copier la liste pour éviter les modifications pendant l'itération
        callbacks = _frontend_loggers.copy()
        for callback in callbacks:
            try:
                callback(log_entry)
            except Exception as e:
                # OPTIMISATION: Supprimer les callbacks défaillants
                if callback in _frontend_loggers:
                    _frontend_loggers.remove(callback)
                sys.stderr.write(f"Erreur callback frontend supprimé: {e}\n")
    
    def get_recent_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Récupérer les logs récents"""
        return self.log_buffer[-limit:]

def register_frontend_logger(callback: callable):
    """Enregistrer un callback pour recevoir les logs frontend"""
    _frontend_loggers.append(callback)

def unregister_frontend_logger(callback: callable):
    """Désenregistrer un callback"""
    if callback in _frontend_loggers:
        _frontend_loggers.remove(callback)

class UserTypeFilter(logging.Filter):
    """
    Filtre professionnel pour contrôler les logs selon le type d'utilisateur
    """
    def __init__(self, user_type: str = "guest", name: str = ""):
        super().__init__(name)
        self.user_type = user_type
        self.logging_config = {
            "guest": {
                "enabled": False,  # AUCUN LOG
                "levels": set(),   # Aucun niveau autorisé
                "modules": set()   # Aucun module autorisé
            },
            "user": {
                "enabled": True,
                "levels": {"ERROR", "CRITICAL"},  # Seulement erreurs critiques
                "modules": {"auth", "security", "admin"}  # Modules sensibles
            },
            "admin": {
                "enabled": True,
                "levels": {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"},  # Tous les niveaux
                "modules": set()  # Tous les modules
            }
        }
    
    def filter(self, record):
        """Détermine si le log doit être enregistré"""
        config = self.logging_config.get(self.user_type, self.logging_config["guest"])
        
        # Si le logging est désactivé pour ce type d'utilisateur
        if not config["enabled"]:
            return False
        
        # Vérifier le niveau de log
        if record.levelname not in config["levels"]:
            return False
        
        # Vérifier le module (si spécifié)
        if config["modules"] and not any(module in record.name.lower() for module in config["modules"]):
            return False
        
        # Ajouter le type d'utilisateur au record pour le contexte
        record.user_type = self.user_type
        return True

class PerformanceFilter(logging.Filter):
    """
    Filtre pour optimiser les performances en production
    """
    def __init__(self, max_logs_per_second: int = 100, name: str = ""):
        super().__init__(name)
        self.max_logs_per_second = max_logs_per_second
        self.log_count = 0
        self.last_reset = time.time()
    
    def filter(self, record):
        """Limite le nombre de logs par seconde"""
        current_time = time.time()
        
        # Réinitialiser le compteur chaque seconde
        if current_time - self.last_reset >= 1.0:
            self.log_count = 0
            self.last_reset = current_time
        
        # Vérifier la limite
        if self.log_count >= self.max_logs_per_second:
            return False
        
        self.log_count += 1
        return True

def setup_adaptive_logging(user_type: str = "guest", max_logs_per_second: int = 100):
    """
    Configure le logging adaptatif avec filtres professionnels
    """
    # Obtenir le logger racine
    root_logger = logging.getLogger()
    
    # Supprimer les filtres existants
    for handler in root_logger.handlers:
        for filter_obj in handler.filters[:]:
            if isinstance(filter_obj, (UserTypeFilter, PerformanceFilter)):
                handler.removeFilter(filter_obj)
    
    # Ajouter les nouveaux filtres
    user_filter = UserTypeFilter(user_type)
    perf_filter = PerformanceFilter(max_logs_per_second)
    
    for handler in root_logger.handlers:
        handler.addFilter(user_filter)
        handler.addFilter(perf_filter)
    
    return root_logger

def setup_logging():
    """Setup logging configuration optimisée avec catégorisation"""
    global _logging_initialized
    
    # Éviter la réinitialisation multiple
    if _logging_initialized:
        return

    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    # Handler pour le frontend
    frontend_handler = FrontendLogHandler()
    frontend_handler.setLevel(logging.WARNING)  # OPTIMISATION: Seulement WARNING et ERROR pour le frontend

    # Configure logging avec niveau réduit pour les modules externes et encodage UTF-8
    # Console handler avec encodage UTF-8
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, settings.log_level.upper()))
    
    # File handlers avec encodage UTF-8
    file_handler = logging.FileHandler(log_dir / "docusense.log", encoding='utf-8')
    file_handler.setLevel(getattr(logging, settings.log_level.upper()))
    
    error_handler = logging.FileHandler(log_dir / "docusense_error.log", encoding='utf-8')
    error_handler.setLevel(logging.ERROR)
    
    # Formatter
    formatter = logging.Formatter(settings.log_format)
    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)
    error_handler.setFormatter(formatter)
    
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper()),
        handlers=[
            console_handler,
            file_handler,
            error_handler,
            frontend_handler
        ]
    )

    # Réduire le niveau de log pour les modules externes
    external_loggers = [
        "uvicorn",
        "uvicorn.error",
        "fastapi",
        "sqlalchemy",
        "httpx",
        "openai",
        "anthropic",
        "mistralai"
    ]

    for logger_name in external_loggers:
        logger = logging.getLogger(logger_name)
        logger.setLevel(logging.ERROR)

    # Set our app logger
    app_logger = logging.getLogger("docusense")
    app_logger.setLevel(getattr(logging, settings.log_level.upper()))

    # Démarrer le planificateur de nettoyage automatique
    log_cleanup_manager.start_cleanup_scheduler()
    
    # Enregistrer le nettoyage à la fermeture
    atexit.register(log_cleanup_manager.cleanup_on_exit)
    
    # Gestion des signaux pour le nettoyage propre
    def signal_handler(signum, frame):
        log_cleanup_manager.cleanup_on_exit()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    _logging_initialized = True
    # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge

def get_logger(name: str) -> logging.Logger:
    """Obtenir un logger avec le nom spécifié"""
    return logging.getLogger(f"docusense.{name}")

def get_adaptive_logger(name: str, user_type: str = "guest", max_logs_per_second: int = 100) -> logging.Logger:
    """
    Obtenir un logger adaptatif avec filtres professionnels
    """
    logger = logging.getLogger(f"docusense.{name}")
    
    # Configurer les filtres pour ce logger spécifique
    user_filter = UserTypeFilter(user_type)
    perf_filter = PerformanceFilter(max_logs_per_second)
    
    # Supprimer les filtres existants
    for filter_obj in logger.filters[:]:
        if isinstance(filter_obj, (UserTypeFilter, PerformanceFilter)):
            logger.removeFilter(filter_obj)
    
    # Ajouter les nouveaux filtres
    logger.addFilter(user_filter)
    logger.addFilter(perf_filter)
    
    return logger

def log_with_context(logger: logging.Logger, level: str, message: str, context: Dict[str, Any] = None, exception: Exception = None, user_type: str = "user"):
    """
    Logger avec contexte structuré et adaptation selon le type d'utilisateur
    """
    # Vérifier si on doit logger selon le type d'utilisateur
    if user_type == "guest":
        return  # AUCUN LOG pour les invités
    
    # Pour les utilisateurs normaux, seulement ERROR et CRITICAL
    if user_type == "user" and level.upper() not in ["ERROR", "CRITICAL"]:
        return
    
    extra_data = {
        "context": context or {},
        "timestamp": datetime.now().isoformat(),
        "user_type": user_type
    }
    
    if exception:
        extra_data["exception"] = {
            "type": type(exception).__name__,
            "message": str(exception),
            "traceback": str(exception.__traceback__)
        }
    
    # Ajouter les données extra au record
    record = logger.makeRecord(
        logger.name, 
        getattr(logging, level.upper()),
        "",
        0,
        message,
        (),
        None,
        func=None,
        extra=extra_data
    )
    
    logger.handle(record)

# Logger principal
logger = get_logger("core")
