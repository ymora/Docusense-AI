#!/usr/bin/env python3
"""
Serveur simplifié pour tester les réponses JSON
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

# Créer une app FastAPI simple
app = FastAPI(
    title="DocuSense AI - Test",
    version="1.0.0",
    description="Test server for JSON responses"
)

# Ajouter CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Endpoint racine"""
    return {
        "message": "DocuSense AI Test Server",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/health")
async def health_check():
    """Endpoint de santé simple"""
    return {
        "status": "healthy",
        "app_name": "DocuSense AI",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/prompts/universal")
async def get_universal_prompts():
    """Endpoint de prompts universels"""
    return {
        "success": True,
        "message": "Prompts universels récupérés",
        "data": {
            "problem_analysis": {
                "id": "problem_analysis",
                "name": "Analyse de problèmes",
                "description": "Identifier et analyser les problèmes dans un document",
                "prompt": "Analysez ce document pour identifier les problèmes principaux...",
                "type": "universal"
            },
            "summary_extraction": {
                "id": "summary_extraction",
                "name": "Extraction de résumé",
                "description": "Extraire un résumé concis du document",
                "prompt": "Créez un résumé concis de ce document...",
                "type": "universal"
            }
        },
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/prompts/recommendations")
async def get_prompt_recommendations(file_type: str = None, context: str = None):
    """Endpoint de recommandations de prompts"""
    return {
        "success": True,
        "message": f"Recommandations pour {file_type} + {context or 'aucun contexte'}",
        "data": [
            {
                "id": "problem_analysis",
                "name": "Analyse de problèmes",
                "description": "Identifier et analyser les problèmes",
                "score": 0.9
            },
            {
                "id": "summary_extraction",
                "name": "Extraction de résumé",
                "description": "Extraire un résumé concis",
                "score": 0.8
            }
        ],
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    print("🚀 Démarrage du serveur de test...")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
