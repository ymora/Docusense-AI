#!/usr/bin/env python3
"""
Script rapide pour lancer les plateformes d'IA vidéo
Ouvre automatiquement les meilleures options
"""

import webbrowser
import subprocess
import os
from pathlib import Path

def main():
    print("🎬 LANCEMENT RAPIDE PLATEFORMES IA VIDÉO")
    print("="*50)
    
    # Vérifier que les assets sont prêts
    assets_dir = Path(__file__).parent.parent / "temp_downloads" / "video_assets"
    
    if not assets_dir.exists():
        print("❌ Assets non trouvés. Lancez d'abord :")
        print("   python scripts/generate_video_assets.py")
        return
    
    print("✅ Assets prêts ! Ouverture des plateformes...")
    
    # Plateformes IA directe (recommandées)
    ai_platforms = {
        "Runway ML": "https://runwayml.com",
        "Pika Labs": "https://pika.art", 
        "Luma AI": "https://lumalabs.ai"
    }
    
    print("\n🚀 Ouverture des plateformes IA...")
    for name, url in ai_platforms.items():
        print(f"🔗 {name}")
        webbrowser.open(url)
    
    # Plateformes freelance
    freelance_platforms = {
        "Fiverr": "https://fiverr.com/search?query=ai+video+creation",
        "Upwork": "https://www.upwork.com/nx/search/jobs/?q=video+creation+ai"
    }
    
    print("\n💼 Ouverture des plateformes freelance...")
    for name, url in freelance_platforms.items():
        print(f"🔗 {name}")
        webbrowser.open(url)
    
    # Ouvrir le dossier des assets
    print("\n📁 Ouverture du dossier des assets...")
    if os.name == 'nt':  # Windows
        subprocess.run(['explorer', str(assets_dir)])
    else:  # macOS/Linux
        subprocess.run(['open', str(assets_dir)])
    
    print("\n" + "="*50)
    print("✅ TOUT EST PRÊT !")
    print("="*50)
    print("\n🎯 PROCHAINES ÉTAPES :")
    print("1. Choisir une plateforme (Runway ML recommandé)")
    print("2. Créer un compte")
    print("3. Uploader le dossier temp_downloads/video_assets/")
    print("4. Lire INSTRUCTIONS_IA_VIDEO.md")
    print("5. Commencer la production !")
    print("\n💰 Budget estimé : 200-400€")
    print("⏰ Délai : 5-10 jours")
    print("\n🚀 Bonne chance pour votre vidéo !")

if __name__ == "__main__":
    main()

