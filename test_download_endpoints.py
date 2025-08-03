#!/usr/bin/env python3
"""
Script de test pour vérifier les endpoints de téléchargement
"""

import requests
import json
import sys
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"

def test_download_endpoints():
    """Test des endpoints de téléchargement"""
    
    print("🧪 Test des endpoints de téléchargement")
    print("=" * 50)
    
    # Test 1: Endpoint par ID (fichier supporté)
    print("\n1. Test endpoint par ID (/api/files/{file_id}/download)")
    try:
        # D'abord, récupérer la liste des fichiers
        response = requests.get(f"{BASE_URL}/api/files/", params={"limit": 5})
        if response.status_code == 200:
            files = response.json().get("files", [])
            if files:
                file_with_id = next((f for f in files if f.get("id")), None)
                if file_with_id:
                    print(f"   ✅ Fichier trouvé avec ID: {file_with_id['name']} (ID: {file_with_id['id']})")
                    
                    # Test du téléchargement par ID
                    download_response = requests.get(f"{BASE_URL}/api/files/{file_with_id['id']}/download")
                    if download_response.status_code == 200:
                        print(f"   ✅ Téléchargement par ID réussi: {len(download_response.content)} bytes")
                    else:
                        print(f"   ❌ Erreur téléchargement par ID: {download_response.status_code}")
                else:
                    print("   ⚠️  Aucun fichier avec ID trouvé")
            else:
                print("   ⚠️  Aucun fichier trouvé")
        else:
            print(f"   ❌ Erreur récupération fichiers: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Erreur test endpoint par ID: {e}")
    
    # Test 2: Endpoint par path (fichier non supporté)
    print("\n2. Test endpoint par path (/api/files/download-by-path/{file_path})")
    try:
        # Créer un fichier de test temporaire avec chemin absolu
        test_file = Path.cwd() / "test_download.txt"
        test_file.write_text("Test de téléchargement par path")
        
        print(f"   📄 Fichier créé: {test_file}")
        print(f"   📄 Fichier existe: {test_file.exists()}")
        
        # Test du téléchargement par path
        download_response = requests.get(f"{BASE_URL}/api/files/download-by-path/{test_file}")
        if download_response.status_code == 200:
            print(f"   ✅ Téléchargement par path réussi: {len(download_response.content)} bytes")
        else:
            print(f"   ❌ Erreur téléchargement par path: {download_response.status_code}")
            print(f"   📄 Réponse: {download_response.text}")
        
        # Nettoyer
        if test_file.exists():
            test_file.unlink()
            print(f"   🧹 Fichier supprimé")
        
    except Exception as e:
        print(f"   ❌ Erreur test endpoint par path: {e}")
        # Nettoyer en cas d'erreur
        test_file = Path.cwd() / "test_download.txt"
        if test_file.exists():
            test_file.unlink()
            print(f"   🧹 Fichier supprimé après erreur")
    
    # Test 3: Vérification de la structure des fichiers dans l'arborescence
    print("\n3. Test structure des fichiers dans l'arborescence")
    try:
        # Récupérer l'arborescence d'un répertoire
        response = requests.get(f"{BASE_URL}/api/files/list/C:/")
        if response.status_code == 200:
            data = response.json()
            files = data.get("files", [])
            
            if files:
                print(f"   📁 {len(files)} fichiers trouvés")
                
                # Analyser la structure des fichiers
                files_with_id = [f for f in files if f.get("id")]
                files_without_id = [f for f in files if not f.get("id")]
                
                print(f"   ✅ Fichiers avec ID (supportés): {len(files_with_id)}")
                print(f"   ⚠️  Fichiers sans ID (non supportés): {len(files_without_id)}")
                
                if files_with_id:
                    print(f"   📄 Exemple fichier supporté: {files_with_id[0]['name']} (ID: {files_with_id[0]['id']})")
                
                if files_without_id:
                    print(f"   📄 Exemple fichier non supporté: {files_without_id[0]['name']} (Path: {files_without_id[0]['path']})")
            else:
                print("   ⚠️  Aucun fichier trouvé dans l'arborescence")
        else:
            print(f"   ❌ Erreur récupération arborescence: {response.status_code}")
            print(f"   📄 Réponse: {response.text}")
    except Exception as e:
        print(f"   ❌ Erreur test structure: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 50)
    print("✅ Tests terminés")

if __name__ == "__main__":
    test_download_endpoints() 