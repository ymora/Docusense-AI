"""
Système de validation unifié pour DocuSense AI
Centralise toutes les validations d'entrées et de données
"""

import re
import os
from pathlib import Path
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, validator, Field
from fastapi import HTTPException

class UnifiedValidator:
    """Validateur unifié pour toutes les entrées"""
    
    # Constantes de validation
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
    MAX_FILENAME_LENGTH = 255
    ALLOWED_FILE_EXTENSIONS = {
        # Documents
        '.pdf', '.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls',
        '.txt', '.rtf', '.md', '.csv',
        # Images
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.svg',
        '.tiff', '.bmp', '.ico', '.raw',
        # Vidéos
        '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv',
        # Audio
        '.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'
    }
    
    ALLOWED_PROMPT_TYPES = [
        'general', 'summary', 'extraction', 'comparison', 
        'classification', 'universal', 'construction', 'legal'
    ]
    
    ALLOWED_PROVIDERS = [
        'openai', 'claude', 'mistral', 'gemini', 'ollama'
    ]
    
    ALLOWED_ROLES = ['guest', 'user', 'admin']
    
    @staticmethod
    def validate_file_path(path: str) -> bool:
        """Valider un chemin de fichier"""
        try:
            # Vérifications de sécurité
            if '..' in path or path.startswith('/'):
                return False
            
            # Vérifier la longueur
            if len(path) > UnifiedValidator.MAX_FILENAME_LENGTH:
                return False
            
            # Vérifier les caractères dangereux
            dangerous_chars = ['<', '>', ':', '"', '|', '?', '*']
            if any(char in path for char in dangerous_chars):
                return False
            
            return True
        except Exception:
            return False
    
    @staticmethod
    def validate_file_extension(filename: str) -> bool:
        """Valider l'extension d'un fichier"""
        try:
            extension = Path(filename).suffix.lower()
            return extension in UnifiedValidator.ALLOWED_FILE_EXTENSIONS
        except Exception:
            return False
    
    @staticmethod
    def validate_file_size(size: int) -> bool:
        """Valider la taille d'un fichier"""
        return 0 < size <= UnifiedValidator.MAX_FILE_SIZE
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Valider un email"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def validate_username(username: str) -> bool:
        """Valider un nom d'utilisateur"""
        # 3-50 caractères, alphanumériques et tirets
        pattern = r'^[a-zA-Z0-9_-]{3,50}$'
        return bool(re.match(pattern, username))
    
    @staticmethod
    def validate_password(password: str) -> bool:
        """Valider un mot de passe"""
        # Au moins 8 caractères, avec majuscule, minuscule, chiffre
        if len(password) < 8:
            return False
        
        if not re.search(r'[A-Z]', password):
            return False
        
        if not re.search(r'[a-z]', password):
            return False
        
        if not re.search(r'\d', password):
            return False
        
        return True
    
    @staticmethod
    def validate_prompt_type(prompt_type: str) -> bool:
        """Valider un type de prompt"""
        return prompt_type in UnifiedValidator.ALLOWED_PROMPT_TYPES
    
    @staticmethod
    def validate_provider(provider: str) -> bool:
        """Valider un provider IA"""
        return provider in UnifiedValidator.ALLOWED_PROVIDERS
    
    @staticmethod
    def validate_role(role: str) -> bool:
        """Valider un rôle utilisateur"""
        return role in UnifiedValidator.ALLOWED_ROLES
    
    @staticmethod
    def validate_api_key(api_key: str, provider: str) -> bool:
        """Valider une clé API"""
        if not api_key or len(api_key) < 10:
            return False
        
        # Validation spécifique par provider
        if provider == 'openai' and not api_key.startswith('sk-'):
            return False
        
        if provider == 'claude' and not api_key.startswith('sk-ant-'):
            return False
        
        return True

# Modèles Pydantic pour validation automatique

class FileUploadRequest(BaseModel):
    """Modèle de validation pour l'upload de fichiers"""
    filename: str = Field(..., min_length=1, max_length=255)
    file_size: int = Field(..., gt=0, le=100*1024*1024)
    file_type: str = Field(..., min_length=1, max_length=100)
    
    @validator('filename')
    def validate_filename(cls, v):
        if not UnifiedValidator.validate_file_path(v):
            raise ValueError('Nom de fichier invalide')
        if not UnifiedValidator.validate_file_extension(v):
            raise ValueError('Type de fichier non autorisé')
        return v
    
    @validator('file_size')
    def validate_file_size(cls, v):
        if not UnifiedValidator.validate_file_size(v):
            raise ValueError('Taille de fichier non autorisée')
        return v

class AnalysisRequest(BaseModel):
    """Modèle de validation pour les requêtes d'analyse"""
    file_id: int = Field(..., gt=0)
    prompt_type: str = Field(..., min_length=1, max_length=50)
    provider: str = Field(..., min_length=1, max_length=20)
    custom_prompt: Optional[str] = Field(None, max_length=2000)
    
    @validator('prompt_type')
    def validate_prompt_type(cls, v):
        if not UnifiedValidator.validate_prompt_type(v):
            raise ValueError('Type de prompt non autorisé')
        return v
    
    @validator('provider')
    def validate_provider(cls, v):
        if not UnifiedValidator.validate_provider(v):
            raise ValueError('Provider non autorisé')
        return v

class UserCreateRequest(BaseModel):
    """Modèle de validation pour la création d'utilisateur"""
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=8, max_length=100)
    role: str = Field(default='user', min_length=1, max_length=20)
    
    @validator('username')
    def validate_username(cls, v):
        if not UnifiedValidator.validate_username(v):
            raise ValueError('Nom d\'utilisateur invalide')
        return v
    
    @validator('email')
    def validate_email(cls, v):
        if not UnifiedValidator.validate_email(v):
            raise ValueError('Email invalide')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if not UnifiedValidator.validate_password(v):
            raise ValueError('Mot de passe trop faible')
        return v
    
    @validator('role')
    def validate_role(cls, v):
        if not UnifiedValidator.validate_role(v):
            raise ValueError('Rôle non autorisé')
        return v

class ProviderConfigRequest(BaseModel):
    """Modèle de validation pour la configuration des providers"""
    provider: str = Field(..., min_length=1, max_length=20)
    api_key: str = Field(..., min_length=10, max_length=500)
    model: Optional[str] = Field(None, max_length=100)
    priority: Optional[int] = Field(None, ge=1, le=10)
    
    @validator('provider')
    def validate_provider(cls, v):
        if not UnifiedValidator.validate_provider(v):
            raise ValueError('Provider non autorisé')
        return v
    
    @validator('api_key')
    def validate_api_key(cls, v, values):
        provider = values.get('provider')
        if provider and not UnifiedValidator.validate_api_key(v, provider):
            raise ValueError('Clé API invalide pour ce provider')
        return v

# Décorateurs de validation

def validate_file_upload(func):
    """Décorateur pour valider les uploads de fichiers"""
    def wrapper(*args, **kwargs):
        # Validation automatique via Pydantic
        if 'file' in kwargs:
            file = kwargs['file']
            request = FileUploadRequest(
                filename=file.filename,
                file_size=file.size,
                file_type=file.content_type
            )
        
        return func(*args, **kwargs)
    return wrapper

def validate_analysis_request(func):
    """Décorateur pour valider les requêtes d'analyse"""
    def wrapper(*args, **kwargs):
        # Validation automatique via Pydantic
        if 'request' in kwargs:
            request_data = kwargs['request']
            AnalysisRequest(**request_data)
        
        return func(*args, **kwargs)
    return wrapper

def validate_user_data(func):
    """Décorateur pour valider les données utilisateur"""
    def wrapper(*args, **kwargs):
        # Validation automatique via Pydantic
        if 'user_data' in kwargs:
            user_data = kwargs['user_data']
            UserCreateRequest(**user_data)
        
        return func(*args, **kwargs)
    return wrapper

# Fonctions utilitaires de validation

def sanitize_filename(filename: str) -> str:
    """Nettoyer un nom de fichier"""
    # Supprimer les caractères dangereux
    dangerous_chars = ['<', '>', ':', '"', '|', '?', '*', '/', '\\']
    for char in dangerous_chars:
        filename = filename.replace(char, '_')
    
    # Limiter la longueur
    if len(filename) > UnifiedValidator.MAX_FILENAME_LENGTH:
        name, ext = os.path.splitext(filename)
        max_name_length = UnifiedValidator.MAX_FILENAME_LENGTH - len(ext)
        filename = name[:max_name_length] + ext
    
    return filename

def validate_directory_path(path: str) -> bool:
    """Valider un chemin de répertoire"""
    try:
        # Vérifications de sécurité
        if '..' in path:
            return False
        
        # Vérifier que le chemin existe et est un répertoire
        path_obj = Path(path)
        return path_obj.exists() and path_obj.is_dir()
    except Exception:
        return False

def validate_json_data(data: Dict[str, Any]) -> bool:
    """Valider des données JSON"""
    try:
        # Vérifier que c'est un dictionnaire
        if not isinstance(data, dict):
            return False
        
        # Vérifier la profondeur maximale (éviter les attaques par récursion)
        def check_depth(obj, current_depth=0, max_depth=10):
            if current_depth > max_depth:
                return False
            
            if isinstance(obj, dict):
                return all(check_depth(v, current_depth + 1, max_depth) for v in obj.values())
            elif isinstance(obj, list):
                return all(check_depth(item, current_depth + 1, max_depth) for item in obj)
            else:
                return True
        
        return check_depth(data)
    except Exception:
        return False
