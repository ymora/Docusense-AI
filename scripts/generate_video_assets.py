#!/usr/bin/env python3
"""
Script d'automatisation pour la génération d'assets vidéo DocuSense AI
Prépare tous les éléments nécessaires pour une IA de génération vidéo
"""

import os
import json
import shutil
from pathlib import Path

class VideoAssetGenerator:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.presentation_dir = self.project_root / "docs" / "presentation"
        self.output_dir = self.project_root / "temp_downloads" / "video_assets"
        
    def create_output_structure(self):
        """Crée la structure de dossiers pour les assets vidéo"""
        print("📁 Création de la structure des dossiers...")
        
        # Créer le dossier principal
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Sous-dossiers
        (self.output_dir / "icons").mkdir(exist_ok=True)
        (self.output_dir / "scripts").mkdir(exist_ok=True)
        (self.output_dir / "specifications").mkdir(exist_ok=True)
        (self.output_dir / "content").mkdir(exist_ok=True)
        
        print("✅ Structure créée avec succès")
        
    def copy_icons(self):
        """Copie toutes les icônes SVG"""
        print("🎨 Copie des icônes SVG...")
        
        icons_source = self.presentation_dir / "assets" / "icons"
        icons_dest = self.output_dir / "icons"
        
        if icons_source.exists():
            shutil.copytree(icons_source, icons_dest, dirs_exist_ok=True)
            print(f"✅ {len(list(icons_dest.rglob('*.svg')))} icônes copiées")
        else:
            print("❌ Dossier des icônes non trouvé")
            
    def copy_scripts(self):
        """Copie les scripts et storyboards"""
        print("📝 Copie des scripts...")
        
        script_source = self.presentation_dir / "script"
        script_dest = self.output_dir / "scripts"
        
        if script_source.exists():
            shutil.copytree(script_source, script_dest, dirs_exist_ok=True)
            print("✅ Scripts copiés")
        else:
            print("❌ Dossier des scripts non trouvé")
            
    def copy_specifications(self):
        """Copie les spécifications techniques"""
        print("⚙️ Copie des spécifications...")
        
        spec_source = self.presentation_dir / "specifications"
        spec_dest = self.output_dir / "specifications"
        
        if spec_source.exists():
            shutil.copytree(spec_source, spec_dest, dirs_exist_ok=True)
            print("✅ Spécifications copiées")
        else:
            print("❌ Dossier des spécifications non trouvé")
            
    def copy_content(self):
        """Copie le contenu narratif"""
        print("📄 Copie du contenu...")
        
        content_source = self.presentation_dir / "content"
        content_dest = self.output_dir / "content"
        
        if content_source.exists():
            shutil.copytree(content_source, content_dest, dirs_exist_ok=True)
            print("✅ Contenu copié")
        else:
            print("❌ Dossier du contenu non trouvé")
            
    def create_instructions_file(self):
        """Crée le fichier d'instructions principal"""
        print("📋 Création du fichier d'instructions...")
        
        instructions_content = """# 🎬 INSTRUCTIONS POUR IA VIDÉO - DOCUSENSE AI

## 📋 MISSION
Créer une vidéo de démonstration professionnelle de 2-3 minutes pour DocuSense AI.

## 🎯 OBJECTIF
- Présenter la valeur ajoutée de DocuSense AI
- Démontrer les fonctionnalités principales
- Convaincre les prospects de l'efficacité
- Maintenir un style professionnel

## 📁 ASSETS FOURNIS
- 15 icônes SVG dans le dossier icons/
- Script complet dans scripts/script_principal.md
- Storyboard dans scripts/storyboard.md
- Spécifications dans specifications/
- Contenu narratif dans content/

## 🎨 STYLE VISUEL
- Couleurs : #1E40AF (bleu), #10B981 (vert), #F59E0B (orange)
- Typographie : Inter (Bold, Medium, Regular)
- Style : Moderne, professionnel, technologique

## 📝 STRUCTURE VIDÉO
1. Introduction (0:00-0:15) - Logo avec animation
2. Problématique (0:15-0:30) - Chaos documentaire
3. Solution (0:30-0:45) - Workflow 5 étapes
4. Fonctionnalités (0:45-1:15) - Démonstration
5. Résultats (1:15-1:45) - Métriques avant/après
6. Call-to-Action (1:45-2:00) - Contact

## 🎬 FORMAT
- Résolution : 1920x1080 (Full HD)
- Format : MP4, codec H.264
- Framerate : 30 fps
- Durée : 2-3 minutes

## 🎯 LIVRABLES
1. Vidéo principale MP4 1920x1080
2. Version courte 30-60 secondes (optionnel)
3. Fichier source (si possible)

---
**L'IA peut maintenant utiliser tous ces éléments pour créer une vidéo professionnelle !**
"""
        
        with open(self.output_dir / "INSTRUCTIONS_IA_VIDEO.md", "w", encoding="utf-8") as f:
            f.write(instructions_content)
            
        print("✅ Fichier d'instructions créé")
        
    def create_package_summary(self):
        """Crée un résumé du package"""
        print("📦 Création du résumé du package...")
        
        # Compter les fichiers
        icon_count = len(list((self.output_dir / "icons").rglob("*.svg")))
        script_count = len(list((self.output_dir / "scripts").rglob("*.md")))
        spec_count = len(list((self.output_dir / "specifications").rglob("*.md")))
        content_count = len(list((self.output_dir / "content").rglob("*.md")))
        
        summary = {
            "project": "DocuSense AI",
            "video_duration": "2-3 minutes",
            "style": "Professionnel, moderne, technologique",
            "assets": {
                "icons_svg": icon_count,
                "scripts": script_count,
                "specifications": spec_count,
                "content": content_count
            },
            "format": {
                "resolution": "1920x1080",
                "format": "MP4",
                "codec": "H.264",
                "fps": 30
            },
            "budget_estimate": "200-400€",
            "timeline": "5-10 jours"
        }
        
        with open(self.output_dir / "PACKAGE_SUMMARY.json", "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
            
        print("✅ Résumé du package créé")
        
    def generate(self):
        """Génère tous les assets vidéo"""
        print("🚀 Génération des assets vidéo DocuSense AI...")
        print("=" * 50)
        
        self.create_output_structure()
        self.copy_icons()
        self.copy_scripts()
        self.copy_specifications()
        self.copy_content()
        self.create_instructions_file()
        self.create_package_summary()
        
        print("=" * 50)
        print("✅ Génération terminée avec succès !")
        print(f"📁 Dossier créé : {self.output_dir}")
        print("\n🎯 Prochaines étapes :")
        print("1. Ouvrir le dossier temp_downloads/video_assets/")
        print("2. Lire INSTRUCTIONS_IA_VIDEO.md")
        print("3. Envoyer le dossier à une IA vidéo")
        print("4. Ou utiliser les plateformes recommandées")

if __name__ == "__main__":
    generator = VideoAssetGenerator()
    generator.generate()

