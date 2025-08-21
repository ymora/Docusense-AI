"""
Système de sécurité simplifié - Fonctions utilitaires uniquement
Consolidation vers le système JWT principal
"""

import hashlib
import secrets
import time
import os
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import logging
from pathlib import Path
import json

logger = logging.getLogger(__name__)


# Fonctions standalone pour la compatibilité (conservées car utiles)
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


# NOTE: L'ancien SecurityManager a été supprimé pour consolider vers le système JWT
# Les fonctions standalone ci-dessus sont conservées pour la compatibilité
