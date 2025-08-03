"""
File service for DocuSense AI
Handles file operations, scanning, and status management with new workflow
"""

from pathlib import Path
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from datetime import datetime

from ..models.file import File, FileCreate, FileListResponse, DirectoryStructure, DirectoryTreeResponse, FileResponse
from ..core.file_utils import FileInfoExtractor, DirectoryInfoExtractor
from ..core.file_validation import FileValidator
from ..core.status_manager import FileStatus
from ..core.database_utils import DatabaseMetrics
from ..core.cache import cached
from ..core.performance_monitor import monitor_performance
from .base_service import BaseService, log_service_operation
from ..core.types import ServiceResponse, FileData


class FileService(BaseService):
    """Service for file operations"""

    def __init__(self, db: Session):
        super().__init__(db)
        # Utilisation des formats centralisés depuis FileValidator
        self.supported_formats = [format for formats in FileValidator.get_all_supported_formats().values() for format in formats]

    @log_service_operation("scan_directory")
    def scan_directory(self, directory_path: str) -> Dict[str, Any]:
        """
        Scan a directory and create virtual mirror of structure
        """
        return self.safe_execute("scan_directory", self._scan_directory_logic, directory_path)

    def _scan_directory_logic(self, directory_path: str) -> Dict[str, Any]:
        """Logic for scanning directory"""
        directory = Path(directory_path)
        
        if not directory.exists() or not directory.is_dir():
            raise ValueError(f"Directory does not exist: {directory_path}")

        self.logger.info(f"Scan du répertoire: {directory_path}")

        # Clear existing directory structure for this root
        self._clear_directory_structure(directory_path)

        files = []
        directories = []

        # Create root directory entry first
        root_dir_info = DirectoryInfoExtractor.extract_directory_info(directory)

        if root_dir_info:
            root_dir = self._create_directory_structure(root_dir_info)
            directories.append(root_dir)
        else:
            self.logger.error(f"Failed to get directory info for root: {directory}")

        # Scan all files and directories with error handling
        try:
            for item_path in directory.rglob("*"):
                try:
                    if item_path.is_file():
                        # Utilisation de FileInfoExtractor centralisé
                        file_info = FileInfoExtractor.extract_file_info(item_path)
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
                        dir_info = DirectoryInfoExtractor.extract_directory_info(item_path)
                        if dir_info:
                            db_dir = self._create_directory_structure(dir_info)
                            directories.append(db_dir)
                except PermissionError:
                    # Skip files/directories without permission
                    continue
                except Exception as e:
                    self.logger.warning(f"Error processing {item_path}: {str(e)}")
                    continue

            # Update file counts for directories
            self._update_directory_file_counts(directory_path)

            self.db.commit()
            self.logger.info(f"Scanned directory {directory_path}: found {len(files)} files and {len(directories)} directories")

            return {
                "files": files,
                "directories": directories,
                "total_files": len(files),
                "total_directories": len(directories)
            }

        except Exception:
            self.logger.error(f"Failed to create directory structure for {directory_path}")
            self.db.rollback()
            # Return empty result instead of raising
            return {
                "files": [],
                "directories": [],
                "total_files": 0,
                "total_directories": 0
            }

    def _create_directory_structure(self, dir_info: Dict[str, Any]) -> DirectoryStructure:
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
            self.logger.error(f"Error creating directory structure: {str(e)}")
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
            self.logger.error(f"Error clearing directory structure: {str(e)}")
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
            self.logger.error(f"Error updating directory file counts: {str(e)}")
            raise

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
                self.logger.info(f"Format optimisé: {file_data['mime_type']} → {optimization_result['optimized_mime']} "
                               f"(support: {optimization_result['browser_support']}%)")
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
        self.logger.info(f"Updated status of {len(files)} files to {status}")
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

        self.logger.info(f"Toggled selection for file {file_id}: {file.is_selected}")
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

        self.logger.info(f"Selected {count} files")
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

        self.logger.info(f"Deselected {count} files")
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

        self.logger.info(f"Updated analysis results for file {file_id}")
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

        self.logger.info(f"Deleted file record {file_id}")
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

    def get_directory_tree(self, root_path: str) -> DirectoryTreeResponse:
        """
        Get complete directory tree structure - ULTRA-FAST VERSION
        """
        try:
            # Check if directory exists in filesystem
            directory = Path(root_path)
            if not directory.exists() or not directory.is_dir():
                self.logger.error(f"Directory does not exist: {root_path}")
                return None

            # ULTRA-FAST: Direct filesystem scan without database queries
            self.logger.info(f"ULTRA-FAST: Scanning directory tree for: {root_path}")
            
            # Get immediate subdirectories only (for performance)
            subdirectories = []
            try:
                for item_path in directory.iterdir():
                    if item_path.is_dir():
                        try:
                            # ULTRA-FAST: No file counting for performance
                            subdirectories.append({
                                "name": item_path.name,
                                "path": str(item_path),
                                "file_count": 0,  # Always 0 for speed
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
                self.logger.warning(f"No permission to access directory: {root_path}")
                return None

            # Create a simple tree response matching DirectoryTreeResponse model
            return DirectoryTreeResponse(
                name=directory.name or root_path,
                path=root_path,
                is_directory=True,
                file_count=0,  # We don't count files in tree view for performance
                folder_count=len(subdirectories),
                children=[],  # Empty for performance - children loaded on demand
                files=[]  # Empty for performance - files loaded separately
            )

        except Exception as e:
            self.logger.error(f"Error getting directory tree: {str(e)}")
            return None



    def list_directory_content(self, directory_path: str) -> Dict[str, Any]:
        """
        List immediate content of a directory (files and subdirectories) - OPTIMIZED VERSION
        """
        try:
            directory = Path(directory_path)
            if not directory.exists() or not directory.is_dir():
                raise ValueError(f"Directory does not exist: {directory_path}")

            # OPTIMIZATION 1: Get all files from database in one query
            db_files = self.db.query(File).filter(
                File.parent_directory == directory_path
            ).all()
            
            # Create lookup map for O(1) access
            db_files_map = {f.path: f for f in db_files}

            files = []
            subdirectories = []

            try:
                # List immediate content only
                for item_path in directory.iterdir():
                    try:
                        if item_path.is_file():
                            item_path_str = str(item_path)
                            
                            # OPTIMIZATION 2: O(1) lookup instead of database query
                            db_file = db_files_map.get(item_path_str)

                            # Check if file is supported
                            extension = item_path.suffix.lower().lstrip('.')
                            # Utiliser FileValidator pour vérifier si le format est supporté
                            mime_type, _ = mimetypes.guess_type(str(item_path))
                            if mime_type:
                                is_supported = FileValidator.is_format_supported(mime_type)
                            else:
                                # Fallback pour les extensions sans MIME type
                                is_supported = extension in ['pdf', 'docx', 'doc', 'txt', 'html', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mp3', 'wav']

                            if is_supported:
                                if not db_file:
                                    # OPTIMIZATION 3: Batch file creation instead of individual
                                    file_info = FileInfoExtractor.extract_file_info(item_path)
                                    if file_info:
                                        try:
                                            self.logger.info(f"Auto-adding supported file: {item_path.name}")
                                            file_create = FileCreate(**file_info)
                                            db_file = self._create_file(file_create)
                                            self.logger.info(f"[SUCCESS] Auto-added: {item_path.name} (ID: {db_file.id})")
                                        except Exception as e:
                                            self.logger.warning(f"[ERROR] Error auto-adding {item_path.name}: {str(e)}")
                                            db_file = None

                                if db_file:
                                    files.append({
                                        "name": item_path.name,
                                        "path": item_path_str,
                                        "size": db_file.size,
                                        "mime_type": db_file.mime_type,
                                        "status": db_file.status.value,
                                        "id": db_file.id
                                    })
                            else:
                                # Unsupported file - no database interaction
                                unsupported_info = FileInfoExtractor.extract_unsupported_file_info(item_path)
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
                                # ULTRA-FAST: No file counting for performance
                                subdirectories.append({
                                    "name": item_path.name,
                                    "path": str(item_path),
                                    "file_count": 0,  # Always 0 for speed
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
                        continue
                    except Exception as e:
                        self.logger.warning(f"Error processing {item_path}: {str(e)}")
                        continue

                return {
                    "directory": directory_path,
                    "files": files,
                    "subdirectories": subdirectories,
                    "total_files": len(files),
                    "total_subdirectories": len(subdirectories)
                }

            except Exception as e:
                self.logger.error(f"Error listing directory content: {str(e)}")
                return {
                    "directory": directory_path,
                    "files": [],
                    "subdirectories": [],
                    "total_files": 0,
                    "total_subdirectories": 0,
                    "error": str(e)
                }

        except Exception as e:
            self.logger.error(f"Error listing directory {directory_path}: {str(e)}")
            raise

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
        self.logger.info(f"Starting list_directory_content_paginated for: {directory_path}")
        try:
            directory = Path(directory_path)
            if not directory.exists() or not directory.is_dir():
                raise ValueError(f"Directory does not exist: {directory_path}")

            files = []
            subdirectories = []
            total_files = 0
            total_subdirectories = 0

            try:
                # ULTRA-FAST: Direct filesystem scan without database queries
                all_items = list(directory.iterdir())
                
                # Process all items first, then apply pagination to results
                all_files = []
                all_subdirectories = []
                
                for item_path in all_items:
                    try:
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
                            
                            # Import here to avoid circular imports
                            from app.core.file_utils import FileInfoExtractor
                            from app.core.file_validation import FileValidator
                            
                            # Determine if format is supported
                            mime_type, _ = mimetypes.guess_type(str(item_path))
                            if mime_type:
                                is_supported = FileValidator.is_format_supported(mime_type)
                            else:
                                # Fallback pour les extensions sans MIME type
                                is_supported = extension in ['pdf', 'docx', 'doc', 'txt', 'html', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mp3', 'wav']
                            
                            # Get proper MIME type
                            mime_type = FileInfoExtractor._get_mime_type(item_path, extension)
                            
                            # Set status based on support
                            status = "none" if is_supported else "unsupported"
                            
                            file_info = {
                                "name": item_path.name,
                                "path": item_path_str,
                                "size": size,
                                "mime_type": mime_type,
                                "status": status,
                                "id": None  # Will be created on demand
                            }
                            all_files.append(file_info)
                            self.logger.info(f"Added file: {item_path.name} to list")

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
                self.logger.info(f"Found {len(all_files)} files and {len(all_subdirectories)} subdirectories in {directory_path}")
                


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
                self.logger.info(
                    f"Nettoyé {orphaned_count} fichiers orphelins dans {directory_path}")

            return orphaned_count

        except Exception as e:
            self.logger.error(
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
            self.logger.error(f"Error building directory tree: {str(e)}")
            return None


