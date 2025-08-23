#!/usr/bin/env python3
"""
Script pour appliquer les optimisations de base de données et analyser les performances
Phase 3: Optimisation des Performances
"""

import time
import logging
from sqlalchemy import text, func
from sqlalchemy.orm import Session
from app.core.database import engine, SessionLocal
from app.models.file import File
from app.models.analysis import Analysis
from app.models.user import User

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseOptimizer:
    """Classe pour optimiser les performances de la base de données"""
    
    def __init__(self):
        self.db = SessionLocal()
    
    def apply_indexes(self):
        """Applique les index d'optimisation"""
        logger.info("🔧 Application des index d'optimisation...")
        
        try:
            # Index pour les fichiers (SQLite - une requête à la fois)
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_files_parent_directory ON files(parent_directory)",
                "CREATE INDEX IF NOT EXISTS idx_files_path ON files(path)",
                "CREATE INDEX IF NOT EXISTS idx_files_status ON files(status)",
                "CREATE INDEX IF NOT EXISTS idx_files_is_selected ON files(is_selected)",
                "CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at)",
                "CREATE INDEX IF NOT EXISTS idx_files_parent_status ON files(parent_directory, status)",
                "CREATE INDEX IF NOT EXISTS idx_files_parent_selected ON files(parent_directory, is_selected)",
                "CREATE INDEX IF NOT EXISTS idx_analyses_file_id ON analyses(file_id)",
                "CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status)",
                "CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at)",
                "CREATE INDEX IF NOT EXISTS idx_analyses_file_status ON analyses(file_id, status)",
                "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)",
                "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)"
            ]
            
            for index_sql in indexes:
                self.db.execute(text(index_sql))
                logger.info(f"  ✅ Index créé: {index_sql.split('ON ')[1]}")
            
            self.db.commit()
            logger.info("✅ Tous les index appliqués avec succès")
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de l'application des index: {str(e)}")
            self.db.rollback()
    
    def analyze_tables(self):
        """Analyse les tables pour optimiser les statistiques"""
        logger.info("📊 Analyse des tables...")
        
        try:
            tables = ['files', 'analyses', 'users', 'configs']
            for table in tables:
                self.db.execute(text(f"ANALYZE {table};"))
            
            self.db.commit()
            logger.info("✅ Analyse des tables terminée")
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de l'analyse: {str(e)}")
            self.db.rollback()
    
    def benchmark_queries(self):
        """Teste les performances des requêtes principales"""
        logger.info("⚡ Test des performances des requêtes...")
        
        benchmarks = {}
        
        # Test 1: Comptage des fichiers par statut
        start_time = time.time()
        result = self.db.query(File.status, func.count(File.id)).group_by(File.status).all()
        duration = time.time() - start_time
        benchmarks['files_by_status'] = {
            'duration': duration,
            'count': len(result)
        }
        
        # Test 2: Recherche de fichiers par répertoire
        start_time = time.time()
        result = self.db.query(File).filter(File.parent_directory.like('D:%')).limit(100).all()
        duration = time.time() - start_time
        benchmarks['files_by_directory'] = {
            'duration': duration,
            'count': len(result)
        }
        
        # Test 3: Analyses récentes
        start_time = time.time()
        result = self.db.query(Analysis).order_by(Analysis.created_at.desc()).limit(50).all()
        duration = time.time() - start_time
        benchmarks['recent_analyses'] = {
            'duration': duration,
            'count': len(result)
        }
        
        # Test 4: Recherche d'utilisateur
        start_time = time.time()
        result = self.db.query(User).filter(User.username == 'admin').first()
        duration = time.time() - start_time
        benchmarks['user_lookup'] = {
            'duration': duration,
            'found': result is not None
        }
        
        return benchmarks
    
    def generate_performance_report(self, benchmarks):
        """Génère un rapport de performance"""
        logger.info("📋 Génération du rapport de performance...")
        
        report = {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'optimizations_applied': True,
            'benchmarks': benchmarks,
            'recommendations': []
        }
        
        # Analyse des performances
        for query_name, data in benchmarks.items():
            duration = data['duration']
            if duration > 0.1:  # Plus de 100ms
                report['recommendations'].append(
                    f"⚠️  Requête '{query_name}' lente: {duration:.3f}s"
                )
            elif duration > 0.05:  # Plus de 50ms
                report['recommendations'].append(
                    f"📝 Requête '{query_name}' peut être optimisée: {duration:.3f}s"
                )
            else:
                report['recommendations'].append(
                    f"✅ Requête '{query_name}' performante: {duration:.3f}s"
                )
        
        return report
    
    def close(self):
        """Ferme la connexion à la base de données"""
        self.db.close()

def main():
    """Fonction principale"""
    logger.info("🚀 Début de l'optimisation de la base de données (Phase 3)")
    
    optimizer = DatabaseOptimizer()
    
    try:
        # 1. Appliquer les index
        optimizer.apply_indexes()
        
        # 2. Analyser les tables
        optimizer.analyze_tables()
        
        # 3. Tester les performances
        benchmarks = optimizer.benchmark_queries()
        
        # 4. Générer le rapport
        report = optimizer.generate_performance_report(benchmarks)
        
        # 5. Afficher le rapport
        logger.info("\n" + "="*60)
        logger.info("📊 RAPPORT D'OPTIMISATION DE LA BASE DE DONNÉES")
        logger.info("="*60)
        logger.info(f"Timestamp: {report['timestamp']}")
        logger.info(f"Optimisations appliquées: {report['optimizations_applied']}")
        
        logger.info("\n📈 BENCHMARKS:")
        for query_name, data in report['benchmarks'].items():
            logger.info(f"  {query_name}: {data['duration']:.3f}s")
        
        logger.info("\n💡 RECOMMANDATIONS:")
        for rec in report['recommendations']:
            logger.info(f"  {rec}")
        
        logger.info("\n✅ Optimisation terminée avec succès!")
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'optimisation: {str(e)}")
    
    finally:
        optimizer.close()

if __name__ == "__main__":
    main()
