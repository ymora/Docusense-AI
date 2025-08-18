#!/usr/bin/env python3
"""
Moniteur d'erreurs en temps réel pour DocuSense AI
Capture et corrige automatiquement les erreurs
"""

import os
import sys
import time
import subprocess
import threading
import re
from pathlib import Path
from datetime import datetime

class ErrorMonitor:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.backend_path = self.project_root / "backend"
        self.frontend_path = self.project_root / "frontend"
        self.error_patterns = {
            # Erreurs Python
            r"ModuleNotFoundError: No module named '([^']+)'": self.fix_missing_module,
            r"ImportError: cannot import name '([^']+)'": self.fix_missing_module,
            r"IndentationError:": self.fix_indentation_error,
            r"SyntaxError:": self.fix_syntax_error,
            r"TypeError:": self.fix_type_error,
            r"AttributeError:": self.fix_attribute_error,
            
            # Erreurs Node.js
            r"Module not found: Can't resolve '([^']+)'": self.fix_npm_module,
            r"Port (\d+) is already in use": self.fix_port_conflict,
            r"EADDRINUSE": self.fix_port_conflict,
            
            # Erreurs de base de données
            r"sqlite3\.OperationalError": self.fix_database_error,
            r"database is locked": self.fix_database_error,
            
            # Erreurs de fichiers
            r"FileNotFoundError": self.fix_file_not_found,
            r"PermissionError": self.fix_permission_error,
        }
        
        self.backend_process = None
        self.frontend_process = None
        self.backend_logs = []
        self.frontend_logs = []
        
    def start_monitoring(self):
        """Démarre le monitoring des erreurs"""
        print("🔍 Démarrage du moniteur d'erreurs...")
        
        # Démarrer le backend
        self.start_backend()
        
        # Démarrer le frontend
        self.start_frontend()
        
        # Monitoring en continu
        try:
            while True:
                self.check_processes()
                self.analyze_logs()
                time.sleep(2)
        except KeyboardInterrupt:
            self.cleanup()
    
    def start_backend(self):
        """Démarre le backend avec capture des logs"""
        try:
            print("🚀 Démarrage du backend...")
            self.backend_process = subprocess.Popen(
                [str(self.backend_path / "venv" / "Scripts" / "python.exe"), "main.py"],
                cwd=self.backend_path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            # Thread pour capturer les logs
            threading.Thread(target=self.capture_backend_logs, daemon=True).start()
            
        except Exception as e:
            print(f"❌ Erreur démarrage backend: {e}")
    
    def start_frontend(self):
        """Démarre le frontend avec capture des logs"""
        try:
            print("🎨 Démarrage du frontend...")
            self.frontend_process = subprocess.Popen(
                ["npm", "run", "dev"],
                cwd=self.frontend_path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            # Thread pour capturer les logs
            threading.Thread(target=self.capture_frontend_logs, daemon=True).start()
            
        except Exception as e:
            print(f"❌ Erreur démarrage frontend: {e}")
    
    def capture_backend_logs(self):
        """Capture les logs du backend"""
        while self.backend_process and self.backend_process.poll() is None:
            try:
                line = self.backend_process.stdout.readline()
                if line:
                    self.backend_logs.append(line.strip())
                    print(f"📊 Backend: {line.strip()}")
                    self.check_error_patterns(line, "backend")
            except:
                break
    
    def capture_frontend_logs(self):
        """Capture les logs du frontend"""
        while self.frontend_process and self.frontend_process.poll() is None:
            try:
                line = self.frontend_process.stdout.readline()
                if line:
                    self.frontend_logs.append(line.strip())
                    print(f"🎨 Frontend: {line.strip()}")
                    self.check_error_patterns(line, "frontend")
            except:
                break
    
    def check_error_patterns(self, log_line, source):
        """Vérifie les patterns d'erreur et applique les corrections"""
        for pattern, fix_function in self.error_patterns.items():
            match = re.search(pattern, log_line)
            if match:
                print(f"🔧 Erreur détectée ({source}): {pattern}")
                print(f"🔧 Application de la correction: {fix_function.__name__}")
                fix_function(match, source)
                break
    
    def fix_missing_module(self, match, source):
        """Corrige les modules manquants"""
        module_name = match.group(1)
        print(f"📦 Installation du module manquant: {module_name}")
        
        try:
            if source == "backend":
                subprocess.run([
                    str(self.backend_path / "venv" / "Scripts" / "pip.exe"),
                    "install", module_name
                ], check=True)
                print(f"✅ Module {module_name} installé")
            else:
                subprocess.run([
                    "npm", "install", module_name
                ], cwd=self.frontend_path, check=True)
                print(f"✅ Module {module_name} installé")
        except Exception as e:
            print(f"❌ Erreur installation {module_name}: {e}")
    
    def fix_npm_module(self, match, source):
        """Corrige les modules npm manquants"""
        module_name = match.group(1)
        print(f"📦 Installation du module npm: {module_name}")
        
        try:
            subprocess.run([
                "npm", "install", module_name
            ], cwd=self.frontend_path, check=True)
            print(f"✅ Module npm {module_name} installé")
        except Exception as e:
            print(f"❌ Erreur installation npm {module_name}: {e}")
    
    def fix_port_conflict(self, match, source):
        """Corrige les conflits de port"""
        print("🔌 Conflit de port détecté, arrêt des processus...")
        
        try:
            if os.name == 'nt':  # Windows
                subprocess.run(["taskkill", "/F", "/IM", "python.exe"], check=False)
                subprocess.run(["taskkill", "/F", "/IM", "node.exe"], check=False)
            else:  # Linux/Mac
                subprocess.run(["pkill", "-f", "python"], check=False)
                subprocess.run(["pkill", "-f", "node"], check=False)
            
            print("✅ Processus arrêtés, redémarrage...")
            time.sleep(2)
            
            if source == "backend":
                self.restart_backend()
            else:
                self.restart_frontend()
                
        except Exception as e:
            print(f"❌ Erreur gestion port: {e}")
    
    def fix_database_error(self, match, source):
        """Corrige les erreurs de base de données"""
        print("🗄️ Erreur base de données détectée...")
        
        try:
            # Vérifier les permissions
            db_path = self.backend_path / "database.db"
            if db_path.exists():
                # Essayer de corriger les permissions
                os.chmod(db_path, 0o666)
                print("✅ Permissions base de données corrigées")
        except Exception as e:
            print(f"❌ Erreur correction DB: {e}")
    
    def fix_file_not_found(self, match, source):
        """Corrige les fichiers manquants"""
        print("📁 Fichier manquant détecté...")
        
        try:
            # Créer les dossiers nécessaires
            (self.backend_path / "logs").mkdir(exist_ok=True)
            (self.backend_path / "temp_downloads").mkdir(exist_ok=True)
            print("✅ Dossiers créés")
        except Exception as e:
            print(f"❌ Erreur création dossiers: {e}")
    
    def fix_indentation_error(self, match, source):
        """Corrige les erreurs d'indentation"""
        print("📝 Erreur d'indentation détectée...")
        # Cette correction nécessite une analyse plus approfondie
        print("⚠️ Correction manuelle requise pour l'indentation")
    
    def fix_syntax_error(self, match, source):
        """Corrige les erreurs de syntaxe"""
        print("🔤 Erreur de syntaxe détectée...")
        print("⚠️ Correction manuelle requise pour la syntaxe")
    
    def fix_type_error(self, match, source):
        """Corrige les erreurs de type"""
        print("🔢 Erreur de type détectée...")
        print("⚠️ Correction manuelle requise pour les types")
    
    def fix_attribute_error(self, match, source):
        """Corrige les erreurs d'attribut"""
        print("🔗 Erreur d'attribut détectée...")
        print("⚠️ Correction manuelle requise pour les attributs")
    
    def fix_permission_error(self, match, source):
        """Corrige les erreurs de permission"""
        print("🔐 Erreur de permission détectée...")
        print("⚠️ Vérifiez les permissions des fichiers")
    
    def restart_backend(self):
        """Redémarre le backend"""
        if self.backend_process:
            self.backend_process.terminate()
            self.backend_process.wait()
        self.start_backend()
    
    def restart_frontend(self):
        """Redémarre le frontend"""
        if self.frontend_process:
            self.frontend_process.terminate()
            self.frontend_process.wait()
        self.start_frontend()
    
    def check_processes(self):
        """Vérifie l'état des processus"""
        if self.backend_process and self.backend_process.poll() is not None:
            print("❌ Backend arrêté, redémarrage...")
            self.restart_backend()
        
        if self.frontend_process and self.frontend_process.poll() is not None:
            print("❌ Frontend arrêté, redémarrage...")
            self.restart_frontend()
    
    def analyze_logs(self):
        """Analyse les logs pour détecter les problèmes"""
        # Analyser les derniers logs
        recent_backend_logs = self.backend_logs[-10:] if self.backend_logs else []
        recent_frontend_logs = self.frontend_logs[-10:] if self.frontend_logs else []
        
        # Détecter les patterns problématiques
        for log in recent_backend_logs:
            if "error" in log.lower() or "exception" in log.lower():
                print(f"⚠️ Problème détecté dans les logs backend: {log}")
        
        for log in recent_frontend_logs:
            if "error" in log.lower() or "failed" in log.lower():
                print(f"⚠️ Problème détecté dans les logs frontend: {log}")
    
    def cleanup(self):
        """Nettoie les processus"""
        print("🧹 Arrêt du moniteur...")
        
        if self.backend_process:
            self.backend_process.terminate()
        
        if self.frontend_process:
            self.frontend_process.terminate()
        
        print("✅ Moniteur arrêté")

if __name__ == "__main__":
    monitor = ErrorMonitor()
    monitor.start_monitoring()
