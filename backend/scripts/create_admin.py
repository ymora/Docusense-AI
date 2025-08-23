#!/usr/bin/env python3
"""
Script pour créer l'utilisateur admin
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import get_db
from app.services.auth_service import AuthService
from app.models.user import UserRole

def create_admin():
    """Créer l'utilisateur admin"""
    
    print("🛡️  Création de l'utilisateur admin pour DocuSense AI")
    print("=" * 50)
    
    try:
        # Créer une session de base de données
        db = next(get_db())
        auth_service = AuthService(db)
        
        # Vérifier si l'admin existe déjà
        existing_admin = auth_service.get_user_by_username("admin")
        if existing_admin:
            print(f"⚠️  L'utilisateur admin existe déjà")
            print(f"   Nom d'utilisateur: {existing_admin.username}")
            print(f"   Email: {existing_admin.email}")
            print(f"   Rôle: {existing_admin.role.value}")
            print(f"   ID: {existing_admin.id}")
            
            # Mettre à jour le rôle si nécessaire
            if existing_admin.role != UserRole.ADMIN:
                existing_admin.role = UserRole.ADMIN
                db.commit()
                db.refresh(existing_admin)
                print(f"✅ Rôle mis à jour vers ADMIN")
        else:
            # Créer l'admin
            admin = auth_service.create_user(
                username="admin",
                email="admin@docusense.ai",
                password="Admin123!",
                role=UserRole.ADMIN
            )
            
            print(f"✅ Admin créé avec succès!")
            print(f"   Nom d'utilisateur: {admin.username}")
            print(f"   Email: {admin.email}")
            print(f"   Rôle: {admin.role.value}")
            print(f"   ID: {admin.id}")
            print(f"   Mot de passe: Admin123!")
        
        print("\n📋 Récapitulatif des comptes disponibles:")
        print("   🛡️  admin (admin) - Admin123!")
        print("   👤 yannick (user) - ym120879")
        print("   👁️  invite (guest) - Invit123!")
        print("\n🔗 Frontend: http://localhost:3000")
        print("📚 API Docs: http://localhost:8000/docs")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la création: {str(e)}")
        return False

if __name__ == "__main__":
    create_admin()
