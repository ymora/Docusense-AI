#!/usr/bin/env python3
"""
Script d'audit complet pour vérifier la conformité aux standards de production
Vérifie tous les aspects critiques pour un déploiement en production
"""

import os
import sys
import logging
import asyncio
import json
from pathlib import Path
from typing import Dict, Any, List, Tuple
from dataclasses import dataclass
from enum import Enum

# Ajouter le répertoire parent au path
sys.path.append(str(Path(__file__).parent))

from app.core.config import settings
from app.core.logging import setup_logging, get_adaptive_logger

class AuditStatus(Enum):
    PASS = "✅"
    FAIL = "❌"
    WARNING = "⚠️"
    INFO = "ℹ️"

@dataclass
class AuditResult:
    category: str
    check_name: str
    status: AuditStatus
    message: str
    details: Dict[str, Any] = None
    recommendations: List[str] = None

class ProductionAuditor:
    """Auditeur de production pour vérifier la conformité"""
    
    def __init__(self):
        self.results: List[AuditResult] = []
        self.critical_issues = 0
        self.warnings = 0
        self.passed_checks = 0
        
    def add_result(self, result: AuditResult):
        """Ajoute un résultat d'audit"""
        self.results.append(result)
        
        if result.status == AuditStatus.FAIL:
            self.critical_issues += 1
        elif result.status == AuditStatus.WARNING:
            self.warnings += 1
        elif result.status == AuditStatus.PASS:
            self.passed_checks += 1
    
    def audit_logging_configuration(self) -> List[AuditResult]:
        """Audit de la configuration de logging"""
        results = []
        
        # Vérifier les variables d'environnement critiques
        critical_vars = [
            ("PRODUCTION_LOGGING", settings.production_logging, True),
            ("GUEST_LOGGING_ENABLED", settings.guest_logging_enabled, False),
            ("LOG_LEVEL", settings.log_level, "ERROR"),
            ("MAX_LOGS_PER_SECOND", settings.max_logs_per_second, 100)
        ]
        
        for var_name, current_value, expected_value in critical_vars:
            if current_value == expected_value:
                results.append(AuditResult(
                    category="Logging",
                    check_name=f"Variable {var_name}",
                    status=AuditStatus.PASS,
                    message=f"✅ {var_name} = {current_value} (conforme)",
                    details={"current": current_value, "expected": expected_value}
                ))
            else:
                results.append(AuditResult(
                    category="Logging",
                    check_name=f"Variable {var_name}",
                    status=AuditStatus.FAIL,
                    message=f"❌ {var_name} = {current_value} (attendu: {expected_value})",
                    details={"current": current_value, "expected": expected_value},
                    recommendations=[f"Configurer {var_name}={expected_value}"]
                ))
        
        # Vérifier les limites de performance
        performance_limits = [
            ("GUEST_MAX_LOGS_PER_SECOND", settings.guest_max_logs_per_second, 0),
            ("USER_MAX_LOGS_PER_SECOND", settings.user_max_logs_per_second, 50),
            ("ADMIN_MAX_LOGS_PER_SECOND", settings.admin_max_logs_per_second, 500)
        ]
        
        for var_name, current_value, expected_value in performance_limits:
            if current_value == expected_value:
                results.append(AuditResult(
                    category="Performance",
                    check_name=f"Limite {var_name}",
                    status=AuditStatus.PASS,
                    message=f"✅ {var_name} = {current_value} (optimal)",
                    details={"current": current_value, "expected": expected_value}
                ))
            else:
                results.append(AuditResult(
                    category="Performance",
                    check_name=f"Limite {var_name}",
                    status=AuditStatus.WARNING,
                    message=f"⚠️ {var_name} = {current_value} (recommandé: {expected_value})",
                    details={"current": current_value, "expected": expected_value},
                    recommendations=[f"Considérer {var_name}={expected_value} pour les performances optimales"]
                ))
        
        return results
    
    def audit_security_configuration(self) -> List[AuditResult]:
        """Audit de la configuration de sécurité"""
        results = []
        
        # Vérifier la clé secrète
        if settings.secret_key == "docusense-secret-key-2024-change-in-production":
            results.append(AuditResult(
                category="Sécurité",
                check_name="Clé secrète",
                status=AuditStatus.FAIL,
                message="❌ Clé secrète par défaut détectée",
                details={"current": "Valeur par défaut", "risk": "CRITIQUE"},
                recommendations=[
                    "Changer SECRET_KEY en production",
                    "Utiliser une clé aléatoire de 32+ caractères",
                    "Ne jamais commiter la clé secrète"
                ]
            ))
        else:
            results.append(AuditResult(
                category="Sécurité",
                check_name="Clé secrète",
                status=AuditStatus.PASS,
                message="✅ Clé secrète personnalisée configurée",
                details={"length": len(settings.secret_key)}
            ))
        
        # Vérifier le rate limiting
        if settings.rate_limit_enabled:
            results.append(AuditResult(
                category="Sécurité",
                check_name="Rate Limiting",
                status=AuditStatus.PASS,
                message="✅ Rate limiting activé",
                details={
                    "enabled": settings.rate_limit_enabled,
                    "requests": settings.rate_limit_requests,
                    "window": settings.rate_limit_window
                }
            ))
        else:
            results.append(AuditResult(
                category="Sécurité",
                check_name="Rate Limiting",
                status=AuditStatus.FAIL,
                message="❌ Rate limiting désactivé",
                recommendations=["Activer RATE_LIMIT_ENABLED=true en production"]
            ))
        
        # Vérifier CORS
        if "http://localhost:3000" in settings.cors_origins:
            results.append(AuditResult(
                category="Sécurité",
                check_name="Configuration CORS",
                status=AuditStatus.WARNING,
                message="⚠️ CORS inclut localhost (normal pour le développement)",
                details={"origins": settings.cors_origins},
                recommendations=["Limiter CORS_ORIGINS aux domaines de production"]
            ))
        
        return results
    
    def audit_performance_configuration(self) -> List[AuditResult]:
        """Audit de la configuration de performance"""
        results = []
        
        # Vérifier la compression
        if settings.compression_enabled:
            results.append(AuditResult(
                category="Performance",
                check_name="Compression",
                status=AuditStatus.PASS,
                message="✅ Compression activée",
                details={
                    "enabled": settings.compression_enabled,
                    "gzip_min_size": settings.gzip_min_size
                }
            ))
        else:
            results.append(AuditResult(
                category="Performance",
                check_name="Compression",
                status=AuditStatus.WARNING,
                message="⚠️ Compression désactivée",
                recommendations=["Activer COMPRESSION_ENABLED=true pour de meilleures performances"]
            ))
        
        # Vérifier le cache
        if settings.cache_enabled:
            results.append(AuditResult(
                category="Performance",
                check_name="Cache",
                status=AuditStatus.PASS,
                message="✅ Cache activé",
                details={
                    "enabled": settings.cache_enabled,
                    "ttl": settings.cache_ttl
                }
            ))
        else:
            results.append(AuditResult(
                category="Performance",
                check_name="Cache",
                status=AuditStatus.WARNING,
                message="⚠️ Cache désactivé",
                recommendations=["Activer CACHE_ENABLED=true pour de meilleures performances"]
            ))
        
        # Vérifier les limites de fichiers
        max_file_size_mb = settings.max_file_size / (1024 * 1024)
        if max_file_size_mb <= 100:
            results.append(AuditResult(
                category="Performance",
                check_name="Limite de taille de fichier",
                status=AuditStatus.PASS,
                message=f"✅ Limite de fichier: {max_file_size_mb:.0f}MB (raisonnable)",
                details={"max_file_size_mb": max_file_size_mb}
            ))
        else:
            results.append(AuditResult(
                category="Performance",
                check_name="Limite de taille de fichier",
                status=AuditStatus.WARNING,
                message=f"⚠️ Limite de fichier élevée: {max_file_size_mb:.0f}MB",
                recommendations=["Considérer réduire MAX_FILE_SIZE pour éviter la surcharge"]
            ))
        
        return results
    
    def audit_database_configuration(self) -> List[AuditResult]:
        """Audit de la configuration de base de données"""
        results = []
        
        # Vérifier si on utilise SQLite (non recommandé en production)
        db_path = Path("docusense.db")
        if db_path.exists():
            results.append(AuditResult(
                category="Base de données",
                check_name="Type de base de données",
                status=AuditStatus.FAIL,
                message="❌ SQLite détecté (non recommandé en production)",
                details={"database": "SQLite", "file": str(db_path)},
                recommendations=[
                    "Migrer vers PostgreSQL en production",
                    "Configurer les variables d'environnement DATABASE_URL",
                    "Mettre en place des sauvegardes automatiques"
                ]
            ))
        else:
            results.append(AuditResult(
                category="Base de données",
                check_name="Type de base de données",
                status=AuditStatus.PASS,
                message="✅ Base de données externe configurée",
                details={"database": "Externe"}
            ))
        
        return results
    
    def audit_monitoring_configuration(self) -> List[AuditResult]:
        """Audit de la configuration de monitoring"""
        results = []
        
        # Vérifier les logs d'erreur
        error_log_path = Path("logs/docusense_error.log")
        if error_log_path.exists():
            results.append(AuditResult(
                category="Monitoring",
                check_name="Logs d'erreur",
                status=AuditStatus.PASS,
                message="✅ Fichier de logs d'erreur configuré",
                details={"path": str(error_log_path)}
            ))
        else:
            results.append(AuditResult(
                category="Monitoring",
                check_name="Logs d'erreur",
                status=AuditStatus.WARNING,
                message="⚠️ Fichier de logs d'erreur non trouvé",
                recommendations=["Vérifier la configuration des logs"]
            ))
        
        # Vérifier la rotation des logs
        if hasattr(settings, 'log_buffer_size') and settings.log_buffer_size > 0:
            results.append(AuditResult(
                category="Monitoring",
                check_name="Rotation des logs",
                status=AuditStatus.PASS,
                message="✅ Buffer de logs configuré",
                details={"buffer_size": settings.log_buffer_size}
            ))
        else:
            results.append(AuditResult(
                category="Monitoring",
                check_name="Rotation des logs",
                status=AuditStatus.WARNING,
                message="⚠️ Buffer de logs non configuré",
                recommendations=["Configurer LOG_BUFFER_SIZE pour éviter la surcharge"]
            ))
        
        return results
    
    def audit_file_structure(self) -> List[AuditResult]:
        """Audit de la structure des fichiers"""
        results = []
        
        # Vérifier les fichiers critiques
        critical_files = [
            "main.py",
            "app/core/config.py",
            "app/core/logging.py",
            "app/middleware/logging_middleware.py",
            "requirements.txt"
        ]
        
        for file_path in critical_files:
            if Path(file_path).exists():
                results.append(AuditResult(
                    category="Structure",
                    check_name=f"Fichier {file_path}",
                    status=AuditStatus.PASS,
                    message=f"✅ {file_path} présent",
                    details={"exists": True}
                ))
            else:
                results.append(AuditResult(
                    category="Structure",
                    check_name=f"Fichier {file_path}",
                    status=AuditStatus.FAIL,
                    message=f"❌ {file_path} manquant",
                    details={"exists": False},
                    recommendations=[f"Vérifier la présence de {file_path}"]
                ))
        
        # Vérifier le répertoire logs
        logs_dir = Path("logs")
        if logs_dir.exists():
            results.append(AuditResult(
                category="Structure",
                check_name="Répertoire logs",
                status=AuditStatus.PASS,
                message="✅ Répertoire logs présent",
                details={"exists": True}
            ))
        else:
            results.append(AuditResult(
                category="Structure",
                check_name="Répertoire logs",
                status=AuditStatus.WARNING,
                message="⚠️ Répertoire logs manquant",
                recommendations=["Créer le répertoire logs pour le stockage des logs"]
            ))
        
        return results
    
    def run_complete_audit(self) -> Dict[str, Any]:
        """Exécute un audit complet"""
        print("🔍 AUDIT COMPLET DE PRODUCTION - DocuSense AI")
        print("=" * 60)
        
        # Exécuter tous les audits
        all_results = []
        all_results.extend(self.audit_logging_configuration())
        all_results.extend(self.audit_security_configuration())
        all_results.extend(self.audit_performance_configuration())
        all_results.extend(self.audit_database_configuration())
        all_results.extend(self.audit_monitoring_configuration())
        all_results.extend(self.audit_file_structure())
        
        # Ajouter tous les résultats
        for result in all_results:
            self.add_result(result)
        
        # Générer le rapport
        return self.generate_report()
    
    def generate_report(self) -> Dict[str, Any]:
        """Génère un rapport d'audit complet"""
        print(f"\n📊 RÉSULTATS DE L'AUDIT:")
        print("-" * 40)
        print(f"✅ Vérifications réussies: {self.passed_checks}")
        print(f"⚠️  Avertissements: {self.warnings}")
        print(f"❌ Problèmes critiques: {self.critical_issues}")
        print(f"📋 Total: {len(self.results)} vérifications")
        
        # Grouper par catégorie
        categories = {}
        for result in self.results:
            if result.category not in categories:
                categories[result.category] = []
            categories[result.category].append(result)
        
        # Afficher les résultats par catégorie
        for category, results in categories.items():
            print(f"\n🔍 {category.upper()}:")
            print("-" * 30)
            
            for result in results:
                print(f"  {result.status.value} {result.check_name}: {result.message}")
                
                if result.recommendations:
                    print("     💡 Recommandations:")
                    for rec in result.recommendations:
                        print(f"        - {rec}")
        
        # Résumé final
        print(f"\n{'='*20} RÉSUMÉ FINAL {'='*20}")
        
        if self.critical_issues == 0:
            print("🎉 FÉLICITATIONS ! Votre application est prête pour la production !")
        elif self.critical_issues <= 3:
            print("⚠️  Quelques ajustements nécessaires avant la production")
        else:
            print("🚨 ATTENTION ! Plusieurs problèmes critiques à résoudre avant la production")
        
        if self.warnings > 0:
            print(f"💡 {self.warnings} améliorations recommandées pour optimiser les performances")
        
        return {
            "total_checks": len(self.results),
            "passed": self.passed_checks,
            "warnings": self.warnings,
            "critical_issues": self.critical_issues,
            "categories": categories,
            "production_ready": self.critical_issues == 0
        }

async def main():
    """Fonction principale d'audit"""
    auditor = ProductionAuditor()
    report = auditor.run_complete_audit()
    
    # Sauvegarder le rapport
    with open("production_audit_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Rapport sauvegardé dans: production_audit_report.json")
    
    if report["production_ready"]:
        print("\n🚀 Votre application est conforme aux standards de production !")
    else:
        print(f"\n🔧 {report['critical_issues']} problème(s) critique(s) à résoudre avant la production")

if __name__ == "__main__":
    asyncio.run(main())
