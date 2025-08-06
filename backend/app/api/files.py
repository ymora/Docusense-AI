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





@router.get("/test-media-compatibility/{file_path:path}")
async def test_media_compatibility(file_path: str) -> Dict[str, Any]:
    """
    Teste la compatibilité d'un fichier média avec différents lecteurs
    """
    try:
        from urllib.parse import unquote
        
        # Décoder l'URL
        decoded_path = unquote(file_path)
        file_path_obj = Path(decoded_path)
        
        if not file_path_obj.exists():
            raise HTTPException(status_code=404, detail="Fichier non trouvé")
        
        # Valider le fichier
        is_valid, error_message, mime_type = FileValidator.validate_file(file_path_obj)
        
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_message)
        
        # Déterminer le type de média
        is_video = mime_type.startswith('video/')
        is_audio = mime_type.startswith('audio/')
        
        # Formats supportés nativement par les navigateurs
        native_formats = {
            'video': ['.mp4', '.webm', '.ogg', '.mov'],
            'audio': ['.mp3', '.wav', '.ogg', '.m4a', '.aac']
        }
        
        # Formats nécessitant une conversion
        conversion_formats = {
            'video': ['.avi', '.mkv', '.wmv', '.flv', '.rm', '.rmvb'],
            'audio': ['.flac', '.wma', '.ape', '.alac']
        }
        
        file_ext = file_path_obj.suffix.lower()
        
        # Vérifier la compatibilité
        compatibility = {
            'file_name': file_path_obj.name,
            'file_path': str(file_path_obj),
            'mime_type': mime_type,
            'file_size_mb': round(file_path_obj.stat().st_size / (1024 * 1024), 2),
            'is_video': is_video,
            'is_audio': is_audio,
            'native_support': file_ext in (native_formats['video'] if is_video else native_formats['audio']),
            'needs_conversion': file_ext in (conversion_formats['video'] if is_video else conversion_formats['audio']),
            'recommended_player': 'native' if file_ext in (native_formats['video'] if is_video else native_formats['audio']) else 'hls',
            'streaming_urls': {
                'native': f"/api/files/stream-by-path/{unquote(file_path)}?native=true",
                'hls': f"/api/files/stream-by-path/{unquote(file_path)}?hls=true" if is_video else None,
                'download': f"/api/files/stream-by-path/{unquote(file_path)}?direct=true"
            }
        }
        
        return {
            "success": True,
            "compatibility": compatibility,
            "message": "Test de compatibilité terminé"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du test de compatibilité: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
