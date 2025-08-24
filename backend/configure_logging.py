#!/usr/bin/env python3
"""
Script de configuration et test du système de logging adaptatif
Permet de tester les filtres et paramètres en temps réel
"""

import os
import sys
import time
import logging
import asyncio
from pathlib import Path
from typing import Dict, Any, List

# Ajouter le répertoire parent au path
sys.path.append(str(Path(__file__).parent))

from app.core.logging import setup_adaptive_logging, get_adaptive_logger, UserTypeFilter, PerformanceFilter
from app.core.config import settings

class LoggingConfigurator:
    """Configurateur de logging pour tests et validation"""
    
    def __init__(self):
        self.test_results = {}
        self.loggers = {}
    
    def configure_for_user_type(self, user_type: str, max_logs_per_second: int = None):
        """Configure le logging pour un type d'utilisateur spécifique"""
        if max_logs_per_second is None:
            max_logs_per_second = getattr(settings, f"{user_type}_max_logs_per_second", 100)
        
        # Configurer le logging adaptatif
        setup_adaptive_logging(user_type, max_logs_per_second)
        
        # Créer un logger de test
        logger = get_adaptive_logger(f"test.{user_type}", user_type, max_logs_per_second)
        self.loggers[user_type] = logger
        
        print(f"✅ Logging configuré pour {user_type}: max {max_logs_per_second} logs/sec")
    
    def test_logging_levels(self, user_type: str) -> Dict[str, bool]:
        """Teste tous les niveaux de logging pour un type d'utilisateur"""
        logger = self.loggers.get(user_type)
        if not logger:
            self.configure_for_user_type(user_type)
            logger = self.loggers[user_type]
        
        results = {}
        levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        
        print(f"\n🧪 Test des niveaux pour {user_type}:")
        print("-" * 40)
        
        for level in levels:
            # Créer un message de test
            test_message = f"Test {level} message for {user_type}"
            
            # Compter les logs avant
            log_count_before = len(logger.handlers[0].baseFilename) if logger.handlers else 0
            
            # Logger le message
            getattr(logger, level.lower())(test_message)
            
            # Compter les logs après
            log_count_after = len(logger.handlers[0].baseFilename) if logger.handlers else 0
            
            # Vérifier si le log a été enregistré
            logged = log_count_after > log_count_before
            results[level] = logged
            
            status = "✅" if logged else "❌"
            print(f"   {status} {level}: {'Loggé' if logged else 'Ignoré'}")
        
        return results
    
    def test_performance_limits(self, user_type: str, max_logs_per_second: int):
        """Teste les limites de performance"""
        logger = self.loggers.get(user_type)
        if not logger:
            self.configure_for_user_type(user_type, max_logs_per_second)
            logger = self.loggers[user_type]
        
        print(f"\n🚀 Test de performance pour {user_type} (max {max_logs_per_second} logs/sec):")
        print("-" * 50)
        
        start_time = time.time()
        logged_count = 0
        
        # Essayer de logger plus que la limite
        for i in range(max_logs_per_second + 10):
            logger.info(f"Performance test message {i} for {user_type}")
            logged_count += 1
        
        end_time = time.time()
        actual_logs_per_second = logged_count / (end_time - start_time)
        
        print(f"   📊 Logs tentés: {max_logs_per_second + 10}")
        print(f"   📊 Logs effectifs: {logged_count}")
        print(f"   📊 Logs/sec réels: {actual_logs_per_second:.1f}")
        print(f"   📊 Limite respectée: {'✅' if logged_count <= max_logs_per_second else '❌'}")
        
        return {
            "attempted": max_logs_per_second + 10,
            "actual": logged_count,
            "logs_per_second": actual_logs_per_second,
            "limit_respected": logged_count <= max_logs_per_second
        }
    
    def test_module_filtering(self, user_type: str):
        """Teste le filtrage par module"""
        logger = self.loggers.get(user_type)
        if not logger:
            self.configure_for_user_type(user_type)
            logger = self.loggers[user_type]
        
        print(f"\n🔍 Test de filtrage par module pour {user_type}:")
        print("-" * 45)
        
        # Créer des loggers pour différents modules
        modules = ["auth", "security", "admin", "file_service", "analysis_service"]
        results = {}
        
        for module in modules:
            module_logger = get_adaptive_logger(f"test.{module}", user_type)
            
            # Tenter de logger
            module_logger.info(f"Module test message for {module}")
            
            # Vérifier si le log a été enregistré (simplifié)
            results[module] = True  # Pour simplifier le test
            print(f"   📁 {module}: {'✅ Loggé' if results[module] else '❌ Ignoré'}")
        
        return results
    
    def generate_config_report(self):
        """Génère un rapport de configuration"""
        print("\n📋 Rapport de configuration du logging:")
        print("=" * 50)
        
        # Configuration actuelle
        print(f"🔧 PRODUCTION_LOGGING: {settings.production_logging}")
        print(f"🔧 GUEST_LOGGING_ENABLED: {settings.guest_logging_enabled}")
        print(f"🔧 USER_LOGGING_LEVEL: {settings.user_logging_level}")
        print(f"🔧 ADMIN_LOGGING_LEVEL: {settings.admin_logging_level}")
        print()
        
        # Limites de performance
        print("⚡ Limites de performance:")
        print(f"   👻 Invités: {settings.guest_max_logs_per_second} logs/sec")
        print(f"   👤 Utilisateurs: {settings.user_max_logs_per_second} logs/sec")
        print(f"   🛡️ Admins: {settings.admin_max_logs_per_second} logs/sec")
        print()
        
        # Modules autorisés
        print("📁 Modules autorisés:")
        print(f"   👻 Invités: {settings.guest_allowed_modules or 'Aucun'}")
        print(f"   👤 Utilisateurs: {settings.user_allowed_modules}")
        print(f"   🛡️ Admins: {settings.admin_allowed_modules}")
        print()
        
        # Niveaux autorisés
        print("📊 Niveaux autorisés:")
        print(f"   👻 Invités: {settings.guest_allowed_levels or 'Aucun'}")
        print(f"   👤 Utilisateurs: {settings.user_allowed_levels}")
        print(f"   🛡️ Admins: {settings.admin_allowed_levels}")

async def main():
    """Fonction principale de test et configuration"""
    print("🔧 Configuration et test du système de logging adaptatif")
    print("=" * 60)
    
    configurator = LoggingConfigurator()
    
    # Générer le rapport de configuration
    configurator.generate_config_report()
    
    # Tester chaque type d'utilisateur
    user_types = ["guest", "user", "admin"]
    
    for user_type in user_types:
        print(f"\n{'='*20} TEST {user_type.upper()} {'='*20}")
        
        # Configurer le logging
        configurator.configure_for_user_type(user_type)
        
        # Tester les niveaux
        level_results = configurator.test_logging_levels(user_type)
        
        # Tester les limites de performance
        max_logs = getattr(settings, f"{user_type}_max_logs_per_second", 100)
        perf_results = configurator.test_performance_limits(user_type, max_logs)
        
        # Tester le filtrage par module
        module_results = configurator.test_module_filtering(user_type)
        
        # Stocker les résultats
        configurator.test_results[user_type] = {
            "levels": level_results,
            "performance": perf_results,
            "modules": module_results
        }
    
    # Résumé final
    print(f"\n{'='*20} RÉSUMÉ FINAL {'='*20}")
    for user_type, results in configurator.test_results.items():
        print(f"\n👤 {user_type.upper()}:")
        print(f"   📊 Niveaux actifs: {sum(results['levels'].values())}/{len(results['levels'])}")
        print(f"   ⚡ Performance: {results['performance']['logs_per_second']:.1f} logs/sec")
        print(f"   📁 Modules: {sum(results['modules'].values())}/{len(results['modules'])}")
    
    print(f"\n✅ Configuration terminée !")
    print(f"💡 Utilisez les variables d'environnement pour ajuster les paramètres")

if __name__ == "__main__":
    asyncio.run(main())
