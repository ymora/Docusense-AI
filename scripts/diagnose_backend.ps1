# Script de diagnostic pour DocuSense AI Backend
# Identifie les problèmes de configuration et d'import

Write-Host "🔍 Diagnostic du Backend DocuSense AI..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Vérifier l'environnement virtuel
Write-Host "📋 Vérification de l'environnement virtuel..." -ForegroundColor Yellow
$venvPath = "backend\venv\Scripts\python.exe"
if (Test-Path $venvPath) {
    Write-Host "✅ Environnement virtuel trouvé: $venvPath" -ForegroundColor Green
    
    # Vérifier la version Python
    $pythonVersion = & $venvPath --version 2>&1
    Write-Host "🐍 Version Python: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Environnement virtuel non trouvé!" -ForegroundColor Red
    exit 1
}

# Vérifier les dépendances
Write-Host "📦 Vérification des dépendances..." -ForegroundColor Yellow
cd backend

$requiredPackages = @("fastapi", "uvicorn", "sqlalchemy", "pydantic")
foreach ($package in $requiredPackages) {
    try {
        $result = & "venv\Scripts\python.exe" -c "import $package; print('OK')" 2>&1
        if ($result -eq "OK") {
            Write-Host "✅ $package - Installé" -ForegroundColor Green
        } else {
            Write-Host "❌ $package - Erreur d'import" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ $package - Non installé" -ForegroundColor Red
    }
}

# Test d'import des modules de l'application
Write-Host "🔧 Test d'import des modules..." -ForegroundColor Yellow

$modules = @(
    "app.core.config",
    "app.core.database", 
    "app.core.logging",
    "app.api.files",
    "app.api.analysis",
    "app.api.health",
    "app.services.file_service",
    "app.services.analysis_service"
)

foreach ($module in $modules) {
    try {
        $result = & "venv\Scripts\python.exe" -c "import $module; print('OK')" 2>&1
        if ($result -eq "OK") {
            Write-Host "✅ $module - OK" -ForegroundColor Green
        } else {
            Write-Host "❌ $module - Erreur - $result" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ $module - Erreur d'import" -ForegroundColor Red
    }
}

# Test de configuration
Write-Host "⚙️ Test de configuration..." -ForegroundColor Yellow
try {
    $result = & "venv\Scripts\python.exe" -c "from app.core.config import settings; print('Configuration OK')" 2>&1
            if ($result -eq "Configuration OK") {
            Write-Host "✅ Configuration - OK" -ForegroundColor Green
        } else {
            Write-Host "❌ Configuration - Erreur - $result" -ForegroundColor Red
        }
}
catch {
    Write-Host "❌ Configuration - Erreur d'import" -ForegroundColor Red
}

# Test de base de données
Write-Host "🗄️ Test de base de données..." -ForegroundColor Yellow
try {
    $result = & "venv\Scripts\python.exe" -c "from app.core.database import engine; print('Base de données OK')" 2>&1
            if ($result -eq "Base de données OK") {
            Write-Host "✅ Base de données - OK" -ForegroundColor Green
        } else {
            Write-Host "❌ Base de données - Erreur - $result" -ForegroundColor Red
        }
}
catch {
    Write-Host "❌ Base de données - Erreur d'import" -ForegroundColor Red
}

# Test de démarrage minimal
Write-Host "🚀 Test de démarrage minimal..." -ForegroundColor Yellow
try {
    $result = & "venv\Scripts\python.exe" -c "
import sys
sys.path.append('app')
from app.core.config import settings
from app.core.database import engine, Base
from app.core.logging import setup_logging
setup_logging()
print('Démarrage minimal OK')
" 2>&1
    
            if ($result -eq "Démarrage minimal OK") {
            Write-Host "✅ Démarrage minimal - OK" -ForegroundColor Green
        } else {
            Write-Host "❌ Démarrage minimal - Erreur - $result" -ForegroundColor Red
        }
}
catch {
    Write-Host "❌ Démarrage minimal - Erreur" -ForegroundColor Red
}

# Vérifier les fichiers de configuration
Write-Host "📄 Vérification des fichiers..." -ForegroundColor Yellow
$files = @(
    "main.py",
    "app/__init__.py",
    "app/core/__init__.py",
    "app/api/__init__.py",
    "app/services/__init__.py",
    "requirements.txt"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file - Existe" -ForegroundColor Green
    } else {
        Write-Host "❌ $file - Manquant" -ForegroundColor Red
    }
}

cd ..

Write-Host ""
Write-Host "🎯 Diagnostic terminé!" -ForegroundColor Green
Write-Host "💡 Si des erreurs sont détectées, corrigez-les avant de redémarrer." -ForegroundColor Yellow 