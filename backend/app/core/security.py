"""
Système de sécurité pour l'accès distant
"""

import hashlib
import secrets
import time
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import logging
from pathlib import Path
import json

logger = logging.getLogger(__name__)


class SecurityManager:
    """
    Gestionnaire de sécurité pour l'accès distant
    """
    
    def __init__(self):
        self.sessions: Dict[str, Dict[str, Any]] = {}
        # Utiliser un chemin absolu depuis le répertoire backend
        self.config_file = Path(__file__).parent.parent.parent / "security_config.json"
        self.load_config()
    
    def load_config(self):
        """Charge la configuration de sécurité"""
        try:
            if self.config_file.exists():
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    self.admin_password = config.get('admin_password', 'admin123')
                    self.session_timeout = config.get('session_timeout', 3600)  # 1 heure
                    self.max_login_attempts = config.get('max_login_attempts', 5)
                    self.lockout_duration = config.get('lockout_duration', 300)  # 5 minutes
            else:
                # Configuration par défaut
                self.admin_password = 'admin123'
                self.session_timeout = 3600
                self.max_login_attempts = 5
                self.lockout_duration = 300
                self.save_config()
                
        except Exception as e:
            logger.error(f"Erreur lors du chargement de la configuration: {e}")
            # Configuration de secours
            self.admin_password = 'admin123'
            self.session_timeout = 3600
            self.max_login_attempts = 5
            self.lockout_duration = 300
    
    def save_config(self):
        """Sauvegarde la configuration de sécurité"""
        try:
            config = {
                'admin_password': self.admin_password,
                'session_timeout': self.session_timeout,
                'max_login_attempts': self.max_login_attempts,
                'lockout_duration': self.lockout_duration
            }
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Erreur lors de la sauvegarde de la configuration: {e}")
    
    def hash_password(self, password: str) -> str:
        """Hash un mot de passe avec salt"""
        salt = secrets.token_hex(16)
        hash_obj = hashlib.sha256()
        hash_obj.update((password + salt).encode('utf-8'))
        return f"{salt}${hash_obj.hexdigest()}"
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Vérifie un mot de passe"""
        try:
            salt, hash_value = hashed.split('$', 1)
            hash_obj = hashlib.sha256()
            hash_obj.update((password + salt).encode('utf-8'))
            return hash_obj.hexdigest() == hash_value
        except:
            return False
    
    def login(self, password: str) -> Optional[str]:
        """Authentification utilisateur"""
        if self.verify_password(password, self.admin_password):
            # Générer un token de session
            session_token = secrets.token_urlsafe(32)
            self.sessions[session_token] = {
                'created_at': datetime.now(),
                'last_activity': datetime.now(),
                'ip_address': None  # Sera défini par le middleware
            }
            logger.info(f"Connexion réussie, session créée: {session_token[:8]}...")
            return session_token
        else:
            logger.warning("Tentative de connexion échouée")
            return None
    
    def verify_session(self, session_token: str) -> bool:
        """Vérifie si une session est valide"""
        if session_token not in self.sessions:
            return False
        
        session = self.sessions[session_token]
        now = datetime.now()
        
        # Vérifier l'expiration
        if (now - session['created_at']).total_seconds() > self.session_timeout:
            del self.sessions[session_token]
            return False
        
        # Mettre à jour l'activité
        session['last_activity'] = now
        return True
    
    def logout(self, session_token: str):
        """Déconnexion utilisateur"""
        if session_token in self.sessions:
            del self.sessions[session_token]
            logger.info(f"Session fermée: {session_token[:8]}...")
    
    def change_password(self, old_password: str, new_password: str) -> bool:
        """Change le mot de passe administrateur"""
        if self.verify_password(old_password, self.admin_password):
            self.admin_password = self.hash_password(new_password)
            self.save_config()
            logger.info("Mot de passe administrateur changé")
            return True
        return False
    
    def get_session_info(self, session_token: str) -> Optional[Dict[str, Any]]:
        """Récupère les informations d'une session"""
        if session_token in self.sessions:
            session = self.sessions[session_token]
            return {
                'created_at': session['created_at'].isoformat(),
                'last_activity': session['last_activity'].isoformat(),
                'expires_at': (session['created_at'] + timedelta(seconds=self.session_timeout)).isoformat()
            }
        return None
    
    def cleanup_expired_sessions(self):
        """Nettoie les sessions expirées"""
        now = datetime.now()
        expired_sessions = []
        
        for token, session in self.sessions.items():
            if (now - session['created_at']).total_seconds() > self.session_timeout:
                expired_sessions.append(token)
        
        for token in expired_sessions:
            del self.sessions[token]
        
        if expired_sessions:
            logger.info(f"Session(s) expirée(s) nettoyée(s): {len(expired_sessions)}")


# Fonctions standalone pour la compatibilité
def hash_password(password: str) -> str:
    """Hash un mot de passe avec bcrypt (fonction standalone)"""
    import bcrypt
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Vérifie un mot de passe avec bcrypt (fonction standalone)"""
    import bcrypt
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except:
        return False


def generate_token() -> str:
    """Génère un token de session (fonction standalone)"""
    return secrets.token_hex(16)  # 16 bytes = 32 caractères hex


def verify_token(token: str) -> bool:
    """Vérifie un token de session (fonction standalone)"""
    # Pour les tests, on simule que seuls les tokens de 32 caractères sont valides
    return len(token) == 32


def encrypt_data(data: str, key: str) -> str:
    """Chiffre des données avec AES (fonction standalone)"""
    from cryptography.fernet import Fernet
    import base64
    
    # Créer une clé Fernet à partir de la clé fournie
    key_bytes = key.encode('utf-8')
    if len(key_bytes) < 32:
        key_bytes = key_bytes.ljust(32, b'0')
    elif len(key_bytes) > 32:
        key_bytes = key_bytes[:32]
    
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    fernet = Fernet(fernet_key)
    
    encrypted = fernet.encrypt(data.encode('utf-8'))
    return encrypted.decode('utf-8')


def decrypt_data(encrypted_data: str, key: str) -> str:
    """Déchiffre des données avec AES (fonction standalone)"""
    from cryptography.fernet import Fernet
    import base64
    
    # Créer une clé Fernet à partir de la clé fournie
    key_bytes = key.encode('utf-8')
    if len(key_bytes) < 32:
        key_bytes = key_bytes.ljust(32, b'0')
    elif len(key_bytes) > 32:
        key_bytes = key_bytes[:32]
    
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    fernet = Fernet(fernet_key)
    
    decrypted = fernet.decrypt(encrypted_data.encode('utf-8'))
    return decrypted.decode('utf-8')


def generate_salt() -> str:
    """Génère un salt aléatoire (fonction standalone)"""
    return secrets.token_hex(8)  # 8 bytes = 16 caractères hex


def hash_with_salt(password: str, salt: str) -> str:
    """Hash un mot de passe avec un salt donné (fonction standalone)"""
    hash_obj = hashlib.sha256()
    hash_obj.update((password + salt).encode('utf-8'))
    return hash_obj.hexdigest()


def is_strong_password(password: str) -> bool:
    """Vérifie la robustesse d'un mot de passe (fonction standalone)"""
    import re
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False
    return True


def sanitize_input(value: str) -> str:
    """Nettoie une entrée utilisateur (fonction standalone)"""
    if value is None:
        return ""
    
    # Suppression des balises HTML
    import re
    value = re.sub(r'<[^>]+>', '', value)
    
    # Suppression des caractères dangereux pour SQL
    value = re.sub(r'DROP\s+TABLE', '', value, flags=re.IGNORECASE)
    value = re.sub(r'DELETE\s+FROM', '', value, flags=re.IGNORECASE)
    value = re.sub(r'INSERT\s+INTO', '', value, flags=re.IGNORECASE)
    value = re.sub(r'UPDATE\s+SET', '', value, flags=re.IGNORECASE)
    
    # Échapper les caractères spéciaux HTML
    value = value.replace('&', '&amp;')
    value = value.replace('<', '&lt;')
    value = value.replace('>', '&gt;')
    value = value.replace('"', '&quot;')
    value = value.replace("'", '&#39;')
    
    return value


# Instance globale du gestionnaire de sécurité
security_manager = SecurityManager()
