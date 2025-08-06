import requests

print("🔍 Test de connexion au serveur...")

try:
    # Test 1: Health check
    print("\n1. Test health check...")
    response = requests.get("http://localhost:8000/api/health", timeout=5)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text[:100]}...")
    
    # Test 2: Documentation
    print("\n2. Test documentation...")
    response = requests.get("http://localhost:8000/docs", timeout=5)
    print(f"   Status: {response.status_code}")
    
    # Test 3: Streaming info
    print("\n3. Test streaming info...")
    response = requests.get("http://localhost:8000/api/files/stream-info/test_audio.mp3", timeout=5)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   Response: {response.json()}")
    else:
        print(f"   Error: {response.text}")
    
    print("\n✅ Tests terminés avec succès!")
    
except Exception as e:
    print(f"❌ Erreur: {e}") 