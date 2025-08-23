"""
API endpoints pour l'authentification et l'accès distant
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import timedelta, datetime
import re
import hashlib
import time

from ..core.database import get_db
from ..services.auth_service import AuthService
from ..models.user import User, UserRole
from ..schemas.auth import (
    LoginRequest, 
    RegisterRequest, 
    AuthResponse, 
    UserInfo,
    GuestResponse
)
from ..core.logging import setup_logging
import logging

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

router = APIRouter(tags=["authentication"])
security = HTTPBearer()

# Rate limiting pour la sécurité
login_attempts = {}
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION = 300  # 5 minutes

def check_rate_limit(ip_address: str, username: str) -> bool:
    """Vérifier le rate limiting pour les tentatives de connexion"""
    current_time = time.time()
    key = f"{ip_address}:{username}"
    
    if key in login_attempts:
        attempts, first_attempt = login_attempts[key]
        
        # Vérifier si le lockout est expiré
        if current_time - first_attempt > LOCKOUT_DURATION:
            del login_attempts[key]
            return True
        
        # Vérifier le nombre de tentatives
        if attempts >= MAX_LOGIN_ATTEMPTS:
            logger.warning(f"Rate limit exceeded for {username} from {ip_address}")
            return False
    
    return True

def record_login_attempt(ip_address: str, username: str, success: bool):
    """Enregistrer une tentative de connexion"""
    current_time = time.time()
    key = f"{ip_address}:{username}"
    
    if success:
        # Réinitialiser les tentatives en cas de succès
        if key in login_attempts:
            del login_attempts[key]
    else:
        # Incrémenter les tentatives échouées
        if key in login_attempts:
            attempts, first_attempt = login_attempts[key]
            login_attempts[key] = (attempts + 1, first_attempt)
        else:
            login_attempts[key] = (1, current_time)

def validate_password_strength(password: str) -> bool:
    """Valider la force du mot de passe"""
    if len(password) < 8:
        return False
    
    # Au moins une lettre majuscule, une minuscule, un chiffre, un caractère spécial
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'\d', password):
        return False
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False
    
    return True

def validate_username(username: str) -> bool:
    """Valider le nom d'utilisateur"""
    # Alphanumérique + underscore, 3-20 caractères
    if not re.match(r'^[a-zA-Z0-9_]{3,20}$', username):
        return False
    return True

def validate_email(email: str) -> bool:
    """Valider l'email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
    client_request: Request = None
):
    """Connexion utilisateur avec sécurité renforcée"""
    auth_service = AuthService(db)
    
    # Récupérer l'IP du client
    ip_address = client_request.client.host if client_request and client_request.client else "unknown"
    
    # Validation des entrées
    if not request.username or not request.username.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nom d'utilisateur requis"
        )
    
    if not request.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mot de passe requis"
        )
    
    # Rate limiting
    if not check_rate_limit(ip_address, request.username):
        # Calculer le temps restant
        key = f"{ip_address}:{request.username}"
        if key in login_attempts:
            attempts, first_attempt = login_attempts[key]
            time_elapsed = time.time() - first_attempt
            time_remaining = max(0, LOCKOUT_DURATION - time_elapsed)
            minutes_remaining = int(time_remaining // 60)
            seconds_remaining = int(time_remaining % 60)
            
            if minutes_remaining > 0:
                time_message = f"{minutes_remaining} minute{'s' if minutes_remaining > 1 else ''}"
            else:
                time_message = f"{seconds_remaining} seconde{'s' if seconds_remaining > 1 else ''}"
        else:
            time_message = f"{LOCKOUT_DURATION//60} minutes"
        
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Trop de tentatives de connexion ({MAX_LOGIN_ATTEMPTS} maximum). Réessayez dans {time_message}."
        )
    
    # Vérifier si c'est l'utilisateur invité (pas de mot de passe requis)
    if request.username.lower() == "invite":
        user = db.query(User).filter(User.username == "invite").first()
        if not user:
            record_login_attempt(ip_address, request.username, False)
            logger.warning(f"Tentative de connexion invité échouée depuis {ip_address}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Utilisateur invité non trouvé"
            )
        if not user.is_active:
            record_login_attempt(ip_address, request.username, False)
            logger.warning(f"Tentative de connexion invité désactivé depuis {ip_address}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Compte invité désactivé"
            )
    else:
        # Authentifier l'utilisateur normal
        user = auth_service.authenticate_user(request.username, request.password)
        if not user:
            record_login_attempt(ip_address, request.username, False)
            logger.warning(f"Tentative de connexion échouée pour {request.username} depuis {ip_address}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Nom d'utilisateur ou mot de passe incorrect"
            )
        
        if not user.is_active:
            record_login_attempt(ip_address, request.username, False)
            logger.warning(f"Tentative de connexion compte désactivé {request.username} depuis {ip_address}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Compte désactivé"
            )
    
    # Enregistrer le succès
    record_login_attempt(ip_address, request.username, True)
    
    # Créer les tokens
    access_token = auth_service.create_access_token(
        data={"sub": str(user.id), "username": user.username, "role": user.role.value}
    )
    refresh_token = auth_service.create_refresh_token(
        data={"sub": str(user.id)}
    )
    
    logger.info(f"Connexion réussie: {user.username} depuis {ip_address}")
    
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserInfo(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role.value,
            is_active=user.is_active
        )
    )

@router.post("/register", response_model=AuthResponse)
async def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
    client_request: Request = None
):
    """Inscription utilisateur avec validation renforcée"""
    auth_service = AuthService(db)
    
    # Récupérer l'IP du client
    ip_address = client_request.client.host if client_request and client_request.client else "unknown"
    
    # Validation des entrées
    if not request.username or not request.username.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nom d'utilisateur requis"
        )
    
    if not validate_username(request.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nom d'utilisateur invalide (3-20 caractères, alphanumérique + underscore)"
        )
    
    if not request.email or not request.email.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email requis"
        )
    
    if not validate_email(request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format d'email invalide"
        )
    
    if not request.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mot de passe requis"
        )
    
    if not validate_password_strength(request.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mot de passe trop faible (minimum 8 caractères, majuscule, minuscule, chiffre, caractère spécial)"
        )
    
    try:
        # Créer l'utilisateur
        user = auth_service.create_user(
            username=request.username,
            email=request.email,
            password=request.password,
            role=UserRole.USER
        )
        
        # Créer les tokens
        access_token = auth_service.create_access_token(
            data={"sub": str(user.id), "username": user.username, "role": user.role.value}
        )
        refresh_token = auth_service.create_refresh_token(
            data={"sub": str(user.id)}
        )
        
        logger.info(f"Inscription réussie: {user.username} depuis {ip_address}")
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=UserInfo(
                id=user.id,
                username=user.username,
                email=user.email,
                role=user.role.value,
                is_active=user.is_active
            )
        )
        
    except ValueError as e:
        logger.warning(f"Tentative d'inscription échouée: {request.username} depuis {ip_address} - {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Erreur lors de l'inscription: {request.username} depuis {ip_address} - {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur interne du serveur"
        )

@router.post("/guest", response_model=GuestResponse)
async def create_guest_session(
    db: Session = Depends(get_db)
):
    """Créer une session invité temporaire"""
    auth_service = AuthService(db)
    
    # Créer un utilisateur invité temporaire
    user = auth_service.create_guest_user()
    
    # Créer un token d'accès court
    access_token = auth_service.create_access_token(
        data={"sub": str(user.id), "username": user.username, "role": user.role.value},
        expires_delta=timedelta(hours=2)  # Session courte pour les invités
    )
    
    logger.info(f"Session invité temporaire créée: {user.username}")
    
    return GuestResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserInfo(
            id=user.id,
            username=user.username,
            email=None,
            role=user.role.value,
            is_active=user.is_active
        )
    )

@router.post("/guest-login", response_model=AuthResponse)
async def login_as_guest(
    request: Request,
    db: Session = Depends(get_db)
):
    """Se connecter avec une session invité identifiée"""
    try:
        from ..services.simple_guest_service import SimpleGuestService
        
        # Extraire les informations de base (approche simple)
        user_agent = request.headers.get("user-agent", "")
        ip_address = request.client.host if request.client else "unknown"
        
        # Générer l'empreinte simple
        guest_service = SimpleGuestService(db)
        fingerprint = guest_service.generate_simple_fingerprint(user_agent, ip_address)
        
        # Obtenir ou créer la session invité
        user = guest_service.get_or_create_guest_session(fingerprint, ip_address)
        
        # Créer les tokens
        auth_service = AuthService(db)
        access_token = auth_service.create_access_token(
            data={"sub": str(user.id), "username": user.username, "role": user.role.value}
        )
        refresh_token = auth_service.create_refresh_token(
            data={"sub": str(user.id)}
        )
        
        # Mettre à jour last_login
        user.last_login = datetime.now()
        db.commit()
        
        logger.info(f"Connexion invité: {user.username} (fingerprint: {fingerprint[:16]}...)")
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=UserInfo(
                id=user.id,
                username=user.username,
                email=user.email,
                role=user.role.value,
                is_active=user.is_active
            )
        )
    except ValueError as e:
        # Limite d'usage atteinte
        raise HTTPException(
            status_code=429, 
            detail=f"Limite d'usage atteinte: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Erreur lors de la connexion invité: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de la connexion invité")

@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    """Rafraîchir le token d'accès"""
    auth_service = AuthService(db)
    
    # Vérifier le refresh token
    payload = auth_service.verify_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de rafraîchissement invalide"
        )
    
    # Récupérer l'utilisateur
    user_id = int(payload.get("sub"))
    user = auth_service.get_user_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé ou désactivé"
        )
    
    # Créer un nouveau token d'accès
    access_token = auth_service.create_access_token(
        data={"sub": str(user.id), "username": user.username, "role": user.role.value}
    )
    
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,  # Garder le même refresh token
        token_type="bearer",
        user=UserInfo(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role.value,
            is_active=user.is_active
        )
    )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Récupérer l'utilisateur connecté (fonction utilitaire)"""
    auth_service = AuthService(db)
    
    logger.info(f"🔐 Vérification du token: {credentials.credentials[:20]}...")
        
    # Vérifier le token
    payload = auth_service.verify_token(credentials.credentials)
    logger.info(f"🔐 Payload du token: {payload}")
    
    if not payload or payload.get("type") != "access":
        logger.error(f"❌ Token invalide - Payload: {payload}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide"
        )
        
    # Récupérer l'utilisateur
    user_id = int(payload.get("sub"))
    logger.info(f"🔐 User ID extrait: {user_id}")
    
    user = auth_service.get_user_by_id(user_id)
    logger.info(f"🔐 Utilisateur trouvé: {user.username if user else 'None'}")
    
    if not user or not user.is_active:
        logger.error(f"❌ Utilisateur non trouvé ou désactivé: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé ou désactivé"
        )
    
    logger.info(f"[SUCCESS] Authentification réussie pour: {user.username}")
    return user

@router.get("/me", response_model=UserInfo)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Récupérer les informations de l'utilisateur connecté"""
    return UserInfo(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role.value,
        is_active=current_user.is_active
    )

@router.post("/logout")
async def logout():
    """Déconnexion (côté client uniquement)"""
    return {"message": "Déconnexion réussie"}

@router.get("/guest-usage", response_model=Dict[str, Any])
async def get_guest_usage_stats(
    request: Request,
    db: Session = Depends(get_db)
):
    """Obtenir les statistiques d'usage pour la session invité actuelle"""
    try:
        from ..services.simple_guest_service import SimpleGuestService
        
        # Extraire les informations de base
        user_agent = request.headers.get("user-agent", "")
        ip_address = request.client.host if request.client else "unknown"
        
        # Générer l'empreinte simple
        guest_service = SimpleGuestService(db)
        fingerprint = guest_service.generate_simple_fingerprint(user_agent, ip_address)
        
        # Obtenir les statistiques
        stats = guest_service.get_guest_usage_stats(fingerprint)
        
        return {
            "success": True,
            "data": stats,
            "message": "Statistiques d'usage récupérées"
        }
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des statistiques: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération des statistiques")


@router.get("/test-auth")
async def test_authentication(
    request: Request,
    db: Session = Depends(get_db)
):
    """Endpoint de test pour diagnostiquer l'authentification"""
    try:
        # Vérifier les en-têtes
        auth_header = request.headers.get("authorization")
        user_agent = request.headers.get("user-agent", "")
        
        # Essayer de récupérer l'utilisateur connecté
        current_user = None
        auth_error = None
        
        try:
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                auth_service = AuthService(db)
                payload = auth_service.verify_token(token)
                
                if payload and payload.get("type") == "access":
                    user_id = int(payload.get("sub"))
                    current_user = auth_service.get_user_by_id(user_id)
                else:
                    auth_error = "Token invalide ou expiré"
            else:
                auth_error = "En-tête Authorization manquant ou invalide"
        except Exception as e:
            auth_error = f"Erreur lors de la vérification du token: {str(e)}"
        
        return {
            "success": True,
            "auth_header_present": bool(auth_header),
            "auth_header_value": auth_header[:50] + "..." if auth_header and len(auth_header) > 50 else auth_header,
            "user_agent": user_agent,
            "current_user": {
                "id": current_user.id,
                "username": current_user.username,
                "role": current_user.role.value,
                "is_active": current_user.is_active
            } if current_user else None,
            "auth_error": auth_error,
            "permissions": {
                "read_analyses": current_user.has_permission("read_analyses") if current_user else False,
                "create_analyses": current_user.has_permission("create_analyses") if current_user else False,
            } if current_user else None
        }
    except Exception as e:
        logger.error(f"Erreur lors du test d'authentification: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        } 