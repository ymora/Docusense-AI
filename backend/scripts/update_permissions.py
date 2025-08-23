#!/usr/bin/env python3
"""
Script pour mettre à jour le système de permissions
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine
from app.models.user import User
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_database_schema():
    """Mettre à jour le schéma de la base de données"""
    try:
        with engine.connect() as conn:
            # Vérifier si la colonne usage_tracking existe
            result = conn.execute(text("""
                SELECT name FROM pragma_table_info('users') 
                WHERE name = 'usage_tracking'
            """))
            
            if not result.fetchone():
                logger.info("🔄 Ajout de la colonne usage_tracking...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN usage_tracking TEXT DEFAULT '{}'
                """))
                conn.commit()
                logger.info("✅ Colonne usage_tracking ajoutée")
            else:
                logger.info("✅ Colonne usage_tracking existe déjà")
            
            # Vérifier si la colonne guest_session_id existe
            result = conn.execute(text("""
                SELECT name FROM pragma_table_info('users') 
                WHERE name = 'guest_session_id'
            """))
            
            if not result.fetchone():
                logger.info("🔄 Ajout de la colonne guest_session_id...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN guest_session_id TEXT
                """))
                conn.commit()
                logger.info("✅ Colonne guest_session_id ajoutée")
            else:
                logger.info("✅ Colonne guest_session_id existe déjà")
            
            # Vérifier si la colonne guest_fingerprint existe
            result = conn.execute(text("""
                SELECT name FROM pragma_table_info('users') 
                WHERE name = 'guest_fingerprint'
            """))
            
            if not result.fetchone():
                logger.info("🔄 Ajout de la colonne guest_fingerprint...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN guest_fingerprint TEXT
                """))
                conn.commit()
                logger.info("✅ Colonne guest_fingerprint ajoutée")
            else:
                logger.info("✅ Colonne guest_fingerprint existe déjà")
                
    except Exception as e:
        logger.error(f"❌ Erreur lors de la mise à jour du schéma: {e}")
        return False
    
    return True

def update_user_permissions():
    """Mettre à jour les permissions des utilisateurs existants"""
    try:
        db = SessionLocal()
        
        # Mettre à jour les utilisateurs existants
        users = db.query(User).all()
        
        for user in users:
            # Initialiser usage_tracking si null
            if user.usage_tracking is None:
                user.usage_tracking = {}
                logger.info(f"🔄 Initialisation usage_tracking pour {user.username}")
        
        db.commit()
        logger.info(f"✅ {len(users)} utilisateurs mis à jour")
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de la mise à jour des utilisateurs: {e}")
        return False
    finally:
        db.close()
    
    return True

def verify_permissions():
    """Vérifier que les permissions fonctionnent correctement"""
    try:
        db = SessionLocal()
        
        # Tester avec l'utilisateur invité
        guest_user = db.query(User).filter(User.username == "invite").first()
        if guest_user:
            logger.info(f"👁️ Test permissions invité ({guest_user.username}):")
            logger.info(f"  - read_analyses: {guest_user.has_permission('read_analyses')}")
            logger.info(f"  - create_analyses: {guest_user.has_permission('create_analyses')}")
            logger.info(f"  - can_use_feature(file_browsing): {guest_user.can_use_feature('file_browsing')}")
            logger.info(f"  - Usage file_browsing: {guest_user.get_feature_usage('file_browsing')}")
        
        # Tester avec l'utilisateur normal
        normal_user = db.query(User).filter(User.username == "yannick").first()
        if normal_user:
            logger.info(f"👤 Test permissions utilisateur ({normal_user.username}):")
            logger.info(f"  - read_analyses: {normal_user.has_permission('read_analyses')}")
            logger.info(f"  - create_analyses: {normal_user.has_permission('create_analyses')}")
            logger.info(f"  - can_use_feature(file_browsing): {normal_user.can_use_feature('file_browsing')}")
        
        # Tester avec l'admin
        admin_user = db.query(User).filter(User.username == "admin").first()
        if admin_user:
            logger.info(f"🛡️ Test permissions admin ({admin_user.username}):")
            logger.info(f"  - read_analyses: {admin_user.has_permission('read_analyses')}")
            logger.info(f"  - create_analyses: {admin_user.has_permission('create_analyses')}")
            logger.info(f"  - can_use_feature(file_browsing): {admin_user.can_use_feature('file_browsing')}")
        
        logger.info("✅ Vérification des permissions terminée")
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de la vérification: {e}")
        return False
    finally:
        db.close()
    
    return True

def main():
    """Fonction principale"""
    logger.info("🚀 Mise à jour du système de permissions...")
    
    # 1. Mettre à jour le schéma
    if not update_database_schema():
        logger.error("❌ Échec de la mise à jour du schéma")
        return False
    
    # 2. Mettre à jour les utilisateurs
    if not update_user_permissions():
        logger.error("❌ Échec de la mise à jour des utilisateurs")
        return False
    
    # 3. Vérifier les permissions
    if not verify_permissions():
        logger.error("❌ Échec de la vérification des permissions")
        return False
    
    logger.info("🎉 Mise à jour du système de permissions terminée avec succès!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
