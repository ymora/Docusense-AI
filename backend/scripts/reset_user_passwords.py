#!/usr/bin/env python3
"""
Script pour réinitialiser les mots de passe des utilisateurs principaux
"""

import bcrypt
from app.core.database import get_db
from app.models.user import User, UserRole

def hash_password(password: str) -> str:
    """Hash un mot de passe avec bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def reset_user_passwords():
    """Réinitialise les mots de passe des utilisateurs principaux"""
    db = next(get_db())
    
    # Mots de passe par défaut
    default_passwords = {
        'admin': 'admin123',
        'yannick': 'yannick123',
        'invite': 'invite123'
    }
    
    print("Réinitialisation des mots de passe...")
    
    for username, password in default_passwords.items():
        user = db.query(User).filter(User.username == username).first()
        if user:
            user.password_hash = hash_password(password)
            print(f"✅ Mot de passe mis à jour pour {username}: {password}")
        else:
            print(f"❌ Utilisateur {username} non trouvé")
    
    # Commit des changements
    db.commit()
    print("\n✅ Mots de passe réinitialisés avec succès!")
    print("\nMots de passe par défaut:")
    for username, password in default_passwords.items():
        print(f"- {username}: {password}")

if __name__ == "__main__":
    reset_user_passwords()
