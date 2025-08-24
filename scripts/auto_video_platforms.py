#!/usr/bin/env python3
"""
Script d'automatisation pour l'envoi vers les plateformes d'IA vidéo
Ouvre automatiquement les plateformes avec les assets préparés
"""

import webbrowser
import os
import subprocess
from pathlib import Path

class VideoPlatformAutomation:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.assets_dir = self.project_root / "temp_downloads" / "video_assets"
        
    def check_assets_ready(self):
        """Vérifie que les assets sont prêts"""
        print("🔍 Vérification des assets...")
        
        if not self.assets_dir.exists():
            print("❌ Dossier des assets non trouvé. Lancez d'abord generate_video_assets.py")
            return False
            
        # Vérifier les fichiers essentiels
        required_files = [
            "INSTRUCTIONS_IA_VIDEO.md",
            "PACKAGE_SUMMARY.json",
            "icons/logo/icon_logo_docusense.svg"
        ]
        
        for file in required_files:
            if not (self.assets_dir / file).exists():
                print(f"❌ Fichier manquant : {file}")
                return False
                
        print("✅ Tous les assets sont prêts !")
        return True
        
    def open_platforms(self):
        """Ouvre les plateformes d'IA vidéo"""
        print("🌐 Ouverture des plateformes d'IA vidéo...")
        
        platforms = {
            "Runway ML": "https://runwayml.com",
            "Pika Labs": "https://pika.art",
            "Luma AI": "https://lumalabs.ai",
            "Synthesia": "https://synthesia.io"
        }
        
        for name, url in platforms.items():
            print(f"🔗 Ouverture de {name}...")
            webbrowser.open(url)
            
    def open_freelance_platforms(self):
        """Ouvre les plateformes freelance"""
        print("💼 Ouverture des plateformes freelance...")
        
        platforms = {
            "Fiverr": "https://fiverr.com/search?query=ai+video+creation",
            "Upwork": "https://www.upwork.com/nx/search/jobs/?q=video+creation+ai"
        }
        
        for name, url in platforms.items():
            print(f"🔗 Ouverture de {name}...")
            webbrowser.open(url)
            
    def show_instructions(self):
        """Affiche les instructions d'utilisation"""
        print("\n" + "="*60)
        print("🎬 INSTRUCTIONS POUR L'IA VIDÉO")
        print("="*60)
        
        instructions = """
📋 ÉTAPES À SUIVRE :

1. 🎯 CHOISIR UNE PLATEFORME :
   • Runway ML (recommandé) - Professionnel
   • Pika Labs - Rapide et simple
   • Luma AI - Génération 3D
   • Fiverr/Upwork - Freelance

2. 📁 UPLOADER LES ASSETS :
   • Dossier : temp_downloads/video_assets/
   • Lire : INSTRUCTIONS_IA_VIDEO.md
   • Utiliser : 15 icônes SVG

3. 🎨 CONFIGURER LE PROJET :
   • Durée : 2-3 minutes
   • Format : MP4 1920x1080
   • Style : Professionnel, moderne

4. 💰 BUDGET ESTIMÉ :
   • IA directe : 50-200€
   • Freelance : 200-400€

5. ⏰ DÉLAI :
   • IA directe : 1-3 jours
   • Freelance : 5-10 jours

📞 MESSAGE TYPE À ENVOYER :
"Bonjour, je recherche une IA pour créer une vidéo de démonstration 
DocuSense AI de 2-3 minutes. J'ai un package complet avec script, 
storyboard et 15 icônes SVG. Budget 200-400€, délai 5-10 jours."

🎯 ASSETS DISPONIBLES :
✅ Script narratif complet (169 lignes)
✅ Storyboard détaillé (209 lignes)
✅ 15 icônes SVG professionnelles
✅ Spécifications techniques
✅ Guide de style visuel
✅ Instructions détaillées

🚀 PRÊT À COMMENCER !
        """
        
        print(instructions)
        
    def open_assets_folder(self):
        """Ouvre le dossier des assets"""
        print("📁 Ouverture du dossier des assets...")
        
        if os.name == 'nt':  # Windows
            subprocess.run(['explorer', str(self.assets_dir)])
        elif os.name == 'posix':  # macOS/Linux
            subprocess.run(['open', str(self.assets_dir)])
            
        print(f"✅ Dossier ouvert : {self.assets_dir}")
        
    def run(self):
        """Lance l'automatisation complète"""
        print("🚀 AUTOMATISATION PLATEFORMES IA VIDÉO")
        print("="*50)
        
        if not self.check_assets_ready():
            return
            
        print("\n🎯 CHOIX DE PLATEFORME :")
        print("1. IA directe (Runway, Pika, Luma)")
        print("2. Freelance (Fiverr, Upwork)")
        print("3. Les deux")
        
        choice = input("\nVotre choix (1/2/3) : ").strip()
        
        if choice in ['1', '3']:
            self.open_platforms()
            
        if choice in ['2', '3']:
            self.open_freelance_platforms()
            
        self.open_assets_folder()
        self.show_instructions()
        
        print("\n✅ Automatisation terminée !")
        print("🎬 Vous pouvez maintenant confier le travail à une IA vidéo !")

if __name__ == "__main__":
    automation = VideoPlatformAutomation()
    automation.run()

