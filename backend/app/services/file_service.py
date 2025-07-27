"""
File service for DocuSense AI
Handles file operations, scanning, and status management with new workflow
"""

from pathlib import Path
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
import logging

from ..models.file import File, FileCreate, FileListResponse, DirectoryStructure, DirectoryTreeResponse, FileResponse
from ..core.file_utils import FileFormatManager, FileInfoExtractor, DirectoryInfoExtractor
from ..core.status_manager import FileStatus
from ..core.database_utils import DatabaseMetrics

logger = logging.getLogger(__name__)


class FileService:
    """Service for file operations"""

    def __init__(self, db: Session):
        self.db = db
        # Utilisation des formats centralisés depuis FileFormatManager
        self.supported_formats = FileFormatManager.get_supported_formats()

    def scan_directory(self, directory_path: str) -> Dict[str, Any]:
        """
        Scan a directory and create virtual mirror of structure
        """
        try:
            logger.info(
                f"=== Starting scan_directory for: {directory_path} ===")
            directory = Path(directory_path)
            logger.info(f"Directory Path object: {directory}")
            logger.info(f"Directory exists: {directory.exists()}")
            logger.info(f"Directory is_dir: {directory.is_dir()}")

            if not directory.exists() or not directory.is_dir():
                raise ValueError(f"Directory does not exist: {directory_path}")

            logger.info(
                f"Directory {directory_path} not in database, scanning...")

            # Clear existing directory structure for this root
            self._clear_directory_structure(directory_path)

            files = []
            directories = []

            # Create root directory entry first
            logger.info(
                f"About to call DirectoryInfoExtractor for root: {directory}")
            root_dir_info = DirectoryInfoExtractor.extract_directory_info(
                directory)
            logger.info(f"Root dir info result: {root_dir_info}")

            if root_dir_info:
                logger.info(
                    f"Creating root directory structure: {root_dir_info}")
                root_dir = self._create_directory_structure(root_dir_info)
                directories.append(root_dir)
                logger.info(f"Created root directory: {root_dir}")
            else:
                logger.error(
                    f"Failed to get directory info for root: {directory}")

            # Scan all files and directories with error handling
            try:
                for item_path in directory.rglob("*"):
                    try:
                        if item_path.is_file():
                            # Utilisation de FileInfoExtractor centralisé
                            file_info = FileInfoExtractor.extract_file_info(
                                item_path)
                            if file_info:
                                # Check if file already exists in database
                                existing_file = self.db.query(File).filter(
                                    File.path == str(item_path)).first()
                                if not existing_file:
                                    file_create = FileCreate(**file_info)
                                    db_file = self._create_file(file_create)
                                    files.append(db_file)
                                else:
                                    files.append(existing_file)

                        elif item_path.is_dir():
                            # Utilisation de DirectoryInfoExtractor centralisé
                            dir_info = DirectoryInfoExtractor.extract_directory_info(
                                item_path)
                            if dir_info:
                                db_dir = self._create_directory_structure(
                                    dir_info)
                                directories.append(db_dir)
                    except PermissionError:
                        # Skip files/directories without permission
                        continue
                    except Exception as e:
                        logger.warning(
                            f"Error processing {item_path}: {
                                str(e)}")
                        continue

                # Update file counts for directories
                self._update_directory_file_counts(directory_path)

                self.db.commit()
                logger.info(
                    f"Scanned directory {directory_path}: found {
                        len(files)} files and {
                        len(directories)} directories")

                return {
                    "files": files,
                    "directories": directories,
                    "total_files": len(files),
                    "total_directories": len(directories)
                }

            except Exception:
                logger.error(
                    f"Failed to create directory structure for {directory_path}")
                self.db.rollback()
                # Return empty result instead of raising
                return {
                    "files": [],
                    "directories": [],
                    "total_files": 0,
                    "total_directories": 0
                }

        except Exception as e:
            logger.error(
                f"Error scanning directory {directory_path}: {
                    str(e)}")
            self.db.rollback()
            raise

    # Méthodes supprimées car centralisées dans les modules core
    # _get_file_info() → FileInfoExtractor.extract_file_info()
    # _is_format_supported() → FileFormatManager.is_format_supported()
    # _get_directory_info() → DirectoryInfoExtractor.extract_directory_info()

    def _create_directory_structure(
            self, dir_info: Dict[str, Any]) -> DirectoryStructure:
        """
        Create a directory structure entry
        """
        try:
            # Check if directory already exists
            existing_dir = self.db.query(DirectoryStructure).filter(
                DirectoryStructure.path == dir_info["path"]
            ).first()

            if existing_dir:
                return existing_dir

            db_dir = DirectoryStructure(**dir_info)
            self.db.add(db_dir)
            self.db.flush()  # Get the ID
            return db_dir

        except Exception as e:
            logger.error(f"Error creating directory structure: {str(e)}")
            raise

    def _clear_directory_structure(self, root_path: str):
        """
        Clear existing directory structure for a root path
        """
        try:
            # Delete all directory structures that start with this root path
            self.db.query(DirectoryStructure).filter(
                DirectoryStructure.path.startswith(root_path)
            ).delete()

            # Also clear files from this root
            self.db.query(File).filter(
                File.path.startswith(root_path)
            ).delete()

        except Exception as e:
            logger.error(f"Error clearing directory structure: {str(e)}")
            raise

    def _update_directory_file_counts(self, root_path: str):
        """
        Update file counts for all directories
        """
        try:
            # Get all directories for this root
            directories = self.db.query(DirectoryStructure).filter(
                DirectoryStructure.path.startswith(root_path)
            ).all()

            for directory in directories:
                # Count files in this directory
                file_count = self.db.query(File).filter(
                    File.parent_directory == directory.path
                ).count()

                directory.file_count = file_count

        except Exception as e:
            logger.error(f"Error updating directory file counts: {str(e)}")
            raise

    def _create_file(self, file_create: FileCreate) -> File:
        """
        Create a new file record
        """
        db_file = File(**file_create.dict())
        self.db.add(db_file)
        self.db.flush()  # Use flush instead of commit to keep transaction open
        self.db.refresh(db_file)
        return db_file

    def get_files(
        self,
        directory: Optional[str] = None,
        status: Optional[FileStatus] = None,
        selected_only: bool = False,
        search: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> FileListResponse:
        """
        Get files with filtering and pagination
        """
        query = self.db.query(File)

        # Apply filters
        if directory:
            query = query.filter(File.parent_directory == directory)

        if status:
            query = query.filter(File.status == status)

        if selected_only:
            query = query.filter(File.is_selected)

        if search:
            search_filter = or_(
                File.name.ilike(f"%{search}%"),
                File.path.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)

        # Get total count
        total = query.count()

        # Apply pagination
        files = query.offset(offset).limit(limit).all()

        # Get status counts
        self._get_status_counts(directory)

        # Get selected count
        self.db.query(File).filter(File.is_selected).count()

        # Convert SQLAlchemy objects to Pydantic models
        file_responses = []
        for file in files:
            file_response = FileResponse(
                id=file.id,
                name=file.name,
                path=file.path,
                size=file.size,
                mime_type=file.mime_type,
                status=file.status,
                parent_directory=file.parent_directory,
                created_at=file.created_at,
                updated_at=file.updated_at,
                extracted_text=file.extracted_text,
                analysis_result=file.analysis_result,
                analysis_metadata=file.analysis_metadata,
                error_message=file.error_message,
                is_selected=file.is_selected
            )
            file_responses.append(file_response)

        return FileListResponse(
            files=file_responses,
            total=total,
            limit=limit,
            offset=offset
        )

    def _get_status_counts(
            self, directory: Optional[str] = None) -> Dict[str, int]:
        """
        Get count of files by status
        """
        return DatabaseMetrics.get_file_count_by_status(self.db, directory)

    def update_file_status(
        self,
        file_ids: List[int],
        status: FileStatus,
        error_message: Optional[str] = None
    ) -> List[File]:
        """
        Update status of multiple files
        """
        try:
            files = self.db.query(File).filter(File.id.in_(file_ids)).all()

            for file in files:
                file.status = status
                if error_message:
                    file.error_message = error_message

            self.db.commit()
            logger.info(f"Updated status of {len(files)} files to {status}")
            return files

        except Exception as e:
            logger.error(f"Error updating file status: {str(e)}")
            self.db.rollback()
            raise

    def toggle_file_selection(self, file_id: int) -> File:
        """
        Toggle file selection status
        """
        try:
            file = self.db.query(File).filter(File.id == file_id).first()
            if not file:
                raise ValueError(f"File not found: {file_id}")

            file.is_selected = not file.is_selected
            self.db.commit()
            self.db.refresh(file)

            logger.info(
                f"Toggled selection for file {file_id}: {
                    file.is_selected}")
            return file

        except Exception as e:
            logger.error(f"Error toggling file selection: {str(e)}")
            self.db.rollback()
            raise

    def select_all_files(self, directory: Optional[str] = None) -> int:
        """
        Select all files in a directory
        """
        try:
            query = self.db.query(File)
            if directory:
                query = query.filter(File.parent_directory == directory)

            count = query.update({File.is_selected: True})
            self.db.commit()

            logger.info(f"Selected {count} files")
            return count

        except Exception as e:
            logger.error(f"Error selecting all files: {str(e)}")
            self.db.rollback()
            raise

    def deselect_all_files(self, directory: Optional[str] = None) -> int:
        """
        Deselect all files in a directory
        """
        try:
            query = self.db.query(File)
            if directory:
                query = query.filter(File.parent_directory == directory)

            count = query.update({File.is_selected: False})
            self.db.commit()

            logger.info(f"Deselected {count} files")
            return count

        except Exception as e:
            logger.error(f"Error deselecting all files: {str(e)}")
            self.db.rollback()
            raise

    def get_selected_files(self) -> List[File]:
        """
        Get all selected files
        """
        return self.db.query(File).filter(File.is_selected).all()

    def update_file_analysis_result(
        self,
        file_id: int,
        extracted_text: Optional[str] = None,
        analysis_result: Optional[str] = None
    ) -> File:
        """
        Update file with analysis results
        """
        try:
            file = self.db.query(File).filter(File.id == file_id).first()
            if not file:
                raise ValueError(f"File not found: {file_id}")

            if extracted_text is not None:
                file.extracted_text = extracted_text

            if analysis_result is not None:
                file.analysis_result = analysis_result

            self.db.commit()
            self.db.refresh(file)

            logger.info(f"Updated analysis results for file {file_id}")
            return file

        except Exception as e:
            logger.error(f"Error updating file analysis result: {str(e)}")
            self.db.rollback()
            raise

    def delete_file(self, file_id: int) -> bool:
        """
        Delete a file record
        """
        try:
            file = self.db.query(File).filter(File.id == file_id).first()
            if not file:
                return False

            self.db.delete(file)
            self.db.commit()

            logger.info(f"Deleted file record {file_id}")
            return True

        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
            self.db.rollback()
            raise

    def get_directory_stats(self, directory: str) -> Dict[str, Any]:
        """
        Get statistics for a directory
        """
        try:
            files = self.db.query(File).filter(
                File.parent_directory == directory).all()

            total_files = len(files)
            total_size = sum(f.size for f in files)
            status_counts = self._get_status_counts(directory)
            selected_count = sum(1 for f in files if f.is_selected)

            return {
                "directory": directory,
                "total_files": total_files,
                "total_size": total_size,
                "status_counts": status_counts,
                "selected_count": selected_count,
                "supported_formats": self.supported_formats
            }

        except Exception as e:
            logger.error(f"Error getting directory stats: {str(e)}")
            raise

    # === MÉTHODES POUR LA GESTION DES ANALYSES ===

    def get_workflow_stats(self) -> Dict[str, Any]:
        """
        Get statistics for the entire workflow
        """
        try:
            # Count files by status in database
            status_counts = self.db.query(
                File.status,
                func.count(File.id)
            ).group_by(File.status).all()

            db_stats = {status.value: count for status, count in status_counts}

            return {
                "database_status": db_stats,
                "workflow_health": "healthy"
            }

        except Exception as e:
            logger.error(f"Error getting workflow stats: {str(e)}")
            raise

    def get_file_by_id(self, file_id: int) -> Optional[File]:
        """
        Get a file by its ID
        """
        try:
            return self.db.query(File).filter(File.id == file_id).first()
        except Exception as e:
            logger.error(f"Error getting file by ID {file_id}: {str(e)}")
            return None

    def get_file_analysis_result(
            self, file_id: int) -> Optional[Dict[str, Any]]:
        """
        Get analysis result for a specific file from database
        """
        try:
            file = self.db.query(File).filter(File.id == file_id).first()
            if not file:
                return None

            # Get the latest analysis for this file
            from ..models.analysis import Analysis
            analysis = self.db.query(Analysis).filter(
                Analysis.file_id == file_id
            ).order_by(Analysis.created_at.desc()).first()

            if not analysis:
                return None

            return {
                "file_id": file.id,
                "file_name": file.name,
                "file_status": file.status.value,
                "extracted_text": file.extracted_text,
                "analysis_result": analysis.result,
                "analysis_type": analysis.analysis_type,
                "confidence": analysis.confidence,
                "processing_time": analysis.processing_time,
                "created_at": analysis.created_at.isoformat(),
                "updated_at": analysis.updated_at.isoformat() if analysis.updated_at else None,
                "error_message": analysis.error_message}

        except Exception as e:
            logger.error(
                f"Error getting analysis result for file {file_id}: {
                    str(e)}")
            return None

    def get_directory_tree(self, root_path: str) -> DirectoryTreeResponse:
        """
        Get complete directory tree structure from database
        """
        try:
            # Check if directory exists in filesystem
            directory = Path(root_path)
            if not directory.exists() or not directory.is_dir():
                logger.error(f"Directory does not exist: {root_path}")
                return None

            # Get root directory from database or create it
            root_dir = self.db.query(DirectoryStructure).filter(
                DirectoryStructure.path == root_path
            ).first()

            logger.info(
                f"Looking for directory structure with path: {root_path}")
            logger.info(f"Found root_dir: {root_dir}")

            if not root_dir:
                # Directory not in database, scan it first
                logger.info(
                    f"Directory {root_path} not in database, scanning...")
                self.scan_directory(root_path)
                root_dir = self.db.query(DirectoryStructure).filter(
                    DirectoryStructure.path == root_path
                ).first()
                logger.info(f"After scan, found root_dir: {root_dir}")

            if not root_dir:
                logger.error(
                    f"Failed to create directory structure for {root_path}")
                return None

            return self._build_directory_tree(root_dir)

        except Exception as e:
            logger.error(f"Error getting directory tree: {str(e)}")
            return None



    def list_directory_content(self, directory_path: str) -> Dict[str, Any]:
        """
        List immediate content of a directory (files and subdirectories) without scanning
        """
        try:
            directory = Path(directory_path)
            if not directory.exists() or not directory.is_dir():
                raise ValueError(f"Directory does not exist: {directory_path}")

            files = []
            subdirectories = []

            try:
                # List immediate content only
                for item_path in directory.iterdir():
                    try:
                        if item_path.is_file():
                            # Vérifier si le fichier existe dans la base de
                            # données
                            db_file = self.db.query(File).filter(
                                File.path == str(item_path)).first()

                            # Vérifier si le fichier est supporté
                            extension = item_path.suffix.lower().lstrip('.')
                            is_supported = FileFormatManager.is_format_supported(
                                extension)

                            if is_supported:
                                # Fichier supporté
                                file_info = FileInfoExtractor.extract_file_info(
                                    item_path)
                                if file_info:
                                    # Si le fichier n'existe pas dans la DB
                                    # mais est supporté, l'ajouter
                                    # automatiquement
                                    if not db_file:
                                        try:
                                            logger.info(
                                                f"Tentative d'auto-ajout pour: {item_path.name}")
                                            file_create = FileCreate(
                                                **file_info)
                                            db_file = self._create_file(
                                                file_create)
                                            logger.info(
                                                f"✅ Auto-ajouté le fichier supporté: {item_path.name} (ID: {db_file.id})")
                                        except Exception as e:
                                            logger.warning(
                                                f"❌ Erreur lors de l'auto-ajout de {item_path.name}: {str(e)}")
                                            db_file = None
                                    else:
                                        # Fichier déjà en base de données
                                        pass

                                    # Ajouter le fichier supporté
                                    files.append({
                                        "name": item_path.name,
                                        "path": str(item_path),
                                        "size": file_info["size"],
                                        "mime_type": file_info["mime_type"],
                                        "status": db_file.status.value if db_file else "pending",
                                        "id": db_file.id if db_file else None
                                    })
                            else:
                                # Fichier non supporté
                                unsupported_info = FileInfoExtractor.extract_unsupported_file_info(
                                    item_path)

                                files.append({
                                    "name": unsupported_info["name"],
                                    "path": unsupported_info["path"],
                                    "size": unsupported_info["size"],
                                    "mime_type": unsupported_info["mime_type"],
                                    "status": "unsupported",
                                    "id": None
                                })

                        elif item_path.is_dir():
                            try:
                                # Count files in subdirectory
                                file_count = len(
                                    [f for f in item_path.iterdir() if f.is_file()])
                                subdirectories.append({
                                    "name": item_path.name,
                                    "path": str(item_path),
                                    "file_count": file_count,
                                    "has_permission": True
                                })
                            except PermissionError:
                                subdirectories.append({
                                    "name": item_path.name,
                                    "path": str(item_path),
                                    "file_count": 0,
                                    "has_permission": False
                                })
                    except PermissionError:
                        # Skip items without permission
                        continue
                    except Exception as e:
                        logger.warning(
                            f"Error processing {item_path}: {
                                str(e)}")
                        continue

                return {
                    "directory": directory_path,
                    "files": files,
                    "subdirectories": subdirectories,
                    "total_files": len(files),
                    "total_subdirectories": len(subdirectories)
                }

            except Exception as e:
                logger.error(f"Error listing directory content: {str(e)}")
                return {
                    "directory": directory_path,
                    "files": [],
                    "subdirectories": [],
                    "total_files": 0,
                    "total_subdirectories": 0,
                    "error": str(e)
                }

        except Exception as e:
            logger.error(f"Error listing directory {directory_path}: {str(e)}")
            raise

    def cleanup_orphaned_files(self, directory_path: str) -> int:
        """
        Nettoyer les fichiers orphelins (qui n'existent plus sur le disque)
        """
        try:
            directory = Path(directory_path)
            if not directory.exists():
                return 0

            # Récupérer tous les fichiers de la base de données pour ce
            # répertoire
            db_files = self.db.query(File).filter(
                File.parent_directory.like(f"{directory_path}%")
            ).all()

            orphaned_count = 0
            for db_file in db_files:
                file_path = Path(db_file.path)
                if not file_path.exists():
                    # Le fichier n'existe plus sur le disque
                    self.db.delete(db_file)
                    orphaned_count += 1

            if orphaned_count > 0:
                self.db.commit()
                logger.info(
                    f"Nettoyé {orphaned_count} fichiers orphelins dans {directory_path}")

            return orphaned_count

        except Exception as e:
            logger.error(
                f"Erreur lors du nettoyage des fichiers orphelins: {
                    str(e)}")
            return 0

    def _build_directory_tree(
            self,
            directory: DirectoryStructure) -> DirectoryTreeResponse:
        """
        Recursively build directory tree from database
        """
        try:
            # Get child directories
            child_dirs = self.db.query(DirectoryStructure).filter(
                DirectoryStructure.parent_path == directory.path
            ).all()
            folder_count = len(child_dirs)

            # Get files in this directory
            files = self.db.query(File).filter(
                File.parent_directory == directory.path
            ).all()
            file_count = len(files)

            # Convert files to response format
            file_responses = []
            for file in files:
                file_response = FileResponse(
                    id=file.id,
                    name=file.name,
                    path=file.path,
                    size=file.size,
                    mime_type=file.mime_type,
                    status=file.status,
                    created_at=file.created_at,
                    updated_at=file.updated_at,
                    extracted_text=file.extracted_text,
                    analysis_result=file.analysis_result,
                    error_message=file.error_message,
                    is_selected=file.is_selected,
                    parent_directory=file.parent_directory
                )
                file_responses.append(file_response)

            # Recursively build child trees
            child_trees = []
            for child_dir in child_dirs:
                child_tree = self._build_directory_tree(child_dir)
                if child_tree:
                    child_trees.append(child_tree)

            return DirectoryTreeResponse(
                name=directory.name,
                path=directory.path,
                is_directory=directory.is_directory,
                file_count=file_count,
                folder_count=folder_count,
                children=child_trees,
                files=file_responses
            )

        except Exception as e:
            logger.error(f"Error building directory tree: {str(e)}")
            return None


