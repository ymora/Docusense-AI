#!/usr/bin/env python3
"""
Script de test pour l'API email
"""

import requests
import json
import sys
from pathlib import Path

def test_email_api():
    """Test de l'API email"""
    
    # URL de base
    base_url = "http://localhost:8000"
    
    # Chercher un fichier .eml dans le répertoire courant
    eml_files = list(Path(".").glob("*.eml"))
    
    if not eml_files:
        print("❌ Aucun fichier .eml trouvé dans le répertoire courant")
        print("Veuillez placer un fichier .eml dans ce répertoire pour tester")
        return False
    
    test_file = eml_files[0]
    # Utiliser le chemin absolu
    test_file_abs = test_file.absolute()
    print(f"📧 Test avec le fichier: {test_file}")
    print(f"📧 Chemin absolu: {test_file_abs}")
    
    # Test 1: Parse email
    print("\n🔄 Test 1: Parse email")
    try:
        response = requests.get(
            f"{base_url}/api/emails/parse/{test_file_abs}",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Parse email réussi")
            print(f"   Sujet: {data.get('subject', 'N/A')}")
            print(f"   De: {data.get('from_address', 'N/A')}")
            print(f"   À: {data.get('to_address', 'N/A')}")
            print(f"   Pièces jointes: {len(data.get('attachments', []))}")
            print(f"   HTML: {data.get('is_html', False)}")
            print(f"   Texte: {data.get('is_text', False)}")
            
            # Test 2: Preview email
            print("\n🔄 Test 2: Preview email")
            preview_response = requests.get(
                f"{base_url}/api/emails/preview/{test_file_abs}",
                timeout=10
            )
            
            if preview_response.status_code == 200:
                preview_data = preview_response.json()
                print("✅ Preview email réussi")
                print(f"   Aperçu: {preview_data.get('data', {}).get('preview', 'N/A')[:100]}...")
            else:
                print(f"❌ Preview email échoué: {preview_response.status_code}")
                print(f"   Erreur: {preview_response.text}")
            
            # Test 3: Pièces jointes si disponibles
            attachments = data.get('attachments', [])
            if attachments:
                print(f"\n🔄 Test 3: Pièces jointes ({len(attachments)})")
                
                for i, attachment in enumerate(attachments):
                    print(f"   Pièce jointe {i}: {attachment.get('filename', 'N/A')}")
                    
                    # Test prévisualisation pièce jointe
                    try:
                        preview_att_response = requests.get(
                            f"{base_url}/api/emails/attachment-preview/{test_file_abs}/{i}",
                            timeout=10
                        )
                        
                        if preview_att_response.status_code == 200:
                            print(f"     ✅ Prévisualisation OK")
                        else:
                            print(f"     ❌ Prévisualisation échouée: {preview_att_response.status_code}")
                    except Exception as e:
                        print(f"     ❌ Erreur prévisualisation: {e}")
            
            return True
            
        else:
            print(f"❌ Parse email échoué: {response.status_code}")
            print(f"   Erreur: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter au serveur")
        print("   Assurez-vous que le backend est démarré sur http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Erreur inattendue: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Test de l'API Email")
    print("=" * 50)
    
    success = test_email_api()
    
    if success:
        print("\n✅ Tous les tests sont passés avec succès!")
    else:
        print("\n❌ Certains tests ont échoué")
        sys.exit(1) 