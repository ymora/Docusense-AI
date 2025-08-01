"""
API endpoints pour le parsing et l'affichage des fichiers .eml
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Response
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Dict, Any, Optional
from pathlib import Path
import logging
import urllib.parse

from ..core.security import security_manager
from ..services.email_parser_service import EmailParserService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/emails", tags=["emails"])

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

# Dépendance pour vérifier l'authentification
def get_current_session(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())) -> str:
    """Vérifie et retourne le token de session"""
    session_token = credentials.credentials
    
    if not security_manager.verify_session(session_token):
        raise HTTPException(
            status_code=401,
            detail="Session invalide ou expirée",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return session_token

def get_current_session_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[str]:
    """Vérifie et retourne le token de session (optionnel)"""
    if not credentials:
        return None
    
    session_token = credentials.credentials
    
    if not security_manager.verify_session(session_token):
        return None # Retourne None si la session est invalide ou expirée
    
    return session_token


@router.get("/parse/{file_path:path}", response_model=EmailContent)
async def parse_email_file(
    file_path: str,
    session_token: Optional[str] = Depends(get_current_session_optional)
):
    """
    Parse un fichier .eml et retourne son contenu structuré
    
    Args:
        file_path: Chemin vers le fichier .eml (encodé en URL)
        session_token: Token de session (optionnel pour les fichiers locaux)
        
    Returns:
        EmailContent: Contenu structuré de l'email
    """
    try:
        # Décoder le chemin du fichier
        decoded_path = urllib.parse.unquote(file_path)
        file_path_obj = Path(decoded_path)
        
        # Vérifier que le fichier existe
        if not file_path_obj.exists():
            raise HTTPException(status_code=404, detail="Fichier .eml non trouvé")
        
        # Vérifier que c'est bien un fichier .eml
        if file_path_obj.suffix.lower() != '.eml':
            raise HTTPException(status_code=400, detail="Le fichier doit être un .eml")
        
        logger.info(f"Parsing du fichier .eml: {file_path_obj}")
        
        # Parser l'email
        email_parser = EmailParserService()
        email_data = email_parser.parse_email_file(str(file_path_obj))
        
        if not email_data:
            raise HTTPException(status_code=500, detail="Erreur lors du parsing de l'email")
        
        # Formater pour l'affichage
        formatted_data = email_parser.format_email_for_display(email_data)
        
        # Convertir en modèle Pydantic
        return EmailContent(
            subject=formatted_data['subject'],
            from_address=formatted_data['from'],
            to_address=formatted_data['to'],
            cc=formatted_data['cc'],
            bcc=formatted_data['bcc'],
            date=formatted_data['date'],
            text_content=formatted_data['text_content'],
            html_content=formatted_data['html_content'],
            attachments=formatted_data['attachments'],
            has_attachments=formatted_data['has_attachments'],
            is_html=formatted_data['is_html'],
            is_text=formatted_data['is_text']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du parsing de l'email {file_path}: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")


@router.get("/preview/{file_path:path}")
async def get_email_preview(
    file_path: str,
    session_token: str = Depends(get_current_session)
):
    """
    Retourne un aperçu rapide d'un fichier .eml
    
    Args:
        file_path: Chemin vers le fichier .eml (encodé en URL)
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        Dict: Aperçu de l'email
    """
    try:
        # Décoder le chemin du fichier
        decoded_path = urllib.parse.unquote(file_path)
        file_path_obj = Path(decoded_path)
        
        if not file_path_obj.exists():
            raise HTTPException(status_code=404, detail="Fichier .eml non trouvé")
        
        # Parser l'email
        email_parser = EmailParserService()
        email_data = email_parser.parse_email_file(str(file_path_obj))
        
        if not email_data:
            raise HTTPException(status_code=500, detail="Erreur lors du parsing de l'email")
        
        # Retourner un aperçu
        return {
            "subject": email_data.get('subject', 'Sans objet'),
            "from": email_data.get('from', 'Expéditeur inconnu'),
            "to": email_data.get('to', 'Destinataire inconnu'),
            "date": email_data.get('date', 'Date inconnue'),
            "has_attachments": len(email_data.get('attachments', [])) > 0,
            "attachments_count": len(email_data.get('attachments', [])),
            "is_html": bool(email_data.get('html_content')),
            "is_text": bool(email_data.get('text_content')),
            "preview": email_data.get('text_content', '')[:200] + "..." if len(email_data.get('text_content', '')) > 200 else email_data.get('text_content', '')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de l'aperçu de l'email {file_path}: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}") 

@router.get("/attachment/{file_path:path}/{attachment_index}")
async def download_email_attachment(
    file_path: str,
    attachment_index: int,
    session_token: Optional[str] = Depends(get_current_session_optional)
):
    """
    Télécharge une pièce jointe d'un email
    
    Args:
        file_path: Chemin vers le fichier .eml (encodé en URL)
        attachment_index: Index de la pièce jointe
        session_token: Token de session (optionnel pour les fichiers locaux)
        
    Returns:
        FileResponse: Pièce jointe
    """
    try:
        # Décoder le chemin du fichier
        decoded_path = urllib.parse.unquote(file_path)
        file_path_obj = Path(decoded_path)
        
        # Vérifier que le fichier existe
        if not file_path_obj.exists():
            raise HTTPException(status_code=404, detail="Fichier .eml non trouvé")
        
        # Vérifier que c'est bien un fichier .eml
        if file_path_obj.suffix.lower() != '.eml':
            raise HTTPException(status_code=400, detail="Le fichier doit être un .eml")
        
        logger.info(f"Téléchargement pièce jointe {attachment_index} du fichier .eml: {file_path_obj}")
        
        # Parser l'email
        email_parser = EmailParserService()
        email_data = email_parser.parse_email_file(str(file_path_obj))
        
        if not email_data:
            raise HTTPException(status_code=500, detail="Erreur lors du parsing de l'email")
        
        # Récupérer les pièces jointes
        attachments = email_data.get('attachments', [])
        
        if attachment_index >= len(attachments):
            raise HTTPException(status_code=404, detail="Pièce jointe non trouvée")
        
        attachment = attachments[attachment_index]
        
        # Extraire la pièce jointe
        attachment_data = email_parser.extract_attachment(email_data, attachment_index)
        
        if not attachment_data:
            raise HTTPException(status_code=500, detail="Erreur lors de l'extraction de la pièce jointe")
        
        # Retourner la pièce jointe
        return Response(
            content=attachment_data['content'],
            media_type=attachment_data['content_type'],
            headers={
                "Content-Disposition": f"attachment; filename=\"{attachment_data['filename']}\"",
                "Content-Length": str(len(attachment_data['content'])),
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du téléchargement de la pièce jointe {attachment_index} de {file_path}: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")

@router.get("/attachment-preview/{file_path:path}/{attachment_index}")
async def preview_email_attachment(
    file_path: str,
    attachment_index: int,
    session_token: Optional[str] = Depends(get_current_session_optional)
):
    """
    Préviseualise une pièce jointe d'un email (pour consultation directe)
    
    Args:
        file_path: Chemin vers le fichier .eml (encodé en URL)
        attachment_index: Index de la pièce jointe
        session_token: Token de session (optionnel pour les fichiers locaux)
        
    Returns:
        Response: Pièce jointe pour prévisualisation
    """
    try:
        # Décoder le chemin du fichier
        decoded_path = urllib.parse.unquote(file_path)
        file_path_obj = Path(decoded_path)
        
        # Vérifier que le fichier existe
        if not file_path_obj.exists():
            raise HTTPException(status_code=404, detail="Fichier .eml non trouvé")
        
        # Vérifier que c'est bien un fichier .eml
        if file_path_obj.suffix.lower() != '.eml':
            raise HTTPException(status_code=400, detail="Le fichier doit être un .eml")
        
        logger.info(f"Prévisualisation pièce jointe {attachment_index} du fichier .eml: {file_path_obj}")
        
        # Parser l'email
        email_parser = EmailParserService()
        email_data = email_parser.parse_email_file(str(file_path_obj))
        
        if not email_data:
            raise HTTPException(status_code=500, detail="Erreur lors du parsing de l'email")
        
        # Récupérer les pièces jointes
        attachments = email_data.get('attachments', [])
        
        if attachment_index >= len(attachments):
            raise HTTPException(status_code=404, detail="Pièce jointe non trouvée")
        
        attachment = attachments[attachment_index]
        
        # Extraire la pièce jointe
        attachment_data = email_parser.extract_attachment(email_data, attachment_index)
        
        if not attachment_data:
            raise HTTPException(status_code=500, detail="Erreur lors de l'extraction de la pièce jointe")
        
        # Déterminer le type de contenu et le traiter en conséquence
        content_type = attachment_data['content_type']
        content = attachment_data['content']
        filename = attachment_data['filename']
        
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
                    headers={
                        "Content-Disposition": "inline",
                        "Content-Length": str(len(text_content)),
                        "X-Content-Type-Options": "nosniff",
                    }
                )
            except UnicodeDecodeError:
                # Si UTF-8 échoue, essayer latin-1
                text_content = content.decode('latin-1')
                return Response(
                    content=text_content,
                    media_type=content_type,
                    headers={
                        "Content-Disposition": "inline",
                        "Content-Length": str(len(text_content)),
                        "X-Content-Type-Options": "nosniff",
                    }
                )
        
        # Pour les images, vidéos, audio, PDFs - retourner tel quel
        if (content_type.startswith('image/') or 
            content_type.startswith('video/') or 
            content_type.startswith('audio/') or 
            content_type == 'application/pdf'):
            
            # Headers spécifiques pour les vidéos
            headers = {
                "Content-Disposition": "inline",
                "Content-Length": str(len(content)),
                "X-Content-Type-Options": "nosniff",
                "Accept-Ranges": "bytes",
            }
            
            # Headers supplémentaires pour les vidéos
            if content_type.startswith('video/'):
                headers.update({
                    "Cache-Control": "public, max-age=3600",
                    "Content-Type": content_type,
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, HEAD",
                    "Access-Control-Allow-Headers": "Range",
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
            headers={
                "Content-Disposition": "inline",
                "Content-Length": str(len(info_message)),
                "X-Content-Type-Options": "nosniff",
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la prévisualisation de la pièce jointe {attachment_index} de {file_path}: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}") 