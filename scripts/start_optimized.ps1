# DocuSense AI - Script de Démarrage Optimisé
# Usage: .\scripts\start_optimized.ps1 [-Analyze] [-Optimize] [-Force]

param(
    [switch]$Analyze,
    [switch]$Optimize,
    [switch]$Force
)

Write-Host "🚀 DocuSense AI - Démarrage Optimisé" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Fonction pour vérifier si un port est utilisé
function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
        return $connection.TcpTestSucceeded
    }
    catch {
        return $false
    }
}

# Fonction pour tuer les processus sur les ports
function Stop-ProcessOnPort {
    param([int]$Port)
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        foreach ($pid in $processes) {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "✅ Processus $pid arrêté sur le port $Port" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "⚠️ Aucun processus trouvé sur le port $Port" -ForegroundColor Yellow
    }
}

# Vérification des prérequis
Write-Host "📋 Vérification des prérequis..." -ForegroundColor Yellow

# Vérifier Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "💡 Installez Python 3.8+ depuis https://python.org" -ForegroundColor Yellow
    exit 1
}

# Vérifier Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "💡 Installez Node.js 16+ depuis https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Prérequis vérifiés" -ForegroundColor Green

# Arrêt des processus existants si -Force
if ($Force) {
    Write-Host "🔄 Arrêt des processus existants..." -ForegroundColor Yellow
    Stop-ProcessOnPort 8000  # Backend
    Stop-ProcessOnPort 3000  # Frontend
    Start-Sleep -Seconds 2
}

# Vérification des ports
if (Test-Port 8000) {
    Write-Host "⚠️ Le port 8000 (backend) est déjà utilisé" -ForegroundColor Yellow
    if (-not $Force) {
        Write-Host "💡 Utilisez -Force pour arrêter les processus existants" -ForegroundColor Yellow
        exit 1
    }
}

if (Test-Port 3000) {
    Write-Host "⚠️ Le port 3000 (frontend) est déjà utilisé" -ForegroundColor Yellow
    if (-not $Force) {
        Write-Host "💡 Utilisez -Force pour arrêter les processus existants" -ForegroundColor Yellow
        exit 1
    }
}

# Configuration du Backend
Write-Host "🔧 Configuration du Backend..." -ForegroundColor Yellow
Set-Location backend

# Vérifier si l'environnement virtuel existe
if (-not (Test-Path "venv")) {
    Write-Host "📦 Création de l'environnement virtuel..." -ForegroundColor Yellow
    python -m venv venv
}

# Activer l'environnement virtuel
Write-Host "🔌 Activation de l'environnement virtuel..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"

# Installation des dépendances
Write-Host "📦 Installation des dépendances Python..." -ForegroundColor Yellow
& "venv\Scripts\pip.exe" install -r requirements.txt

# Optimisation si demandée
if ($Optimize) {
    Write-Host "⚡ Optimisation du système..." -ForegroundColor Yellow
    # Nettoyage des caches
    & "venv\Scripts\pip.exe" cache purge
    # Optimisation de la base de données
    if (Test-Path "docusense.db") {
        Write-Host "🗄️ Optimisation de la base de données..." -ForegroundColor Yellow
    }
}

# Démarrage du Backend
Write-Host "🚀 Démarrage du Backend..." -ForegroundColor Green
Start-Process -FilePath "venv\Scripts\python.exe" -ArgumentList "main.py" -WindowStyle Minimized

# Retour au répertoire racine
Set-Location ..

# Configuration du Frontend
Write-Host "🎨 Configuration du Frontend..." -ForegroundColor Yellow
Set-Location frontend

# Installation des dépendances Node.js
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances Node.js..." -ForegroundColor Yellow
    npm install
}

# Démarrage du Frontend
Write-Host "🚀 Démarrage du Frontend..." -ForegroundColor Green
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Minimized

# Retour au répertoire racine
Set-Location ..

# Attendre que les services démarrent
Write-Host "⏳ Attente du démarrage des services..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Vérification des services
Write-Host "🔍 Vérification des services..." -ForegroundColor Yellow

$backendReady = $false
$frontendReady = $false

for ($i = 0; $i -lt 10; $i++) {
    if (Test-Port 8000) {
        $backendReady = $true
        Write-Host "✅ Backend démarré sur http://localhost:8000" -ForegroundColor Green
    }
    
    if (Test-Port 3000) {
        $frontendReady = $true
        Write-Host "✅ Frontend démarré sur http://localhost:3000" -ForegroundColor Green
    }
    
    if ($backendReady -and $frontendReady) {
        break
    }
    
    Start-Sleep -Seconds 2
}

if (-not $backendReady) {
    Write-Host "❌ Le Backend n'a pas démarré correctement" -ForegroundColor Red
}

if (-not $frontendReady) {
    Write-Host "❌ Le Frontend n'a pas démarré correctement" -ForegroundColor Red
}

# Ouverture automatique du navigateur
if ($backendReady -and $frontendReady) {
    Write-Host "🌐 Ouverture du navigateur..." -ForegroundColor Green
    Start-Process "http://localhost:3000"
}

Write-Host ""
Write-Host "🎉 DocuSense AI est prêt !" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📚 API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Pour arrêter les services, fermez les fenêtres ou utilisez Ctrl+C" -ForegroundColor Yellow 