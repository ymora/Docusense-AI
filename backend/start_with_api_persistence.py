"""
Script de démarrage optimisé avec persistance automatique des clés API
"""

import sys
import os
import subprocess
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migration():
    """Exécute la migration des clés API"""
    try:
        print("🔄 Migration automatique des clés API...")
        result = subprocess.run([
            sys.executable, "migrate_api_keys.py"
        ], capture_output=True, text=True, cwd=Path(__file__).parent)
        
        if result.returncode == 0:
            print("✅ Migration des clés API terminée")
            return True
        else:
            print(f"⚠️ Migration échouée: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors de la migration: {str(e)}")
        return False

def test_persistence():
    """Teste la persistance des clés API"""
    try:
        print("🔍 Test de persistance des clés API...")
        result = subprocess.run([
            sys.executable, "test_api_persistence.py"
        ], capture_output=True, text=True, cwd=Path(__file__).parent)
        
        if result.returncode == 0:
            print("✅ Test de persistance réussi")
            return True
        else:
            print(f"⚠️ Test échoué: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {str(e)}")
        return False

def start_backend():
    """Démarre le backend avec les clés API persistantes"""
    try:
        print("🚀 Démarrage du backend avec clés API persistantes...")
        print("=" * 60)
        
        # Étape 1: Migration des clés API
        if not run_migration():
            print("⚠️ Continuation malgré l'échec de la migration...")
        
        # Étape 2: Test de persistance (optionnel)
        if not test_persistence():
            print("⚠️ Continuation malgré l'échec du test...")
        
        # Étape 3: Démarrage du backend
        print("\n🎯 Démarrage du serveur backend...")
        print("   Les clés API sont maintenant persistantes entre les redémarrages")
        print("   Documentation API: http://localhost:8000/docs")
        print("   Appuyez sur Ctrl+C pour arrêter le serveur")
        print("=" * 60)
        
        # Démarrer le serveur
        subprocess.run([
            sys.executable, "main.py"
        ], cwd=Path(__file__).parent)
        
    except KeyboardInterrupt:
        print("\n🛑 Arrêt du serveur...")
    except Exception as e:
        print(f"❌ Erreur lors du démarrage: {str(e)}")
        logger.error(f"Startup failed: {str(e)}")

if __name__ == "__main__":
    start_backend() 