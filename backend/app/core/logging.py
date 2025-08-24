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
import gzip
import tarfile
import hashlib

# Variables globales pour éviter les logs répétitifs
_logging_initialized = False
_frontend_loggers: List[callable] = []
_log_cleanup_scheduled = False

class LogArchiveManager:
    """Gestionnaire d'archivage automatique des logs"""
    
    def __init__(self):
        self.log_dir = Path("logs")
        self.archive_dir = self.log_dir / "archive"
        self.archive_retention_days = 365  # 1 an
        self.archive_interval_hours = 24  # Archivage quotidien
        self._archive_thread = None
        self._stop_archive = False
        
    def start_archive_scheduler(self):
        """Démarre le planificateur d'archivage automatique"""
        if self._archive_thread is None or not self._archive_thread.is_alive():
            self._stop_archive = False
            self._archive_thread = threading.Thread(target=self._archive_scheduler, daemon=True)
            self._archive_thread.start()
    
    def stop_archive_scheduler(self):
        """Arrête le planificateur d'archivage"""
        self._stop_archive = True
        if self._archive_thread and self._archive_thread.is_alive():
            self._archive_thread.join(timeout=5)
    
    def _archive_scheduler(self):
        """Planificateur d'archivage en arrière-plan"""
        while not self._stop_archive:
            try:
                self.archive_old_logs()
                # Attendre l'intervalle d'archivage
                for _ in range(self.archive_interval_hours * 3600):
                    if self._stop_archive:
                        break
                    time.sleep(1)
            except Exception as e:
                sys.stderr.write(f"Erreur dans le planificateur d'archivage: {e}\n")
                time.sleep(3600)  # Attendre 1 heure en cas d'erreur
    
    def archive_old_logs(self):
        """Archive les logs anciens"""
        try:
            if not self.log_dir.exists():
                return
            
            now = datetime.now()
            archive_threshold = now - timedelta(days=30)  # Archiver après 30 jours
            
            # Créer le répertoire d'archive du mois
            archive_month = now.strftime("%Y-%m")
            month_archive_dir = self.archive_dir / archive_month
            month_archive_dir.mkdir(parents=True, exist_ok=True)
            
            archived_count = 0
            
            # Parcourir tous les sous-répertoires de logs
            for category_dir in self.log_dir.iterdir():
                if not category_dir.is_dir() or category_dir.name == "archive":
                    continue
                
                # Archiver les fichiers de log anciens dans cette catégorie
                for log_file in category_dir.glob("*.log"):
                    try:
                        stat = log_file.stat()
                        file_age = datetime.fromtimestamp(stat.st_mtime)
                        
                        if file_age < archive_threshold:
                            # Créer l'archive
                            archive_name = f"{file_age.strftime('%Y-%m-%d')}_{category_dir.name}_{log_file.stem}.tar.gz"
                            archive_path = month_archive_dir / archive_name
                            
                            with tarfile.open(archive_path, "w:gz") as tar:
                                tar.add(log_file, arcname=log_file.name)
                            
                            # Créer le checksum
                            with open(archive_path, 'rb') as f:
                                checksum = hashlib.sha256(f.read()).hexdigest()
                            
                            checksum_path = archive_path.with_suffix('.tar.gz.sha256')
                            with open(checksum_path, 'w') as f:
                                f.write(checksum)
                            
                            # Supprimer le fichier original
                            log_file.unlink()
                            archived_count += 1
                            
                    except Exception as e:
                        sys.stderr.write(f"Erreur lors de l'archivage de {log_file}: {e}\n")
            
            # Nettoyer les archives anciennes
            self.cleanup_old_archives()
            
            if archived_count > 0:
                sys.stderr.write(f"Archivage terminé: {archived_count} fichiers archivés\n")
                
        except Exception as e:
            sys.stderr.write(f"Erreur lors de l'archivage: {e}\n")
    
    def cleanup_old_archives(self):
        """Nettoie les archives anciennes"""
        try:
            if not self.archive_dir.exists():
                return
            
            now = datetime.now()
            retention_threshold = now - timedelta(days=self.archive_retention_days)
            
            cleaned_count = 0
            
            for month_dir in self.archive_dir.iterdir():
                if not month_dir.is_dir():
                    continue
                
                try:
                    # Extraire la date du nom du répertoire (YYYY-MM)
                    month_date = datetime.strptime(month_dir.name, "%Y-%m")
                    
                    if month_date < retention_threshold:
                        # Supprimer tout le répertoire du mois
                        import shutil
                        shutil.rmtree(month_dir)
                        cleaned_count += 1
                        
                except ValueError:
                    # Ignorer les répertoires qui ne suivent pas le format YYYY-MM
                    continue
                except Exception as e:
                    sys.stderr.write(f"Erreur lors du nettoyage de {month_dir}: {e}\n")
            
            if cleaned_count > 0:
                sys.stderr.write(f"Nettoyage des archives terminé: {cleaned_count} mois supprimés\n")
                
        except Exception as e:
            sys.stderr.write(f"Erreur lors du nettoyage des archives: {e}\n")

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
    
    def stop_cleanup_scheduler(self):
        """Arrête le planificateur de nettoyage"""
        self._stop_cleanup = True
        if self._cleanup_thread and self._cleanup_thread.is_alive():
            self._cleanup_thread.join(timeout=5)
    
    def _cleanup_scheduler(self):
        """Planificateur de nettoyage en arrière-plan"""
        while not self._stop_cleanup:
            try:
                self.cleanup_logs()
                # Attendre l'intervalle de nettoyage
                for _ in range(self.cleanup_interval_hours * 3600):
                    if self._stop_cleanup:
                        break
                    time.sleep(1)
            except Exception as e:
                sys.stderr.write(f"Erreur dans le planificateur de nettoyage: {e}\n")
                time.sleep(60)
    
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
            
            # Nettoyer les fichiers de log dans tous les sous-répertoires
            for category_dir in self.log_dir.iterdir():
                if not category_dir.is_dir() or category_dir.name == "archive":
                    continue
                
                for log_file in category_dir.glob("*.log"):
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
                            
                    except Exception as e:
                        sys.stderr.write(f"Impossible de nettoyer {log_file}: {e}\n")
            
            if cleaned_count > 0:
                sys.stderr.write(f"Nettoyage terminé: {cleaned_count} fichiers supprimés, {total_size_cleaned / 1024 / 1024:.1f}MB libérés\n")
                
        except Exception as e:
            sys.stderr.write(f"Erreur lors du nettoyage des logs: {e}\n")
    
    def cleanup_on_exit(self):
        """Nettoyage forcé à la fermeture de l'application"""
        self.stop_cleanup_scheduler()
        self.cleanup_logs(force=True)

# Instances globales des gestionnaires
log_cleanup_manager = LogCleanupManager()
log_archive_manager = LogArchiveManager()

class FrontendLogHandler(logging.Handler):
    """Handler pour envoyer les logs au frontend via SSE"""
    
    def __init__(self):
        super().__init__()
        self.log_buffer: List[Dict[str, Any]] = []
        self.max_buffer_size = 500
        self._last_notification = 0
        self._notification_threshold = 0.1
    
    def emit(self, record):
        try:
            current_time = time.time()
            should_notify = (current_time - self._last_notification) >= self._notification_threshold
            
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
            
            if record.exc_info:
                log_entry["details"]["exception"] = {
                    "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                    "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                    "traceback": self.formatException(record.exc_info)
                }
            
            if hasattr(record, 'extra_data'):
                log_entry["details"]["extra"] = record.extra_data
            
            self.log_buffer.append(log_entry)
            
            if len(self.log_buffer) > self.max_buffer_size:
                self.log_buffer = self.log_buffer[-self.max_buffer_size:]
            
            if should_notify:
                self._notify_frontend(log_entry)
                self._last_notification = current_time
            
        except Exception as e:
            sys.stderr.write(f"Erreur dans FrontendLogHandler: {e}\n")
    
    def _notify_frontend(self, log_entry: Dict[str, Any]):
        """Notifier les listeners frontend de manière optimisée"""
        callbacks = _frontend_loggers.copy()
        for callback in callbacks:
            try:
                callback(log_entry)
            except Exception as e:
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
                "enabled": False,
                "levels": set(),
                "modules": set()
            },
            "user": {
                "enabled": True,
                "levels": {"ERROR", "CRITICAL"},
                "modules": {"auth", "security", "admin"}
            },
            "admin": {
                "enabled": True,
                "levels": {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"},
                "modules": set()
            }
        }
    
    def filter(self, record):
        """Détermine si le log doit être enregistré"""
        config = self.logging_config.get(self.user_type, self.logging_config["guest"])
        
        if not config["enabled"]:
            return False
        
        if record.levelname not in config["levels"]:
            return False
        
        if config["modules"] and not any(module in record.name.lower() for module in config["modules"]):
            return False
        
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
        
        if current_time - self.last_reset >= 1.0:
            self.log_count = 0
            self.last_reset = current_time
        
        if self.log_count >= self.max_logs_per_second:
            return False
        
        self.log_count += 1
        return True

def setup_adaptive_logging(user_type: str = "guest", max_logs_per_second: int = 100):
    """
    Configure le logging adaptatif avec filtres professionnels
    """
    root_logger = logging.getLogger()
    
    for handler in root_logger.handlers:
        for filter_obj in handler.filters[:]:
            if isinstance(filter_obj, (UserTypeFilter, PerformanceFilter)):
                handler.removeFilter(filter_obj)
    
    user_filter = UserTypeFilter(user_type)
    perf_filter = PerformanceFilter(max_logs_per_second)
    
    for handler in root_logger.handlers:
        handler.addFilter(user_filter)
        handler.addFilter(perf_filter)
    
    return root_logger

def setup_logging():
    """Setup logging configuration optimisée avec catégorisation"""
    global _logging_initialized
    
    if _logging_initialized:
        return

    # Créer la structure des répertoires de logs
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Créer les sous-répertoires
    categories = ["application", "security", "api", "database", "system", "analysis", "frontend", "tests"]
    for category in categories:
        (log_dir / category).mkdir(exist_ok=True)
    
    # Créer le répertoire d'archive
    (log_dir / "archive").mkdir(exist_ok=True)

    # Handler pour le frontend
    frontend_handler = FrontendLogHandler()
    frontend_handler.setLevel(logging.WARNING)

    # Console handler avec encodage UTF-8
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, settings.log_level.upper()))
    
    # File handlers organisés par catégorie
    handlers = [console_handler, frontend_handler]
    
    # Application logs
    app_handler = logging.FileHandler(log_dir / "application" / "docusense.log", encoding='utf-8')
    app_handler.setLevel(getattr(logging, settings.log_level.upper()))
    handlers.append(app_handler)
    
    # Error logs
    error_handler = logging.FileHandler(log_dir / "application" / "docusense_error.log", encoding='utf-8')
    error_handler.setLevel(logging.ERROR)
    handlers.append(error_handler)
    
    # Security logs
    security_handler = logging.FileHandler(log_dir / "security" / "security_events.log", encoding='utf-8')
    security_handler.setLevel(logging.INFO)
    handlers.append(security_handler)
    
    # API logs
    api_handler = logging.FileHandler(log_dir / "api" / "requests.log", encoding='utf-8')
    api_handler.setLevel(logging.WARNING)
    handlers.append(api_handler)
    
    # Database logs
    db_handler = logging.FileHandler(log_dir / "database" / "errors.log", encoding='utf-8')
    db_handler.setLevel(logging.ERROR)
    handlers.append(db_handler)
    
    # System logs
    system_handler = logging.FileHandler(log_dir / "system" / "startup.log", encoding='utf-8')
    system_handler.setLevel(logging.INFO)
    handlers.append(system_handler)
    
    # Analysis logs
    analysis_handler = logging.FileHandler(log_dir / "analysis" / "processing.log", encoding='utf-8')
    analysis_handler.setLevel(logging.ERROR)
    handlers.append(analysis_handler)
    
    # Formatter
    formatter = logging.Formatter(settings.log_format)
    for handler in handlers:
        handler.setFormatter(formatter)
    
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper()),
        handlers=handlers
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

    # Démarrer les planificateurs
    log_cleanup_manager.start_cleanup_scheduler()
    log_archive_manager.start_archive_scheduler()
    
    # Enregistrer le nettoyage à la fermeture
    atexit.register(log_cleanup_manager.cleanup_on_exit)
    atexit.register(log_archive_manager.stop_archive_scheduler)
    
    # Gestion des signaux pour le nettoyage propre
    def signal_handler(signum, frame):
        log_cleanup_manager.cleanup_on_exit()
        log_archive_manager.stop_archive_scheduler()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    _logging_initialized = True

def get_logger(name: str) -> logging.Logger:
    """Obtenir un logger avec le nom spécifié"""
    return logging.getLogger(f"docusense.{name}")

def get_category_logger(category: str, name: str) -> logging.Logger:
    """
    Obtenir un logger pour une catégorie spécifique
    
    Args:
        category: Catégorie de log (application, security, api, database, system, analysis)
        name: Nom du logger
    """
    logger = logging.getLogger(f"docusense.{category}.{name}")
    
    # Ajouter un filtre pour diriger les logs vers le bon fichier
    class CategoryFilter(logging.Filter):
        def __init__(self, target_category: str):
            super().__init__()
            self.target_category = target_category
        
        def filter(self, record):
            return record.name.startswith(f"docusense.{self.target_category}")
    
    # Supprimer les filtres existants
    for handler in logger.handlers:
        for filter_obj in handler.filters[:]:
            if isinstance(filter_obj, CategoryFilter):
                handler.removeFilter(filter_obj)
    
    # Ajouter le filtre de catégorie
    category_filter = CategoryFilter(category)
    for handler in logger.handlers:
        handler.addFilter(category_filter)
    
    return logger

def get_adaptive_logger(name: str, user_type: str = "guest", max_logs_per_second: int = 100) -> logging.Logger:
    """
    Obtenir un logger adaptatif avec filtres professionnels
    """
    logger = logging.getLogger(f"docusense.{name}")
    
    user_filter = UserTypeFilter(user_type)
    perf_filter = PerformanceFilter(max_logs_per_second)
    
    for filter_obj in logger.filters[:]:
        if isinstance(filter_obj, (UserTypeFilter, PerformanceFilter)):
            logger.removeFilter(filter_obj)
    
    logger.addFilter(user_filter)
    logger.addFilter(perf_filter)
    
    return logger

def log_with_context(logger: logging.Logger, level: str, message: str, context: Dict[str, Any] = None, exception: Exception = None, user_type: str = "user"):
    """
    Logger avec contexte structuré et adaptation selon le type d'utilisateur
    """
    if user_type == "guest":
        return
    
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
