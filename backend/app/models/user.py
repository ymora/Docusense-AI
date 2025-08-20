from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base
import enum
from datetime import datetime, timedelta
import uuid
import hashlib
import json

class UserRole(enum.Enum):
    GUEST = "guest"
    USER = "user"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=True)  # Null pour les invités
    role = Column(Enum(UserRole), default=UserRole.GUEST, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Nouveau: Tracking des utilisages pour les invités
    usage_tracking = Column(JSON, default=dict, nullable=True)
    
    # Nouveau: Identifiant unique pour les invités
    guest_session_id = Column(String(255), nullable=True, index=True)
    guest_fingerprint = Column(String(255), nullable=True, index=True)
    
    # Relations
    analyses = relationship("Analysis", back_populates="user")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', role='{self.role.value}')>"
    
    @property
    def is_guest(self) -> bool:
        return self.role == UserRole.GUEST
    
    @property
    def is_user(self) -> bool:
        return self.role == UserRole.USER
    
    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN
    
    def has_permission(self, permission: str) -> bool:
        """Vérifier les permissions selon le rôle"""
        permissions = {
            UserRole.GUEST: ["read_analyses", "view_pdfs", "browse_files", "view_multimedia", "create_analyses", "download_files"],
            UserRole.USER: ["read_analyses", "view_pdfs", "create_analyses", "delete_own_analyses", "browse_files", "view_multimedia", "download_files", "manage_own_config"],
            UserRole.ADMIN: ["*"]  # Toutes les permissions
        }
        
        user_permissions = permissions.get(self.role, [])
        return "*" in user_permissions or permission in user_permissions
    
    def can_use_feature(self, feature: str, limit: int = 5) -> bool:
        """Vérifier si l'utilisateur peut utiliser une fonctionnalité (limitation pour invités)"""
        if not self.is_guest:
            return True  # Pas de limitation pour utilisateurs et admins
        
        if not self.usage_tracking:
            self.usage_tracking = {}
        
        # Nettoyer les anciennes entrées (plus de 24h)
        current_time = datetime.now()
        if feature in self.usage_tracking:
            self.usage_tracking[feature] = [
                timestamp for timestamp in self.usage_tracking[feature]
                if current_time - datetime.fromisoformat(timestamp) < timedelta(hours=24)
            ]
        
        # Vérifier la limite
        current_usage = len(self.usage_tracking.get(feature, []))
        return current_usage < limit
    
    def track_feature_usage(self, feature: str):
        """Enregistrer l'utilisation d'une fonctionnalité"""
        if not self.is_guest:
            return  # Pas de tracking pour utilisateurs et admins
        
        if not self.usage_tracking:
            self.usage_tracking = {}
        
        if feature not in self.usage_tracking:
            self.usage_tracking[feature] = []
        
        self.usage_tracking[feature].append(datetime.now().isoformat())
    
    def get_feature_usage(self, feature: str) -> dict:
        """Obtenir les statistiques d'utilisation d'une fonctionnalité"""
        if not self.usage_tracking or feature not in self.usage_tracking:
            return {"used": 0, "remaining": 5, "limit": 5}
        
        current_time = datetime.now()
        recent_usage = [
            timestamp for timestamp in self.usage_tracking[feature]
            if current_time - datetime.fromisoformat(timestamp) < timedelta(hours=24)
        ]
        
        used = len(recent_usage)
        limit = 5
        remaining = max(0, limit - used)
        
        return {
            "used": used,
            "remaining": remaining,
            "limit": limit
        }
    
    def generate_guest_session_id(self) -> str:
        """Générer un identifiant unique pour la session invité"""
        if not self.guest_session_id:
            self.guest_session_id = str(uuid.uuid4())
        return self.guest_session_id
    
    def set_guest_fingerprint(self, fingerprint: str):
        """Définir l'empreinte du navigateur pour l'invité"""
        self.guest_fingerprint = fingerprint
    
    def get_total_usage_count(self) -> int:
        """Obtenir le nombre total d'utilisations toutes fonctionnalités confondues"""
        if not self.usage_tracking:
            return 0
        
        current_time = datetime.now()
        total_count = 0
        
        for feature, timestamps in self.usage_tracking.items():
            recent_usage = [
                timestamp for timestamp in timestamps
                if current_time - datetime.fromisoformat(timestamp) < timedelta(hours=24)
            ]
            total_count += len(recent_usage)
        
        return total_count
    
    def can_create_new_session(self) -> bool:
        """Vérifier si l'invité peut créer une nouvelle session (limite globale)"""
        if not self.is_guest:
            return True
        
        # Limite globale : 25 utilisations par 24h (5 fonctionnalités × 5 essais)
        return self.get_total_usage_count() < 25
