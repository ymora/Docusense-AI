#!/usr/bin/env python3
"""
Script de nettoyage complet de la base de données DocuSense AI
Permet de nettoyer différents types de données selon les besoins
"""

import os
import sys
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any

# Ajouter le répertoire parent au path pour les imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.file import File, FileStatus
from app.models.analysis import Analysis
from app.models.queue import QueueItem, QueueStatus
from app.core.database_migration import DatabaseMigrationManager, check_database_consistency


class DatabaseCleaner:
    """Classe pour nettoyer la base de données"""
    
    def __init__(self):
        self.db = SessionLocal()
        self.cleanup_stats = {
            'files_deleted': 0,
            'analyses_deleted': 0,
            'queue_items_deleted': 0,
            'orphaned_files_marked': 0,
            'invalid_statuses_fixed': 0,
            'temp_files_cleaned': 0
        }
    
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
        print("4. ⏰ Nettoyer les tâches de queue anciennes")
        print("5. 📁 Nettoyer les fichiers temporaires")
        print("6. 🔧 Corriger les statuts invalides")
        print("7. 🚀 Nettoyage complet (toutes les opérations)")
        print("8. 💾 Créer une sauvegarde avant nettoyage")
        print("9. 🔄 Restaurer depuis une sauvegarde")
        print("0. ❌ Quitter")
        print("="*60)
    
    def get_user_choice(self) -> int:
        """Récupère le choix de l'utilisateur"""
        while True:
            try:
                choice = int(input("\nVotre choix (0-9): "))
                if 0 <= choice <= 9:
                    return choice
                else:
                    print("❌ Choix invalide. Veuillez entrer un nombre entre 0 et 9.")
            except ValueError:
                print("❌ Veuillez entrer un nombre valide.")
    
    def show_database_status(self):
        """Affiche l'état actuel de la base de données"""
        print("\n📊 ÉTAT ACTUEL DE LA BASE DE DONNÉES")
        print("-" * 40)
        
        # Compter les fichiers
        total_files = self.db.query(File).count()
        files_by_status = {}
        for status in FileStatus:
            count = self.db.query(File).filter(File.status == status).count()
            if count > 0:
                files_by_status[status.value] = count
        
        # Compter les analyses
        total_analyses = self.db.query(Analysis).count()
        
        # Compter les tâches de queue
        total_queue_items = self.db.query(QueueItem).count()
        queue_by_status = {}
        for status in QueueStatus:
            count = self.db.query(QueueItem).filter(QueueItem.status == status).count()
            if count > 0:
                queue_by_status[status.value] = count
        
        print(f"📁 Fichiers: {total_files}")
        for status, count in files_by_status.items():
            print(f"   - {status}: {count}")
        
        print(f"📋 Analyses: {total_analyses}")
        print(f"⏳ Tâches de queue: {total_queue_items}")
        for status, count in queue_by_status.items():
            print(f"   - {status}: {count}")
        
        # Vérifier la cohérence
        print("\n🔍 VÉRIFICATION DE COHÉRENCE")
        consistency_report = check_database_consistency(self.db)
        print(f"   - Fichiers valides: {consistency_report['valid_files']}")
        print(f"   - Statuts invalides: {consistency_report['invalid_statuses']}")
        print(f"   - Fichiers orphelins: {consistency_report['orphaned_files']}")
        print(f"   - Types MIME manquants: {consistency_report['missing_mime_types']}")
    
    def cleanup_orphaned_files(self):
        """Nettoie les fichiers orphelins (fichiers introuvables)"""
        print("\n🗑️  NETTOYAGE DES FICHIERS ORPHELINS")
        print("-" * 40)
        
        files = self.db.query(File).all()
        orphaned_count = 0
        
        for file in files:
            if not Path(file.path).exists():
                print(f"   ❌ Fichier introuvable: {file.name}")
                self.db.delete(file)
                orphaned_count += 1
        
        if orphaned_count > 0:
            self.db.commit()
            self.cleanup_stats['files_deleted'] += orphaned_count
            print(f"✅ {orphaned_count} fichiers orphelins supprimés")
        else:
            print("✅ Aucun fichier orphelin trouvé")
    
    def cleanup_failed_analyses(self):
        """Nettoie les analyses échouées"""
        print("\n🧪 NETTOYAGE DES ANALYSES ÉCHOUÉES")
        print("-" * 40)
        
        # Supprimer les analyses échouées
        failed_analyses = self.db.query(Analysis).filter(
            Analysis.status == "failed"
        ).all()
        
        failed_count = 0
        for analysis in failed_analyses:
            print(f"   ❌ Analyse échouée supprimée: {analysis.id}")
            self.db.delete(analysis)
            failed_count += 1
        
        if failed_count > 0:
            self.db.commit()
            self.cleanup_stats['analyses_deleted'] += failed_count
            print(f"✅ {failed_count} analyses échouées supprimées")
        else:
            print("✅ Aucune analyse échouée trouvée")
    
    def cleanup_old_queue_items(self, max_age_hours: int = 24):
        """Nettoie les tâches de queue anciennes"""
        print(f"\n⏰ NETTOYAGE DES TÂCHES DE QUEUE (plus de {max_age_hours}h)")
        print("-" * 40)
        
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        
        # Supprimer les tâches terminées anciennes
        old_completed = self.db.query(QueueItem).filter(
            QueueItem.status == QueueStatus.COMPLETED,
            QueueItem.completed_at < cutoff_time
        ).all()
        
        # Supprimer les tâches échouées anciennes
        old_failed = self.db.query(QueueItem).filter(
            QueueItem.status == QueueStatus.FAILED,
            QueueItem.updated_at < cutoff_time
        ).all()
        
        deleted_count = 0
        for item in old_completed + old_failed:
            print(f"   ⏰ Tâche ancienne supprimée: {item.id}")
            self.db.delete(item)
            deleted_count += 1
        
        if deleted_count > 0:
            self.db.commit()
            self.cleanup_stats['queue_items_deleted'] += deleted_count
            print(f"✅ {deleted_count} tâches anciennes supprimées")
        else:
            print("✅ Aucune tâche ancienne trouvée")
    
    def cleanup_temp_files(self):
        """Nettoie les fichiers temporaires"""
        print("\n📁 NETTOYAGE DES FICHIERS TEMPORAIRES")
        print("-" * 40)
        
        temp_dir = Path("temp_downloads")
        if not temp_dir.exists():
            print("✅ Aucun dossier temporaire trouvé")
            return
        
        cleaned_count = 0
        for file_path in temp_dir.iterdir():
            if file_path.is_file():
                try:
                    file_path.unlink()
                    print(f"   🗑️  Fichier temporaire supprimé: {file_path.name}")
                    cleaned_count += 1
                except Exception as e:
                    print(f"   ❌ Erreur suppression {file_path.name}: {e}")
        
        self.cleanup_stats['temp_files_cleaned'] += cleaned_count
        print(f"✅ {cleaned_count} fichiers temporaires supprimés")
    
    def fix_invalid_statuses(self):
        """Corrige les statuts invalides"""
        print("\n🔧 CORRECTION DES STATUTS INVALIDES")
        print("-" * 40)
        
        # Utiliser le système de migration existant
        migration_manager = DatabaseMigrationManager(self.db)
        results = migration_manager.run_migrations()
        
        if results['warnings']:
            for warning in results['warnings']:
                print(f"   ⚠️  {warning}")
        
        if results['migrations_applied']:
            print(f"✅ {len(results['migrations_applied'])} corrections appliquées")
        else:
            print("✅ Aucune correction nécessaire")
    
    def full_cleanup(self):
        """Effectue un nettoyage complet"""
        print("\n🚀 NETTOYAGE COMPLET EN COURS...")
        print("=" * 50)
        
        self.cleanup_orphaned_files()
        self.cleanup_failed_analyses()
        self.cleanup_old_queue_items()
        self.cleanup_temp_files()
        self.fix_invalid_statuses()
        
        print("\n" + "=" * 50)
        print("📊 RÉSUMÉ DU NETTOYAGE")
        print("=" * 50)
        for key, value in self.cleanup_stats.items():
            if value > 0:
                print(f"   - {key}: {value}")
        
        print("✅ Nettoyage complet terminé !")
    
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
                    self.cleanup_old_queue_items(hours)
                except ValueError:
                    print("❌ Valeur invalide, utilisation de 24h par défaut")
                    self.cleanup_old_queue_items()
            elif choice == 5:
                self.cleanup_temp_files()
            elif choice == 6:
                self.fix_invalid_statuses()
            elif choice == 7:
                confirm = input("⚠️  Êtes-vous sûr de vouloir effectuer un nettoyage complet ? (oui/non): ")
                if confirm.lower() in ['oui', 'o', 'yes', 'y']:
                    self.full_cleanup()
                else:
                    print("❌ Nettoyage annulé")
            elif choice == 8:
                self.create_backup()
            elif choice == 9:
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
