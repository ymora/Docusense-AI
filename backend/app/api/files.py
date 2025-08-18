"""
File management endpoints for DocuSense AI
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, Header, UploadFile, Form
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import logging
import os
import psutil
import subprocess
import platform
from pathlib import Path
from datetime import datetime
import urllib.parse

from ..core.database import get_db
from ..services.file_service import FileService
from ..services.download_service import download_service
from ..core.file_validation import FileValidator
from ..models.file import FileStatus
from ..schemas.file import FileListResponse, FileStatusUpdate
from ..utils.response_formatter import ResponseFormatter
from ..utils.api_utils import APIUtils


logger = logging.getLogger(__name__)

router = APIRouter(tags=["files"])


class DrivesResponse(BaseModel):
    """Response model for drives endpoint"""
    drives: List[str]


@router.get("/drives", response_model=DrivesResponse)
async def list_drives():
    """ULTRA-FAST: List available drives without slow psutil calls"""
    drives = []
    
    if os.name == "nt":  # Windows
        # ULTRA-FAST: Direct drive letter check instead of psutil
        import string
        for letter in string.ascii_uppercase:
            drive_path = f"{letter}:\\"
            try:
                # Quick access test
                os.listdir(drive_path)
                drives.append(f"{letter}:")
            except (OSError, PermissionError):
                pass  # Drive not accessible
    else:
        # Linux/Mac: Use psutil but with timeout
        try:
            for part in psutil.disk_partitions(all=False):
                try:
                    os.listdir(part.mountpoint)
                    drives.append(part.mountpoint)
                except Exception:
                    pass
        except Exception:
            # Fallback to common mount points
            common_mounts = ["/", "/home", "/mnt", "/media"]
            for mount in common_mounts:
                if os.path.exists(mount):
                    drives.append(mount)
    
    return DrivesResponse(drives=drives)




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


# ENDPOINT SUPPRIMÉ: /scan - Remplacé par navigation automatique


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
@APIUtils.monitor_api_performance
async def list_directory_content(
    directory: str,
    page: int = Query(1, ge=1, description="Numéro de page"),
    page_size: int = Query(50, ge=1, le=1000, description="Taille de page"),
    offset: int = Query(0, ge=0, description="Offset"),
    db: Session = Depends(get_db)
):
    """
    Liste le contenu d'un répertoire avec pagination
    """
    try:
        # Décoder le chemin et valider le répertoire
        decoded_directory = urllib.parse.unquote(directory)
        
        # Continuer avec la logique existante
        file_service = FileService(db)
        result = file_service.list_directory_content_paginated(
            decoded_directory, page, page_size, offset
        )
        
        # Vérifier si le résultat indique un disque non accessible
        if not result.get("success", True) and result.get("error") in ["DISK_LOCKED", "DISK_NOT_READY", "DISK_ERROR"]:
            # Retourner une réponse d'erreur appropriée avec les informations de retry
            return ResponseFormatter.error_response(
                error_code=result["error"],
                message=result["message"],
                data={
                    "retry_after": result.get("retry_after"),
                    "directory": decoded_directory,
                    "files": [],
                    "subdirectories": [],
                    "total_files": 0,
                    "total_subdirectories": 0,
                    "page": page,
                    "page_size": page_size,
                    "total_pages": 0
                }
            )
        
        return ResponseFormatter.success_response(
            data=result,
            message=f"Contenu du répertoire {decoded_directory} récupéré"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la liste du répertoire {directory}: {e}")
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
        file_service = FileService(db)
        file = file_service.get_file_by_id(file_id)

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
            "parent_directory": file.parent_directory,
            "created_at": file.created_at.isoformat() if file.created_at else None,
            "updated_at": file.updated_at.isoformat() if file.updated_at else None,
            "file_created_at": file.file_created_at.isoformat() if file.file_created_at else None,
            "file_modified_at": file.file_modified_at.isoformat() if file.file_modified_at else None,
            "file_accessed_at": file.file_accessed_at.isoformat() if file.file_accessed_at else None,
            "analysis_metadata": file.analysis_metadata}
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


# ENDPOINT SUPPRIMÉ: /tree - DirectoryStructure n'est plus utilisé














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


@router.get("/stream-by-path/{file_path:path}")
async def stream_file_by_path(
    file_path: str,
    native: bool = Query(False, description="Stream natif sans conversion"),
    hls: bool = Query(False, description="Stream HLS pour vidéos"),
    direct: bool = Query(False, description="Téléchargement direct"),
    html: bool = Query(False, description="Conversion en HTML pour Office"),
    db: Session = Depends(get_db)
):
    """
    Stream un fichier par son chemin complet
    """
    try:
        from urllib.parse import unquote
        
        # Décoder l'URL
        decoded_path = unquote(file_path)
        file_path_obj = Path(decoded_path)
        
        if not file_path_obj.exists():
            raise HTTPException(status_code=404, detail="Fichier non trouvé")
        
        # Valider le fichier
        is_valid, error_message = FileValidator.validate_file_for_streaming(file_path_obj)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_message)
        
        # Déterminer le type MIME
        mime_type, _ = FileValidator.get_mime_type(file_path_obj)
        extension = file_path_obj.suffix.lower().lstrip('.')
        
        # Conversion HTML pour les fichiers Office
        office_extensions = ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'odt', 'ods', 'odp']
        if html and extension in office_extensions:
            try:
                from ..services.office_viewer_service import OfficeViewerService
                office_viewer = OfficeViewerService(db)
                
                if office_viewer.is_format_supported(extension):
                    result = await office_viewer.convert_to_html(str(file_path_obj))
                    
                    if result["success"]:
                        html_content = result["data"]["html"]
                        
                        # Créer une page HTML complète avec styles
                        full_html = f"""
                        <!DOCTYPE html>
                        <html lang="fr">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>{file_path_obj.name}</title>
                            <style>
                                body {{
                                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                    margin: 0;
                                    padding: 20px;
                                    background-color: #1e293b;
                                    color: #e2e8f0;
                                    line-height: 1.6;
                                }}
                                .office-document, .office-spreadsheet, .office-presentation {{
                                    max-width: 1200px;
                                    margin: 0 auto;
                                    background-color: #334155;
                                    padding: 30px;
                                    border-radius: 8px;
                                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                                }}
                                .document-title {{
                                    color: #3b82f6;
                                    border-bottom: 2px solid #3b82f6;
                                    padding-bottom: 10px;
                                    margin-bottom: 30px;
                                }}
                                .paragraph {{
                                    margin-bottom: 15px;
                                    text-align: justify;
                                }}
                                .document-table, .spreadsheet-table {{
                                    width: 100%;
                                    border-collapse: collapse;
                                    margin: 20px 0;
                                    background-color: #475569;
                                }}
                                .document-table td, .spreadsheet-table td {{
                                    border: 1px solid #64748b;
                                    padding: 8px 12px;
                                    text-align: left;
                                }}
                                .document-table tr:nth-child(even), .spreadsheet-table tr:nth-child(even) {{
                                    background-color: #526480;
                                }}
                                .sheet-title, .slide-title {{
                                    color: #10b981;
                                    margin: 25px 0 15px 0;
                                    font-size: 1.2em;
                                }}
                                .slide {{
                                    margin: 20px 0;
                                    padding: 20px;
                                    background-color: #475569;
                                    border-radius: 6px;
                                    border-left: 4px solid #10b981;
                                }}
                                .slide-text {{
                                    margin: 10px 0;
                                }}
                                .spreadsheet-content, .presentation-content {{
                                    background-color: #475569;
                                    padding: 20px;
                                    border-radius: 6px;
                                    margin: 15px 0;
                                }}
                                .spreadsheet-text, .presentation-text {{
                                    white-space: pre-wrap;
                                    font-family: 'Courier New', monospace;
                                    font-size: 0.9em;
                                    line-height: 1.4;
                                }}
                                .fallback {{
                                    text-align: center;
                                    padding: 40px;
                                }}
                                .fallback-message {{
                                    background-color: #dc2626;
                                    color: #fecaca;
                                    padding: 20px;
                                    border-radius: 6px;
                                    margin: 20px 0;
                                }}
                                .fallback-message p {{
                                    margin: 10px 0;
                                }}
                            </style>
                        </head>
                        <body>
                            {html_content}
                        </body>
                        </html>
                        """
                        
                        return Response(
                            content=full_html,
                            media_type="text/html",
                            headers={
                                "Content-Disposition": f"inline; filename={file_path_obj.stem}.html",
                                "Cache-Control": "public, max-age=3600",  # 1h pour les conversions
                            }
                        )
                    else:
                        logger.error(f"Erreur conversion Office: {result['error']}")
                        raise HTTPException(status_code=500, detail="Erreur lors de la conversion")
                else:
                    raise HTTPException(status_code=400, detail=f"Format non supporté: {extension}")
                    
            except ImportError:
                logger.warning("Service Office Viewer non disponible")
                raise HTTPException(status_code=500, detail="Service de visualisation Office non disponible")
            except Exception as e:
                logger.error(f"Erreur conversion Office: {e}")
                raise HTTPException(status_code=500, detail=f"Erreur lors de la conversion: {str(e)}")
        
        # Pour les PDFs, forcer l'affichage natif
        if mime_type == 'application/pdf':
            native = True
        
        # Pour les images, toujours en natif
        if mime_type.startswith('image/'):
            native = True
        
        # Si téléchargement direct demandé
        if direct:
            return FileResponse(
                path=str(file_path_obj),
                filename=file_path_obj.name,
                media_type=mime_type
            )
        
        # Stream natif pour PDFs et images
        if native or mime_type == 'application/pdf' or mime_type.startswith('image/'):
            # OPTIMISATION: Cache plus agressif pour les images et PDFs
            cache_headers = {
                "Content-Disposition": f"inline; filename={file_path_obj.name}",
                "Cache-Control": "public, max-age=86400, immutable",  # 24h pour les fichiers statiques
                "ETag": f'"{file_path_obj.stat().st_mtime}"'  # ETag basé sur la date de modification
            }
            
            return FileResponse(
                path=str(file_path_obj),
                media_type=mime_type,
                headers=cache_headers
            )
        
        # Pour les autres types, téléchargement par défaut
        return FileResponse(
            path=str(file_path_obj),
            filename=file_path_obj.name,
            media_type=mime_type
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du streaming: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class DownloadMultipleRequest(BaseModel):
    file_paths: List[str]
    zip_name: Optional[str] = None


class OpenInExplorerRequest(BaseModel):
    path: str


class AnalyzeDirectoryRequest(BaseModel):
    directory_path: str

@router.post("/upload")
@APIUtils.monitor_api_performance
async def upload_file(
    file: UploadFile,
    directory: str = Form(""),
    db: Session = Depends(get_db)
):
    """
    Upload d'un fichier avec validation de sécurité renforcée
    """
    try:
        # Sanitizer les entrées utilisateur
        from ..core.security import sanitize_input
        sanitized_filename = sanitize_input(file.filename)
        sanitized_directory = sanitize_input(directory)
        
        # Valider le répertoire de destination
        if sanitized_directory:
            from ..core.file_validation import FileValidator
            validation_result = FileValidator.validate_directory_path(sanitized_directory)
            if not validation_result.is_valid:
                error_messages = [error.message for error in validation_result.errors]
                raise HTTPException(status_code=400, detail="; ".join(error_messages))
        
        # Vérifier le format du fichier
        from ..core.media_formats import is_supported_format
        if not is_supported_format(sanitized_filename):
            raise HTTPException(
                status_code=400, 
                detail=f"Format de fichier non supporté: {sanitized_filename}"
            )
        
        # Continuer avec la logique existante...
        file_service = FileService(db)
        result = file_service.upload_file(file, sanitized_directory)
        
        # Enregistrer la métrique d'upload
        APIUtils.record_api_metric("file_uploads", 1.0, {"format": file.content_type})
        
        return ResponseFormatter.success_response(
            data=result,
            message=f"Fichier {sanitized_filename} uploadé avec succès"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de l'upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/download-multiple")
async def download_multiple_files_by_path(
    request: DownloadMultipleRequest,
    db: Session = Depends(get_db)
):
    """
    Télécharger plusieurs fichiers en ZIP
    """
    try:
        from urllib.parse import unquote
        import tempfile
        import zipfile
        from datetime import datetime
        
        # Décoder les chemins
        decoded_paths = [unquote(path) for path in request.file_paths]
        
        # Vérifier que tous les fichiers existent
        valid_paths = []
        for path in decoded_paths:
            file_path_obj = Path(path)
            if file_path_obj.exists() and file_path_obj.is_file():
                valid_paths.append(file_path_obj)
            else:
                logger.warning(f"Fichier non trouvé ou invalide: {path}")
        
        if not valid_paths:
            raise HTTPException(status_code=404, detail="Aucun fichier valide trouvé")
        
        # Créer un fichier ZIP temporaire
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_name = request.zip_name or f"documents_{timestamp}.zip"
        
        with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as temp_zip:
            with zipfile.ZipFile(temp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for file_path in valid_paths:
                    try:
                        # Ajouter le fichier au ZIP avec un nom relatif
                        zipf.write(file_path, file_path.name)
                    except Exception as e:
                        logger.error(f"Erreur lors de l'ajout du fichier {file_path} au ZIP: {e}")
                        continue
            
            # Retourner le fichier ZIP
            return FileResponse(
                path=temp_zip.name,
                filename=zip_name,
                media_type='application/zip',
                background=lambda: os.unlink(temp_zip.name)  # Supprimer le fichier temporaire après envoi
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du téléchargement ZIP: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/open-in-explorer")
async def open_in_explorer(
    request: OpenInExplorerRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Ouvrir un fichier ou dossier dans l'explorateur de fichiers (lecture seule)
    """
    try:
        path = Path(request.path)
        
        if not path.exists():
            raise HTTPException(status_code=404, detail="Chemin introuvable")
        
        # Ouvrir dans l'explorateur selon le système d'exploitation
        system = platform.system().lower()
        
        if system == "windows":
            subprocess.run(["explorer", str(path)], check=True)
        elif system == "darwin":  # macOS
            subprocess.run(["open", str(path)], check=True)
        else:  # Linux
            subprocess.run(["xdg-open", str(path)], check=True)
        
        return {"success": True, "message": f"Ouvert dans l'explorateur: {path}"}
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Erreur lors de l'ouverture dans l'explorateur: {e}")
        raise HTTPException(status_code=500, detail="Impossible d'ouvrir dans l'explorateur")
    except Exception as e:
        logger.error(f"Erreur lors de l'ouverture dans l'explorateur: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-directory")
async def analyze_directory(
    request: AnalyzeDirectoryRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Analyser tous les fichiers d'un dossier
    """
    try:
        directory_path = Path(request.directory_path)
        
        if not directory_path.exists() or not directory_path.is_dir():
            raise HTTPException(status_code=404, detail="Dossier introuvable")
        
        # Récupérer tous les fichiers du dossier
        file_service = FileService(db)
        files = file_service.scan_directory(directory_path)
        
        # Ajouter les fichiers à la queue d'analyse
        file_ids = []
        for file_info in files:
            if file_info.get('id'):
                file_ids.append(file_info['id'])
        
        if file_ids:
            # Ajouter à la queue d'analyse
            from ..services.queue_service import QueueService
            queue_service = QueueService(db)
            
            for file_id in file_ids:
                queue_service.add_item(
                    file_id=file_id,
                    analysis_type="analysis",
                    prompt_id="default"
                )
        
        return {
            "success": True, 
            "message": f"Analyse du dossier lancée pour {len(file_ids)} fichiers",
            "files_count": len(file_ids)
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse du dossier: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/directory-files/{directory:path}")
async def get_directory_files(
    directory: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Récupérer tous les fichiers d'un dossier pour l'affichage en miniatures
    """
    try:
        directory_path = Path(directory)
        
        if not directory_path.exists() or not directory_path.is_dir():
            raise HTTPException(status_code=404, detail="Dossier introuvable")
        
        # Récupérer tous les fichiers du dossier
        file_service = FileService(db)
        files = file_service.scan_directory(directory_path)
        
        # Formater les fichiers pour l'affichage
        formatted_files = []
        for file_info in files:
            if file_info.get('id'):
                formatted_files.append({
                    'id': file_info['id'],
                    'name': file_info['name'],
                    'path': file_info['path'],
                    'mime_type': file_info.get('mime_type', ''),
                    'size': file_info.get('size', 0),
                    'is_directory': file_info.get('is_directory', False),
                    'status': file_info.get('status', 'none'),
                    'analysis_count': file_info.get('analysis_count', 0)
                })
        
        return {
            "success": True,
            "files": formatted_files,
            "total_count": len(formatted_files),
            "directory": str(directory_path)
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des fichiers du dossier: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-directory-supported")
async def analyze_directory_supported(
    request: AnalyzeDirectoryRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Analyser uniquement les fichiers supportés par l'IA d'un dossier
    """
    try:
        directory_path = Path(request.directory_path)
        
        if not directory_path.exists() or not directory_path.is_dir():
            raise HTTPException(status_code=404, detail="Dossier introuvable")
        
        # Récupérer tous les fichiers du dossier
        file_service = FileService(db)
        files = file_service.scan_directory(directory_path)
        
        # Filtrer les fichiers supportés par l'IA
        from ..core.media_formats import is_format_supported_in_dict
        supported_file_ids = []
        
        for file_info in files:
            if file_info.get('id') and file_info.get('mime_type'):
                if is_format_supported_in_dict(file_info['mime_type']):
                    supported_file_ids.append(file_info['id'])
        
        if not supported_file_ids:
            return {
                "success": False,
                "message": f"Aucun fichier supporté par l'IA trouvé dans le dossier",
                "files_analyzed": 0,
                "supported_files": 0,
                "total_files": len(files)
            }
        
        # Ajouter les fichiers supportés à la queue d'analyse
        from ..services.queue_service import QueueService
        queue_service = QueueService(db)
        
        for file_id in supported_file_ids:
            queue_service.add_item(
                file_id=file_id,
                analysis_type="analysis",
                prompt_id="default"
            )
        
        return {
            "success": True,
            "message": f"Analyse lancée pour {len(supported_file_ids)} fichiers supportés sur {len(files)} fichiers",
            "files_analyzed": len(supported_file_ids),
            "supported_files": len(supported_file_ids),
            "total_files": len(files)
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse des fichiers supportés du dossier: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download-by-path/{file_path:path}")
async def download_file_by_path(
    file_path: str,
    db: Session = Depends(get_db)
):
    """
    Télécharger un fichier par son chemin complet
    """
    try:
        from urllib.parse import unquote
        
        # Décoder l'URL
        decoded_path = unquote(file_path)
        file_path_obj = Path(decoded_path)
        
        if not file_path_obj.exists():
            raise HTTPException(status_code=404, detail="Fichier non trouvé")
        
        # Valider le fichier
        is_valid, error_message = FileValidator.validate_file_for_streaming(file_path_obj)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_message)
        
        # Déterminer le type MIME
        mime_type, _ = FileValidator.get_mime_type(file_path_obj)
        
        return FileResponse(
            path=str(file_path_obj),
            filename=file_path_obj.name,
            media_type=mime_type
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du téléchargement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



