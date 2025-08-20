# Script de debug pour le backend DocuSense AI

Write-Host "🔍 Debug du Backend DocuSense AI" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Gray

# 1. Vérifier le répertoire
Write-Host "📁 Répertoire actuel: $(Get-Location)" -ForegroundColor Yellow

# 2. Aller dans le backend
$backendPath = "backend"
if (Test-Path $backendPath) {
    Set-Location $backendPath
    Write-Host "✅ Répertoire backend trouvé" -ForegroundColor Green
} else {
    Write-Host "❌ Répertoire backend introuvable" -ForegroundColor Red
    exit 1
}

# 3. Vérifier l'environnement virtuel
Write-Host "🐍 Vérification de l'environnement virtuel..." -ForegroundColor Yellow
if (Test-Path "venv\Scripts\python.exe") {
    Write-Host "✅ Environnement virtuel trouvé" -ForegroundColor Green
    $pythonVersion = .\venv\Scripts\python.exe --version
    Write-Host "🐍 Version: $pythonVersion" -ForegroundColor Gray
} else {
    Write-Host "❌ Environnement virtuel introuvable" -ForegroundColor Red
    Write-Host "📁 Contenu du répertoire:" -ForegroundColor Gray
    Get-ChildItem | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }
    exit 1
}

# 4. Test d'import des modules principaux
Write-Host "🔍 Test d'import des modules..." -ForegroundColor Yellow
try {
    $result = .\venv\Scripts\python.exe -c "import fastapi; import uvicorn; print('✅ Modules principaux OK')"
    Write-Host $result -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur import modules: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 5. Test d'import de l'application
Write-Host "🔍 Test d'import de l'application..." -ForegroundColor Yellow
try {
    $result = .\venv\Scripts\python.exe -c "import sys; sys.path.append('.'); from main import app; print('✅ Application FastAPI OK')"
    Write-Host $result -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur import application: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 6. Lancement du backend
Write-Host "🚀 Lancement du backend..." -ForegroundColor Yellow
Write-Host "⚠️  Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Yellow
Write-Host "🌐 Le backend sera accessible sur http://localhost:8000" -ForegroundColor Cyan

.\venv\Scripts\python.exe main.py
