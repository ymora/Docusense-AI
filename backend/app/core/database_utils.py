"""
Utilitaires centralisés pour la gestion de la base de données
"""

import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from contextlib import contextmanager

logger = logging.getLogger(__name__)


class DatabaseUtils:
    """
    Utilitaires centralisés pour la gestion de la base de données
    """

    @staticmethod
    @contextmanager
    def safe_transaction(session: Session):
        """
        Gestionnaire de contexte pour les transactions sécurisées

        Args:
            session: Session de base de données

        Yields:
            Session: Session de base de données
        """
        try:
            yield session
            session.commit()

        except Exception as e:
            session.rollback()
            logger.error(
                f"Erreur lors de la transaction, rollback effectué: {
                    str(e)}")
            raise

    @staticmethod
    def bulk_operation(
            session: Session,
            operation_func,
            items: List[Any],
            batch_size: int = 100):
        """
        Effectue une opération en lot sur des éléments

        Args:
            session: Session de base de données
            operation_func: Fonction à appliquer sur chaque élément
            items: Liste des éléments à traiter
            batch_size: Taille des lots

        Returns:
            int: Nombre d'éléments traités
        """
        processed_count = 0

        try:
            for i in range(0, len(items), batch_size):
                batch = items[i:i + batch_size]

                for item in batch:
                    try:
                        operation_func(session, item)
                        processed_count += 1
                    except Exception as e:
                        logger.error(
                            f"Erreur lors du traitement de l'élément {item}: {
                                str(e)}")
                        continue

                # Commit après chaque lot
                session.commit()

            return processed_count

        except Exception as e:
            session.rollback()
            logger.error(f"Erreur lors de l'opération en lot: {str(e)}")
            raise

    @staticmethod
    def safe_query(session: Session, query_func, *args, **kwargs):
        """
        Exécute une requête de manière sécurisée

        Args:
            session: Session de base de données
            query_func: Fonction de requête à exécuter
            *args: Arguments pour la fonction
            **kwargs: Arguments nommés pour la fonction

        Returns:
            Any: Résultat de la requête ou None si erreur
        """
        try:
            return query_func(session, *args, **kwargs)
        except Exception as e:
            logger.error(f"Erreur lors de l'exécution de la requête: {str(e)}")
            return None


class QueryBuilder:
    """
    Constructeur de requêtes centralisé
    """

    @staticmethod
    def build_file_filters(
        directory: Optional[str] = None,
        status: Optional[str] = None,
        selected_only: bool = False,
        search: Optional[str] = None,
        format_category: Optional[str] = None
    ) -> List:
        """
        Construit les filtres pour les requêtes de fichiers

        Args:
            directory: Répertoire à filtrer
            status: Statut à filtrer
            selected_only: Filtrer seulement les fichiers sélectionnés
            search: Terme de recherche
            format_category: Catégorie de format à filtrer

        Returns:
            List: Liste des filtres SQLAlchemy
        """
        filters = []

        if directory:
            filters.append(func.startswith(File.parent_directory, directory))

        if status:
            filters.append(File.status == status)

        if selected_only:
            filters.append(File.is_selected)

        if search:
            search_filter = or_(
                File.name.ilike(f"%{search}%"),
                File.path.ilike(f"%{search}%")
            )
            filters.append(search_filter)

        if format_category:
            # Ici on pourrait ajouter un filtre sur la catégorie de format
            # Nécessite d'ajouter un champ format_category à la table File
            pass

        return filters

    @staticmethod
    def build_pagination_query(query, limit: int = 100, offset: int = 0):
        """
        Applique la pagination à une requête

        Args:
            query: Requête SQLAlchemy
            limit: Nombre maximum d'éléments
            offset: Décalage

        Returns:
            Query: Requête avec pagination
        """
        return query.limit(limit).offset(offset)


class DatabaseValidator:
    """
    Validateur de base de données centralisé
    """

    @staticmethod
    def validate_file_exists(session: Session, file_id: int) -> bool:
        """
        Valide qu'un fichier existe dans la base de données

        Args:
            session: Session de base de données
            file_id: ID du fichier

        Returns:
            bool: True si le fichier existe
        """
        try:
            from app.models.file import File
            file = session.query(File).filter(File.id == file_id).first()
            return file is not None
        except Exception as e:
            logger.error(
                f"Erreur lors de la validation du fichier {file_id}: {
                    str(e)}")
            return False

    @staticmethod
    def validate_directory_exists(
            session: Session,
            directory_path: str) -> bool:
        """
        Valide qu'un répertoire existe dans la base de données

        Args:
            session: Session de base de données
            directory_path: Chemin du répertoire

        Returns:
            bool: True si le répertoire existe
        """
        try:
            from app.models.database import DirectoryStructure
            directory = session.query(DirectoryStructure).filter(
                DirectoryStructure.path == directory_path
            ).first()
            return directory is not None
        except Exception as e:
            logger.error(
                f"Erreur lors de la validation du répertoire {directory_path}: {
                    str(e)}")
            return False


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
            from app.models.file import File

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
    def get_total_file_count(
            session: Session,
            directory: Optional[str] = None) -> int:
        """
        Obtient le nombre total de fichiers

        Args:
            session: Session de base de données
            directory: Répertoire optionnel pour filtrer

        Returns:
            int: Nombre total de fichiers
        """
        try:
            from app.models.file import File

            query = session.query(func.count(File.id))

            if directory:
                query = query.filter(
                    func.startswith(
                        File.parent_directory,
                        directory))

            return query.scalar() or 0

        except Exception as e:
            logger.error(
                f"Erreur lors du calcul du nombre total de fichiers: {
                    str(e)}")
            return 0
