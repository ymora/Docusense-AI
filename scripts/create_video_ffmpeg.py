#!/usr/bin/env python3
"""
Script de génération vidéo avec FFmpeg
Crée une vidéo de démonstration DocuSense AI avec les assets disponibles
"""

import os
import subprocess
import json
from pathlib import Path
import cairosvg
from PIL import Image, ImageDraw, ImageFont
import numpy as np

class VideoGenerator:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.assets_dir = self.project_root / "temp_downloads" / "video_assets"
        self.output_dir = self.project_root / "temp_downloads" / "video_output"
        self.temp_dir = self.project_root / "temp_downloads" / "temp_frames"
        
        # Créer les dossiers
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        
    def svg_to_png(self, svg_path, png_path, size=(1920, 1080)):
        """Convertit SVG en PNG"""
        try:
            cairosvg.svg2png(url=str(svg_path), write_to=str(png_path), 
                           output_width=size[0], output_height=size[1])
            return True
        except Exception as e:
            print(f"❌ Erreur conversion SVG: {e}")
            return False
            
    def create_text_frame(self, text, output_path, bg_color="#111827", text_color="#FFFFFF"):
        """Crée une frame avec du texte"""
        width, height = 1920, 1080
        img = Image.new('RGB', (width, height), bg_color)
        draw = ImageDraw.Draw(img)
        
        # Essayer de charger une police
        try:
            font = ImageFont.truetype("arial.ttf", 60)
        except:
            font = ImageFont.load_default()
            
        # Centrer le texte
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (width - text_width) // 2
        y = (height - text_height) // 2
        
        draw.text((x, y), text, fill=text_color, font=font)
        img.save(output_path)
        
    def create_logo_frame(self, logo_svg, output_path, duration=3):
        """Crée des frames pour le logo avec animation"""
        logo_png = self.temp_dir / "logo.png"
        if self.svg_to_png(logo_svg, logo_png, (400, 400)):
            # Créer plusieurs frames pour l'animation
            for i in range(duration * 30):  # 30 fps
                frame_path = self.temp_dir / f"logo_frame_{i:04d}.png"
                self.create_text_frame("DocuSense AI", frame_path)
                
    def create_workflow_frames(self, icons_dir, output_dir, duration=5):
        """Crée des frames pour le workflow"""
        icons = list(icons_dir.rglob("*.svg"))
        
        for i, icon in enumerate(icons[:5]):  # 5 premières icônes
            icon_png = self.temp_dir / f"icon_{i}.png"
            if self.svg_to_png(icon, icon_png, (200, 200)):
                # Créer des frames pour chaque étape
                start_frame = i * duration * 30
                for j in range(duration * 30):
                    frame_num = start_frame + j
                    frame_path = output_dir / f"workflow_frame_{frame_num:04d}.png"
                    self.create_text_frame(f"Étape {i+1}", frame_path)
                    
    def create_comparison_frames(self, output_dir, duration=4):
        """Crée des frames pour la comparaison avant/après"""
        frames = duration * 30
        
        for i in range(frames):
            frame_path = output_dir / f"comparison_frame_{i:04d}.png"
            
            # Créer une image avec deux sections
            img = Image.new('RGB', (1920, 1080), "#111827")
            draw = ImageDraw.Draw(img)
            
            # Section AVANT (gauche)
            draw.rectangle([0, 0, 960, 1080], fill="#374151")
            draw.text((480, 540), "AVANT", fill="#EF4444", anchor="mm")
            
            # Section APRÈS (droite)
            draw.rectangle([960, 0, 1920, 1080], fill="#1E40AF")
            draw.text((1440, 540), "APRÈS", fill="#10B981", anchor="mm")
            
            img.save(frame_path)
            
    def create_final_frame(self, output_path, duration=3):
        """Crée la frame finale avec call-to-action"""
        frames = duration * 30
        
        for i in range(frames):
            frame_path = output_path / f"final_frame_{i:04d}.png"
            self.create_text_frame("Contactez-nous !", frame_path, "#1E40AF", "#FFFFFF")
            
    def generate_video(self):
        """Génère la vidéo complète"""
        print("🎬 Génération de la vidéo DocuSense AI...")
        
        # 1. Introduction avec logo (3 secondes)
        print("📝 Création de l'introduction...")
        logo_svg = self.assets_dir / "icons" / "logo" / "icon_logo_docusense.svg"
        intro_dir = self.temp_dir / "intro"
        intro_dir.mkdir(exist_ok=True)
        self.create_logo_frame(logo_svg, intro_dir, 3)
        
        # 2. Workflow (5 secondes)
        print("🔄 Création du workflow...")
        workflow_dir = self.temp_dir / "workflow"
        workflow_dir.mkdir(exist_ok=True)
        icons_dir = self.assets_dir / "icons" / "fonctionnalites"
        self.create_workflow_frames(icons_dir, workflow_dir, 5)
        
        # 3. Comparaison avant/après (4 secondes)
        print("📊 Création de la comparaison...")
        comparison_dir = self.temp_dir / "comparison"
        comparison_dir.mkdir(exist_ok=True)
        self.create_comparison_frames(comparison_dir, 4)
        
        # 4. Frame finale (3 secondes)
        print("🎯 Création de la conclusion...")
        final_dir = self.temp_dir / "final"
        final_dir.mkdir(exist_ok=True)
        self.create_final_frame(final_dir, 3)
        
        # Combiner toutes les frames
        print("🔗 Combinaison des séquences...")
        self.combine_frames()
        
        print("✅ Vidéo générée avec succès !")
        print(f"📁 Fichier : {self.output_dir / 'docusense_demo.mp4'}")
        
    def combine_frames(self):
        """Combine toutes les frames en vidéo"""
        # Créer une liste de toutes les frames
        all_frames = []
        
        # Ajouter les frames dans l'ordre
        frame_dirs = ["intro", "workflow", "comparison", "final"]
        
        for frame_dir in frame_dirs:
            dir_path = self.temp_dir / frame_dir
            if dir_path.exists():
                frames = sorted(dir_path.glob("*.png"))
                all_frames.extend(frames)
        
        # Créer la vidéo avec FFmpeg
        if all_frames:
            # Créer un fichier de liste pour FFmpeg
            list_file = self.temp_dir / "frames.txt"
            with open(list_file, 'w') as f:
                for frame in all_frames:
                    f.write(f"file '{frame.absolute()}'\n")
                    f.write("duration 0.033\n")  # 30 fps
            
            # Commande FFmpeg
            output_video = self.output_dir / "docusense_demo.mp4"
            cmd = [
                "ffmpeg", "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", str(list_file),
                "-c:v", "libx264",
                "-pix_fmt", "yuv420p",
                "-r", "30",
                str(output_video)
            ]
            
            try:
                subprocess.run(cmd, check=True, capture_output=True)
                print(f"✅ Vidéo créée : {output_video}")
            except subprocess.CalledProcessError as e:
                print(f"❌ Erreur FFmpeg : {e}")
                print("💡 Assurez-vous que FFmpeg est installé")
        else:
            print("❌ Aucune frame trouvée")

def main():
    print("🚀 GÉNÉRATEUR VIDÉO DOCUSENSE AI")
    print("="*50)
    
    generator = VideoGenerator()
    generator.generate()
    
    print("\n🎯 Prochaines étapes :")
    print("1. Vérifier que FFmpeg est installé")
    print("2. Lancer le script : python scripts/create_video_ffmpeg.py")
    print("3. Vidéo disponible dans temp_downloads/video_output/")

if __name__ == "__main__":
    main()

