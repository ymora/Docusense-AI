#!/usr/bin/env python3
"""
Script de test pour vérifier les endpoints de streaming
"""

import requests
import json
import sys
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
TEST_FILES = [
    "test_audio.mp3",  # Fichier audio existant
    "test_format_support.html",  # Fichier non-média
]

def test_endpoint(endpoint, description):
    """Test un endpoint et affiche le résultat"""
    print(f"\n🔍 Test: {description}")
    print(f"   URL: {BASE_URL}{endpoint}")
    
    try:
        response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ Succès")
            if response.headers.get('content-type', '').startswith('application/json'):
                try:
                    data = response.json()
                    print(f"   Data: {json.dumps(data, indent=2)}")
                except:
                    print(f"   Data: {response.text[:200]}...")
        else:
            print(f"   ❌ Erreur: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Erreur: Impossible de se connecter au serveur")
    except requests.exceptions.Timeout:
        print("   ❌ Erreur: Timeout")
    except Exception as e:
        print(f"   ❌ Erreur: {str(e)}")

def test_streaming_endpoints():
    """Test tous les endpoints de streaming"""
    print("🎬 Tests des endpoints de streaming")
    print("=" * 50)
    
    # Test 1: Endpoint de streaming classique
    test_endpoint("/api/files/stream-by-path/test_audio.mp3", "Streaming classique")
    
    # Test 2: Endpoint de streaming en temps réel
    test_endpoint("/api/files/stream-realtime/test_audio.mp3", "Streaming en temps réel")
    
    # Test 3: Informations de streaming
    test_endpoint("/api/files/stream-info/test_audio.mp3", "Informations de streaming")
    
    # Test 4: Headers de streaming en temps réel
    test_endpoint("/api/files/stream-realtime/test_audio.mp3", "Headers streaming temps réel (HEAD)")
    
    # Test 5: Fichier non-média (doit échouer gracieusement)
    test_endpoint("/api/files/stream-realtime/test_format_support.html", "Fichier non-média (doit échouer)")
    
    # Test 6: Fichier inexistant (doit échouer gracieusement)
    test_endpoint("/api/files/stream-realtime/fichier_inexistant.mp3", "Fichier inexistant (doit échouer)")

def test_health_endpoints():
    """Test les endpoints de santé"""
    print("\n🏥 Tests des endpoints de santé")
    print("=" * 50)
    
    test_endpoint("/api/health", "Health check")
    test_endpoint("/docs", "Documentation API")

def main():
    """Fonction principale"""
    print("🚀 Tests de débogage - DocuSense AI Streaming")
    print("=" * 60)
    
    # Vérifier que le serveur est accessible
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Serveur accessible")
        else:
            print("⚠️ Serveur accessible mais health check échoue")
    except:
        print("❌ Serveur non accessible - Assurez-vous que l'application est démarrée")
        print("   Commande: .\\scripts\\start_optimized.ps1")
        return
    
    # Tests des endpoints
    test_health_endpoints()
    test_streaming_endpoints()
    
    print("\n" + "=" * 60)
    print("🎯 Résumé des tests terminé")
    print("\n💡 Conseils de débogage:")
    print("   1. Vérifiez les logs du backend dans le terminal")
    print("   2. Vérifiez les logs du frontend dans le terminal")
    print("   3. Ouvrez http://localhost:8000/docs pour tester l'API")
    print("   4. Vérifiez que FFmpeg est installé si nécessaire")

if __name__ == "__main__":
    main() 