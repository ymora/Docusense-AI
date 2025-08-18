# -*- coding: utf-8 -*-

# CODE MORT EXTRAIT DE: backend/app/core/database_utils.py
# Fonctions extraites: 8
# Lignes totales extraites: 208
# Date d'extraction: 2025-08-11 01:32:24

# =============================================================================
# FONCTIONS MORTES EXTRAITES
# =============================================================================


# =============================================================================
# FONCTION: safe_transaction
# Lignes originales: 24-43
# =============================================================================

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


# =============================================================================
# FONCTION: bulk_operation
# Lignes originales: 46-87
# =============================================================================

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


# =============================================================================
# FONCTION: safe_query
# Lignes originales: 90-107
# =============================================================================

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


# =============================================================================
# FONCTION: build_file_filters
# Lignes originales: 116-159
# =============================================================================

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


# =============================================================================
# FONCTION: build_pagination_query
# Lignes originales: 162-174
# =============================================================================

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


# =============================================================================
# FONCTION: validate_file_exists
# Lignes originales: 183-201
# =============================================================================

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
            file = session.query(File).filter(File.id == file_id).first()
            return file is not None
        except Exception as e:
            logger.error(
                f"Erreur lors de la validation du fichier {file_id}: {
                    str(e)}")
            return False


# =============================================================================
# FONCTION: validate_directory_exists
# Lignes originales: 204-226
# =============================================================================

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
            directory = session.query(DirectoryStructure).filter(
                DirectoryStructure.path == directory_path
            ).first()
            return directory is not None
        except Exception as e:
            logger.error(
                f"Erreur lors de la validation du répertoire {directory_path}: {
                    str(e)}")
            return False


# =============================================================================
# FONCTION: get_total_file_count
# Lignes originales: 265-293
# =============================================================================

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

