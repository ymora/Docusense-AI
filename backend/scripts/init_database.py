#!/usr/bin/env python3
"""
Script pour initialiser la base de données DocuSense AI
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import engine, Base
from app.models import User, Analysis, File, Config

def init_database():
    """Initialiser la base de données"""
    
    print("🗄️ Initialisation de la base de données DocuSense AI")
    print("=" * 50)
    
    try:
        # Créer toutes les tables
        Base.metadata.create_all(bind=engine)
        print("✅ Tables créées avec succès!")
        
        # Créer l'utilisateur maître
        from app.core.database import get_db
        from app.services.auth_service import AuthService
        
        db = next(get_db())
        auth_service = AuthService(db)
        
        # Informations du compte maître
        username = "admin"
        email = "admin@docusense.ai"
        password = "Admin123!"
        
        # Vérifier si l'utilisateur existe déjà
        existing_user = auth_service.get_user_by_username(username)
        if existing_user:
            print(f"✅ L'utilisateur admin '{username}' existe déjà")
            print(f"   Nom d'utilisateur: {existing_user.username}")
            print(f"   Email: {existing_user.email}")
            print(f"   Rôle: {existing_user.role.value}")
            print(f"   ID: {existing_user.id}")
        else:
            # Créer l'utilisateur maître
            user = auth_service.create_admin_user(username, email, password)
            print(f"✅ Utilisateur admin créé avec succès!")
            print(f"   Nom d'utilisateur: {user.username}")
            print(f"   Email: {user.email}")
            print(f"   Rôle: {user.role.value}")
            print(f"   ID: {user.id}")
            print(f"   Mot de passe: {password}")
        
        print("\n🎉 Base de données initialisée avec succès!")
        print("   🔗 Frontend: http://localhost:3000")
        print("   📚 API Docs: http://localhost:8000/docs")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de l'initialisation: {str(e)}")
        return False

if __name__ == "__main__":
    init_database()
