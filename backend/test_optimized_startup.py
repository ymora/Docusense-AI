#!/usr/bin/env python3
"""
Script de test pour vérifier les optimisations des logs de démarrage
"""

import subprocess
import time
import sys
import os

def test_startup_logs():
    """Teste les logs de démarrage optimisés"""
    
    print("🧪 TEST DES LOGS DE DÉMARRAGE OPTIMISÉS")
    print("=" * 50)
    
    # Démarrer le backend en arrière-plan
    print("Démarrage du backend...")
    process = subprocess.Popen(
        [sys.executable, "main.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
        universal_newlines=True
    )
    
    # Attendre quelques secondes pour les logs de démarrage
    time.sleep(3)
    
    # Lire les logs
    logs = []
    while process.poll() is None:
        line = process.stdout.readline()
        if line:
            logs.append(line.strip())
            print(f"LOG: {line.strip()}")
        time.sleep(0.1)
        
        # Arrêter après 10 secondes
        if len(logs) > 50:
            break
    
    # Arrêter le processus
    process.terminate()
    process.wait()
    
    # Analyser les logs
    print("\n📊 ANALYSE DES LOGS:")
    print("=" * 30)
    
    # Compter les types de logs
    startup_logs = [log for log in logs if "démarrage" in log.lower() or "start" in log.lower()]
    config_logs = [log for log in logs if "config" in log.lower()]
    ai_logs = [log for log in logs if "ai" in log.lower()]
    queue_logs = [log for log in logs if "queue" in log.lower()]
    error_logs = [log for log in logs if "error" in log.lower()]
    
    print(f"Logs de démarrage: {len(startup_logs)}")
    print(f"Logs de configuration: {len(config_logs)}")
    print(f"Logs AI: {len(ai_logs)}")
    print(f"Logs de queue: {len(queue_logs)}")
    print(f"Logs d'erreur: {len(error_logs)}")
    print(f"Total des logs: {len(logs)}")
    
    # Vérifier les optimisations
    print("\n✅ VÉRIFICATIONS:")
    print("=" * 20)
    
    # 1. Vérifier qu'il n'y a pas de logs répétitifs
    unique_logs = set(logs)
    if len(unique_logs) == len(logs):
        print("✅ Pas de logs répétitifs détectés")
    else:
        print("❌ Logs répétitifs détectés")
    
    # 2. Vérifier que les logs de démarrage sont consolidés
    if len(startup_logs) <= 5:
        print("✅ Logs de démarrage consolidés")
    else:
        print("❌ Trop de logs de démarrage")
    
    # 3. Vérifier qu'il n'y a pas d'erreurs d'encodage
    encoding_errors = [log for log in logs if "unicode" in log.lower() or "encode" in log.lower()]
    if not encoding_errors:
        print("✅ Pas d'erreurs d'encodage")
    else:
        print("❌ Erreurs d'encodage détectées")
    
    # 4. Vérifier que le backend démarre correctement
    success_logs = [log for log in logs if "succès" in log.lower() or "success" in log.lower()]
    if success_logs:
        print("✅ Backend démarré avec succès")
    else:
        print("❌ Échec du démarrage du backend")
    
    return {
        "total_logs": len(logs),
        "startup_logs": len(startup_logs),
        "config_logs": len(config_logs),
        "ai_logs": len(ai_logs),
        "queue_logs": len(queue_logs),
        "error_logs": len(error_logs),
        "no_repetition": len(unique_logs) == len(logs),
        "consolidated_startup": len(startup_logs) <= 5,
        "no_encoding_errors": not encoding_errors,
        "startup_success": bool(success_logs)
    }

def main():
    """Fonction principale"""
    
    print("🔧 TEST DES OPTIMISATIONS DE DÉMARRAGE")
    print("=" * 60)
    print()
    
    try:
        results = test_startup_logs()
        
        print("\n📈 RÉSULTATS:")
        print("=" * 20)
        
        score = 0
        total_tests = 4
        
        if results["no_repetition"]:
            score += 1
            print("✅ Pas de logs répétitifs")
        else:
            print("❌ Logs répétitifs présents")
            
        if results["consolidated_startup"]:
            score += 1
            print("✅ Logs de démarrage consolidés")
        else:
            print("❌ Logs de démarrage non consolidés")
            
        if results["no_encoding_errors"]:
            score += 1
            print("✅ Pas d'erreurs d'encodage")
        else:
            print("❌ Erreurs d'encodage présentes")
            
        if results["startup_success"]:
            score += 1
            print("✅ Démarrage réussi")
        else:
            print("❌ Échec du démarrage")
        
        print(f"\n🎯 SCORE: {score}/{total_tests}")
        
        if score == total_tests:
            print("🎉 Toutes les optimisations fonctionnent correctement!")
        elif score >= 3:
            print("👍 La plupart des optimisations fonctionnent")
        else:
            print("⚠️ Des problèmes persistent")
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {str(e)}")

if __name__ == "__main__":
    main() 