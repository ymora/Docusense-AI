"""
Script de migration des clés API pour assurer la persistance
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

def migrate_api_keys():
    """Migration des clés API vers le système de persistance"""
    
    print("🔄 Migration des clés API vers le système de persistance")
    print("=" * 60)
    
    # Créer une session de base de données
    db = SessionLocal()
    
    try:
        config_service = ConfigService(db)
        
        # Mapping des providers
        provider_mapping = {
            'openai': 'openai_api_key',
            'claude': 'anthropic_api_key',
            'anthropic': 'anthropic_api_key',
            'mistral': 'mistral_api_key'
        }
        
        migrated_count = 0
        
        print("\n📋 Vérification des clés API existantes:")
        
        # Vérifier chaque provider
        for provider, setting_attr in provider_mapping.items():
            # Vérifier si la clé existe dans les settings
            setting_value = getattr(settings, setting_attr, None)
            
            # Vérifier si la clé existe dans la base de données
            db_value = config_service.get_ai_provider_key(provider)
            
            print(f"\n🔍 {provider.upper()}:")
            print(f"   Settings: {'*' * (len(setting_value) - 8) + setting_value[-8:] if setting_value else 'Aucune'}")
            print(f"   Base de données: {'*' * (len(db_value) - 8) + db_value[-8:] if db_value else 'Aucune'}")
            
            # Si la clé existe dans les settings mais pas en base, la migrer
            if setting_value and not db_value:
                print(f"   ⚠️  Migration nécessaire...")
                success = config_service.set_ai_provider_key(provider, setting_value)
                if success:
                    print(f"   ✅ Migrée avec succès")
                    migrated_count += 1
                else:
                    print(f"   ❌ Échec de la migration")
            
            # Si la clé existe en base mais pas dans les settings, la restaurer
            elif db_value and not setting_value:
                print(f"   ⚠️  Restauration nécessaire...")
                config_service._save_api_key_to_settings(provider, db_value)
                print(f"   ✅ Restaurée dans les settings")
                migrated_count += 1
            
            # Si les deux existent mais sont différentes, priorité à la base
            elif setting_value and db_value and setting_value != db_value:
                print(f"   ⚠️  Conflit détecté, priorité à la base de données...")
                config_service._save_api_key_to_settings(provider, db_value)
                print(f"   ✅ Synchronisée avec la base de données")
                migrated_count += 1
            
            elif setting_value and db_value and setting_value == db_value:
                print(f"   ✅ Déjà synchronisée")
        
        print(f"\n📊 Résumé de la migration:")
        print(f"   {migrated_count} clé(s) migrée(s)/synchronisée(s)")
        
        if migrated_count > 0:
            print(f"\n✅ Migration terminée avec succès!")
            print(f"   Toutes les clés API sont maintenant persistantes.")
        else:
            print(f"\n✅ Aucune migration nécessaire.")
            print(f"   Toutes les clés API sont déjà synchronisées.")
        
        # Vérification finale
        print(f"\n🔍 Vérification finale:")
        config_service.load_api_keys_from_database()
        
        for provider, setting_attr in provider_mapping.items():
            final_value = getattr(settings, setting_attr, None)
            if final_value:
                print(f"   ✅ {provider}: {'*' * (len(final_value) - 8) + final_value[-8:]}")
            else:
                print(f"   ❌ {provider}: Aucune clé")
        
    except Exception as e:
        print(f"\n❌ Erreur lors de la migration: {str(e)}")
        logger.error(f"Migration failed: {str(e)}")
        
    finally:
        db.close()

if __name__ == "__main__":
    migrate_api_keys() 