"""
Script d'optimisation de la base de données DocuSense AI
Ajoute les index manquants pour améliorer les performances
"""

import sqlite3
from pathlib import Path
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def optimize_database():
    """Optimiser la base de données en ajoutant les index manquants"""
    
    db_path = Path("docusense.db")
    if not db_path.exists():
        logger.error("Base de données non trouvée")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        logger.info("🔧 Début de l'optimisation de la base de données...")
        
        # Index pour la table users
        logger.info("📊 Ajout des index pour la table users...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)")
        
        # Index pour la table files
        logger.info("📊 Ajout des index pour la table files...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_files_path ON files(path)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_files_status ON files(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_files_parent_directory ON files(parent_directory)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_files_is_selected ON files(is_selected)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at)")
        
        # Index pour la table analyses
        logger.info("📊 Ajout des index pour la table analyses...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_analyses_file_id ON analyses(file_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_analyses_provider ON analyses(provider)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at)")
        
        # Index composites pour les requêtes fréquentes
        logger.info("📊 Ajout des index composites...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_analyses_file_status ON analyses(file_id, status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_analyses_user_status ON analyses(user_id, status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_files_parent_status ON files(parent_directory, status)")
        
        # Index pour la table system_logs (si elle existe)
        try:
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level)")
            logger.info("📊 Index system_logs ajoutés")
        except sqlite3.OperationalError:
            logger.info("📊 Table system_logs non trouvée, ignorée")
        
        # Analyser les tables pour optimiser les requêtes
        logger.info("📊 Analyse des tables...")
        cursor.execute("ANALYZE")
        
        # Vérifier les index créés
        logger.info("📊 Vérification des index...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index'")
        indexes = cursor.fetchall()
        logger.info(f"✅ {len(indexes)} index au total")
        
        conn.commit()
        conn.close()
        
        logger.info("✅ Optimisation de la base de données terminée avec succès!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'optimisation: {str(e)}")
        return False

if __name__ == "__main__":
    optimize_database()
