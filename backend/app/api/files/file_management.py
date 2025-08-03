"""
Gestion des fichiers - CRUD et opérations de base
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import logging

from ...core.database import get_db
from ...services.file_service import FileService
from ...models.file import FileStatus, FileListResponse, FileStatusUpdate
from ...utils.api_utils import APIUtils, ResponseFormatter
import os
import psutil
from pathlib import Path

logger = logging.getLogger(__name__)

router = APIRouter(tags=["file-management"])


class DrivesResponse(BaseModel):
    """Response model for drives endpoint"""
    drives: List[str]


class ScanDirectoryRequest(BaseModel):
    directory_path: str


@router.get("/drives", response_model=DrivesResponse)
@APIUtils.handle_errors
def list_drives():
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


@router.get("/tree/{directory:path}")
@APIUtils.handle_errors
async def get_directory_tree(
    directory: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get directory tree structure for navigation"""
    try:
        # Normaliser le chemin
        normalized_path = Path(directory).resolve()
        
        # Vérifier que le chemin existe
        if not normalized_path.exists():
            raise HTTPException(status_code=404, detail="Directory not found")
        
        if not normalized_path.is_dir():
            raise HTTPException(status_code=400, detail="Path is not a directory")
        
        # Construire l'arborescence
        tree = {
            "name": normalized_path.name or str(normalized_path),
            "path": str(normalized_path),
            "is_directory": True,
            "file_count": 0,
            "children": [],
            "files": []
        }
        
        # Lire le contenu du répertoire
        try:
            items = list(normalized_path.iterdir())
            
            # Séparer les dossiers et les fichiers
            directories = []
            files = []
            
            for item in items:
                try:
                    if item.is_dir():
                        directories.append({
                            "name": item.name,
                            "path": str(item),
                            "is_directory": True,
                            "file_count": 0,
                            "children": [],
                            "files": []
                        })
                    elif item.is_file():
                        files.append({
                            "id": len(files) + 1,  # ID temporaire
                            "name": item.name,
                            "path": str(item),
                            "size": item.stat().st_size,
                            "mime_type": "application/octet-stream",  # Type par défaut
                            "status": "none",
                            "is_selected": False,
                            "created_at": item.stat().st_ctime,
                            "updated_at": item.stat().st_mtime
                        })
                except (PermissionError, OSError):
                    # Ignorer les fichiers/dossiers inaccessibles
                    continue
            
            # Trier les dossiers et fichiers par nom
            directories.sort(key=lambda x: x["name"].lower())
            files.sort(key=lambda x: x["name"].lower())
            
            tree["children"] = directories
            tree["files"] = files
            tree["file_count"] = len(files)
            
        except PermissionError:
            raise HTTPException(status_code=403, detail="Access denied to directory")
        
        return tree
        
    except Exception as e:
        logger.error(f"Error getting directory tree for {directory}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error reading directory: {str(e)}")


@router.get("/list/{directory:path}")
@APIUtils.handle_errors
async def list_directory_content(
    directory: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(100, ge=1, le=1000, description="Items per page"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """List directory content with pagination"""
    try:
        # Normaliser le chemin
        normalized_path = Path(directory).resolve()
        
        # Vérifier que le chemin existe
        if not normalized_path.exists():
            raise HTTPException(status_code=404, detail="Directory not found")
        
        if not normalized_path.is_dir():
            raise HTTPException(status_code=400, detail="Path is not a directory")
        
        # Lire le contenu du répertoire
        try:
            items = list(normalized_path.iterdir())
            
            # Séparer les dossiers et les fichiers
            directories = []
            files = []
            
            for item in items:
                try:
                    if item.is_dir():
                        directories.append({
                            "name": item.name,
                            "path": str(item),
                            "is_directory": True,
                            "file_count": 0
                        })
                    elif item.is_file():
                        files.append({
                            "id": len(files) + 1,  # ID temporaire
                            "name": item.name,
                            "path": str(item),
                            "size": item.stat().st_size,
                            "mime_type": "application/octet-stream",  # Type par défaut
                            "status": "none",
                            "is_selected": False,
                            "created_at": item.stat().st_ctime,
                            "updated_at": item.stat().st_mtime
                        })
                except (PermissionError, OSError):
                    # Ignorer les fichiers/dossiers inaccessibles
                    continue
            
            # Trier les dossiers et fichiers par nom
            directories.sort(key=lambda x: x["name"].lower())
            files.sort(key=lambda x: x["name"].lower())
            
            # Pagination
            all_items = directories + files
            total = len(all_items)
            start = (page - 1) * page_size
            end = start + page_size
            paginated_items = all_items[start:end]
            
            return {
                "success": True,
                "data": {
                    "directories": [item for item in paginated_items if item.get("is_directory")],
                    "files": [item for item in paginated_items if not item.get("is_directory")]
                },
                "pagination": {
                    "total": total,
                    "page": page,
                    "page_size": page_size,
                    "pages": (total + page_size - 1) // page_size
                }
            }
            
        except PermissionError:
            raise HTTPException(status_code=403, detail="Access denied to directory")
        
    except Exception as e:
        logger.error(f"Error listing directory {directory}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error reading directory: {str(e)}")


@router.get("/", response_model=FileListResponse)
@APIUtils.handle_errors
async def get_files(
    directory: Optional[str] = Query(None, description="Filter by directory"),
    status: Optional[FileStatus] = Query(None, description="Filter by status"),
    selected_only: bool = Query(False, description="Show only selected files"),
    search: Optional[str] = Query(None, description="Search in file names"),
    limit: int = Query(100, ge=1, le=1000, description="Number of files to return"),
    offset: int = Query(0, ge=0, description="Number of files to skip"),
    db: Session = Depends(get_db)
) -> FileListResponse:
    """Get files with filtering and pagination"""
    file_service = FileService(db)
    return file_service.get_files(
        directory=directory,
        status=status,
        selected_only=selected_only,
        search=search,
        limit=limit,
        offset=offset
    )


@router.post("/scan")
@APIUtils.handle_errors
async def scan_directory(
    request: ScanDirectoryRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Scan a directory for supported files"""
    file_service = FileService(db)
    files = file_service.scan_directory(request.directory_path)

    return ResponseFormatter.success_response(
        data={
            "files_found": files.get("total_files", 0),
            "directories_found": files.get("total_directories", 0),
            "directory": request.directory_path
        },
        message=f"Scanned directory {request.directory_path}"
    )


@router.put("/status")
@APIUtils.handle_errors
async def update_file_status(
    status_update: FileStatusUpdate,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Update status of multiple files"""
    file_service = FileService(db)
    files = file_service.update_file_status(
        file_ids=status_update.file_ids,
        status=status_update.status,
        error_message=status_update.error_message
    )

    return ResponseFormatter.success_response(
        data={
            "status": status_update.status.value,
            "files_updated": len(files)
        },
        message=f"Updated status of {len(files)} files"
    )


@router.put("/{file_id}/toggle-selection")
@APIUtils.handle_errors
async def toggle_file_selection(
    file_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Toggle file selection status"""
    file_service = FileService(db)
    file = file_service.toggle_file_selection(file_id)

    return ResponseFormatter.success_response(
        data={
            "file_id": file_id,
            "is_selected": file.is_selected
        },
        message=f"Toggled selection for file {file_id}"
    )


@router.post("/select-all")
@APIUtils.handle_errors
async def select_all_files(
    directory: Optional[str] = Query(None, description="Directory to select files from"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Select all files in a directory"""
    file_service = FileService(db)
    count = file_service.select_all_files(directory)

    return ResponseFormatter.success_response(
        data={
            "files_selected": count,
            "directory": directory
        },
        message=f"Selected {count} files"
    )


@router.post("/deselect-all")
@APIUtils.handle_errors
async def deselect_all_files(
    directory: Optional[str] = Query(None, description="Directory to deselect files from"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Deselect all files in a directory"""
    file_service = FileService(db)
    count = file_service.deselect_all_files(directory)

    return ResponseFormatter.success_response(
        data={
            "files_deselected": count,
            "directory": directory
        },
        message=f"Deselected {count} files"
    )


@router.get("/selected")
@APIUtils.handle_errors
async def get_selected_files(
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get all selected files"""
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


@router.get("/{file_id}")
@APIUtils.handle_errors
async def get_file(
    file_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get a specific file by ID"""
    from ...models.file import File
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
        "updated_at": file.updated_at.isoformat() if file.updated_at else None
    }


@router.delete("/{file_id}")
@APIUtils.handle_errors
async def delete_file(
    file_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Delete a file record"""
    file_service = FileService(db)
    success = file_service.delete_file(file_id)

    if not success:
        raise HTTPException(status_code=404, detail="File not found")

    return ResponseFormatter.success_response(
        data={"file_id": file_id},
        message=f"Deleted file {file_id}"
    ) 