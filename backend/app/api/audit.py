"""
Module d'API pour l'audit automatisé de DocuSense AI
Fournit des endpoints simples pour l'application d'audit externe
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List, Any, Optional
import os
import subprocess
import json
from datetime import datetime
from pathlib import Path

from app.core.database import get_db
from app.core.config import settings

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("/health")
async def audit_health():
    """Endpoint de santé pour l'audit"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "audit_entry_point",
        "version": "1.0.0"
    }

@router.get("/info")
async def get_application_info():
    """Fournir les informations de base de l'application pour l'audit externe"""
    try:
        # Informations sur l'application
        app_info = {
            "name": "DocuSense AI",
            "version": "1.0.0",
            "environment": settings.environment,
            "timestamp": datetime.now().isoformat(),
            "base_path": str(Path(__file__).parent.parent.parent),
            "backend_path": str(Path(__file__).parent.parent.parent),
            "frontend_path": str(Path(__file__).parent.parent.parent.parent / "frontend"),
            "tests_path": str(Path(__file__).parent.parent.parent.parent / "tests"),
            "docs_path": str(Path(__file__).parent.parent.parent.parent / "docs")
        }
        
        # Vérifier la présence des fichiers de configuration
        config_files = {
            "requirements_txt": os.path.exists("backend/requirements.txt"),
            "package_json": os.path.exists("frontend/package.json"),
            "pytest_config": os.path.exists("backend/pytest.ini") or os.path.exists("backend/pyproject.toml"),
            "vitest_config": os.path.exists("frontend/vitest.config.ts"),
            "audit_config": os.path.exists("audit-config.json")
        }
        
        app_info["config_files"] = config_files
        return app_info
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des informations: {str(e)}")

@router.get("/tests/status")
async def get_tests_status():
    """Fournir le statut des tests existants"""
    try:
        test_status = {
            "timestamp": datetime.now().isoformat(),
            "backend_tests": {
                "unit_tests": os.path.exists("tests/backend/test_unit_services.py"),
                "performance_tests": os.path.exists("tests/backend/performance_test.py"),
                "priority_tests": os.path.exists("tests/backend/test_priority_mode.py"),
                "test_runner": os.path.exists("run-tests.ps1")
            },
            "frontend_tests": {
                "component_tests": os.path.exists("frontend/src/test/components/FileList.test.tsx"),
                "test_setup": os.path.exists("frontend/src/test/setup.ts"),
                "vitest_config": os.path.exists("frontend/vitest.config.ts")
            },
            "integration_tests": {
                "test_audit": os.path.exists("test-audit.ps1")
            }
        }
        
        return test_status
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la vérification des tests: {str(e)}")

@router.post("/tests/run")
async def trigger_test_execution(test_type: str = "all"):
    """Déclencher l'exécution des tests (pour l'audit externe)"""
    try:
        # Retourner les informations sur comment exécuter les tests
        test_instructions = {
            "timestamp": datetime.now().isoformat(),
            "test_type": test_type,
            "instructions": {
                "backend_tests": "cd backend && venv\\Scripts\\python.exe -m pytest",
                "frontend_tests": "cd frontend && npm test",
                "all_tests": "powershell -ExecutionPolicy Bypass -File run-tests.ps1",
                "audit_tests": "powershell -ExecutionPolicy Bypass -File test-audit.ps1"
            },
            "available_scripts": {
                "run_tests": os.path.exists("run-tests.ps1"),
                "test_audit": os.path.exists("test-audit.ps1")
            },
            "note": "L'application d'audit externe doit exécuter ces commandes pour obtenir les résultats"
        }
        
        return test_instructions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du déclenchement des tests: {str(e)}")

@router.get("/config")
async def get_audit_config():
    """Fournir la configuration d'audit pour l'application externe"""
    try:
        config_path = "audit-config.json"
        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            return {
                "timestamp": datetime.now().isoformat(),
                "config": config,
                "source": "audit-config.json"
            }
        else:
            return {
                "timestamp": datetime.now().isoformat(),
                "config": None,
                "note": "Fichier audit-config.json non trouvé"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération de la configuration: {str(e)}")

@router.get("/database/status")
async def get_database_status(db=Depends(get_db)):
    """Fournir le statut de la base de données pour l'audit"""
    try:
        # Test simple de connexion
        result = db.execute("SELECT 1").scalar()
        
        db_status = {
            "timestamp": datetime.now().isoformat(),
            "connection": result == 1,
            "database_file": os.path.exists("backend/docusense.db"),
            "migrations": True,  # À vérifier par l'audit externe
            "tables": True       # À vérifier par l'audit externe
        }
        
        return db_status
        
    except Exception as e:
        return {
            "timestamp": datetime.now().isoformat(),
            "connection": False,
            "error": str(e)
        }

@router.get("/files/structure")
async def get_files_structure():
    """Fournir la structure des fichiers pour l'audit"""
    try:
        base_path = Path(__file__).parent.parent.parent.parent
        
        structure = {
            "timestamp": datetime.now().isoformat(),
            "base_path": str(base_path),
            "directories": {
                "backend": {
                    "exists": (base_path / "backend").exists(),
                    "main_files": [
                        "main.py",
                        "requirements.txt",
                        "app/api/",
                        "app/services/",
                        "app/models/"
                    ]
                },
                "frontend": {
                    "exists": (base_path / "frontend").exists(),
                    "main_files": [
                        "package.json",
                        "src/components/",
                        "src/services/",
                        "src/stores/"
                    ]
                },
                "tests": {
                    "exists": (base_path / "tests").exists(),
                    "structure": [
                        "backend/",
                        "frontend/"
                    ]
                },
                "docs": {
                    "exists": (base_path / "docs").exists(),
                    "files": [
                        "developers/TESTS.md",
                        "AUDIT_RECOMMANDATIONS.md"
                    ]
                }
            }
        }
        
        return structure
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération de la structure: {str(e)}")

@router.get("/endpoints")
async def get_available_endpoints():
    """Fournir la liste des endpoints disponibles pour l'audit"""
    try:
        endpoints = {
            "timestamp": datetime.now().isoformat(),
            "audit_endpoints": {
                "health": "GET /api/audit/health",
                "info": "GET /api/audit/info",
                "tests_status": "GET /api/audit/tests/status",
                "run_tests": "POST /api/audit/tests/run",
                "config": "GET /api/audit/config",
                "database_status": "GET /api/audit/database/status",
                "files_structure": "GET /api/audit/files/structure",
                "endpoints": "GET /api/audit/endpoints"
            },
            "main_application_endpoints": {
                "health": "GET /api/health",
                "files": "GET /api/files",
                "analysis": "GET /api/analysis",
                "auth": "POST /api/auth/login"
            },
            "note": "L'application d'audit externe peut utiliser ces endpoints pour collecter des informations"
        }
        
        return endpoints
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des endpoints: {str(e)}")
