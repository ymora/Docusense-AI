#!/usr/bin/env python3
"""
Script pour supprimer un utilisateur de la base de données DocuSense AI
Gère proprement les relations avec les analyses et les logs système
"""

import os
import sys
from pathlib import Path

# Ajouter le répertoire parent au path pour les imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.user import User
from app.models.analysis import Analysis
from app.models.system_log import SystemLog
from app.models.file import File


class UserRemover:
    """Classe pour supprimer un utilisateur de la base de données"""
    
    def __init__(self):
        self.db = SessionLocal()
        self.removal_stats = {
            'user_deleted': False,
            'analyses_deleted': 0,
            'system_logs_deleted': 0,
            'files_affected': 0
        }
    
    def __del__(self):
        if hasattr(self, 'db'):
            self.db.close()
    
    def find_user(self, username: str) -> User:
        """Trouver un utilisateur par son nom d'utilisateur"""
        return self.db.query(User).filter(User.username == username).first()
    
    def list_all_users(self):
        """Lister tous les utilisateurs"""
        users = self.db.query(User).all()
        print("\n📋 LISTE DES UTILISATEURS")
        print("-" * 50)
        for user in users:
            print(f"ID: {user.id} | Username: {user.username} | Email: {user.email} | Role: {user.role.value} | Actif: {user.is_active}")
        return users
    
    def show_user_details(self, user: User):
        """Afficher les détails d'un utilisateur"""
        print(f"\n👤 DÉTAILS DE L'UTILISATEUR: {user.username}")
        print("-" * 50)
        print(f"ID: {user.id}")
        print(f"Username: {user.username}")
        print(f"Email: {user.email}")
        print(f"Role: {user.role.value}")
        print(f"Actif: {user.is_active}")
        print(f"Créé le: {user.created_at}")
        print(f"Dernière connexion: {user.last_login}")
        
        # Compter les analyses
        analyses_count = self.db.query(Analysis).filter(Analysis.user_id == user.id).count()
        print(f"Analyses associées: {analyses_count}")
        
        # Compter les logs système
        logs_count = self.db.query(SystemLog).filter(SystemLog.user_id == user.id).count()
        print(f"Logs système associés: {logs_count}")
    
    def remove_user_data(self, user: User, dry_run: bool = True):
        """Supprimer toutes les données associées à un utilisateur"""
        print(f"\n🗑️  SUPPRESSION DES DONNÉES DE L'UTILISATEUR: {user.username}")
        print("-" * 60)
        
        if dry_run:
            print("🔍 MODE SIMULATION (aucune donnée ne sera supprimée)")
        else:
            print("⚠️  MODE RÉEL (les données seront supprimées définitivement)")
        
        # 1. Supprimer les analyses associées
        analyses = self.db.query(Analysis).filter(Analysis.user_id == user.id).all()
        print(f"\n📋 Analyses à supprimer: {len(analyses)}")
        for analysis in analyses:
            print(f"  - ID: {analysis.id} | Type: {analysis.analysis_type} | Statut: {analysis.status}")
            if not dry_run:
                self.db.delete(analysis)
                self.removal_stats['analyses_deleted'] += 1
        
        # 2. Supprimer les logs système associés
        system_logs = self.db.query(SystemLog).filter(SystemLog.user_id == user.id).all()
        print(f"\n📝 Logs système à supprimer: {len(system_logs)}")
        for log in system_logs:
            print(f"  - ID: {log.id} | Type: {log.log_type} | Message: {log.message[:50]}...")
            if not dry_run:
                self.db.delete(log)
                self.removal_stats['system_logs_deleted'] += 1
        
        # 3. Supprimer l'utilisateur lui-même
        print(f"\n👤 Utilisateur à supprimer: {user.username}")
        if not dry_run:
            self.db.delete(user)
            self.removal_stats['user_deleted'] = True
        
        # 4. Valider les changements
        if not dry_run:
            try:
                self.db.commit()
                print("\n✅ Suppression effectuée avec succès!")
            except Exception as e:
                self.db.rollback()
                print(f"\n❌ Erreur lors de la suppression: {e}")
                return False
        else:
            print("\n✅ Simulation terminée - Aucune donnée supprimée")
        
        return True
    
    def show_removal_stats(self):
        """Afficher les statistiques de suppression"""
        print(f"\n📊 STATISTIQUES DE SUPPRESSION")
        print("-" * 40)
        print(f"Utilisateur supprimé: {'✅' if self.removal_stats['user_deleted'] else '❌'}")
        print(f"Analyses supprimées: {self.removal_stats['analyses_deleted']}")
        print(f"Logs système supprimés: {self.removal_stats['system_logs_deleted']}")
        print(f"Fichiers affectés: {self.removal_stats['files_affected']}")
    
    def confirm_removal(self, username: str) -> bool:
        """Demander confirmation pour la suppression"""
        print(f"\n⚠️  ATTENTION: Vous êtes sur le point de supprimer l'utilisateur '{username}'")
        print("Cette action est IRREVERSIBLE et supprimera:")
        print("  • Toutes les analyses associées à cet utilisateur")
        print("  • Tous les logs système associés à cet utilisateur")
        print("  • L'utilisateur lui-même")
        print("\nLes fichiers uploadés ne seront PAS supprimés.")
        
        while True:
            confirm = input(f"\nÊtes-vous sûr de vouloir supprimer '{username}' ? (oui/non): ").lower().strip()
            if confirm in ['oui', 'o', 'yes', 'y']:
                return True
            elif confirm in ['non', 'n', 'no']:
                return False
            else:
                print("❌ Veuillez répondre 'oui' ou 'non'.")


def main():
    """Fonction principale"""
    print("🗑️  SCRIPT DE SUPPRESSION D'UTILISATEUR - DOCUSENSE AI")
    print("=" * 60)
    
    remover = UserRemover()
    
    # Lister tous les utilisateurs
    users = remover.list_all_users()
    
    if not users:
        print("❌ Aucun utilisateur trouvé dans la base de données.")
        return
    
    # Demander le nom d'utilisateur à supprimer
    print(f"\n🎯 UTILISATEUR À SUPPRIMER")
    print("-" * 30)
    username = input("Entrez le nom d'utilisateur à supprimer (ou 'marjorie' par défaut): ").strip()
    
    if not username:
        username = "marjorie"
    
    # Trouver l'utilisateur
    user = remover.find_user(username)
    
    if not user:
        print(f"❌ Utilisateur '{username}' non trouvé dans la base de données.")
        return
    
    # Afficher les détails de l'utilisateur
    remover.show_user_details(user)
    
    # Demander confirmation
    if not remover.confirm_removal(username):
        print("❌ Suppression annulée.")
        return
    
    # Effectuer une simulation d'abord
    print("\n🔍 SIMULATION DE LA SUPPRESSION...")
    remover.remove_user_data(user, dry_run=True)
    
    # Demander confirmation finale
    print(f"\n⚠️  CONFIRMATION FINALE")
    print("-" * 30)
    final_confirm = input("Voulez-vous procéder à la suppression réelle ? (oui/non): ").lower().strip()
    
    if final_confirm in ['oui', 'o', 'yes', 'y']:
        print("\n🗑️  SUPPRESSION EN COURS...")
        success = remover.remove_user_data(user, dry_run=False)
        
        if success:
            remover.show_removal_stats()
            print(f"\n✅ L'utilisateur '{username}' a été supprimé avec succès!")
        else:
            print(f"\n❌ Erreur lors de la suppression de l'utilisateur '{username}'.")
    else:
        print("❌ Suppression annulée.")


if __name__ == "__main__":
    main()
