# Script de démarrage du backend avec diagnostic complet

Write-Host "=== BACKEND DOCUSENSE AI ===" -ForegroundColor Green
Write-Host "Port: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Red
Write-Host ""

Write-Host "Démarrage du backend..." -ForegroundColor Yellow
Write-Host "Vérification de l'environnement virtuel..." -ForegroundColor Cyan

if (Test-Path "venv\Scripts\python.exe") {
    Write-Host "✅ Environnement virtuel trouvé" -ForegroundColor Green
    Write-Host "Vérification des dépendances..." -ForegroundColor Cyan
    
    # Afficher les packages installés
    .\venv\Scripts\pip.exe list | findstr "fastapi|uvicorn" | ForEach-Object { 
        Write-Host $_ -ForegroundColor Green 
    }
    
    Write-Host "Test des imports Python..." -ForegroundColor Yellow
    
    # Test Python
    .\venv\Scripts\python.exe -c "import sys; print('Python:', sys.version)"
    
    # Test FastAPI
    .\venv\Scripts\python.exe -c "import fastapi; print('FastAPI:', fastapi.__version__)"
    
    # Test Uvicorn
    .\venv\Scripts\python.exe -c "import uvicorn; print('Uvicorn:', uvicorn.__version__)"
    
    Write-Host "✅ Toutes les dépendances sont installées" -ForegroundColor Green
    Write-Host "Démarrage du serveur..." -ForegroundColor Green
    
    # Démarrer le backend
    .\venv\Scripts\python.exe main.py
} else {
    Write-Host "❌ Environnement virtuel non trouvé !" -ForegroundColor Red
    Write-Host "Création de l'environnement virtuel..." -ForegroundColor Yellow
    
    python -m venv venv
    .\venv\Scripts\activate.ps1
    .\venv\Scripts\pip.exe install -r requirements.txt
    .\venv\Scripts\python.exe main.py
} 