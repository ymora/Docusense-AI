#!/usr/bin/env python3
"""
Script de diagnostic détaillé pour identifier les problèmes de démarrage
"""

import sys
import os
import traceback
from pathlib import Path

def test_imports_step_by_step():
    """Test des imports étape par étape"""
    print("🔍 DIAGNOSTIC DES IMPORTS")
    print("=" * 40)
    
    # Test 1: FastAPI
    try:
        import fastapi
        print("✅ FastAPI importé")
    except Exception as e:
        print(f"❌ Erreur FastAPI: {e}")
        return False
    
    # Test 2: uvicorn
    try:
        import uvicorn
        print("✅ uvicorn importé")
    except Exception as e:
        print(f"❌ Erreur uvicorn: {e}")
        return False
    
    # Test 3: sqlalchemy
    try:
        import sqlalchemy
        print("✅ sqlalchemy importé")
    except Exception as e:
        print(f"❌ Erreur sqlalchemy: {e}")
        return False
    
    # Test 4: settings
    try:
        sys.path.append(str(Path(__file__).parent / 'app'))
        from app.core.config import settings
        print("✅ settings importé")
    except Exception as e:
        print(f"❌ Erreur settings: {e}")
        traceback.print_exc()
        return False
    
    # Test 5: database
    try:
        from app.core.database import engine, Base
        print("✅ database importé")
    except Exception as e:
        print(f"❌ Erreur database: {e}")
        traceback.print_exc()
        return False
    
    # Test 6: load_api_keys_from_database
    try:
        from app.core.config import load_api_keys_from_database
        print("✅ load_api_keys_from_database importé")
    except Exception as e:
        print(f"❌ Erreur load_api_keys_from_database: {e}")
        traceback.print_exc()
        return False
    
    # Test 7: routers
    try:
        from app.api import health_router
        print("✅ health_router importé")
    except Exception as e:
        print(f"❌ Erreur health_router: {e}")
        traceback.print_exc()
        return False
    
    return True

def test_database_connection():
    """Test de la connexion à la base de données"""
    print("\n🔍 TEST DE LA BASE DE DONNÉES")
    print("=" * 40)
    
    try:
        from app.core.database import engine, SessionLocal
        
        # Test de connexion
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Connexion à la base de données réussie")
        
        # Test de session
        db = SessionLocal()
        db.close()
        print("✅ Session de base de données créée")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur base de données: {e}")
        traceback.print_exc()
        return False

def test_api_keys_loading():
    """Test du chargement des clés API"""
    print("\n🔍 TEST DU CHARGEMENT DES CLÉS API")
    print("=" * 40)
    
    try:
        from app.core.config import load_api_keys_from_database
        load_api_keys_from_database()
        print("✅ Chargement des clés API réussi")
        return True
        
    except Exception as e:
        print(f"❌ Erreur chargement clés API: {e}")
        traceback.print_exc()
        return False

def test_fastapi_app_creation():
    """Test de création de l'app FastAPI"""
    print("\n🔍 TEST DE CRÉATION DE L'APP FASTAPI")
    print("=" * 40)
    
    try:
        from fastapi import FastAPI
        from app.api import health_router
        
        app = FastAPI(title="Test App")
        app.include_router(health_router, prefix="/api/health")
        
        print("✅ App FastAPI créée avec succès")
        return True
        
    except Exception as e:
        print(f"❌ Erreur création app FastAPI: {e}")
        traceback.print_exc()
        return False

def test_port_availability():
    """Test de la disponibilité du port"""
    print("\n🔍 TEST DE DISPONIBILITÉ DU PORT")
    print("=" * 40)
    
    import socket
    
    port = 8000
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('localhost', port))
            print(f"✅ Port {port} disponible")
            return True
    except OSError:
        print(f"❌ Port {port} occupé")
        return False

def main():
    """Fonction principale"""
    print("🚀 DIAGNOSTIC COMPLET DU DÉMARRAGE")
    print("=" * 50)
    
    tests = [
        test_imports_step_by_step,
        test_database_connection,
        test_api_keys_loading,
        test_fastapi_app_creation,
        test_port_availability
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
            print()
        except Exception as e:
            print(f"❌ Test {test.__name__} a échoué: {e}")
            traceback.print_exc()
            print()
    
    print("=" * 50)
    print(f"📊 RÉSULTATS: {passed}/{total} tests passés")
    
    if passed == total:
        print("🎉 Tous les tests passent ! Le serveur devrait démarrer correctement.")
        return True
    else:
        print("⚠️ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
