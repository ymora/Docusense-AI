# -*- coding: utf-8 -*-

# CODE MORT EXTRAIT DE: backend/app/core/file_utils.py
# Fonctions extraites: 7
# Lignes totales extraites: 207
# Date d'extraction: 2025-08-11 01:32:24

# =============================================================================
# FONCTIONS MORTES EXTRAITES
# =============================================================================


# =============================================================================
# FONCTION: extract_file_info
# Lignes originales: 24-85
# =============================================================================

    def extract_file_info(file_path: Path) -> Optional[Dict[str, Any]]:
        """
        Extrait les informations d'un fichier

        Args:
            file_path: Chemin du fichier

        Returns:
            Dict: Informations du fichier ou None si erreur
        """
        try:
            # Vérifier que le fichier existe
            if not file_path.exists():
                logger.warning(f"Fichier inexistant: {file_path}")
                return None

            # Extraire l'extension
            extension = file_path.suffix.lower().lstrip('.')

            # Vérifier si le format est supporté
            # Utiliser FileValidator pour vérifier si le format est supporté
            from .file_validation import FileValidator
            mime_type, _ = mimetypes.guess_type(str(file_path))
            if mime_type and not FileValidator.is_format_supported(mime_type):
                return None

            # Obtenir les statistiques du fichier
            stat = file_path.stat()

            # Déterminer le type MIME
            mime_type = FileInfoExtractor._get_mime_type(file_path, extension)

            # Obtenir la catégorie du format
            # Utiliser FileValidator pour obtenir la catégorie
            if mime_type:
                file_type = FileValidator.get_file_type(mime_type)
                format_category = file_type
            else:
                format_category = None

            file_info = {
                "name": file_path.name,
                "path": str(file_path),
                "size": stat.st_size,
                "mime_type": mime_type,
                "extension": extension,
                "format_category": format_category,
                "parent_directory": str(file_path.parent),
                "is_supported": True,
                # Ajout des dates de création et modification du fichier
                "file_created_at": datetime.fromtimestamp(stat.st_ctime).isoformat() if hasattr(stat, 'st_ctime') else None,
                "file_modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat() if hasattr(stat, 'st_mtime') else None,
                "file_accessed_at": datetime.fromtimestamp(stat.st_atime).isoformat() if hasattr(stat, 'st_atime') else None
            }

            return file_info

        except Exception as e:
            logger.error(
                f"Erreur lors de l'extraction d'informations pour {file_path}: {
                    str(e)}")
            return None


# =============================================================================
# FONCTION: extract_unsupported_file_info
# Lignes originales: 88-126
# =============================================================================

    def extract_unsupported_file_info(file_path: Path) -> Dict[str, Any]:
        """
        Extrait les informations d'un fichier non supporté

        Args:
            file_path: Chemin du fichier

        Returns:
            Dict: Informations du fichier non supporté
        """
        try:
            extension = file_path.suffix.lower().lstrip('.')
            stat = file_path.stat() if file_path.exists() else None

            return {
                "name": file_path.name,
                "path": str(file_path),
                "size": stat.st_size if stat else 0,
                "mime_type": "unknown",
                "extension": extension,
                "format_category": None,
                "parent_directory": str(file_path.parent),
                "is_supported": False
            }

        except Exception as e:
            logger.error(
                f"Erreur lors de l'extraction d'informations pour fichier non supporté {file_path}: {
                    str(e)}")
            return {
                "name": file_path.name,
                "path": str(file_path),
                "size": 0,
                "mime_type": "unknown",
                "extension": file_path.suffix.lower().lstrip('.'),
                "format_category": None,
                "parent_directory": str(file_path.parent),
                "is_supported": False
            }


# =============================================================================
# FONCTION: get_browser_optimized_mime_type
# Lignes originales: 309-339
# =============================================================================

    def get_browser_optimized_mime_type(original_mime: str, extension: str) -> str:
        """
        Optimise le type MIME pour une meilleure compatibilité navigateur

        Args:
            original_mime: Type MIME original
            extension: Extension du fichier

        Returns:
            str: Type MIME optimisé
        """
        # Mapping d'optimisation pour formats problématiques
        optimization_mapping = {
            # Formats vidéo avec codecs explicites
            'video/mp4': 'video/mp4; codecs="avc1.42E01E"',
            'video/webm': 'video/webm; codecs="vp8, vorbis"',
            'video/ogg': 'video/ogg; codecs="theora, vorbis"',
            
            # Formats audio avec codecs explicites
            'audio/mp4': 'audio/mp4; codecs="mp4a.40.2"',
            'audio/aac': 'audio/aac',
            'audio/ogg': 'audio/ogg; codecs="vorbis"',
            
            # Formats HLS/DASH
            'application/x-mpegURL': 'application/x-mpegURL',
            'application/vnd.apple.mpegurl': 'application/vnd.apple.mpegurl',
            'application/dash+xml': 'application/dash+xml',
        }

        # Retourner le type optimisé s'il existe
        return optimization_mapping.get(original_mime, original_mime)


# =============================================================================
# FONCTION: extract_directory_info
# Lignes originales: 348-379
# =============================================================================

    def extract_directory_info(dir_path: Path) -> Optional[Dict[str, Any]]:
        """
        Extrait les informations d'un répertoire

        Args:
            dir_path: Chemin du répertoire

        Returns:
            Dict: Informations du répertoire ou None si erreur
        """
        try:

            # Gérer le cas du répertoire racine
            parent_path = None
            if dir_path.parent != dir_path:
                parent_path = str(dir_path.parent)

            dir_info = {
                "name": dir_path.name,
                "path": str(dir_path),
                "parent_path": parent_path,
                "is_directory": True,
                "file_count": 0  # Sera mis à jour plus tard
            }

            return dir_info

        except Exception as e:
            logger.error(
                f"Erreur lors de l'extraction d'informations pour le répertoire {dir_path}: {
                    str(e)}")
            return None


# =============================================================================
# FONCTION: normalize_path
# Lignes originales: 388-398
# =============================================================================

    def normalize_path(path: str) -> Path:
        """
        Normalise un chemin de fichier

        Args:
            path: Chemin à normaliser

        Returns:
            Path: Chemin normalisé
        """
        return Path(path).resolve()


# =============================================================================
# FONCTION: is_subdirectory
# Lignes originales: 401-417
# =============================================================================

    def is_subdirectory(parent: Path, child: Path) -> bool:
        """
        Vérifie si un répertoire est un sous-répertoire d'un autre

        Args:
            parent: Répertoire parent
            child: Répertoire enfant

        Returns:
            bool: True si child est un sous-répertoire de parent
        """
        try:
            parent = parent.resolve()
            child = child.resolve()
            return parent in child.parents
        except Exception:
            return False


# =============================================================================
# FONCTION: get_relative_path
# Lignes originales: 420-434
# =============================================================================

    def get_relative_path(base: Path, target: Path) -> str:
        """
        Obtient le chemin relatif d'un fichier par rapport à une base

        Args:
            base: Chemin de base
            target: Chemin cible

        Returns:
            str: Chemin relatif
        """
        try:
            return str(target.relative_to(base))
        except ValueError:
            return str(target)

