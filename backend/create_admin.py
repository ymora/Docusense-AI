#!/usr/bin/env python3
"""
Script pour créer un utilisateur administrateur
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password
from sqlalchemy.exc import IntegrityError

def create_admin_user():
    """Créer un utilisateur administrateur"""
    db = SessionLocal()
    
    try:
        # Vérifier si l'admin existe déjà
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if existing_admin:
            print("✅ L'utilisateur admin existe déjà")
            print(f"   ID: {existing_admin.id}")
            print(f"   Username: {existing_admin.username}")
            print(f"   Role: {existing_admin.role.value}")
            print(f"   Actif: {existing_admin.is_active}")
            return
        
        # Créer l'utilisateur admin
        admin_user = User(
            username="admin",
            email="admin@docusense.ai",
            password_hash=hash_password("admin123"),
            role=UserRole.ADMIN,
            is_active=True
        )
        
        db.add(admin_user)
        db.commit()
        
        print("✅ Utilisateur admin créé avec succès")
        print(f"   Username: admin")
        print(f"   Password: admin123")
        print(f"   Role: {admin_user.role.value}")
        
    except IntegrityError as e:
        print("❌ Erreur: L'utilisateur admin existe déjà")
        db.rollback()
    except Exception as e:
        print(f"❌ Erreur lors de la création de l'admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
