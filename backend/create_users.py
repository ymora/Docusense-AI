#!/usr/bin/env python3
"""
Script pour créer les utilisateurs demandés
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import get_db
from app.services.auth_service import AuthService
from app.models.user import UserRole
from app.models.user import User

def create_users():
    """Créer les utilisateurs demandés"""
    
    print("👥 Création des utilisateurs pour DocuSense AI")
    print("=" * 50)
    
    # Liste des utilisateurs à créer
    users_to_create = [
        {
            "username": "invite",
            "email": "invite@docusense.ai",
            "password": None,
            "role": UserRole.GUEST,
            "description": "Compte invité"
        },
        {
            "username": "yannick",
            "email": "yannick@docusense.ai",
            "password": "ym120879",
            "role": UserRole.USER,
            "description": "Compte utilisateur"
        }
    ]
    
    try:
        # Créer une session de base de données
        db = next(get_db())
        auth_service = AuthService(db)
        
        created_count = 0
        
        for user_info in users_to_create:
            username = user_info["username"]
            email = user_info["email"]
            password = user_info["password"]
            role = user_info["role"]
            description = user_info["description"]
            
            # Vérifier si l'utilisateur existe déjà
            existing_user = auth_service.get_user_by_username(username)
            if existing_user:
                print(f"⚠️  L'utilisateur '{username}' existe déjà")
                print(f"   Nom d'utilisateur: {existing_user.username}")
                print(f"   Email: {existing_user.email}")
                print(f"   Rôle: {existing_user.role.value}")
                print(f"   ID: {existing_user.id}")
            else:
                # Créer l'utilisateur
                if role == UserRole.GUEST:
                    # Pour les invités, créer un utilisateur sans mot de passe
                    user = User(
                        username=username,
                        email=email,
                        role=role,
                        is_active=True
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                else:
                    # Pour les utilisateurs normaux, utiliser le service d'auth
                    user = auth_service.create_user(username, email, password, role)
                
                print(f"✅ {description} créé avec succès!")
                print(f"   Nom d'utilisateur: {user.username}")
                print(f"   Email: {user.email}")
                print(f"   Rôle: {user.role.value}")
                print(f"   ID: {user.id}")
                if role != UserRole.GUEST:
                    print(f"   Mot de passe: {password}")
                created_count += 1
            
            print()  # Ligne vide pour séparer
        
        print(f"🎉 {created_count} nouvel(le)(s) utilisateur(s) créé(s)!")
        print("\n📋 Récapitulatif des comptes disponibles:")
        print("   🛡️  admin (admin) - Admin123!")
        print("   👤 yannick (user) - ym120879")
        print("   👁️  invite (guest) - Pas de mot de passe")
        print("\n🔗 Frontend: http://localhost:3000")
        print("📚 API Docs: http://localhost:8000/docs")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la création: {str(e)}")
        return False

if __name__ == "__main__":
    create_users()
