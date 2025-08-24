from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import jwt
import bcrypt
import secrets
import uuid

from ..models.user import User, UserRole
from ..core.config import settings
from ..core.logging import logger
# TODO: Réintégrer les broadcasts SSE après résolution des imports circulaires

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.secret_key = settings.secret_key or "your-secret-key-change-in-production"
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 30
        self.refresh_token_expire_days = 7
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Créer un token JWT d'accès"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """Créer un token JWT de rafraîchissement"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Vérifier et décoder un token JWT"""
        try:
                    # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            return payload
        except jwt.ExpiredSignatureError:
            logger.error("❌ Token expiré")
            return None
        except jwt.InvalidTokenError as e:
            logger.error(f"❌ Token invalide: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"❌ Erreur inattendue lors de la vérification du token: {str(e)}")
            return None
    
    def create_guest_user(self) -> User:
        """Créer un utilisateur invité temporaire"""
        guest_username = f"guest_{uuid.uuid4().hex[:8]}"
        
        user = User(
            username=guest_username,
            role=UserRole.GUEST,
            is_active=True
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
        return user
    
    def create_user(self, username: str, email: str, password: str, role: UserRole = UserRole.USER) -> User:
        """Créer un utilisateur avec mot de passe"""
        # Hasher le mot de passe
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(password.encode('utf-8'), salt)
        
        user = User(
            username=username,
            email=email,
            password_hash=password_hash.decode('utf-8'),
            role=role,
            is_active=True
        )
        
        try:
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            
            # TODO: Réintégrer les broadcasts SSE après résolution des imports circulaires
            
            return user
        except IntegrityError:
            self.db.rollback()
            raise ValueError("Nom d'utilisateur ou email déjà utilisé")
    
    def check_username_exists(self, username: str) -> bool:
        """Vérifier si un nom d'utilisateur existe déjà"""
        user = self.db.query(User).filter(User.username == username).first()
        return user is not None
    
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authentifier un utilisateur avec mot de passe"""
        user = self.db.query(User).filter(User.username == username).first()
        
        if not user or not user.password_hash:
            return None
        
        if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
            return None
        
        # Mettre à jour la dernière connexion
        user.last_login = datetime.utcnow()
        self.db.commit()
        
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
        return user
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Récupérer un utilisateur par ID"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Récupérer un utilisateur par nom d'utilisateur"""
        return self.db.query(User).filter(User.username == username).first()
    
    def create_admin_user(self, username: str, email: str, password: str) -> User:
        """Créer un utilisateur administrateur"""
        return self.create_user(username, email, password, UserRole.ADMIN)
    
    def delete_guest_users(self, older_than_days: int = 7) -> int:
        """Supprimer les utilisateurs invités anciens"""
        cutoff_date = datetime.utcnow() - timedelta(days=older_than_days)
        deleted_count = self.db.query(User).filter(
            User.role == UserRole.GUEST,
            User.created_at < cutoff_date
        ).delete()
        
        self.db.commit()
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
        return deleted_count
    
    def update_user(self, user_id: int, **kwargs) -> Optional[User]:
        """Mettre à jour un utilisateur"""
        user = self.get_user_by_id(user_id)
        if not user:
            return None
        
        # Mettre à jour les champs fournis
        for key, value in kwargs.items():
            if hasattr(user, key):
                if key == 'password' and value:
                    # Hasher le nouveau mot de passe
                    salt = bcrypt.gensalt()
                    password_hash = bcrypt.hashpw(value.encode('utf-8'), salt)
                    user.password_hash = password_hash.decode('utf-8')
                else:
                    setattr(user, key, value)
        
        self.db.commit()
        self.db.refresh(user)
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
        
        # TODO: Réintégrer les broadcasts SSE après résolution des imports circulaires
        
        return user
    
    def delete_user(self, user_id: int) -> bool:
        """Supprimer un utilisateur"""
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        user_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role.value,
            "is_active": user.is_active
        }
        
        self.db.delete(user)
        self.db.commit()
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
        
        # TODO: Réintégrer les broadcasts SSE après résolution des imports circulaires
        
        return True
    
    def get_all_users(self) -> list[User]:
        """Récupérer tous les utilisateurs"""
        return self.db.query(User).all()
    
    def get_active_users(self) -> list[User]:
        """Récupérer les utilisateurs actifs"""
        return self.db.query(User).filter(User.is_active == True).all()
