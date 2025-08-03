"""
Email parser service for DocuSense AI
Handles parsing of .eml files and extraction of email content
"""

import email
import re
from pathlib import Path
from email import policy
from email.parser import BytesParser
from sqlalchemy.orm import Session

from .base_service import BaseService, log_service_operation
from ..core.types import ServiceResponse, EmailData, AttachmentData


class EmailParserService(BaseService):
    """
    Service pour parser les fichiers .eml et extraire leur contenu
    """

    def __init__(self, db: Session):
        super().__init__(db)
        self.policy = policy.default
        self.parser = BytesParser(policy=self.policy)

    @log_service_operation("parse_email_file")
    def parse_email_file(self, file_path: str) -> ServiceResponse:
        """
        Parse un fichier .eml et retourne son contenu structuré
        
        Args:
            file_path: Chemin vers le fichier .eml
            
        Returns:
            ServiceResponse: Contenu structuré de l'email ou erreur
        """
        try:
            email_data = self.safe_execute("parse_email_file_logic", self._parse_email_file_logic, file_path)
            return {"success": True, "data": email_data}
        except Exception as e:
            return {"success": False, "error": f"Erreur lors du parsing: {str(e)}"}

    def _parse_email_file_logic(self, file_path: str) -> dict[str, any]:
        """Logic for parsing email file"""
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"Fichier .eml non trouvé: {file_path}")

        # Lire le fichier .eml
        with open(file_path, 'rb') as f:
            msg = self.parser.parse(f)

        # Extraire les informations de base
        email_data = {
            'subject': self._get_header(msg, 'subject', 'Sans objet'),
            'from': self._get_header(msg, 'from', 'Expéditeur inconnu'),
            'to': self._get_header(msg, 'to', 'Destinataire inconnu'),
            'cc': self._get_header(msg, 'cc', ''),
            'bcc': self._get_header(msg, 'bcc', ''),
            'date': self._get_header(msg, 'date', 'Date inconnue'),
            'message_id': self._get_header(msg, 'message-id', ''),
            'content_type': msg.get_content_type(),
            'headers': self._extract_headers(msg),
            'body': self._extract_body(msg),
            'attachments': self._extract_attachments(msg),
            'html_content': self._extract_html_content(msg),
            'text_content': self._extract_text_content(msg),
            '_file_path': str(file_path)  # Stocker le chemin pour l'extraction des pièces jointes
        }

        self.logger.info(f"Email parsé avec succès: {file_path.name}")
        return email_data

    def _get_header(self, msg: email.message.Message, header_name: str, default: str = '') -> str:
        """Extrait un header spécifique de l'email"""
        try:
            header_value = msg.get(header_name, default)
            if header_value:
                # Décoder les headers si nécessaire
                if isinstance(header_value, str):
                    return header_value
                else:
                    return str(header_value)
            return default
        except Exception:
            return default

    def _extract_headers(self, msg: email.message.Message) -> dict[str, str]:
        """Extrait tous les headers de l'email"""
        headers = {}
        for header_name, header_value in msg.items():
            try:
                headers[header_name.lower()] = str(header_value)
            except Exception:
                continue
        return headers

    def _extract_body(self, msg: email.message.Message) -> str:
        """Extrait le corps principal de l'email"""
        try:
            if msg.is_multipart():
                # Email multipart - chercher la partie texte
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        return part.get_content()
                # Si pas de texte, prendre la première partie
                return msg.get_payload()[0].get_content()
            else:
                # Email simple
                return msg.get_content()
        except Exception as e:
            self.logger.warning(f"Erreur lors de l'extraction du corps: {e}")
            return "Contenu non lisible"

    def _extract_html_content(self, msg: email.message.Message) -> str:
        """Extrait le contenu HTML de l'email"""
        try:
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/html":
                        content = part.get_content()
                        if content:
                            return content
            elif msg.get_content_type() == "text/html":
                content = msg.get_content()
                if content:
                    return content
            
            # Fallback: essayer d'extraire du contenu HTML depuis le body
            body = self._extract_body(msg)
            if body and ('<html' in body.lower() or '<body' in body.lower()):
                return body
                
            return ""
        except Exception as e:
            self.logger.warning(f"Erreur lors de l'extraction HTML: {e}")
            return ""

    def _extract_text_content(self, msg: email.message.Message) -> str:
        """Extrait le contenu texte de l'email"""
        try:
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        return part.get_content()
            elif msg.get_content_type() == "text/plain":
                return msg.get_content()
            return ""
        except Exception:
            return ""

    def _extract_attachments(self, msg: email.message.Message) -> list[AttachmentData]:
        """Extrait les pièces jointes de l'email"""
        attachments = []
        try:
            if msg.is_multipart():
                for part in msg.walk():
                    filename = part.get_filename()
                    if filename:
                        # Décoder le nom de fichier si nécessaire
                        if isinstance(filename, bytes):
                            try:
                                filename = filename.decode('utf-8')
                            except UnicodeDecodeError:
                                filename = filename.decode('latin-1')
                        
                        # Calculer la taille
                        try:
                            payload = part.get_payload(decode=True)
                            size = len(payload) if payload else 0
                        except Exception:
                            size = 0
                        
                        attachment = {
                            'filename': filename,
                            'content_type': part.get_content_type(),
                            'size': size,
                            'content_disposition': part.get('content-disposition', '')
                        }
                        attachments.append(attachment)
                        self.logger.debug(f"Pièce jointe trouvée: {filename} ({part.get_content_type()})")
        except Exception as e:
            self.logger.warning(f"Erreur lors de l'extraction des pièces jointes: {e}")
        
        return attachments

    def extract_attachment(self, email_data: EmailData, attachment_index: int) -> ServiceResponse:
        """
        Extrait une pièce jointe spécifique de l'email
        
        Args:
            email_data: Données parsées de l'email
            attachment_index: Index de la pièce jointe à extraire
            
        Returns:
            ServiceResponse: Données de la pièce jointe ou erreur
        """
        try:
            file_path = email_data.get('_file_path')  # Chemin du fichier .eml
            if not file_path:
                self.logger.error("Chemin du fichier .eml non disponible")
                return {"success": False, "error": "Chemin du fichier .eml non disponible"}

            # Re-parser le fichier pour accéder aux pièces jointes
            with open(file_path, 'rb') as f:
                msg = self.parser.parse(f)

            if not msg.is_multipart():
                self.logger.warning("Email non multipart - pas de pièces jointes")
                return {"success": False, "error": "Email non multipart - pas de pièces jointes"}

            # Trouver la pièce jointe par index
            attachment_count = 0
            for part in msg.walk():
                if part.get_filename():
                    if attachment_count == attachment_index:
                        # Extraire la pièce jointe
                        filename = part.get_filename()
                        content_type = part.get_content_type()
                        content = part.get_payload(decode=True)
                        
                        return {
                            'success': True,
                            'data': {
                                'filename': filename,
                                'content_type': content_type,
                                'content': content,
                                'size': len(content)
                            }
                        }
                    attachment_count += 1

            self.logger.warning(f"Pièce jointe index {attachment_index} non trouvée")
            return {"success": False, "error": f"Pièce jointe index {attachment_index} non trouvée"}

        except Exception as e:
            self.logger.error(f"Erreur lors de l'extraction de la pièce jointe {attachment_index}: {e}")
            return {"success": False, "error": f"Erreur lors de l'extraction de la pièce jointe {attachment_index}: {str(e)}"}

    def format_email_for_display(self, email_data: EmailData) -> ServiceResponse:
        """
        Formate les données email pour l'affichage
        
        Args:
            email_data: Données parsées de l'email
            
        Returns:
            ServiceResponse: Données formatées pour l'affichage
        """
        try:
            # Nettoyer et formater le contenu
            text_content = email_data.get('text_content', '')
            html_content = email_data.get('html_content', '')
            
            # Nettoyer le contenu HTML pour l'affichage sécurisé
            if html_content:
                # Supprimer les scripts et styles dangereux
                html_content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
                html_content = re.sub(r'<style[^>]*>.*?</style>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
                html_content = re.sub(r'on\w+\s*=', '', html_content, flags=re.IGNORECASE)

            return {
                'success': True,
                'data': {
                    'subject': email_data.get('subject', 'Sans objet'),
                    'from': email_data.get('from', 'Expéditeur inconnu'),
                    'to': email_data.get('to', 'Destinataire inconnu'),
                    'cc': email_data.get('cc', ''),
                    'bcc': email_data.get('bcc', ''),
                    'date': email_data.get('date', 'Date inconnue'),
                    'text_content': text_content,
                    'html_content': html_content,
                    'attachments': email_data.get('attachments', []),
                    'has_attachments': len(email_data.get('attachments', [])) > 0,
                    'is_html': bool(html_content),
                    'is_text': bool(text_content)
                }
            }
        except Exception as e:
            self.logger.error(f"Erreur lors du formatage de l'email: {e}")
            return {
                'success': False,
                'error': f"Erreur lors du formatage de l'email: {str(e)}"
            } 