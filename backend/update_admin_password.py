#!/usr/bin/env python3
"""
Script pour mettre à jour le mot de passe de l'utilisateur admin
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.core.database import SessionLocal
from app.models.user import User
import bcrypt

def update_admin_password():
    """Mettre à jour le mot de passe de l'admin"""
    db = SessionLocal()
    
    try:
        # Trouver l'utilisateur admin
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            print("❌ Utilisateur admin non trouvé")
            return
        
        # Nouveau mot de passe
        new_password = "admin123"
        
        # Hasher le mot de passe avec bcrypt
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), salt)
        
        # Mettre à jour le mot de passe
        admin_user.password_hash = password_hash.decode('utf-8')
        db.commit()
        
        print("✅ Mot de passe de l'admin mis à jour avec succès")
        print(f"   Username: admin")
        print(f"   Nouveau password: {new_password}")
        print(f"   Role: {admin_user.role.value}")
        
    except Exception as e:
        print(f"❌ Erreur lors de la mise à jour du mot de passe: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_admin_password()
