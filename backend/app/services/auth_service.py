"""
Service d'authentification centralisé pour DocuSense AI
Consolide toute la logique d'authentification et d'autorisation
"""

from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from fastapi import HTTPException, Request
import jwt
from passlib.context import CryptContext
from pydantic import ValidationError

from ..models.user import User
from ..core.config import settings
from ..core.types import ServiceResponse
from .base_service import BaseService, log_service_operation

# Configuration du hachage des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService(BaseService):
    """Service centralisé d'authentification et d'autorisation"""

    def __init__(self, db: Session):
        super().__init__(db)
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES

    @log_service_operation("verify_password")
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Vérifier un mot de passe"""
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            self.logger.error(f"Erreur lors de la vérification du mot de passe: {e}")
            return False

    @log_service_operation("get_password_hash")
    def get_password_hash(self, password: str) -> str:
        """Hasher un mot de passe"""
        return pwd_context.hash(password)

    @log_service_operation("authenticate_user")
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authentifier un utilisateur"""
        try:
            user = self.db.query(User).filter(User.username == username).first()
            if not user:
                return None
            
            if not self.verify_password(password, user.hashed_password):
                return None
            
            if not user.is_active:
                self.logger.warning(f"Tentative de connexion pour un utilisateur inactif: {username}")
                return None
            
            return user
        except Exception as e:
            self.logger.error(f"Erreur lors de l'authentification: {e}")
            return None

    @log_service_operation("create_access_token")
    def create_access_token(self, data: Dict[str, Any]) -> str:
        """Créer un token JWT"""
        try:
            to_encode = data.copy()
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
            to_encode.update({"exp": expire})
            
            encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
            return encoded_jwt
        except Exception as e:
            self.logger.error(f"Erreur lors de la création du token: {e}")
            raise HTTPException(status_code=500, detail="Erreur lors de la création du token")

    @log_service_operation("verify_token")
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Vérifier un token JWT"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            self.logger.warning("Token expiré")
            return None
        except jwt.JWTError as e:
            self.logger.error(f"Erreur JWT: {e}")
            return None

    @log_service_operation("get_current_user")
    def get_current_user(self, request: Request) -> Optional[User]:
        """Récupérer l'utilisateur actuel depuis la requête"""
        try:
            # Extraire le token de l'en-tête Authorization
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return None
            
            token = auth_header.split(" ")[1]
            payload = self.verify_token(token)
            
            if not payload:
                return None
            
            username = payload.get("sub")
            if not username:
                return None
            
            user = self.db.query(User).filter(User.username == username).first()
            if not user or not user.is_active:
                return None
            
            return user
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération de l'utilisateur: {e}")
            return None

    @log_service_operation("check_permissions")
    def check_permissions(self, user: User, resource: str, action: str) -> bool:
        """Vérifier les permissions d'un utilisateur"""
        try:
            # Logique de vérification des permissions basée sur le rôle
            if user.role == "admin":
                return True
            
            if user.role == "user":
                # Permissions pour les utilisateurs normaux
                user_permissions = {
                    "files": ["read", "upload", "analyze"],
                    "analysis": ["create", "read", "delete"],
                    "config": ["read"],
                }
                return resource in user_permissions and action in user_permissions[resource]
            
            if user.role == "guest":
                # Permissions limitées pour les invités
                guest_permissions = {
                    "files": ["read"],
                    "analysis": ["create", "read"],
                }
                return resource in guest_permissions and action in guest_permissions[resource]
            
            return False
        except Exception as e:
            self.logger.error(f"Erreur lors de la vérification des permissions: {e}")
            return False

    @log_service_operation("create_user")
    def create_user(self, username: str, email: str, password: str, role: str = "user") -> User:
        """Créer un nouvel utilisateur"""
        try:
            # Vérifier si l'utilisateur existe déjà
            existing_user = self.db.query(User).filter(
                (User.username == username) | (User.email == email)
            ).first()
            
            if existing_user:
                raise HTTPException(status_code=400, detail="Utilisateur déjà existant")
            
            # Créer le nouvel utilisateur
            hashed_password = self.get_password_hash(password)
            user = User(
                username=username,
                email=email,
                hashed_password=hashed_password,
                role=role,
                is_active=True
            )
            
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            
            self.logger.info(f"Nouvel utilisateur créé: {username}")
            return user
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Erreur lors de la création de l'utilisateur: {e}")
            raise HTTPException(status_code=500, detail="Erreur lors de la création de l'utilisateur")

    @log_service_operation("update_user")
    def update_user(self, user_id: int, updates: Dict[str, Any]) -> User:
        """Mettre à jour un utilisateur"""
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
            
            # Mettre à jour les champs autorisés
            allowed_fields = ["email", "role", "is_active"]
            for field, value in updates.items():
                if field in allowed_fields:
                    setattr(user, field, value)
            
            # Mettre à jour le mot de passe si fourni
            if "password" in updates:
                user.hashed_password = self.get_password_hash(updates["password"])
            
            self.db.commit()
            self.db.refresh(user)
            
            self.logger.info(f"Utilisateur mis à jour: {user.username}")
            return user
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Erreur lors de la mise à jour de l'utilisateur: {e}")
            raise HTTPException(status_code=500, detail="Erreur lors de la mise à jour de l'utilisateur")

    @log_service_operation("delete_user")
    def delete_user(self, user_id: int) -> bool:
        """Supprimer un utilisateur"""
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
            
            self.db.delete(user)
            self.db.commit()
            
            self.logger.info(f"Utilisateur supprimé: {user.username}")
            return True
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Erreur lors de la suppression de l'utilisateur: {e}")
            raise HTTPException(status_code=500, detail="Erreur lors de la suppression de l'utilisateur")

    @log_service_operation("get_user_by_id")
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Récupérer un utilisateur par ID"""
        try:
            return self.db.query(User).filter(User.id == user_id).first()
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération de l'utilisateur: {e}")
            return None

    @log_service_operation("get_user_by_username")
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Récupérer un utilisateur par nom d'utilisateur"""
        try:
            return self.db.query(User).filter(User.username == username).first()
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération de l'utilisateur: {e}")
            return None

    @log_service_operation("list_users")
    def list_users(self, skip: int = 0, limit: int = 100) -> list[User]:
        """Lister les utilisateurs avec pagination"""
        try:
            return self.db.query(User).offset(skip).limit(limit).all()
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération des utilisateurs: {e}")
            return []

    @log_service_operation("change_password")
    def change_password(self, user_id: int, old_password: str, new_password: str) -> bool:
        """Changer le mot de passe d'un utilisateur"""
        try:
            user = self.get_user_by_id(user_id)
            if not user:
                raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
            
            if not self.verify_password(old_password, user.hashed_password):
                raise HTTPException(status_code=400, detail="Ancien mot de passe incorrect")
            
            user.hashed_password = self.get_password_hash(new_password)
            self.db.commit()
            
            self.logger.info(f"Mot de passe changé pour l'utilisateur: {user.username}")
            return True
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Erreur lors du changement de mot de passe: {e}")
            raise HTTPException(status_code=500, detail="Erreur lors du changement de mot de passe")

# Instance singleton pour injection de dépendances
_auth_service = None

def get_auth_service(db: Session) -> AuthService:
    """Obtenir l'instance du service d'authentification"""
    global _auth_service
    if _auth_service is None:
        _auth_service = AuthService(db)
    return _auth_service
