"""
Script de test pour vérifier la persistance des clés API
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import SessionLocal
from app.services.config_service import ConfigService
from app.core.config import settings
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_api_key_persistence():
    """Test de persistance des clés API"""
    
    print("🔍 Test de persistance des clés API")
    print("=" * 50)
    
    # Créer une session de base de données
    db = SessionLocal()
    
    try:
        config_service = ConfigService(db)
        
        # Test 1: Vérifier les clés actuelles
        print("\n📋 1. Clés API actuelles dans la base de données:")
        providers = ['openai', 'claude', 'anthropic', 'mistral']
        
        for provider in providers:
            api_key = config_service.get_ai_provider_key(provider)
            if api_key:
                print(f"   ✅ {provider}: {'*' * (len(api_key) - 8) + api_key[-8:]}")
            else:
                print(f"   ❌ {provider}: Aucune clé trouvée")
        
        # Test 2: Sauvegarder une clé de test
        print("\n💾 2. Sauvegarde d'une clé de test...")
        test_key = "sk-test123456789abcdef"
        success = config_service.set_ai_provider_key("openai", test_key)
        
        if success:
            print("   ✅ Clé de test sauvegardée avec succès")
        else:
            print("   ❌ Échec de la sauvegarde")
            return
        
        # Test 3: Vérifier que la clé est bien persistée
        print("\n🔍 3. Vérification de la persistance...")
        saved_key = config_service.get_ai_provider_key("openai")
        
        if saved_key == test_key:
            print("   ✅ Clé correctement persistée dans la base de données")
        else:
            print(f"   ❌ Clé incorrecte: attendue '{test_key}', trouvée '{saved_key}'")
            return
        
        # Test 4: Vérifier que la clé est chargée dans les settings
        print("\n⚙️ 4. Vérification du chargement dans les settings...")
        config_service.load_api_keys_from_database()
        
        if settings.openai_api_key == test_key:
            print("   ✅ Clé correctement chargée dans les settings")
        else:
            print(f"   ❌ Clé non chargée dans les settings: {settings.openai_api_key}")
            return
        
        # Test 5: Simuler un redémarrage
        print("\n🔄 5. Simulation d'un redémarrage...")
        
        # Réinitialiser les settings
        settings.openai_api_key = None
        
        # Recharger depuis la base de données
        config_service.load_api_keys_from_database()
        
        if settings.openai_api_key == test_key:
            print("   ✅ Clé correctement restaurée après redémarrage")
        else:
            print(f"   ❌ Échec de la restauration: {settings.openai_api_key}")
            return
        
        print("\n🎉 Tous les tests de persistance sont passés avec succès!")
        print("   Les clés API sont maintenant persistantes entre les redémarrages.")
        
    except Exception as e:
        print(f"\n❌ Erreur lors du test: {str(e)}")
        logger.error(f"Test failed: {str(e)}")
        
    finally:
        db.close()

if __name__ == "__main__":
    test_api_key_persistence() 