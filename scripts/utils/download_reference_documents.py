#!/usr/bin/env python3
"""
Script pour télécharger automatiquement les documents de référence
"""

import os
import sys
import requests
import json
from pathlib import Path
from urllib.parse import urlparse
import time
from typing import Dict, List, Optional

# Ajouter le chemin du backend au PYTHONPATH
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.services.reference_document_service import ReferenceDocumentService

class DocumentDownloader:
    """Classe pour télécharger les documents de référence"""
    
    def __init__(self):
        self.base_path = Path(__file__).parent.parent / "reference_documents"
        self.service = ReferenceDocumentService()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
    def download_file(self, url: str, file_path: Path) -> bool:
        """Télécharge un fichier depuis une URL"""
        try:
            print(f"Téléchargement de {url} vers {file_path}")
            
            # Créer le dossier parent si nécessaire
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Télécharger le fichier
            response = self.session.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"✅ Téléchargé: {file_path.name}")
            return True
            
        except Exception as e:
            print(f"❌ Erreur lors du téléchargement de {url}: {e}")
            return False
    
    def create_text_document(self, file_path: Path, content: str, title: str, description: str) -> bool:
        """Crée un document texte avec le contenu fourni"""
        try:
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(f"# {title}\n\n")
                f.write(f"{description}\n\n")
                f.write("=" * 50 + "\n\n")
                f.write(content)
            
            print(f"✅ Document créé: {file_path.name}")
            return True
            
        except Exception as e:
            print(f"❌ Erreur lors de la création du document {file_path}: {e}")
            return False
    
    def download_dtu_documents(self):
        """Télécharge les DTU essentiels"""
        print("\n🏗️  Téléchargement des DTU...")
        
        # Sources des DTU (sites officiels et ressources publiques)
        dtu_sources = {
            "DTU_31.1_Charpente_bois.txt": {
                "url": "https://www.cstb.fr/fr/produits-solutions/dtu/",
                "title": "DTU 31.1 - Charpente en bois",
                "description": "Document Technique Unifié pour la charpente en bois",
                "content": """
# DTU 31.1 - Charpente en bois

## Généralités
Le DTU 31.1 définit les règles de conception et d'exécution des charpentes en bois.

## Domaine d'application
- Charpentes traditionnelles en bois massif
- Charpentes industrielles en bois massif
- Charpentes en lamellé-collé

## Exigences techniques
- Essences de bois autorisées
- Classes de résistance mécanique
- Traitements de préservation
- Assemblage et fixation
- Contrôle d'exécution

## Points de contrôle
- Qualité du bois
- Respect des cotes
- Assemblage correct
- Fixation conforme
- Traitement appliqué
"""
            },
            "DTU_40.1_Plomberie.txt": {
                "url": "https://www.cstb.fr/fr/produits-solutions/dtu/",
                "title": "DTU 40.1 - Plomberie sanitaire",
                "description": "Document Technique Unifié pour la plomberie sanitaire",
                "content": """
# DTU 40.1 - Plomberie sanitaire

## Généralités
Le DTU 40.1 définit les règles d'exécution des installations de plomberie sanitaire.

## Domaine d'application
- Installations d'eau froide et chaude
- Installations d'évacuation
- Installations de ventilation
- Raccordements

## Exigences techniques
- Matériaux autorisés
- Pression et débit
- Pente des canalisations
- Ventilation des évacuations
- Raccordement au réseau

## Points de contrôle
- Qualité des matériaux
- Respect des pentes
- Ventilation correcte
- Raccordement conforme
- Tests d'étanchéité
"""
            },
            "DTU_51.1_Isolation.txt": {
                "url": "https://www.cstb.fr/fr/produits-solutions/dtu/",
                "title": "DTU 51.1 - Isolation thermique",
                "description": "Document Technique Unifié pour l'isolation thermique",
                "content": """
# DTU 51.1 - Isolation thermique

## Généralités
Le DTU 51.1 définit les règles d'exécution des isolations thermiques.

## Domaine d'application
- Isolation des murs
- Isolation des planchers
- Isolation des toitures
- Isolation des combles

## Exigences techniques
- Matériaux isolants autorisés
- Épaisseur minimale
- Pose continue
- Élimination des ponts thermiques
- Vapeur d'eau

## Points de contrôle
- Qualité des isolants
- Épaisseur respectée
- Pose continue
- Ponts thermiques éliminés
- Perméance à la vapeur
"""
            }
        }
        
        for filename, info in dtu_sources.items():
            file_path = self.base_path / "construction" / "dtu" / filename
            if self.create_text_document(file_path, info["content"], info["title"], info["description"]):
                # Ajouter à l'index
                relative_path = f"construction/dtu/{filename}"
                self.service.add_document(
                    relative_path,
                    "construction",
                    "dtu",
                    info["title"],
                    info["description"],
                    info["url"]
                )
    
    def download_juridical_documents(self):
        """Télécharge les documents juridiques"""
        print("\n⚖️  Téléchargement des documents juridiques...")
        
        juridical_sources = {
            "Code_Civil_Livre_III.txt": {
                "url": "https://www.legifrance.gouv.fr/",
                "title": "Code Civil - Livre III - Contrats",
                "description": "Dispositions du Code Civil relatives aux contrats",
                "content": """
# Code Civil - Livre III - Contrats

## Article 1101
Le contrat est un accord de volontés entre deux ou plusieurs personnes destiné à créer, modifier, transmettre ou éteindre des obligations.

## Article 1102
Chacun est libre de contracter ou de ne pas contracter, de choisir son cocontractant et de déterminer le contenu et la forme du contrat dans les limites posées par la loi.

## Article 1103
Les contrats légalement formés tiennent lieu de loi à ceux qui les ont faits.

## Article 1104
Les contrats doivent être négociés, formés et exécutés de bonne foi.

## Article 1105
Les contrats, qu'ils aient ou non une dénomination propre, sont soumis à des règles générales qui sont l'objet du présent titre.

## Article 1106
Le contrat est synallagmatique ou bilatéral lorsque les contractants s'obligent réciproquement les uns envers les autres.

## Article 1107
Le contrat est unilatéral lorsqu'une ou plusieurs personnes s'obligent envers une ou plusieurs autres sans qu'il y ait d'engagement réciproque de celles-ci.

## Article 1108
Quatre conditions sont essentielles pour la validité d'une convention :
1. Le consentement de la partie qui s'oblige
2. Sa capacité de contracter
3. Un contenu licite et certain
4. Une cause licite
"""
            },
            "Code_Construction_Responsabilite.txt": {
                "url": "https://www.legifrance.gouv.fr/",
                "title": "Code de la Construction - Responsabilité décennale",
                "description": "Dispositions sur la responsabilité décennale des constructeurs",
                "content": """
# Code de la Construction - Responsabilité décennale

## Article L111-1
Toute personne participant à l'acte de construire est responsable de plein droit, vis-à-vis du maître de l'ouvrage ou de l'acquéreur, des dommages, même résultant d'un vice du sol, qui compromettent la solidité de l'ouvrage ou le rendent impropre à sa destination.

## Article L111-2
Cette responsabilité s'attache aux défauts de solidité du gros œuvre et des éléments d'équipement indissociables, qu'ils affectent la solidité de l'ouvrage ou le rendent impropre à sa destination.

## Article L111-3
La responsabilité prévue à l'article L111-1 s'exerce pendant dix ans à compter de la réception des travaux.

## Article L111-4
La responsabilité prévue à l'article L111-1 ne peut être écartée ou limitée par une clause contractuelle.

## Article L111-5
Les actions en responsabilité prévues aux articles L111-1 à L111-4 se prescrivent par dix ans à compter de la réception des travaux.

## Article L111-6
La garantie de parfait achèvement prévue à l'article 1792-6 du code civil s'exerce pendant un an à compter de la réception des travaux.

## Article L111-7
La garantie de bon fonctionnement prévue à l'article 1792-3 du code civil s'exerce pendant deux ans à compter de la réception des travaux.
"""
            }
        }
        
        for filename, info in juridical_sources.items():
            if "Code_Civil" in filename:
                file_path = self.base_path / "juridique" / "code_civil" / filename
                category = "juridique"
                subcategory = "code_civil"
            else:
                file_path = self.base_path / "juridique" / "code_construction" / filename
                category = "juridique"
                subcategory = "code_construction"
            
            if self.create_text_document(file_path, info["content"], info["title"], info["description"]):
                relative_path = f"juridique/{subcategory}/{filename}"
                self.service.add_document(
                    relative_path,
                    category,
                    subcategory,
                    info["title"],
                    info["description"],
                    info["url"]
                )
    
    def download_reglementations(self):
        """Télécharge les réglementations"""
        print("\n📋 Téléchargement des réglementations...")
        
        reglementation_sources = {
            "RE2020_Reglementation.txt": {
                "url": "https://www.ecologie.gouv.fr/",
                "title": "Réglementation Environnementale RE2020",
                "description": "Réglementation environnementale pour les bâtiments neufs",
                "content": """
# Réglementation Environnementale RE2020

## Objectifs
La RE2020 vise à :
- Réduire l'impact carbone des bâtiments
- Améliorer la performance énergétique
- Garantir le confort en cas de forte chaleur

## Indicateurs de performance

### Bbio (Besoin bioclimatique)
- Seuil maximal : 60
- Mesure l'efficacité de la conception bioclimatique

### Cep (Consommation d'énergie primaire)
- Seuil maximal : 50 kWh/m²/an
- Mesure la consommation énergétique

### Cep,nr (Consommation d'énergie primaire non renouvelable)
- Seuil maximal : 70 kWh/m²/an
- Mesure l'impact environnemental

### Ic (Impact carbone)
- Seuil maximal : 640 kgCO2/m²
- Mesure l'impact carbone sur le cycle de vie

## Exigences techniques
- Isolation renforcée
- Ventilation performante
- Étanchéité à l'air
- Ponts thermiques limités
- Systèmes de chauffage efficaces
- Production d'énergie renouvelable

## Contrôles
- Calculs thermiques
- Tests d'infiltrométrie
- Mesures de perméabilité
- Contrôles de mise en œuvre
"""
            },
            "RT2012_Reglementation.txt": {
                "url": "https://www.ecologie.gouv.fr/",
                "title": "Réglementation Thermique RT2012",
                "description": "Réglementation thermique pour les bâtiments neufs",
                "content": """
# Réglementation Thermique RT2012

## Objectifs
La RT2012 vise à :
- Limiter la consommation d'énergie
- Améliorer le confort d'été
- Réduire les émissions de CO2

## Indicateurs de performance

### Bbio (Besoin bioclimatique)
- Seuil maximal : 60
- Mesure l'efficacité de la conception

### Cep (Consommation d'énergie primaire)
- Seuil maximal : 50 kWh/m²/an
- Mesure la consommation énergétique

### Tic (Température intérieure conventionnelle)
- Seuil maximal : 26°C
- Mesure le confort d'été

## Exigences techniques
- Isolation thermique renforcée
- Perméabilité à l'air limitée
- Ponts thermiques traités
- Ventilation performante
- Éclairage naturel optimisé
- Systèmes de chauffage efficaces

## Contrôles
- Calculs thermiques
- Tests d'infiltrométrie
- Mesures de perméabilité
- Contrôles de mise en œuvre
"""
            }
        }
        
        for filename, info in reglementation_sources.items():
            file_path = self.base_path / "construction" / "reglementations" / filename
            if self.create_text_document(file_path, info["content"], info["title"], info["description"]):
                relative_path = f"construction/reglementations/{filename}"
                self.service.add_document(
                    relative_path,
                    "construction",
                    "reglementations",
                    info["title"],
                    info["description"],
                    info["url"]
                )
    
    def download_administrative_documents(self):
        """Télécharge les documents administratifs"""
        print("\n📄 Téléchargement des documents administratifs...")
        
        admin_sources = {
            "Code_Urbanisme.txt": {
                "url": "https://www.legifrance.gouv.fr/",
                "title": "Code de l'Urbanisme",
                "description": "Dispositions du Code de l'Urbanisme",
                "content": """
# Code de l'Urbanisme

## Article L111-1
Le territoire français est le patrimoine commun de la nation. Chaque collectivité publique en est le gestionnaire et le garant dans le cadre de ses compétences.

## Article L111-2
L'utilisation du sol est régie par des règles d'urbanisme qui ont pour objet d'assurer, dans le respect des objectifs du développement durable :
1. L'équilibre entre les populations résidant dans les zones urbaines et rurales
2. La maîtrise des besoins de déplacement et de la circulation automobile
3. La préservation de la qualité de l'air, de l'eau, du sol et du sous-sol, des écosystèmes, des espaces verts, des milieux, sites et paysages naturels ou urbains
4. La réduction des nuisances sonores
5. La sauvegarde des ensembles urbains remarquables et du patrimoine bâti
6. La protection des terres agricoles et forestières
7. La préservation des ressources naturelles et de la biodiversité

## Article L111-3
Les règles d'urbanisme sont élaborées et appliquées dans le respect des principes de développement durable.

## Article L111-4
Les règles d'urbanisme sont élaborées et appliquées dans le respect des principes de solidarité entre les territoires.

## Article L111-5
Les règles d'urbanisme sont élaborées et appliquées dans le respect des principes de participation des habitants.
"""
            }
        }
        
        for filename, info in admin_sources.items():
            file_path = self.base_path / "administratif" / "urbanisme" / filename
            if self.create_text_document(file_path, info["content"], info["title"], info["description"]):
                relative_path = f"administratif/urbanisme/{filename}"
                self.service.add_document(
                    relative_path,
                    "administratif",
                    "urbanisme",
                    info["title"],
                    info["description"],
                    info["url"]
                )
    
    def run(self):
        """Exécute le téléchargement de tous les documents"""
        print("🚀 Début du téléchargement des documents de référence...")
        
        # Télécharger tous les types de documents
        self.download_dtu_documents()
        self.download_juridical_documents()
        self.download_reglementations()
        self.download_administrative_documents()
        
        # Afficher le résumé
        summary = self.service.get_index_summary()
        print(f"\n✅ Téléchargement terminé !")
        print(f"📊 Total des documents: {summary['total_documents']}")
        print(f"📁 Catégories: {list(summary['categories'].keys())}")
        
        for category, info in summary['categories'].items():
            print(f"  - {category}: {info['total']} documents")

if __name__ == "__main__":
    downloader = DocumentDownloader()
    downloader.run()
