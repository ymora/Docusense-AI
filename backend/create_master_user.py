#!/usr/bin/env python3
"""
Script pour créer un utilisateur maître pour DocuSense AI
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.auth_service import AuthService
from app.models.user import UserRole

def create_master_user():
    """Créer un utilisateur maître"""
    
    print("🔐 Création d'un utilisateur maître pour DocuSense AI")
    print("=" * 50)
    
    # Demander les informations
    username = input("Nom d'utilisateur: ").strip()
    email = input("Email: ").strip()
    password = input("Mot de passe (minimum 8 caractères): ").strip()
    confirm_password = input("Confirmer le mot de passe: ").strip()
    
    # Validation
    if not username or len(username) < 3:
        print("❌ Le nom d'utilisateur doit contenir au moins 3 caractères")
        return False
    
    if not email or '@' not in email:
        print("❌ Email invalide")
        return False
    
    if len(password) < 8:
        print("❌ Le mot de passe doit contenir au moins 8 caractères")
        return False
    
    if password != confirm_password:
        print("❌ Les mots de passe ne correspondent pas")
        return False
    
    try:
        # Créer une session de base de données
        db = next(get_db())
        auth_service = AuthService(db)
        
        # Vérifier si l'utilisateur existe déjà
        existing_user = auth_service.get_user_by_username(username)
        if existing_user:
            print(f"❌ L'utilisateur '{username}' existe déjà")
            return False
        
        # Créer l'utilisateur maître
        user = auth_service.create_master_user(username, email, password)
        
        print(f"✅ Utilisateur maître créé avec succès!")
        print(f"   Nom d'utilisateur: {user.username}")
        print(f"   Email: {user.email}")
        print(f"   Rôle: {user.role.value}")
        print(f"   ID: {user.id}")
        print("\n🎉 Vous pouvez maintenant vous connecter avec ces identifiants!")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la création: {str(e)}")
        return False

if __name__ == "__main__":
    create_master_user()
