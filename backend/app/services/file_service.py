"""
File service for DocuSense AI
Handles file operations, scanning, and status management with new workflow
"""

from pathlib import Path
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from datetime import datetime
import mimetypes

from ..models.file import File
from ..schemas.file import FileCreate, FileListResponse, FileResponse
from ..core.file_utils import FileInfoExtractor
from ..core.file_validation import FileValidator
from ..core.status_manager import FileStatus
from ..core.database_utils import DatabaseMetrics
from ..core.cache import cached
from ..core.performance_monitor import performance_monitor
from ..core.database_migration import run_automatic_migrations, check_database_consistency
from .base_service import BaseService, log_service_operation
from ..core.types import ServiceResponse, FileData


class FileService(BaseService):
    """Service for file operations"""

    def __init__(self, db: Session):
        super().__init__(db)
        # Utilisation des formats centralisés depuis FileValidator
        self.supported_formats = [format for formats in FileValidator.get_all_supported_formats().values() for format in formats]
        
        # Exécuter les migrations automatiques au démarrage
        try:
            migration_results = run_automatic_migrations(db)
            if migration_results.get('migrations_applied'):
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                # self.logger.info(f"Migrations automatiques appliquées: {len(migration_results['migrations_applied'])}")
                pass
            if migration_results.get('warnings'):
                for warning in migration_results['warnings']:
                    self.logger.warning(f"Migration: {warning}")
            
            # NOUVEAU: Synchronisation automatique DB ↔ Système de fichiers
            self._synchronize_database_with_filesystem()
            
        except Exception as e:
            self.logger.error(f"Erreur lors des migrations automatiques: {str(e)}")

    # MÉTHODE SUPPRIMÉE: scan_directory() - Remplacée par navigation automatique

    # MÉTHODES SUPPRIMÉES: DirectoryStructure n'est plus utilisé (remplacé par navigation directe)

    def _create_file(self, file_create: FileCreate) -> File:
        """
        Create a new file record with format optimization
        """
        file_data = file_create.dict()
        
        # Optimiser le format pour le navigateur
        if file_data.get('mime_type') and (file_data['mime_type'].startswith('video/') or file_data['mime_type'].startswith('audio/')):
            optimization_result = self.format_optimizer.optimize_format_for_browser(
                Path(file_data['path']), 
                file_data['mime_type']
            )
            
            # Mettre à jour le type MIME si optimisé
            if optimization_result['optimized_mime'] != file_data['mime_type']:
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                # self.logger.info(f"Format optimisé: {file_data['mime_type']} → {optimization_result['optimized_mime']} (support: {optimization_result['browser_support']}%)")
                file_data['mime_type'] = optimization_result['optimized_mime']
            
            # Ajouter les informations d'optimisation aux métadonnées
            if 'analysis_metadata' not in file_data:
                file_data['analysis_metadata'] = {}
            file_data['analysis_metadata']['format_optimization'] = optimization_result
        
        # Convertir les dates ISO en objets datetime si elles existent
        if file_data.get('file_created_at') and isinstance(file_data['file_created_at'], str):
            file_data['file_created_at'] = datetime.fromisoformat(file_data['file_created_at'])
        
        if file_data.get('file_modified_at') and isinstance(file_data['file_modified_at'], str):
            file_data['file_modified_at'] = datetime.fromisoformat(file_data['file_modified_at'])
        
        if file_data.get('file_accessed_at') and isinstance(file_data['file_accessed_at'], str):
            file_data['file_accessed_at'] = datetime.fromisoformat(file_data['file_accessed_at'])
        
        db_file = File(**file_data)
        self.db.add(db_file)
        self.db.flush()  # Use flush instead of commit to keep transaction open
        self.db.refresh(db_file)
        return db_file

    @log_service_operation("get_files")
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
        return self.safe_execute("get_files", self._get_files_logic, directory, status, selected_only, search, limit, offset)

    def _get_files_logic(self, directory: Optional[str], status: Optional[FileStatus], selected_only: bool, search: Optional[str], limit: int, offset: int) -> FileListResponse:
        """Logic for getting files"""
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

        # OPTIMISATION: Suppression des calculs coûteux pour la navigation

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
                is_selected=file.is_selected,
                file_created_at=file.file_created_at,
                file_modified_at=file.file_modified_at,
                file_accessed_at=file.file_accessed_at
            )
            file_responses.append(file_response)

        return FileListResponse(
            files=file_responses,
            total=total,
            limit=limit,
            offset=offset
        )

    def _get_status_counts(self, directory: Optional[str] = None) -> Dict[str, int]:
        """
        Get count of files by status
        """
        return DatabaseMetrics.get_file_count_by_status(self.db, directory)

    @log_service_operation("update_file_status")
    def update_file_status(
        self,
        file_ids: List[int],
        status: FileStatus,
        error_message: Optional[str] = None
    ) -> List[File]:
        """
        Update status of multiple files
        """
        return self.safe_execute("update_file_status", self._update_file_status_logic, file_ids, status, error_message)

    def _update_file_status_logic(self, file_ids: List[int], status: FileStatus, error_message: Optional[str]) -> List[File]:
        """Logic for updating file status"""
        files = self.db.query(File).filter(File.id.in_(file_ids)).all()

        for file in files:
            file.status = status
            if error_message:
                file.error_message = error_message

        self.db.commit()
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # self.logger.info(f"Updated status of {len(files)} files to {status}")
        return files

    @log_service_operation("toggle_file_selection")
    def toggle_file_selection(self, file_id: int) -> File:
        """
        Toggle file selection status
        """
        return self.safe_execute("toggle_file_selection", self._toggle_file_selection_logic, file_id)

    def _toggle_file_selection_logic(self, file_id: int) -> File:
        """Logic for toggling file selection"""
        file = self.db.query(File).filter(File.id == file_id).first()
        if not file:
            raise ValueError(f"File not found: {file_id}")

        file.is_selected = not file.is_selected
        self.db.commit()
        self.db.refresh(file)

        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # self.logger.info(f"Toggled selection for file {file_id}: {file.is_selected}")
        return file

    @log_service_operation("select_all_files")
    def select_all_files(self, directory: Optional[str] = None) -> int:
        """
        Select all files in a directory
        """
        return self.safe_execute("select_all_files", self._select_all_files_logic, directory)

    def _select_all_files_logic(self, directory: Optional[str]) -> int:
        """Logic for selecting all files"""
        query = self.db.query(File)
        if directory:
            query = query.filter(File.parent_directory == directory)

        count = query.update({File.is_selected: True})
        self.db.commit()

        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # self.logger.info(f"Selected {count} files")
        return count

    @log_service_operation("deselect_all_files")
    def deselect_all_files(self, directory: Optional[str] = None) -> int:
        """
        Deselect all files in a directory
        """
        return self.safe_execute("deselect_all_files", self._deselect_all_files_logic, directory)

    def _deselect_all_files_logic(self, directory: Optional[str]) -> int:
        """Logic for deselecting all files"""
        query = self.db.query(File)
        if directory:
            query = query.filter(File.parent_directory == directory)

        count = query.update({File.is_selected: False})
        self.db.commit()

        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # self.logger.info(f"Deselected {count} files")
        return count

    @log_service_operation("get_selected_files")
    def get_selected_files(self) -> List[File]:
        """
        Get all selected files
        """
        return self.safe_execute("get_selected_files", self._get_selected_files_logic)

    def _get_selected_files_logic(self) -> List[File]:
        """Logic for getting selected files"""
        return self.db.query(File).filter(File.is_selected).all()

    @log_service_operation("update_file_analysis_result")
    def update_file_analysis_result(
        self,
        file_id: int,
        extracted_text: Optional[str] = None,
        analysis_result: Optional[str] = None
    ) -> File:
        """
        Update file with analysis results
        """
        return self.safe_execute("update_file_analysis_result", self._update_file_analysis_result_logic, file_id, extracted_text, analysis_result)

    def _update_file_analysis_result_logic(self, file_id: int, extracted_text: Optional[str], analysis_result: Optional[str]) -> File:
        """Logic for updating file analysis result"""
        file = self.db.query(File).filter(File.id == file_id).first()
        if not file:
            raise ValueError(f"File not found: {file_id}")

        if extracted_text is not None:
            file.extracted_text = extracted_text

        if analysis_result is not None:
            file.analysis_result = analysis_result

        self.db.commit()
        self.db.refresh(file)

        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # self.logger.info(f"Updated analysis results for file {file_id}")
        return file

    @log_service_operation("delete_file")
    def delete_file(self, file_id: int) -> bool:
        """
        Delete a file record
        """
        return self.safe_execute("delete_file", self._delete_file_logic, file_id)

    def _delete_file_logic(self, file_id: int) -> bool:
        """Logic for deleting file"""
        file = self.db.query(File).filter(File.id == file_id).first()
        if not file:
            return False

        self.db.delete(file)
        self.db.commit()

        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # self.logger.info(f"Deleted file record {file_id}")
        return True

    @log_service_operation("get_directory_stats")
    def get_directory_stats(self, directory: str) -> Dict[str, Any]:
        """
        Get statistics for a directory
        """
        return self.safe_execute("get_directory_stats", self._get_directory_stats_logic, directory)

    def _get_directory_stats_logic(self, directory: str) -> Dict[str, Any]:
        """Logic for getting directory stats"""
        files = self.db.query(File).filter(File.parent_directory == directory).all()

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

    # === MÉTHODES POUR LA GESTION DES ANALYSES ===

    def get_workflow_stats(self) -> Dict[str, Any]:
        """
        Get statistics for the entire workflow with format optimization stats
        """
        try:
            # Count files by status in database
            status_counts = self.db.query(
                File.status,
                func.count(File.id)
            ).group_by(File.status).all()

            db_stats = {status.value: count for status, count in status_counts}
            total_files = sum(db_stats.values())

            # Statistiques d'optimisation des formats
            format_stats = self.format_optimizer.get_optimization_stats()

            return {
                "database_status": db_stats,
                "workflow_health": "healthy",
                "format_optimization": {
                    "native_formats": format_stats['native_formats'],
                    "extended_formats": format_stats['extended_formats'],
                    "advanced_formats": format_stats['advanced_formats'],
                    "fallback_conversions": format_stats['fallback_conversions'],
                    "total_optimizations": format_stats['total_optimizations'],
                    "optimization_rate": (format_stats['total_optimizations'] / total_files * 100) if total_files > 0 else 0
                }
            }

        except Exception as e:
            self.logger.error(f"Error getting workflow stats: {str(e)}")
            raise

    def get_file_by_id(self, file_id: int) -> Optional[File]:
        """
        Get a file by its ID
        """
        try:
            return self.db.query(File).filter(File.id == file_id).first()
        except Exception as e:
            self.logger.error(f"Error getting file by ID {file_id}: {str(e)}")
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
            self.logger.error(
                f"Error getting analysis result for file {file_id}: {
                    str(e)}")
            return None

    # MÉTHODE SUPPRIMÉE: get_directory_tree() - DirectoryStructure n'est plus utilisé



    def _check_disk_accessibility(self, directory_path: str) -> Dict[str, Any]:
        """
        Vérifie l'accessibilité d'un disque et gère les cas de verrouillage
        
        Args:
            directory_path: Chemin du répertoire à vérifier
            
        Returns:
            Dict avec les informations d'accessibilité
        """
        try:
            directory = Path(directory_path)
            
            # Vérifier si le disque est accessible
            if not directory.exists():
                return {
                    "accessible": False,
                    "error": "DISK_NOT_FOUND",
                    "message": f"Le disque {directory_path} n'existe pas",
                    "retry_after": None
                }
            
            # Essayer de lister le contenu pour vérifier l'accessibilité
            try:
                test_items = list(directory.iterdir())
                return {
                    "accessible": True,
                    "error": None,
                    "message": "Disque accessible",
                    "retry_after": None
                }
            except PermissionError:
                return {
                    "accessible": False,
                    "error": "DISK_LOCKED",
                    "message": f"Le disque {directory_path} est verrouillé ou inaccessible",
                    "retry_after": 30,  # Retry après 30 secondes
                    "user_message": f"Le disque {directory_path} est verrouillé. Veuillez le déverrouiller et réessayer."
                }
            except OSError as e:
                if "device not ready" in str(e).lower() or "not ready" in str(e).lower():
                    return {
                        "accessible": False,
                        "error": "DISK_NOT_READY",
                        "message": f"Le disque {directory_path} n'est pas prêt",
                        "retry_after": 10,  # Retry après 10 secondes
                        "user_message": f"Le disque {directory_path} n'est pas prêt. Veuillez attendre qu'il soit disponible."
                    }
                else:
                    return {
                        "accessible": False,
                        "error": "DISK_ERROR",
                        "message": f"Erreur d'accès au disque {directory_path}: {str(e)}",
                        "retry_after": 60,  # Retry après 1 minute
                        "user_message": f"Erreur d'accès au disque {directory_path}. Veuillez vérifier la connexion."
                    }
                    
        except Exception as e:
            self.logger.error(f"Erreur lors de la vérification d'accessibilité du disque {directory_path}: {e}")
            return {
                "accessible": False,
                "error": "UNKNOWN_ERROR",
                "message": f"Erreur inconnue: {str(e)}",
                "retry_after": 120,  # Retry après 2 minutes
                "user_message": f"Erreur inconnue lors de l'accès au disque {directory_path}"
            }

    # MÉTHODE SUPPRIMÉE: list_directory_content() remplacée par list_directory_content_paginated()

    @cached(ttl=300)  # OPTIMIZATION: Cache de 5 minutes pour la navigation paginée
    def list_directory_content_paginated(
        self, 
        directory_path: str, 
        page: int = 1, 
        page_size: int = 50, 
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        List directory content with pagination - ULTRA-FAST VERSION
        """
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # self.logger.info(f"Starting list_directory_content_paginated for: {directory_path}")
        try:
            # Vérifier l'accessibilité du disque avant de continuer
            disk_status = self._check_disk_accessibility(directory_path)
            if not disk_status["accessible"]:
                self.logger.warning(f"Disque non accessible: {disk_status['message']}")
                return {
                    "success": False,
                    "error": disk_status["error"],
                    "message": disk_status.get("user_message", disk_status["message"]),
                    "retry_after": disk_status["retry_after"],
                    "files": [],
                    "subdirectories": [],
                    "total_files": 0,
                    "total_subdirectories": 0,
                    "page": page,
                    "page_size": page_size,
                    "total_pages": 0
                }
            
            # Valider le répertoire avec la fonction réintégrée
            from ..core.file_validation import FileValidator
            validation_result = FileValidator.validate_directory_path(directory_path)
            if not validation_result.is_valid:
                error_messages = [error.message for error in validation_result.errors]
                raise ValueError("; ".join(error_messages))
            
            directory = Path(directory_path)
            files = []
            subdirectories = []
            total_files = 0
            total_subdirectories = 0

            # Utiliser les fonctions réintégrées pour la gestion des formats
            from ..core.file_validation import FileValidator
            
            # Récupérer les formats supportés
            document_formats = FileValidator.get_supported_formats_for_type('document')
            image_formats = FileValidator.get_supported_formats_for_type('image')
            video_formats = FileValidator.get_supported_formats_for_type('video')
            audio_formats = FileValidator.get_supported_formats_for_type('audio')
            
            all_supported_formats = document_formats + image_formats + video_formats + audio_formats
            
            try:
                # OPTIMISATION: 1 seule requête DB pour tout le répertoire
                db_files_in_directory = self.db.query(File).filter(
                    File.parent_directory == directory_path
                ).all()
                
                # Mapping path → file pour accès O(1)
                db_files_map = {file.path: file for file in db_files_in_directory}
                
                # ULTRA-FAST: Direct filesystem scan
                all_items = list(directory.iterdir())
                
                # Process all items first, then apply pagination to results
                all_files = []
                all_subdirectories = []
                
                for item_path in all_items:
                    try:
                        # Vérifier l'accessibilité de chaque élément individuellement
                        if not item_path.exists():
                            self.logger.warning(f"Élément non accessible: {item_path}")
                            continue
                            
                        if item_path.is_file():
                            total_files += 1
                            item_path_str = str(item_path)
                            
                            # ULTRA-SIMPLE: Add all files without any error checking
                            try:
                                stat = item_path.stat()
                                size = stat.st_size
                            except:
                                size = 0
                            
                            # Check if file format is supported
                            extension = item_path.suffix.lower().lstrip('.')
                            
                            # Utiliser les imports déjà disponibles
                            
                            # Determine if format is supported
                            mime_type, _ = mimetypes.guess_type(str(item_path))
                            if mime_type:
                                is_supported = self.supported_formats and any(format in mime_type for format in self.supported_formats)
                            else:
                                # Fallback pour les extensions sans MIME type
                                is_supported = extension in ['pdf', 'docx', 'doc', 'txt', 'html', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mp3', 'wav']
                            
                            # Get proper MIME type
                            if not mime_type:
                                mime_type = mimetypes.guess_type(str(item_path))[0] or 'application/octet-stream'
                            
                            # Set status based on support
                            status = "none" if is_supported else "unsupported"
                            
                            # VALIDATION AUTOMATIQUE: Vérifier cohérence DB ↔ Système de fichiers
                            existing_file = db_files_map.get(item_path_str)
                            
                            if existing_file:
                                # Fichier existe en DB - vérifier si l'analyse est encore valide
                                if self._is_analysis_still_valid(existing_file, item_path):
                                    status = existing_file.status.value
                                    file_id = existing_file.id
                                else:
                                    # Analyse obsolète - remettre à "none" pour réanalyser
                                    status = "none" if is_supported else "unsupported"
                                    file_id = existing_file.id
                                    # Mettre à jour automatiquement en DB
                                    self._update_file_status_auto(existing_file, status, item_path)
                            else:
                                # Nouveau fichier - créer automatiquement en DB
                                status = "none" if is_supported else "unsupported"
                                file_id = self._create_file_auto(item_path, status, mime_type, size)
                            
                            file_info = {
                                "name": item_path.name,
                                "path": item_path_str,
                                "size": size,
                                "mime_type": mime_type,
                                "status": status,
                                "id": file_id
                            }
                            all_files.append(file_info)
                            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # self.logger.info(f"FileService: Ajouté le fichier: {item_path.name} (ID: {file_info['id']}, Path: {item_path_str})")

                        elif item_path.is_dir():
                            total_subdirectories += 1
                            try:
                                # OPTIMISATION: Suppression du calcul de file_count pour la navigation
                                all_subdirectories.append({
                                    "name": item_path.name,
                                    "path": str(item_path),
                                    "file_count": 0,  # Supprimé pour la performance
                                    "has_permission": True
                                })
                            except PermissionError:
                                all_subdirectories.append({
                                    "name": item_path.name,
                                    "path": str(item_path),
                                    "file_count": 0,
                                    "has_permission": False
                                })
                    except PermissionError:
                        continue
                    except Exception as e:
                        self.logger.warning(f"Error processing {item_path}: {str(e)}")
                        continue

                # Return all files and subdirectories without pagination for now
                files = all_files
                subdirectories = all_subdirectories
                
                # Log des résultats
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # self.logger.info(f"Found {len(all_files)} files and {len(all_subdirectories)} subdirectories in {directory_path}")
                


                return {
                    "directory": directory_path,
                    "files": files,
                    "subdirectories": subdirectories,
                    "total_files": len(files),
                    "total_subdirectories": len(all_subdirectories),
                    "page": page,
                    "page_size": page_size,
                    "total_pages": 1,
                    "has_next": False,
                    "has_previous": False
                }

            except Exception as e:
                self.logger.error(f"Error listing directory content: {str(e)}")
                return {
                    "directory": directory_path,
                    "files": [],
                    "subdirectories": [],
                    "total_files": 0,
                    "total_subdirectories": 0,
                    "page": page,
                    "page_size": page_size,
                    "total_pages": 0,
                    "has_next": False,
                    "has_previous": False,
                    "error": str(e)
                }

        except Exception as e:
            self.logger.error(f"Error listing directory {directory_path}: {str(e)}")
            raise

    def _is_analysis_still_valid(self, db_file: File, file_path: Path) -> bool:
        """
        Vérifie si l'analyse d'un fichier est encore valide
        """
        try:
            # Vérifier la date de modification
            file_mtime = file_path.stat().st_mtime
            db_mtime = db_file.file_modified_at.timestamp() if db_file.file_modified_at else 0
            
            # Si le fichier a été modifié après l'analyse
            if file_mtime > db_mtime:
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # self.logger.info(f"Fichier modifié: {file_path.name} (analyse obsolète)")
                return False
                
            # Vérifier la taille
            if file_path.stat().st_size != db_file.size:
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # self.logger.info(f"Taille modifiée: {file_path.name} (analyse obsolète)")
                return False
                
            return True
        except Exception as e:
            self.logger.warning(f"Erreur validation fichier {file_path}: {str(e)}")
            return False

    def _update_file_status_auto(self, db_file: File, new_status: str, file_path: Path):
        """
        Met à jour automatiquement le statut d'un fichier
        """
        try:
            from ..models.file import FileStatus
            from datetime import datetime
            
            # Mettre à jour le statut
            db_file.status = FileStatus(new_status)
            
            # Mettre à jour les métadonnées du fichier
            stat = file_path.stat()
            db_file.size = stat.st_size
            db_file.file_modified_at = datetime.fromtimestamp(stat.st_mtime)
            db_file.file_accessed_at = datetime.fromtimestamp(stat.st_atime)
            
            # Effacer l'analyse obsolète
            if new_status in ["none", "unsupported"]:
                db_file.extracted_text = None
                db_file.analysis_result = None
                db_file.analysis_metadata = None
                db_file.error_message = None
            
            self.db.commit()
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # self.logger.info(f"Statut mis à jour automatiquement: {file_path.name} -> {new_status}")
            
        except Exception as e:
            self.logger.error(f"Erreur mise à jour automatique {file_path}: {str(e)}")
            self.db.rollback()

    def _create_file_auto(self, file_path: Path, status: str, mime_type: str, size: int) -> Optional[int]:
        """
        Crée automatiquement un fichier en base de données
        """
        try:
            from ..models.file import FileStatus
            from ..schemas.file import FileCreate
            from datetime import datetime
            
            # Extraire les métadonnées du fichier
            stat = file_path.stat()
            
            file_info = {
                "name": file_path.name,
                "path": str(file_path),
                "size": size,
                "mime_type": mime_type,
                "status": FileStatus(status),
                "parent_directory": str(file_path.parent),
                "file_created_at": datetime.fromtimestamp(stat.st_ctime),
                "file_modified_at": datetime.fromtimestamp(stat.st_mtime),
                "file_accessed_at": datetime.fromtimestamp(stat.st_atime)
            }
            
            file_create = FileCreate(**file_info)
            db_file = self._create_file(file_create)
            
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # self.logger.info(f"Fichier créé automatiquement: {file_path.name} (ID: {db_file.id})")
            return db_file.id
            
        except Exception as e:
            self.logger.error(f"Erreur création automatique {file_path}: {str(e)}")
            return None

    def _synchronize_database_with_filesystem(self):
        """
        Synchronise automatiquement la base de données avec le système de fichiers
        au démarrage de l'application
        """
        try:
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # self.logger.info("🔄 Synchronisation automatique DB ↔ Système de fichiers")
            
            # Récupérer tous les fichiers en base
            all_db_files = self.db.query(File).all()
            
            updated_count = 0
            deleted_count = 0
            
            for db_file in all_db_files:
                file_path = Path(db_file.path)
                
                if file_path.exists():
                    # Fichier existe - vérifier s'il a été modifié
                    if not self._is_analysis_still_valid(db_file, file_path):
                        # Mettre à jour automatiquement
                        self._update_file_status_auto(db_file, "none", file_path)
                        updated_count += 1
                else:
                    # Fichier n'existe plus - le supprimer
                    self.db.delete(db_file)
                    deleted_count += 1
            
            if updated_count > 0 or deleted_count > 0:
                self.db.commit()
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                # self.logger.info(f"✅ Synchronisation terminée: {updated_count} mis à jour, {deleted_count} supprimés")
            else:
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                # self.logger.info("✅ Base de données déjà synchronisée")
                pass
                
        except Exception as e:
            self.logger.error(f"Erreur synchronisation automatique: {str(e)}")
            self.db.rollback()

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
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                # self.logger.info(f"Nettoyé {orphaned_count} fichiers orphelins dans {directory_path}")

            return orphaned_count

        except Exception as e:
            self.logger.error(
                f"Erreur lors du nettoyage des fichiers orphelins: {
                    str(e)}")
            return 0

    # MÉTHODE SUPPRIMÉE: _build_directory_tree() - DirectoryStructure n'est plus utilisé


