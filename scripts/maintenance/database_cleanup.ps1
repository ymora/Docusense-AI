# Script de nettoyage de la base de données DocuSense AI
# Lance l'interface de nettoyage interactif

Write-Host "🧹 NETTOYAGE DE LA BASE DE DONNÉES DOCUSENSE AI" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "backend\docusense.db")) {
    Write-Host "❌ Base de données introuvable" -ForegroundColor Red
    Write-Host "Assurez-vous d'exécuter ce script depuis la racine du projet" -ForegroundColor Yellow
    exit 1
}

# Aller dans le répertoire backend
Set-Location "backend"

# Activer l'environnement virtuel
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "🔧 Activation de l'environnement virtuel..." -ForegroundColor Green
    & "venv\Scripts\Activate.ps1"
} else {
    Write-Host "⚠️  Environnement virtuel non trouvé" -ForegroundColor Yellow
}

# Lancer le script de nettoyage
Write-Host "🚀 Lancement du script de nettoyage..." -ForegroundColor Green
& "venv\Scripts\python.exe" "cleanup_database.py"

# Retourner au répertoire parent
Set-Location ".."

Write-Host "✅ Nettoyage terminé" -ForegroundColor Green
