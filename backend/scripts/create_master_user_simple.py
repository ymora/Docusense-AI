#!/usr/bin/env python3
"""
Script simple pour créer un utilisateur maître pour DocuSense AI
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import get_db
from app.services.auth_service import AuthService

def create_master_user():
    """Créer un utilisateur maître"""
    
    print("🔐 Création d'un utilisateur maître pour DocuSense AI")
    print("=" * 50)
    
    # Informations du compte maître
    username = "admin"
    email = "admin@docusense.ai"
    password = "Admin123!"
    
    try:
        # Créer une session de base de données
        db = next(get_db())
        auth_service = AuthService(db)
        
        # Vérifier si l'utilisateur existe déjà
        existing_user = auth_service.get_user_by_username(username)
        if existing_user:
            print(f"✅ L'utilisateur maître '{username}' existe déjà")
            print(f"   Nom d'utilisateur: {existing_user.username}")
            print(f"   Email: {existing_user.email}")
            print(f"   Rôle: {existing_user.role.value}")
            print(f"   ID: {existing_user.id}")
            return True
        
        # Créer l'utilisateur maître
        user = auth_service.create_master_user(username, email, password)
        
        print(f"✅ Utilisateur maître créé avec succès!")
        print(f"   Nom d'utilisateur: {user.username}")
        print(f"   Email: {user.email}")
        print(f"   Rôle: {user.role.value}")
        print(f"   ID: {user.id}")
        print(f"   Mot de passe: {password}")
        print("\n🎉 Vous pouvez maintenant vous connecter avec ces identifiants!")
        print("   🔗 Frontend: http://localhost:3000")
        print("   📚 API Docs: http://localhost:8000/docs")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la création: {str(e)}")
        return False

if __name__ == "__main__":
    create_master_user()
