"""
API endpoints pour le parsing et l'affichage des fichiers .eml
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
from pathlib import Path
import logging
import urllib.parse

# Suppression de l'import security_manager - utilisation du système JWT
from ..services.email_parser_service import EmailParserService
from ..middleware.auth_middleware import AuthMiddleware
from ..utils.api_utils import APIUtils, ResponseFormatter, FilePathValidator
from ..models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(tags=["emails"])

# Modèles Pydantic
class EmailContent(BaseModel):
    subject: str
    from_address: str
    to_address: str
    cc: Optional[str] = ""
    bcc: Optional[str] = ""
    date: str
    text_content: str
    html_content: Optional[str] = ""
    attachments: list
    has_attachments: bool
    is_html: bool
    is_text: bool

# Utilisation du middleware d'authentification centralisé


@router.get("/parse/{file_path:path}", response_model=EmailContent)
@APIUtils.handle_errors
async def parse_email_file(
    file_path: str,
    current_user: Optional[User] = Depends(AuthMiddleware.get_current_user_optional)
):
    """
    Parse un fichier .eml et retourne son contenu structuré
    
    Args:
        file_path: Chemin vers le fichier .eml (encodé en URL)
        current_user: Utilisateur connecté (optionnel pour les fichiers locaux)
        
    Returns:
        EmailContent: Contenu structuré de l'email
    """
    try:
        # Décoder et valider le chemin du fichier
        decoded_path = urllib.parse.unquote(file_path)
        file_path_obj = FilePathValidator.validate_email_file(decoded_path)
        
        logger.info(f"🔄 Parsing du fichier .eml: {file_path_obj}")
        
        # Parser l'email
        email_parser = EmailParserService(db=None)  # Pas besoin de DB pour le parsing
        email_data = email_parser.parse_email_file(str(file_path_obj))
        
        if not email_data or not email_data.get('success'):
            error_msg = email_data.get('error', 'Erreur inconnue') if email_data else 'Aucune donnée reçue'
            logger.error(f"❌ Erreur parsing email: {error_msg}")
            raise HTTPException(status_code=500, detail=f"Erreur lors du parsing de l'email: {error_msg}")
        
        # Formater pour l'affichage
        formatted_data = email_parser.format_email_for_display(email_data['data'])
        
        if not formatted_data or not formatted_data.get('success'):
            error_msg = formatted_data.get('error', 'Erreur inconnue') if formatted_data else 'Aucune donnée formatée'
            logger.error(f"❌ Erreur formatage email: {error_msg}")
            raise HTTPException(status_code=500, detail=f"Erreur lors du formatage de l'email: {error_msg}")
        
        display_data = formatted_data['data']
        logger.info(f"✅ Email parsé avec succès: {display_data.get('subject', 'Sans objet')} - {len(display_data.get('attachments', []))} pièces jointes")
        
        # Convertir en modèle Pydantic
        return EmailContent(
            subject=display_data['subject'],
            from_address=display_data['from'],
            to_address=display_data['to'],
            cc=display_data['cc'],
            bcc=display_data['bcc'],
            date=display_data['date'],
            text_content=display_data['text_content'],
            html_content=display_data['html_content'],
            attachments=display_data['attachments'],
            has_attachments=display_data['has_attachments'],
            is_html=display_data['is_html'],
            is_text=display_data['is_text']
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur inattendue lors du parsing email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur inattendue: {str(e)}")


@router.get("/preview/{file_path:path}")
@APIUtils.handle_errors
async def get_email_preview(
    file_path: str,
    current_user: User = Depends(AuthMiddleware.get_current_user_jwt)
):
    """
    Retourne un aperçu rapide d'un fichier .eml
    
    Args:
        file_path: Chemin vers le fichier .eml (encodé en URL)
        current_user: Utilisateur connecté
        
    Returns:
        Dict: Aperçu de l'email
    """
    # Décoder et valider le chemin du fichier
    decoded_path = urllib.parse.unquote(file_path)
    file_path_obj = FilePathValidator.validate_email_file(decoded_path)
    
    # Parser l'email
    email_parser = EmailParserService(db=None)
    email_data = email_parser.parse_email_file(str(file_path_obj))
    
    if not email_data or not email_data.get('success'):
        error_msg = email_data.get('error', 'Erreur inconnue') if email_data else 'Aucune donnée reçue'
        raise HTTPException(status_code=500, detail=f"Erreur lors du parsing de l'email: {error_msg}")
    
    email_content = email_data['data']
    # Retourner un aperçu
    preview_data = {
        "subject": email_content.get('subject', 'Sans objet'),
        "from": email_content.get('from', 'Expéditeur inconnu'),
        "to": email_content.get('to', 'Destinataire inconnu'),
        "date": email_content.get('date', 'Date inconnue'),
        "has_attachments": len(email_content.get('attachments', [])) > 0,
        "attachments_count": len(email_content.get('attachments', [])),
        "is_html": bool(email_content.get('html_content')),
        "is_text": bool(email_content.get('text_content')),
        "preview": email_content.get('text_content', '')[:200] + "..." if len(email_content.get('text_content', '')) > 200 else email_content.get('text_content', '')
    }
    
    return ResponseFormatter.success_response(data=preview_data, message="Aperçu de l'email récupéré") 

@router.get("/attachment/{file_path:path}/{attachment_index}")
@APIUtils.handle_errors
async def download_email_attachment(
    file_path: str,
    attachment_index: int,
    current_user: Optional[User] = Depends(AuthMiddleware.get_current_user_optional)
):
    """
    Télécharge une pièce jointe d'un email
    
    Args:
        file_path: Chemin vers le fichier .eml (encodé en URL)
        attachment_index: Index de la pièce jointe
        current_user: Utilisateur connecté (optionnel)
        
    Returns:
        FileResponse: Pièce jointe
    """
    # Décoder et valider le chemin du fichier
    decoded_path = urllib.parse.unquote(file_path)
    file_path_obj = FilePathValidator.validate_email_file(decoded_path)
    
    logger.info(f"Téléchargement pièce jointe {attachment_index} du fichier .eml: {file_path_obj}")
    
    # Parser l'email
    email_parser = EmailParserService(db=None)
    email_data = email_parser.parse_email_file(str(file_path_obj))
    
    if not email_data or not email_data.get('success'):
        error_msg = email_data.get('error', 'Erreur inconnue') if email_data else 'Aucune donnée reçue'
        raise HTTPException(status_code=500, detail=f"Erreur lors du parsing de l'email: {error_msg}")
    
    email_content = email_data['data']
    # Récupérer les pièces jointes
    attachments = email_content.get('attachments', [])
    
    if attachment_index >= len(attachments):
        raise HTTPException(status_code=404, detail="Pièce jointe non trouvée")
    
    # Extraire la pièce jointe
    attachment_data = email_parser.extract_attachment(email_content, attachment_index)
    
    if not attachment_data or not attachment_data.get('success'):
        error_msg = attachment_data.get('error', 'Erreur inconnue') if attachment_data else 'Aucune donnée reçue'
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'extraction de la pièce jointe: {error_msg}")
    
    attachment_content = attachment_data['data']
    
    # Retourner la pièce jointe
    return Response(
        content=attachment_content['content'],
        media_type=attachment_content['content_type'],
        headers={
            "Content-Disposition": f"attachment; filename=\"{attachment_content['filename']}\"",
            "Content-Length": str(len(attachment_content['content'])),
        }
    )

@router.get("/attachment-preview/{file_path:path}/{attachment_index}")
@APIUtils.handle_errors
async def preview_email_attachment(
    file_path: str,
    attachment_index: int,
    current_user: Optional[User] = Depends(AuthMiddleware.get_current_user_optional)
):
    """
    Préviseualise une pièce jointe d'un email (pour consultation directe)
    
    Args:
        file_path: Chemin vers le fichier .eml (encodé en URL)
        attachment_index: Index de la pièce jointe
        current_user: Utilisateur connecté (optionnel)
        
    Returns:
        Response: Pièce jointe pour prévisualisation
    """
    # Décoder et valider le chemin du fichier
    decoded_path = urllib.parse.unquote(file_path)
    file_path_obj = FilePathValidator.validate_email_file(decoded_path)
    
    logger.info(f"Prévisualisation pièce jointe {attachment_index} du fichier .eml: {file_path_obj}")
    
    # Parser l'email
    email_parser = EmailParserService(db=None)
    email_data = email_parser.parse_email_file(str(file_path_obj))
    
    if not email_data or not email_data.get('success'):
        error_msg = email_data.get('error', 'Erreur inconnue') if email_data else 'Aucune donnée reçue'
        raise HTTPException(status_code=500, detail=f"Erreur lors du parsing de l'email: {error_msg}")
    
    email_content = email_data['data']
    # Récupérer les pièces jointes
    attachments = email_content.get('attachments', [])
    
    if attachment_index >= len(attachments):
        raise HTTPException(status_code=404, detail="Pièce jointe non trouvée")
    
    # Extraire la pièce jointe
    attachment_data = email_parser.extract_attachment(email_content, attachment_index)
    
    if not attachment_data or not attachment_data.get('success'):
        error_msg = attachment_data.get('error', 'Erreur inconnue') if attachment_data else 'Aucune donnée reçue'
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'extraction de la pièce jointe: {error_msg}")
    
    attachment_content = attachment_data['data']
    # Déterminer le type de contenu et le traiter en conséquence
    content_type = attachment_content['content_type']
    content = attachment_content['content']
    filename = attachment_content['filename']
    
    # Headers de base pour tous les types
    base_headers = {
        "Content-Disposition": "inline",
        "Content-Length": str(len(content)),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD",
        "Access-Control-Allow-Headers": "Range",
    }
    
    # Pour les fichiers texte et code
    if (content_type.startswith('text/') or 
        content_type in ['application/json', 'application/xml', 'text/csv'] or
        any(filename.lower().endswith(ext) for ext in ['.txt', '.md', '.log', '.json', '.xml', '.csv', '.html', '.htm', '.css', '.js', '.py', '.java', '.cpp', '.c', '.php'])):
        try:
            # Essayer de décoder en UTF-8
            text_content = content.decode('utf-8')
            return Response(
                content=text_content,
                media_type=content_type,
                headers=base_headers
            )
        except UnicodeDecodeError:
            # Si UTF-8 échoue, essayer latin-1
            text_content = content.decode('latin-1')
            return Response(
                content=text_content,
                media_type=content_type,
                headers=base_headers
            )
    
    # Pour les images - optimisations spécifiques
    if content_type.startswith('image/'):
        headers = base_headers.copy()
        headers.update({
            "Accept-Ranges": "bytes",
            "Content-Type": content_type,
        })
        
        return Response(
            content=content,
            media_type=content_type,
            headers=headers
        )
    
    # Pour les PDFs
    if content_type == 'application/pdf':
        headers = base_headers.copy()
        headers.update({
            "Accept-Ranges": "bytes",
            "Content-Type": content_type,
        })
        
        return Response(
            content=content,
            media_type=content_type,
            headers=headers
        )
    
    # Pour les vidéos - support du streaming
    if content_type.startswith('video/'):
        headers = base_headers.copy()
        headers.update({
            "Accept-Ranges": "bytes",
            "Content-Type": content_type,
        })
        
        return Response(
            content=content,
            media_type=content_type,
            headers=headers
        )
    
    # Pour les fichiers audio
    if content_type.startswith('audio/'):
        headers = base_headers.copy()
        headers.update({
            "Accept-Ranges": "bytes",
            "Content-Type": content_type,
        })
        
        return Response(
            content=content,
            media_type=content_type,
            headers=headers
        )
    
    # Pour les autres types (documents Office, archives, etc.)
    # Retourner avec un message informatif
    info_message = f"Type de fichier: {content_type}\nTaille: {len(content)} bytes\nNom: {filename}\n\nCe fichier ne peut pas être prévisualisé directement. Veuillez le télécharger."
    
    return Response(
        content=info_message,
        media_type="text/plain",
        headers=base_headers
    ) 