#!/usr/bin/env python3
"""
Script de nettoyage complet de la base de données DocuSense AI
Utilise le service de nettoyage unifié pour une meilleure organisation
"""

import os
import sys
from pathlib import Path

# Ajouter le répertoire parent au path pour les imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.services.unified_cleanup_service import UnifiedCleanupService


class DatabaseCleaner:
    """Classe pour nettoyer la base de données - Utilise le service unifié"""
    
    def __init__(self):
        self.db = SessionLocal()
        self.cleanup_service = UnifiedCleanupService(self.db)
    
    def __del__(self):
        if hasattr(self, 'db'):
            self.db.close()
    
    def show_menu(self):
        """Affiche le menu de nettoyage"""
        print("\n" + "="*60)
        print("🧹 NETTOYAGE DE LA BASE DE DONNÉES DOCUSENSE AI")
        print("="*60)
        print("1. 🔍 Afficher l'état actuel de la base de données")
        print("2. 🗑️  Nettoyer les fichiers orphelins (fichiers introuvables)")
        print("3. 🧪 Nettoyer les analyses échouées")
        print("4. ⏰ Nettoyer les analyses anciennes")
        print("5. 📁 Nettoyer les fichiers temporaires")
        print("6. 📝 Nettoyer les fichiers de logs")
        print("7. 🗂️  Nettoyer le cache")
        print("8. 🎬 Nettoyer les anciennes conversions")
        print("9. 🔧 Corriger les statuts invalides")
        print("10. 🚀 Nettoyage complet (toutes les opérations)")
        print("11. 💾 Créer une sauvegarde avant nettoyage")
        print("12. 🔄 Restaurer depuis une sauvegarde")
        print("0. ❌ Quitter")
        print("="*60)
    
    def get_user_choice(self) -> int:
        """Récupère le choix de l'utilisateur"""
        while True:
            try:
                choice = int(input("\nVotre choix (0-12): "))
                if 0 <= choice <= 12:
                    return choice
                else:
                    print("❌ Choix invalide. Veuillez entrer un nombre entre 0 et 12.")
            except ValueError:
                print("❌ Veuillez entrer un nombre valide.")
    
    def show_database_status(self):
        """Affiche l'état actuel de la base de données"""
        print("\n📊 ÉTAT ACTUEL DE LA BASE DE DONNÉES")
        print("-" * 40)
        
        # Utiliser le service unifié pour obtenir les statistiques
        stats = self.cleanup_service.get_cleanup_stats()
        
        db_stats = stats['database']
        temp_stats = stats['temp_files']
        
        print(f"📁 Fichiers: {db_stats['total_files']}")
        for status, count in db_stats['files_by_status'].items():
            print(f"   - {status}: {count}")
        
        print(f"📋 Analyses: {db_stats['total_analyses']}")
        for status, count in db_stats['analyses_by_status'].items():
            print(f"   - {status}: {count}")
        
        print(f"🗂️ Fichiers temporaires: {temp_stats['count']} ({temp_stats['size_mb']} MB)")
        
        # Vérifier la cohérence
        print("\n🔍 VÉRIFICATION DE COHÉRENCE")
        consistency_report = check_database_consistency(self.db)
        print(f"   - Fichiers valides: {consistency_report['valid_files']}")
        print(f"   - Statuts invalides: {consistency_report['invalid_statuses']}")
        print(f"   - Fichiers orphelins: {consistency_report['orphaned_files']}")
        print(f"   - Types MIME manquants: {consistency_report['missing_mime_types']}")
    
    def cleanup_orphaned_files(self, directory_path: str = None):
        """Nettoie les fichiers orphelins (fichiers introuvables)"""
        print("\n🗑️  NETTOYAGE DES FICHIERS ORPHELINS")
        print("-" * 40)
        
        count = self.cleanup_service.cleanup_orphaned_files(directory_path)
        
        if count > 0:
            print(f"✅ {count} fichiers orphelins marqués")
        else:
            print("✅ Aucun fichier orphelin trouvé")
        
        return count
    
    def cleanup_failed_analyses(self, max_age_hours: int = 24):
        """Nettoie les analyses échouées"""
        print(f"\n🧪 NETTOYAGE DES ANALYSES ÉCHOUÉES (plus de {max_age_hours}h)")
        print("-" * 40)
        
        count = self.cleanup_service.cleanup_failed_analyses(max_age_hours)
        
        if count > 0:
            print(f"✅ {count} analyses échouées supprimées")
        else:
            print("✅ Aucune analyse échouée trouvée")
        
        return count
    
    def cleanup_old_analyses(self, max_age_hours: int = 168):
        """Nettoie les analyses anciennes"""
        print(f"\n⏰ NETTOYAGE DES ANALYSES ANCIENNES (plus de {max_age_hours}h)")
        print("-" * 40)
        
        count = self.cleanup_service.cleanup_old_analyses(max_age_hours)
        
        if count > 0:
            print(f"✅ {count} analyses anciennes supprimées")
        else:
            print("✅ Aucune analyse ancienne trouvée")
        
        return count
    
    def cleanup_temp_files(self, max_age_hours: int = 1, max_total_size_gb: int = 2):
        """Nettoie les fichiers temporaires"""
        print(f"\n📁 NETTOYAGE DES FICHIERS TEMPORAIRES (max {max_age_hours}h, {max_total_size_gb}GB)")
        print("-" * 40)
        
        result = self.cleanup_service.cleanup_temp_files(max_age_hours, max_total_size_gb)
        
        print(f"✅ {result['files_deleted']} fichiers temporaires supprimés")
        print(f"📊 Taille restante: {result['remaining_size_gb']} GB")
        
        return result
    
    def fix_invalid_statuses(self):
        """Corrige les statuts invalides"""
        print("\n🔧 CORRECTION DES STATUTS INVALIDES")
        print("-" * 40)
        
        result = self.cleanup_service.fix_invalid_statuses()
        
        print(f"✅ {result['items_fixed']} statuts corrigés")
        
        return result
    
    def cleanup_logs(self, max_age_days: int = 7, max_size_mb: int = 100):
        """Nettoie les fichiers de logs"""
        print(f"\n📝 NETTOYAGE DES LOGS (max {max_age_days}j, {max_size_mb}MB)")
        print("-" * 40)
        
        result = self.cleanup_service.cleanup_logs(max_age_days, max_size_mb)
        
        print(f"✅ {result['files_deleted']} fichiers de logs supprimés")
        print(f"📊 Taille restante: {result['remaining_size_mb']} MB")
        
        return result
    
    def cleanup_cache(self, max_age_hours: int = 24):
        """Nettoie le cache"""
        print(f"\n🗂️ NETTOYAGE DU CACHE (max {max_age_hours}h)")
        print("-" * 40)
        
        result = self.cleanup_service.cleanup_cache(max_age_hours)
        
        return result
    
    def cleanup_conversions(self, max_age_hours: int = 24):
        """Nettoie les anciennes conversions"""
        print(f"\n🎬 NETTOYAGE DES CONVERSIONS (max {max_age_hours}h)")
        print("-" * 40)
        
        result = self.cleanup_service.cleanup_old_conversions(max_age_hours)
        
        print(f"✅ {result['items_deleted']} conversions supprimées")
        
        return result
    
    def full_cleanup(self):
        """Effectue un nettoyage complet"""
        print("\n🚀 NETTOYAGE COMPLET EN COURS...")
        print("=" * 50)
        
        result = self.cleanup_service.full_cleanup()
        
        print("\n" + "=" * 50)
        print("📊 RÉSUMÉ DU NETTOYAGE")
        print("=" * 50)
        
        total_stats = result['total_stats']
        for key, value in total_stats.items():
            if value > 0:
                print(f"   - {key}: {value}")
        
        print("✅ Nettoyage complet terminé !")
        
        return result
    
    def create_backup(self):
        """Crée une sauvegarde de la base de données"""
        print("\n💾 CRÉATION D'UNE SAUVEGARDE")
        print("-" * 40)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"docusense_backup_{timestamp}.db"
        
        try:
            shutil.copy2("docusense.db", backup_path)
            print(f"✅ Sauvegarde créée: {backup_path}")
        except Exception as e:
            print(f"❌ Erreur création sauvegarde: {e}")
    
    def restore_backup(self):
        """Restaure une sauvegarde"""
        print("\n🔄 RESTAURATION D'UNE SAUVEGARDE")
        print("-" * 40)
        
        # Lister les sauvegardes disponibles
        backup_files = list(Path(".").glob("docusense_backup_*.db"))
        
        if not backup_files:
            print("❌ Aucune sauvegarde trouvée")
            return
        
        print("Sauvegardes disponibles:")
        for i, backup in enumerate(backup_files, 1):
            print(f"   {i}. {backup.name}")
        
        try:
            choice = int(input("\nChoisissez une sauvegarde (numéro): ")) - 1
            if 0 <= choice < len(backup_files):
                backup_path = backup_files[choice]
                
                # Créer une sauvegarde de l'état actuel
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                current_backup = f"docusense_current_{timestamp}.db"
                shutil.copy2("docusense.db", current_backup)
                
                # Restaurer la sauvegarde
                shutil.copy2(backup_path, "docusense.db")
                print(f"✅ Base de données restaurée depuis {backup_path.name}")
                print(f"💾 Sauvegarde de l'état actuel: {current_backup}")
            else:
                print("❌ Choix invalide")
        except (ValueError, IndexError):
            print("❌ Choix invalide")
        except Exception as e:
            print(f"❌ Erreur restauration: {e}")
    
    def run(self):
        """Lance l'interface de nettoyage"""
        while True:
            self.show_menu()
            choice = self.get_user_choice()
            
            if choice == 0:
                print("\n👋 Au revoir !")
                break
            elif choice == 1:
                self.show_database_status()
            elif choice == 2:
                self.cleanup_orphaned_files()
            elif choice == 3:
                self.cleanup_failed_analyses()
            elif choice == 4:
                hours = input("Âge maximum en heures (défaut: 24): ")
                try:
                    hours = int(hours) if hours.strip() else 24
                    self.cleanup_old_analyses(hours)
                except ValueError:
                    print("❌ Valeur invalide, utilisation de 24h par défaut")
                    self.cleanup_old_analyses()
            elif choice == 5:
                self.cleanup_temp_files()
            elif choice == 6:
                days = input("Âge maximum en jours (défaut: 7): ")
                size = input("Taille maximale en MB (défaut: 100): ")
                try:
                    days = int(days) if days.strip() else 7
                    size = int(size) if size.strip() else 100
                    self.cleanup_logs(days, size)
                except ValueError:
                    print("❌ Valeur invalide, utilisation des valeurs par défaut")
                    self.cleanup_logs()
            elif choice == 7:
                hours = input("Âge maximum en heures (défaut: 24): ")
                try:
                    hours = int(hours) if hours.strip() else 24
                    self.cleanup_cache(hours)
                except ValueError:
                    print("❌ Valeur invalide, utilisation de 24h par défaut")
                    self.cleanup_cache()
            elif choice == 8:
                hours = input("Âge maximum en heures (défaut: 24): ")
                try:
                    hours = int(hours) if hours.strip() else 24
                    self.cleanup_conversions(hours)
                except ValueError:
                    print("❌ Valeur invalide, utilisation de 24h par défaut")
                    self.cleanup_conversions()
            elif choice == 9:
                self.fix_invalid_statuses()
            elif choice == 10:
                confirm = input("⚠️  Êtes-vous sûr de vouloir effectuer un nettoyage complet ? (oui/non): ")
                if confirm.lower() in ['oui', 'o', 'yes', 'y']:
                    self.full_cleanup()
                else:
                    print("❌ Nettoyage annulé")
            elif choice == 11:
                self.create_backup()
            elif choice == 12:
                self.restore_backup()
            
            input("\nAppuyez sur Entrée pour continuer...")


if __name__ == "__main__":
    print("🧹 Script de nettoyage de la base de données DocuSense AI")
    print("Version: 1.0")
    
    # Vérifier que la base de données existe
    if not Path("docusense.db").exists():
        print("❌ Base de données 'docusense.db' introuvable")
        print("Assurez-vous d'exécuter ce script depuis le répertoire backend/")
        sys.exit(1)
    
    cleaner = DatabaseCleaner()
    cleaner.run()
