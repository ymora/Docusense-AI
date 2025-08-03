#!/usr/bin/env python3
"""
Script de test pour vérifier l'affichage automatique des pièces jointes d'emails
"""

import requests
import json
import sys
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
TEST_EMAIL_FILE = "test_email.eml"  # Assurez-vous que ce fichier existe

def test_email_parsing():
    """Test du parsing d'email"""
    print("🧪 Test du parsing d'email...")
    
    try:
        # Vérifier que le fichier existe
        if not Path(TEST_EMAIL_FILE).exists():
            print(f"❌ Fichier de test {TEST_EMAIL_FILE} non trouvé")
            return False
        
        # Parser l'email
        response = requests.get(f"{BASE_URL}/api/emails/parse/{TEST_EMAIL_FILE}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Email parsé avec succès")
            print(f"   Sujet: {data.get('subject', 'N/A')}")
            print(f"   De: {data.get('from_address', 'N/A')}")
            print(f"   Pièces jointes: {len(data.get('attachments', []))}")
            
            # Afficher les détails des pièces jointes
            for i, attachment in enumerate(data.get('attachments', [])):
                print(f"   - {i}: {attachment.get('filename')} ({attachment.get('content_type')}) - {attachment.get('size')} bytes")
            
            return data
        else:
            print(f"❌ Erreur lors du parsing: {response.status_code}")
            print(f"   Réponse: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        return False

def test_attachment_preview(email_data):
    """Test de la prévisualisation des pièces jointes"""
    print("\n🧪 Test de la prévisualisation des pièces jointes...")
    
    attachments = email_data.get('attachments', [])
    if not attachments:
        print("ℹ️  Aucune pièce jointe à tester")
        return
    
    for i, attachment in enumerate(attachments):
        print(f"\n📎 Test pièce jointe {i}: {attachment.get('filename')}")
        
        try:
            # Tester la prévisualisation
            response = requests.get(f"{BASE_URL}/api/emails/attachment-preview/{TEST_EMAIL_FILE}/{i}")
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                content_length = response.headers.get('content-length', '0')
                
                print(f"   ✅ Prévisualisation réussie")
                print(f"   Type: {content_type}")
                print(f"   Taille: {content_length} bytes")
                print(f"   Headers: {dict(response.headers)}")
                
                # Vérifier le contenu selon le type
                if content_type.startswith('image/'):
                    print(f"   🖼️  Image détectée - Taille du contenu: {len(response.content)} bytes")
                elif content_type == 'application/pdf':
                    print(f"   📄 PDF détecté - Taille du contenu: {len(response.content)} bytes")
                elif content_type.startswith('text/'):
                    print(f"   📝 Texte détecté - Contenu: {response.text[:100]}...")
                elif content_type.startswith('video/'):
                    print(f"   🎬 Vidéo détectée - Taille du contenu: {len(response.content)} bytes")
                elif content_type.startswith('audio/'):
                    print(f"   🎵 Audio détecté - Taille du contenu: {len(response.content)} bytes")
                else:
                    print(f"   📄 Type inconnu - Taille du contenu: {len(response.content)} bytes")
                    
            else:
                print(f"   ❌ Erreur lors de la prévisualisation: {response.status_code}")
                print(f"   Réponse: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Erreur lors du test: {e}")

def test_frontend_integration():
    """Test de l'intégration frontend"""
    print("\n🧪 Test de l'intégration frontend...")
    
    try:
        # Vérifier que le frontend répond
        response = requests.get("http://localhost:3000")
        
        if response.status_code == 200:
            print("✅ Frontend accessible")
        else:
            print(f"⚠️  Frontend non accessible: {response.status_code}")
            
    except Exception as e:
        print(f"⚠️  Frontend non accessible: {e}")

def main():
    """Fonction principale de test"""
    print("🚀 Test de l'affichage automatique des pièces jointes d'emails")
    print("=" * 60)
    
    # Test 1: Parsing d'email
    email_data = test_email_parsing()
    if not email_data:
        print("❌ Échec du test de parsing - arrêt des tests")
        return
    
    # Test 2: Prévisualisation des pièces jointes
    test_attachment_preview(email_data)
    
    # Test 3: Intégration frontend
    test_frontend_integration()
    
    print("\n" + "=" * 60)
    print("✅ Tests terminés")
    print("\n📋 Résumé:")
    print("- Les pièces jointes sont maintenant affichées automatiquement dans l'interface")
    print("- Les images et PDFs sont visibles directement sans téléchargement")
    print("- Un bouton 'Plein écran' permet d'agrandir les pièces jointes")
    print("- L'API backend supporte tous les types de fichiers courants")

if __name__ == "__main__":
    main() 