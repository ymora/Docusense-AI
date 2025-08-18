# -*- coding: utf-8 -*-

# CODE MORT EXTRAIT DE: backend/app/middleware/auth_middleware.py
# Fonctions extraites: 3
# Lignes totales extraites: 28
# Date d'extraction: 2025-08-11 01:32:24

# =============================================================================
# FONCTIONS MORTES EXTRAITES
# =============================================================================


# =============================================================================
# FONCTION: get_current_session
# Lignes originales: 22-33
# =============================================================================

    def get_current_session(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> str:
        """Vérifie et retourne le token de session (obligatoire)"""
        session_token = credentials.credentials
        
        if not security_manager.verify_session(session_token):
            raise HTTPException(
                status_code=401,
                detail="Session invalide ou expirée",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return session_token


# =============================================================================
# FONCTION: get_current_session_optional
# Lignes originales: 36-46
# =============================================================================

    def get_current_session_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[str]:
        """Vérifie et retourne le token de session (optionnel)"""
        if not credentials:
            return None
        
        session_token = credentials.credentials
        
        if not security_manager.verify_session(session_token):
            return None  # Retourne None si la session est invalide ou expirée
        
        return session_token


# =============================================================================
# FONCTION: require_admin
# Lignes originales: 49-53
# =============================================================================

    def require_admin(session_token: str = Depends(get_current_session)) -> str:
        """Vérifie que l'utilisateur a les droits administrateur"""
        # Pour l'instant, tous les utilisateurs authentifiés sont admin
        # À étendre selon les besoins
        return session_token

