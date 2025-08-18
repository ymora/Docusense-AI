"""
Database utilities for DocuSense AI
Centralized database operations and utilities
"""

import logging
from contextlib import contextmanager
from typing import List, Any, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from ..models.file import File

logger = logging.getLogger(__name__)


class DatabaseUtils:
    """
    Utilitaires centralisés pour la gestion de la base de données
    """

    @staticmethod
    @contextmanager
    def safe_transaction(session: Session):
        """Contexte sécurisé pour les transactions"""
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Transaction failed: {e}")
            raise

    @staticmethod
    def bulk_operation(session: Session, operation_type: str, items: List[Any]):
        """Opération en lot sécurisée"""
        try:
            if operation_type == "insert":
                session.bulk_save_objects(items)
            elif operation_type == "update":
                session.bulk_update_mappings(items)
            session.commit()
            return True
        except Exception as e:
            session.rollback()
            logger.error(f"Bulk operation failed: {e}")
            return False

    @staticmethod
    def safe_query(session: Session, query_func, *args, **kwargs):
        """Exécute une requête de manière sécurisée"""
        try:
            return query_func(session, *args, **kwargs)
        except Exception as e:
            logger.error(f"Query failed: {e}")
            return None


class QueryBuilder:
    """
    Constructeur de requêtes centralisé
    """

    @staticmethod
    def build_file_filters(session: Session, filters: Dict[str, Any]):
        """Construit les filtres pour les requêtes de fichiers"""
        query = session.query(File)
        
        if filters.get("status"):
            query = query.filter(File.status == filters["status"])
        
        if filters.get("directory"):
            query = query.filter(File.parent_directory == filters["directory"])
        
        if filters.get("mime_type"):
            query = query.filter(File.mime_type == filters["mime_type"])
        
        return query

    @staticmethod
    def build_pagination_query(query, page: int = 1, page_size: int = 50):
        """Ajoute la pagination à une requête"""
        offset = (page - 1) * page_size
        return query.offset(offset).limit(page_size)


class DatabaseValidator:
    """
    Validateur de base de données centralisé
    """

    @staticmethod
    def validate_file_exists(session: Session, file_id: int) -> bool:
        """Vérifie si un fichier existe"""
        return session.query(File).filter(File.id == file_id).first() is not None

    @staticmethod
    def validate_directory_exists(session: Session, directory: str) -> bool:
        """Vérifie si un répertoire existe dans la base"""
        return session.query(File).filter(File.parent_directory == directory).first() is not None


class DatabaseMetrics:
    """
    Métriques de base de données centralisées
    """

    @staticmethod
    def get_file_count_by_status(
            session: Session, directory: Optional[str] = None) -> Dict[str, int]:
        """
        Obtient le nombre de fichiers par statut

        Args:
            session: Session de base de données
            directory: Répertoire optionnel pour filtrer

        Returns:
            Dict: Nombre de fichiers par statut
        """
        try:
            query = session.query(File.status, func.count(File.id))

            if directory:
                query = query.filter(
                    func.startswith(
                        File.parent_directory,
                        directory))

            result = query.group_by(File.status).all()

            return {status.value: count for status, count in result}

        except Exception as e:
            logger.error(f"Erreur lors du calcul des métriques: {str(e)}")
            return {}

    @staticmethod
    def get_total_file_count(session: Session, directory: Optional[str] = None) -> int:
        """Obtient le nombre total de fichiers"""
        try:
            query = session.query(func.count(File.id))
            
            if directory:
                query = query.filter(func.startswith(File.parent_directory, directory))
            
            return query.scalar() or 0
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul du nombre total: {str(e)}")
            return 0
