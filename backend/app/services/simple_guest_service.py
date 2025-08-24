"""
Service de gestion des invités - Approche professionnelle simplifiée
Conforme aux standards de l'industrie (GitHub, GitLab, Vercel, etc.)
"""

from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
import hashlib
import uuid
from datetime import datetime, timedelta
import logging
from ipaddress import ip_address, ip_network

from ..models.user import User, UserRole
from ..core.database import SessionLocal

logger = logging.getLogger(__name__)

class SimpleGuestService:
    """
    Service simplifié pour les sessions invités
    Inspiré des approches de GitHub, GitLab, et autres plateformes professionnelles
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_simple_fingerprint(self, user_agent: str, ip_address: str) -> str:
        """
        Génère une empreinte simple mais efficace
        Utilisé par les grands acteurs : GitHub, GitLab, Vercel, etc.
        """
        # Normaliser l'IP (masquer le dernier octet pour la vie privée)
        try:
            ip = ip_address(ip_address)
            if ip.version == 4:
                # IPv4: Masquer le dernier octet (ex: 192.168.1.xxx -> 192.168.1.0)
                network = ip_network(f"{ip}/24", strict=False)
                normalized_ip = str(network.network_address)
            else:
                # IPv6: Masquer les 64 derniers bits
                network = ip_network(f"{ip}/64", strict=False)
                normalized_ip = str(network.network_address)
        except:
            normalized_ip = "unknown"
        
        # Normaliser le User-Agent (garder seulement les parties importantes)
        ua_parts = user_agent.lower().split()
        browser_info = []
        
        for part in ua_parts:
            if any(browser in part for browser in ['chrome', 'firefox', 'safari', 'edge', 'opera']):
                browser_info.append(part.split('/')[0])  # Garder seulement le nom, pas la version
            elif 'windows' in part or 'macos' in part or 'linux' in part:
                browser_info.append(part)
        
        normalized_ua = ' '.join(set(browser_info))  # Supprimer les doublons
        
        # Créer l'empreinte
        fingerprint_data = f"{normalized_ip}:{normalized_ua}"
        return hashlib.sha256(fingerprint_data.encode()).hexdigest()[:32]  # 32 caractères suffisent
    
    def is_ip_suspicious(self, ip_address: str) -> bool:
        """
        Détection simple des IPs suspectes
        Basé sur les listes publiques utilisées par l'industrie
        """
        # Plages privées (pas suspectes, mais à noter)
        private_ranges = [
            "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "127.0.0.0/8"
        ]
        
        # Plages connues de datacenters (VPS/Cloud)
        datacenter_ranges = [
            # AWS
            "3.0.0.0/8", "13.0.0.0/8", "18.0.0.0/8", "52.0.0.0/8", "54.0.0.0/8",
            # Google Cloud
            "34.0.0.0/8", "35.0.0.0/8", "104.0.0.0/8", "130.211.0.0/16",
            # Azure
            "4.0.0.0/8", "20.0.0.0/8", "40.0.0.0/8", "104.0.0.0/8",
            # DigitalOcean
            "138.197.0.0/16", "159.203.0.0/16", "165.227.0.0/16"
        ]
        
        try:
            ip = ip_address(ip_address)
            
            # Vérifier les plages de datacenters
            for range_str in datacenter_ranges:
                if ip in ip_network(range_str):
                    return True
            
            return False
        except:
            return True  # IP invalide = suspecte
    
    def find_existing_guest_session(self, fingerprint: str) -> Optional[User]:
        """Trouve une session invité existante"""
        return self.db.query(User).filter(
            User.guest_fingerprint == fingerprint,
            User.role == UserRole.GUEST,
            User.is_active == True
        ).first()
    
    def create_guest_session(self, fingerprint: str, ip_address: str) -> User:
        """
        Crée une session invité
        Approche simple : 1 session par empreinte, limites basiques
        """
        # Vérifier si une session existe déjà
        existing_user = self.find_existing_guest_session(fingerprint)
        if existing_user:
            # Vérifier les limites globales simples
            if not existing_user.can_create_new_session():
                raise ValueError("Limite d'usage journalière atteinte (25 actions)")
            return existing_user
        
        # Détection simple d'abus
        if self.is_ip_suspicious(ip_address):
            logger.warning(f"IP suspecte détectée: {ip_address}")
            # Ne pas bloquer, juste logger (approche permissive)
        
        # Créer un nouveau compte invité
        username = f"guest_{uuid.uuid4().hex[:8]}"
        
        guest_user = User(
            username=username,
            role=UserRole.GUEST,
            is_active=True,
            guest_fingerprint=fingerprint,
            guest_session_id=str(uuid.uuid4()),
            usage_tracking={}
        )
        
        self.db.add(guest_user)
        self.db.commit()
        self.db.refresh(guest_user)
        
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # logger.info(f"Session invité créée: {guest_user.username}")
        return guest_user
    
    def get_or_create_guest_session(self, fingerprint: str, ip_address: str) -> User:
        """Obtient ou crée une session invité"""
        # Chercher une session existante
        existing_user = self.find_existing_guest_session(fingerprint)
        if existing_user:
            # Mettre à jour last_login
            existing_user.last_login = datetime.now()
            self.db.commit()
            return existing_user
        
        # Créer une nouvelle session
        return self.create_guest_session(fingerprint, ip_address)
    
    def get_guest_usage_stats(self, fingerprint: str) -> Dict[str, Any]:
        """Obtient les statistiques d'usage simples"""
        user = self.find_existing_guest_session(fingerprint)
        if not user:
            return {
                "total_usage": 0,
                "remaining_global": 25,
                "features": {}
            }
        
        total_usage = user.get_total_usage_count()
        remaining_global = max(0, 25 - total_usage)
        
        # Statistiques par fonctionnalité
        features = {}
        if user.usage_tracking:
            for feature, timestamps in user.usage_tracking.items():
                if feature != "blocked":  # Ignorer les flags de blocage
                    current_time = datetime.now()
                    recent_usage = [
                        timestamp for timestamp in timestamps
                        if current_time - datetime.fromisoformat(timestamp) < timedelta(hours=24)
                    ]
                    features[feature] = {
                        "used": len(recent_usage),
                        "remaining": max(0, 5 - len(recent_usage)),
                        "limit": 5
                    }
        
        return {
            "total_usage": total_usage,
            "remaining_global": remaining_global,
            "features": features,
            "session_id": user.guest_session_id,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None
        }
    
    def cleanup_expired_sessions(self, max_age_hours: int = 48):
        """Nettoie les sessions expirées"""
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        
        expired_users = self.db.query(User).filter(
            User.role == UserRole.GUEST,
            User.last_login < cutoff_time
        ).all()
        
        for user in expired_users:
            self.db.delete(user)
        
        self.db.commit()
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # logger.info(f"Nettoyé {len(expired_users)} sessions invités expirées")
