"""
File management endpoints for DocuSense AI
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, Header
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import logging
import os
import psutil
from pathlib import Path
from datetime import datetime

from ..core.database import get_db
from ..services.file_service import FileService
from ..services.download_service import download_service
from ..core.file_validation import FileValidator
from ..models.file import FileStatus, FileListResponse, FileStatusUpdate, DirectoryTreeResponse




logger = logging.getLogger(__name__)

router = APIRouter(tags=["files"])




@router.get("/", response_model=FileListResponse)
async def get_files(
        directory: Optional[str] = Query(
            None,
            description="Filter by directory"),
    status: Optional[FileStatus] = Query(
            None,
            description="Filter by status"),
        selected_only: bool = Query(
            False,
            description="Show only selected files"),
        search: Optional[str] = Query(
            None,
            description="Search in file names"),
        limit: int = Query(
            100,
            ge=1,
            le=1000,
            description="Number of files to return"),
        offset: int = Query(
            0,
            ge=0,
            description="Number of files to skip"),
        db: Session = Depends(get_db)) -> FileListResponse:
    """
    Get files with filtering and pagination
    """
    try:
        file_service = FileService(db)
        return file_service.get_files(
            directory=directory,
            status=status,
            selected_only=selected_only,
            search=search,
            limit=limit,
            offset=offset
        )
    except Exception as e:
        logger.error(f"Error getting files: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class ScanDirectoryRequest(BaseModel):
    directory_path: str


@router.post("/scan")
async def scan_directory(
    request: ScanDirectoryRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Scan a directory for supported files
    """
    try:
        file_service = FileService(db)
        files = file_service.scan_directory(request.directory_path)

        return {
            "message": f"Scanned directory {request.directory_path}",
            "files_found": files.get("total_files", 0),
            "directories_found": files.get("total_directories", 0),
            "directory": request.directory_path
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error scanning directory: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/status")
async def update_file_status(
    status_update: FileStatusUpdate,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Update status of multiple files
    """
    try:
        file_service = FileService(db)
        files = file_service.update_file_status(
            file_ids=status_update.file_ids,
            status=status_update.status,
            error_message=status_update.error_message
        )

        return {
            "message": f"Updated status of {len(files)} files",
            "status": status_update.status.value,
            "files_updated": len(files)
        }
    except Exception as e:
        logger.error(f"Error updating file status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{file_id}/toggle-selection")
async def toggle_file_selection(
    file_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Toggle file selection status
    """
    try:
        file_service = FileService(db)
        file = file_service.toggle_file_selection(file_id)

        return {
            "message": f"Toggled selection for file {file_id}",
            "file_id": file_id,
            "is_selected": file.is_selected
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error toggling file selection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/select-all")
async def select_all_files(
    directory: Optional[str] = Query(None, description="Directory to select files from"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Select all files in a directory
    """
    try:
        file_service = FileService(db)
        count = file_service.select_all_files(directory)

        return {
            "message": f"Selected {count} files",
            "files_selected": count,
            "directory": directory
        }
    except Exception as e:
        logger.error(f"Error selecting all files: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/deselect-all")
async def deselect_all_files(
    directory: Optional[str] = Query(None, description="Directory to deselect files from"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Deselect all files in a directory
    """
    try:
        file_service = FileService(db)
        count = file_service.deselect_all_files(directory)

        return {
            "message": f"Deselected {count} files",
            "files_deselected": count,
            "directory": directory
        }
    except Exception as e:
        logger.error(f"Error deselecting all files: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/selected")
async def get_selected_files(
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get all selected files
    """
    try:
        file_service = FileService(db)
        files = file_service.get_selected_files()

        return [
            {
                "id": file.id,
                "name": file.name,
                "path": file.path,
                "status": file.status.value,
                "size": file.size,
                "is_selected": file.is_selected
            }
            for file in files
        ]
    except Exception as e:
        logger.error(f"Error getting selected files: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list/{directory:path}")
async def list_directory_content(
    directory: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Items per page"),
    cleanup_orphaned: bool = Query(False, description="Clean up orphaned files"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    List immediate content of a directory (files and subdirectories) with optional cleanup
    """
    try:
        file_service = FileService(db)

        # Gérer le cas où le répertoire est vide ou racine
        if not directory or directory == "/" or directory == "\\":
            return {
                "directory": "",
                "files": [],
                "subdirectories": [],
                "total_files": 0,
                "total_subdirectories": 0
            }

        # Log pour les grands répertoires ou nettoyage
        if page_size > 50 or cleanup_orphaned:
            logger.info(f"[API] Listing directory content: {directory} (page={page}, page_size={page_size})")
        
        # Nettoyer les fichiers orphelins si demandé
        orphaned_count = 0
        if cleanup_orphaned:
            logger.info(f"[API] Cleaning up orphaned files for: {directory}")
            orphaned_count = file_service.cleanup_orphaned_files(directory)

        # OPTIMIZATION: Pagination support
        offset = (page - 1) * page_size
        
        logger.info(f"[API] Calling list_directory_content_paginated for: {directory}")
        
        content = file_service.list_directory_content_paginated(
            directory, 
            page=page, 
            page_size=page_size, 
            offset=offset
        )
        
        # Log pour les grands répertoires ou nettoyage
        if page_size > 50 or cleanup_orphaned:
            logger.info(f"[API] Successfully retrieved content: {len(content.get('files', []))} files, {len(content.get('subdirectories', []))} subdirectories")

        # Ajouter les informations de nettoyage
        if cleanup_orphaned:
            content["cleanup_info"] = {
                "orphaned_files_removed": orphaned_count,
                "cleanup_performed": True
            }

        return content

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error listing directory content: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/directories")
async def get_available_directories(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get list of available directories for selection
    """
    try:
        import platform
        from pathlib import Path

        available_dirs = []

        # Détecter le système d'exploitation
        system = platform.system()

        if system == "Windows":
            # Lister tous les disques disponibles sur Windows
            import string
            for drive_letter in string.ascii_uppercase:
                drive_path = f"{drive_letter}:\\"
                if os.path.exists(drive_path):
                    try:
                        # Obtenir le nom du volume si possible
                        import subprocess
                        try:
                            result = subprocess.run(["wmic",
                                                     "logicaldisk",
                                                     "where",
                                                     f"DeviceID='{drive_letter}:'",
                                                     "get",
                                                     "VolumeName",
                                                     "/value"],
                                                    capture_output=True,
                                                    text=True,
                                                    timeout=5)
                            volume_name = None
                            for line in result.stdout.split('\n'):
                                if 'VolumeName=' in line:
                                    volume_name = line.split('=')[1].strip()
                                    break
                        except BaseException:
                            volume_name = None

                        # ULTRA-FAST: No file counting for performance
                        file_count = 0

                        display_name = f"{drive_letter}:"
                        if volume_name and volume_name != "":
                            display_name += f" ({volume_name})"

                        available_dirs.append({
                            "path": drive_path,
                            "name": display_name,
                            "file_count": file_count,
                            "exists": True,
                            "type": "drive"
                        })
                    except Exception:
                        continue

            # Ajouter les répertoires communs de l'utilisateur
            common_directories = [
                str(Path.home() / "Desktop"),
                str(Path.home() / "Documents"),
                str(Path.home() / "Downloads"),
                str(Path.home() / "Pictures"),
                str(Path.home() / "Music"),
                str(Path.home() / "Videos"),
            ]

            for dir_path in common_directories:
                if os.path.exists(dir_path) and os.path.isdir(dir_path):
                    try:
                        # ULTRA-FAST: No file counting for performance
                        available_dirs.append({
                            "path": dir_path,
                            "name": os.path.basename(dir_path),
                            "file_count": 0,  # Always 0 for speed
                            "exists": True,
                            "type": "folder"
                        })
                    except PermissionError:
                        continue
        else:
            # Pour Linux/Mac, utiliser les répertoires communs
            common_directories = [
                str(Path.home() / "Desktop"),
                str(Path.home() / "Documents"),
                str(Path.home() / "Downloads"),
                str(Path.home() / "Pictures"),
                str(Path.home() / "Music"),
                str(Path.home() / "Videos"),
                "/",
                "/home",
                "/usr",
            ]

            for dir_path in common_directories:
                if os.path.exists(dir_path) and os.path.isdir(dir_path):
                    try:
                        # ULTRA-FAST: No file counting for performance
                        available_dirs.append({
                            "path": dir_path,
                            "name": os.path.basename(dir_path) if dir_path != "/" else "Root",
                            "file_count": 0,  # Always 0 for speed
                            "exists": True,
                            "type": "folder"
                        })
                    except PermissionError:
                        continue

        return {
            "directories": available_dirs,
            "total": len(available_dirs),
            "system": system
        }

    except Exception as e:
        logger.error(f"Error getting available directories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))





@router.get("/{file_id}")
async def get_file(
    file_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get a specific file by ID
    """
    try:
        FileService(db)
        # This would need to be implemented in FileService
        # For now, we'll use a direct query
        from ..models.file import File
        file = db.query(File).filter(File.id == file_id).first()

        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        return {
            "id": file.id,
            "name": file.name,
            "path": file.path,
            "status": file.status.value,
            "size": file.size,
            "mime_type": file.mime_type,
            "is_selected": file.is_selected,
            "extracted_text": file.extracted_text,
            "analysis_result": file.analysis_result,
            "error_message": file.error_message,
            "created_at": file.created_at.isoformat() if file.created_at else None,
            "updated_at": file.updated_at.isoformat() if file.updated_at else None}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{file_id}/details")
async def get_file_details(
    file_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get detailed file information including analysis results and metadata
    """
    try:
        from ..models.file import File
        file = db.query(File).filter(File.id == file_id).first()

        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        # Récupérer les résultats d'analyse si disponibles
        analysis_results = None
        if file.status == FileStatus.COMPLETED and file.analysis_result:
            try:
                import json
                analysis_results = json.loads(
                    file.analysis_result) if isinstance(
                    file.analysis_result,
                    str) else file.analysis_result
            except Exception as e:
                logger.warning(
                    f"Could not parse analysis results for file {file_id}: {
                        str(e)}")

        # Récupérer les métadonnées du fichier
        metadata = {}
        try:
            if os.path.exists(file.path):
                stat_info = os.stat(file.path)
                metadata = {
                    "permissions": oct(stat_info.st_mode)[-3:],
                    "owner": stat_info.st_uid,
                    "group": stat_info.st_gid,
                    "last_accessed": datetime.fromtimestamp(stat_info.st_atime).isoformat(),
                    "last_modified": datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
                    "created": datetime.fromtimestamp(stat_info.st_ctime).isoformat(),
                    "is_readable": os.access(file.path, os.R_OK),
                    "is_writable": os.access(file.path, os.W_OK),
                    "is_executable": os.access(file.path, os.X_OK)
                }
        except Exception as e:
            logger.warning(
                f"Could not load metadata for file {file_id}: {
                    str(e)}")

        return {
            "id": file.id,
            "name": file.name,
            "path": file.path,
            "size": file.size,
            "mime_type": file.mime_type,
            "status": file.status.value,
            "created_at": file.created_at.isoformat() if file.created_at else None,
            "updated_at": file.updated_at.isoformat() if file.updated_at else None,
            "error_message": file.error_message,
            "analysis_results": analysis_results,
            "metadata": metadata}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file details {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Delete a file record
    """
    try:
        file_service = FileService(db)
        success = file_service.delete_file(file_id)

        if not success:
            raise HTTPException(status_code=404, detail="File not found")

        return {
            "message": f"Deleted file {file_id}",
            "file_id": file_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/directory/{directory:path}")
async def get_directory_stats(
    directory: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get statistics for a directory
    """
    try:
        file_service = FileService(db)
        stats = file_service.get_directory_stats(directory)

        return stats
    except Exception as e:
        logger.error(f"Error getting directory stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/workflow")
async def get_workflow_stats(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get workflow statistics
    """
    try:
        file_service = FileService(db)
        return file_service.get_workflow_stats()
    except Exception as e:
        logger.error(f"Error getting workflow stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{file_id}/analysis")
async def get_file_analysis(
    file_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get analysis results for a specific file
    """
    try:
        file_service = FileService(db)
        analysis_result = file_service.get_file_analysis_result(file_id)
        if not analysis_result:
            raise HTTPException(
                status_code=404,
                detail="Analysis result not found")
        return analysis_result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error getting analysis result for file {file_id}: {
                str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tree/{directory:path}", response_model=DirectoryTreeResponse)
async def get_directory_tree(
    directory: str,
    db: Session = Depends(get_db)
) -> DirectoryTreeResponse:
    """
    Get complete directory tree structure from database
    """
    try:
        file_service = FileService(db)

        # Gérer le cas où le répertoire est vide ou racine
        if not directory or directory == "/" or directory == "\\":
            # Retourner une structure vide pour la racine
            return DirectoryTreeResponse(
                name="root",
                path="",
                is_directory=True,
                file_count=0,
                children=[],
                files=[]
            )

        tree = file_service.get_directory_tree(directory)

        if not tree:
            raise HTTPException(
                status_code=404,
                detail=f"Directory tree not found for {directory}")

        return tree

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting directory tree: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))





@router.get("/{file_id}/content")
async def get_file_content(
    file_id: int,
    db: Session = Depends(get_db)
) -> Response:
    """
    Get the content of a text file for preview
    """
    try:
        file_service = FileService(db)
        file_info = file_service.get_file_by_id(file_id)

        if not file_info:
            raise HTTPException(status_code=404, detail="File not found")

        # Vérifier que le fichier existe sur le disque
        if not os.path.exists(file_info.path):
            raise HTTPException(
                status_code=404,
                detail="File not found on disk")

        # Vérifier que c'est un fichier texte
        mime_type = file_info.mime_type or ""
        if not mime_type.startswith('text/'):
            raise HTTPException(
                status_code=400,
                detail="File is not a text file")

        # Lire le contenu du fichier
        try:
            with open(file_info.path, 'r', encoding='utf-8') as f:
                content = f.read()

            return Response(content=content, media_type="text/plain")
        except UnicodeDecodeError:
            # Essayer avec un autre encodage
            try:
                with open(file_info.path, 'r', encoding='latin-1') as f:
                    content = f.read()
                return Response(content=content, media_type="text/plain")
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Error reading file: {
                        str(e)}")
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error reading file: {
                    str(e)}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error getting file content for file {file_id}: {
                str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{file_id}/download")
async def download_file(
    file_id: int,
    db: Session = Depends(get_db)
) -> FileResponse:
    """
    Download a file by ID (uses original file path)
    """
    try:
        logger.info(f"🎯 Téléchargement par ID demandé: {file_id}")
        
        file_service = FileService(db)
        file_info = file_service.get_file_by_id(file_id)

        if not file_info:
            logger.error(f"🎯 Fichier non trouvé en base: {file_id}")
            raise HTTPException(status_code=404, detail="File not found")

        logger.info(f"🎯 Fichier trouvé en base: {file_info.name} -> {file_info.path}")

        # Vérifier que le fichier existe sur le disque
        if not os.path.exists(file_info.path):
            logger.error(f"🎯 Fichier non trouvé sur le disque: {file_info.path}")
            raise HTTPException(
                status_code=404,
                detail="File not found on disk")

        logger.info(f"🎯 Fichier trouvé sur le disque: {file_info.path}")
        
        # Utiliser le service de téléchargement pour le fichier original
        return download_service.download_file(Path(file_info.path))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download-by-path/{file_path:path}")
async def download_file_by_path(
    file_path: str
) -> FileResponse:
    """
    Download a file by its path
    """
    try:
        logger.info(f"🎯 Téléchargement par chemin demandé: {file_path}")
        
        file_path_obj = Path(file_path)
        
        # Vérifier que le fichier existe
        if not file_path_obj.exists():
            logger.error(f"🎯 Fichier non trouvé: {file_path}")
            raise HTTPException(status_code=404, detail=f"Fichier non trouvé: {file_path}")
        
        logger.info(f"🎯 Fichier trouvé: {file_path_obj.name} ({file_path_obj.stat().st_size} bytes)")
        
        # Valider le fichier (format et taille)
        is_valid, error_message, mime_type = FileValidator.validate_file(file_path_obj)
        
        if not is_valid:
            logger.error(f"🎯 Fichier invalide: {error_message}")
            raise HTTPException(status_code=400, detail=error_message)
        
        logger.info(f"🎯 Téléchargement du fichier: {file_path_obj.name}")
        return download_service.download_file(file_path_obj)
        
    except Exception as e:
        logger.error(f"Error downloading file by path: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class DownloadSelectedRequest(BaseModel):
    file_ids: List[int]

@router.post("/download-selected")
async def download_selected_files(
    request: DownloadSelectedRequest,
    db: Session = Depends(get_db)
) -> FileResponse:
    """
    Download selected files as a ZIP archive
    """
    try:

        
        # Récupérer les fichiers par leurs IDs
        file_service = FileService(db)
        selected_files = []
        
        for file_id in request.file_ids:
            file = file_service.get_file_by_id(file_id)
            if file:
                selected_files.append(file)
        
        if not selected_files:
            raise HTTPException(status_code=400, detail="Aucun fichier sélectionné")
        
        # Convertir en chemins de fichiers
        file_paths = [Path(file.path) for file in selected_files]
        
        # Générer un nom de ZIP par défaut
        zip_name = f"selected_files_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
        
        logger.info(f"Téléchargement de {len(file_paths)} fichiers sélectionnés")
        
        return download_service.download_multiple_files(file_paths, zip_name)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading selected files: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{file_id}/stream")
async def stream_file(
    file_id: int,
    range: Optional[str] = Header(None, alias="Range"),
    db: Session = Depends(get_db)
) -> FileResponse:
    """
    Stream a file directly from disk for audio/video playback
    Supports range requests for seeking in media files
    """
    try:
        file_service = FileService(db)
        file_info = file_service.get_file_by_id(file_id)

        if not file_info:
            raise HTTPException(status_code=404, detail="File not found")

        # Vérifier que le fichier existe sur le disque
        if not os.path.exists(file_info.path):
            raise HTTPException(
                status_code=404,
                detail="File not found on disk")

        # Utiliser FileResponse qui gère automatiquement les range requests
        return FileResponse(
            path=file_info.path,
            filename=file_info.name,
            media_type=file_info.mime_type,
            headers={
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=3600",  # Cache pour 1 heure
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error streaming file {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stream-by-path/{file_path:path}")
async def stream_file_by_path(
    file_path: str,
    range: Optional[str] = Header(None, alias="Range"),
    native: Optional[bool] = Query(False, description="Force native browser player"),
    direct: Optional[bool] = Query(False, description="Force direct download")
) -> FileResponse:
    """
    Stream a file by its path directly from disk for visualization
    Supports range requests for seeking in media files
    """
    try:
        from urllib.parse import unquote
        
        # Log de début avec l'URL encodée
        logger.info(f"STREAM-BY-PATH REQUEST - Encoded URL: {file_path}")
        
        # Décoder l'URL pour gérer les caractères spéciaux
        decoded_path = unquote(file_path)
        logger.info(f"STREAM-BY-PATH REQUEST - Decoded path: {decoded_path}")
        
        file_path_obj = Path(decoded_path)
        logger.info(f"STREAM-BY-PATH REQUEST - Path object: {file_path_obj}")
        
        # Vérifier que le fichier existe
        if not file_path_obj.exists():
            error_msg = f"File not found: {decoded_path}"
            logger.error(f"STREAM-BY-PATH ERROR - {error_msg}")
            raise HTTPException(status_code=404, detail=f"Fichier non trouvé: {file_path_obj.name}")
        
        if not file_path_obj.is_file():
            error_msg = f"Path is not a file: {decoded_path}"
            logger.error(f"STREAM-BY-PATH ERROR - {error_msg}")
            raise HTTPException(status_code=400, detail="Le chemin ne correspond pas à un fichier")
        
        logger.info(f"STREAM-BY-PATH - File exists and is valid: {file_path_obj}")
        
        # Valider le fichier (format uniquement)
        is_valid, error_message, mime_type = FileValidator.validate_file(file_path_obj)
        
        logger.info(f"STREAM-BY-PATH - Validation result: valid={is_valid}, mime_type={mime_type}")
        
        if not is_valid:
            logger.error(f"STREAM-BY-PATH ERROR - File validation failed: {error_message}")
            raise HTTPException(status_code=400, detail=error_message)
        
        logger.info(f"STREAM-BY-PATH - File validated successfully, streaming: {file_path_obj}")
        
        # Déterminer le type de réponse selon les paramètres
        if direct:
            # Mode téléchargement direct
            headers = {
                "Content-Disposition": f"attachment; filename=\"{file_path_obj.name}\"",
                "Content-Type": mime_type,
                "Cache-Control": "no-cache",
            }
        elif native:
            # Mode lecteur natif du navigateur
            headers = {
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=3600",
                "Content-Disposition": "inline",
                "X-Content-Type-Options": "nosniff",
                "Content-Type": mime_type,
                "X-Player-Mode": "native",
            }
        else:
            # Mode React (par défaut)
            headers = {
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=3600",
                "Content-Disposition": "inline",
                "X-Content-Type-Options": "nosniff",
                "Content-Type": mime_type,
                "X-Player-Mode": "react",
            }
        
        # Utiliser FileResponse qui gère automatiquement les range requests et le streaming
        return FileResponse(
            path=str(file_path_obj),
            media_type=mime_type,
            headers=headers
        )
        
    except HTTPException:
        logger.error(f"STREAM-BY-PATH HTTP ERROR - Re-raising HTTPException")
        raise
    except Exception as e:
        logger.error(f"STREAM-BY-PATH UNEXPECTED ERROR - File: {file_path}, Error: {str(e)}")
        logger.error(f"STREAM-BY-PATH ERROR DETAILS - Type: {type(e).__name__}, Args: {e.args}")
        raise HTTPException(status_code=500, detail=str(e))
