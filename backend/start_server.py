#!/usr/bin/env python3
"""
Script de démarrage robuste du serveur avec gestion d'erreurs
"""

import sys
import os
import time
import subprocess
from pathlib import Path

def check_port_available(port: int) -> bool:
    """Vérifier si le port est disponible"""
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('localhost', port))
            return True
    except OSError:
        return False

def kill_process_on_port(port: int):
    """Tuer le processus qui utilise le port"""
    try:
        # Windows
        result = subprocess.run(
            ['netstat', '-ano'], 
            capture_output=True, 
            text=True, 
            shell=True
        )
        
        for line in result.stdout.split('\n'):
            if f':{port}' in line and 'LISTENING' in line:
                parts = line.split()
                if len(parts) >= 5:
                    pid = parts[-1]
                    print(f"🔄 Arrêt du processus {pid} sur le port {port}")
                    subprocess.run(['taskkill', '/PID', pid, '/F'], shell=True)
                    time.sleep(2)
                    break
    except Exception as e:
        print(f"⚠️ Impossible d'arrêter le processus sur le port {port}: {e}")

def start_server():
    """Démarrer le serveur avec gestion d'erreurs"""
    print("🚀 DÉMARRAGE DU SERVEUR DOCUSENSE AI")
    print("=" * 50)
    
    # Vérifier le port
    port = 8000
    if not check_port_available(port):
        print(f"⚠️ Le port {port} est occupé")
        kill_process_on_port(port)
        time.sleep(2)
        
        if not check_port_available(port):
            print(f"❌ Impossible de libérer le port {port}")
            return False
    
    print(f"✅ Port {port} disponible")
    
    # Vérifier les dépendances
    try:
        import fastapi
        import uvicorn
        print("✅ Dépendances FastAPI disponibles")
    except ImportError as e:
        print(f"❌ Dépendance manquante: {e}")
        return False
    
    # Démarrer le serveur
    try:
        print("🔄 Démarrage du serveur...")
        
        # Importer et démarrer l'app
        from main import app
        
        import uvicorn
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=port,
            reload=False,
            log_level="info"
        )
        
    except Exception as e:
        print(f"❌ Erreur lors du démarrage: {e}")
        return False

if __name__ == "__main__":
    try:
        start_server()
    except KeyboardInterrupt:
        print("\n🛑 Arrêt du serveur")
    except Exception as e:
        print(f"❌ Erreur fatale: {e}")
        sys.exit(1)
