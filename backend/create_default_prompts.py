#!/usr/bin/env python3
"""
Script pour créer des prompts par défaut
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.core.database import SessionLocal
from app.models.prompt import Prompt, PromptCategory
from sqlalchemy.exc import IntegrityError

def create_default_prompts():
    """Créer des prompts par défaut"""
    db = SessionLocal()
    
    try:
        # Vérifier si des prompts existent déjà
        existing_prompts = db.query(Prompt).count()
        if existing_prompts > 0:
            print(f"✅ {existing_prompts} prompts existent déjà dans la base de données")
            return
        
        # Prompts par défaut
        default_prompts = [
            {
                "name": "Analyse générale",
                "prompt": "Analysez ce document et fournissez un résumé détaillé de son contenu, de sa structure et des informations clés qu'il contient.",
                "category": PromptCategory.GENERAL,
                "description": "Analyse générale de documents"
            },
            {
                "name": "Extraction d'informations",
                "prompt": "Extrayez les informations importantes de ce document : dates, noms, montants, adresses, et autres données structurées.",
                "category": PromptCategory.GENERAL,
                "description": "Extraction d'informations structurées"
            },
            {
                "name": "Résumé exécutif",
                "prompt": "Créez un résumé exécutif de ce document, en mettant l'accent sur les points clés et les décisions importantes.",
                "category": PromptCategory.GENERAL,
                "description": "Résumé pour direction"
            },
            {
                "name": "Analyse juridique",
                "prompt": "Analysez ce document sous l'angle juridique, identifiez les clauses importantes, les obligations et les risques potentiels.",
                "category": PromptCategory.LEGAL,
                "description": "Analyse juridique de documents"
            },
            {
                "name": "Analyse financière",
                "prompt": "Analysez ce document financier, identifiez les montants, les tendances, les ratios et les indicateurs financiers importants.",
                "category": PromptCategory.FINANCIAL,
                "description": "Analyse de documents financiers"
            },
            {
                "name": "Analyse technique",
                "prompt": "Analysez ce document technique, expliquez les concepts, les spécifications et les implications techniques.",
                "category": PromptCategory.TECHNICAL,
                "description": "Analyse de documents techniques"
            }
        ]
        
        # Créer les prompts
        for prompt_data in default_prompts:
            prompt = Prompt(
                name=prompt_data["name"],
                prompt=prompt_data["prompt"],
                category=prompt_data["category"],
                description=prompt_data["description"],
                is_active=True
            )
            db.add(prompt)
        
        db.commit()
        
        print(f"✅ {len(default_prompts)} prompts par défaut créés avec succès")
        print("Prompts créés :")
        for prompt_data in default_prompts:
            print(f"  - {prompt_data['name']} ({prompt_data['category'].value})")
        
    except IntegrityError as e:
        print("❌ Erreur: Certains prompts existent déjà")
        db.rollback()
    except Exception as e:
        print(f"❌ Erreur lors de la création des prompts: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_default_prompts()
