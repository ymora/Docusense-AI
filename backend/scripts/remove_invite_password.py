#!/usr/bin/env python3
"""
Script pour supprimer le mot de passe de l'utilisateur invite
"""

from app.core.database import get_db
from app.models.user import User

def remove_invite_password():
    """Supprime le mot de passe de l'utilisateur invite"""
    db = next(get_db())
    
    # Trouver l'utilisateur invite
    invite_user = db.query(User).filter(User.username == "invite").first()
    
    if invite_user:
        # Supprimer le mot de passe (mettre à None)
        invite_user.password_hash = None
        db.commit()
        print("✅ Mot de passe supprimé pour l'utilisateur 'invite'")
        print("📝 L'utilisateur 'invite' peut maintenant se connecter sans mot de passe")
    else:
        print("❌ Utilisateur 'invite' non trouvé")

if __name__ == "__main__":
    remove_invite_password()
