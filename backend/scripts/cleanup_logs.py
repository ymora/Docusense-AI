#!/usr/bin/env python3
"""
Script de nettoyage manuel des logs
Supprime les logs anciens et volumineux
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
import argparse

def cleanup_logs(force: bool = False, max_age_hours: int = 24, max_size_mb: int = 10):
    """
    Nettoie les logs selon les critères définis
    
    Args:
        force: Force le nettoyage même si pas nécessaire
        max_age_hours: Âge maximum en heures
        max_size_mb: Taille maximale en MB par fichier
    """
    # CORRECTION: Utiliser le dossier backend/logs au lieu de logs à la racine
    log_dir = Path("backend/logs")
    
    if not log_dir.exists():
        print("❌ Répertoire backend/logs/ non trouvé")
        return
    
    print(f"🧹 Début du nettoyage des logs...")
    print(f"   - Âge max: {max_age_hours}h")
    print(f"   - Taille max: {max_size_mb}MB par fichier")
    print(f"   - Mode forcé: {force}")
    print()
    
    now = datetime.now()
    max_age = now - timedelta(hours=max_age_hours)
    max_size_bytes = max_size_mb * 1024 * 1024
    
    cleaned_count = 0
    total_size_cleaned = 0
    
    # Analyser tous les fichiers de log
    for log_file in log_dir.glob("*.log"):
        try:
            stat = log_file.stat()
            file_age = datetime.fromtimestamp(stat.st_mtime)
            file_size = stat.st_size
            file_size_mb = file_size / (1024 * 1024)
            
            should_clean = False
            reason = ""
            
            # Vérifier l'âge du fichier
            if file_age < max_age:
                should_clean = True
                reason = "âge"
            # Vérifier la taille du fichier
            elif file_size > max_size_bytes:
                should_clean = True
                reason = "taille"
            # Nettoyage forcé
            elif force:
                should_clean = True
                reason = "forcé"
            
            # Afficher les informations du fichier
            age_hours = (now - file_age).total_seconds() / 3600
            print(f"📄 {log_file.name}")
            print(f"   - Taille: {file_size_mb:.1f}MB")
            print(f"   - Âge: {age_hours:.1f}h")
            print(f"   - Modifié: {file_age.strftime('%Y-%m-%d %H:%M:%S')}")
            
            if should_clean:
                log_file.unlink()
                cleaned_count += 1
                total_size_cleaned += file_size
                print(f"   🗑️  SUPPRIMÉ ({reason})")
            else:
                print(f"   ✅ CONSERVÉ")
            print()
            
        except Exception as e:
            print(f"❌ Erreur avec {log_file}: {e}")
            print()
    
    # Résumé
    print("=" * 50)
    if cleaned_count > 0:
        print(f"✅ Nettoyage terminé: {cleaned_count} fichiers supprimés")
        print(f"📊 Espace libéré: {total_size_cleaned / 1024 / 1024:.1f} MB")
    else:
        print("✅ Aucun fichier à nettoyer")
    
    # Statistiques finales
    remaining_files = list(log_dir.glob("*.log"))
    remaining_size = sum(f.stat().st_size for f in remaining_files)
    print(f"📈 Fichiers restants: {len(remaining_files)}")
    print(f"📈 Taille totale restante: {remaining_size / 1024 / 1024:.1f} MB")

def main():
    parser = argparse.ArgumentParser(description="Nettoyage manuel des logs")
    parser.add_argument("--force", action="store_true", help="Forcer le nettoyage de tous les logs")
    parser.add_argument("--max-age", type=int, default=24, help="Âge maximum en heures (défaut: 24)")
    parser.add_argument("--max-size", type=int, default=10, help="Taille maximale en MB (défaut: 10)")
    
    args = parser.parse_args()
    
    print("🧹 Script de nettoyage des logs DocuSense AI")
    print("=" * 50)
    
    try:
        cleanup_logs(
            force=args.force,
            max_age_hours=args.max_age,
            max_size_mb=args.max_size
        )
    except KeyboardInterrupt:
        print("\n❌ Nettoyage interrompu par l'utilisateur")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erreur lors du nettoyage: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
