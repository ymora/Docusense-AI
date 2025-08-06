import requests
import json

print("🔍 Test de l'endpoint des statistiques...")

try:
    # Test de l'endpoint des statistiques
    response = requests.get("http://localhost:8000/api/analysis/stats", timeout=5)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Succès!")
        print(f"Réponse complète: {json.dumps(data, indent=2)}")
        
        if 'data' in data:
            stats = data['data']
            print(f"\n📊 Statistiques extraites:")
            print(f"  Total: {stats.get('total', 0)}")
            print(f"  Terminées: {stats.get('completed', 0)}")
            print(f"  Échecs: {stats.get('failed', 0)}")
            print(f"  En attente: {stats.get('pending', 0)}")
            print(f"  En cours: {stats.get('processing', 0)}")
            print(f"  Taux de succès: {stats.get('success_rate', 0)}%")
        else:
            print("⚠️ Pas de données 'data' dans la réponse")
    else:
        print(f"❌ Erreur: {response.text}")
        
except Exception as e:
    print(f"❌ Erreur: {e}") 