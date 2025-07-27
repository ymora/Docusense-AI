# Script de démarrage pour DocuSense AI
# Usage: .\scripts\start_docusense.ps1 [-BackendOnly] [-FrontendOnly] [-Clean]

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$Clean
)

# Configuration
$BackendPort = 8000
$FrontendPort = 3000
$BackendDir = "backend"
$FrontendDir = "frontend"

Write-Host "🚀 DocuSense AI - Script de démarrage" -ForegroundColor Green

# Fonction pour vérifier si un port est utilisé
function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -WarningAction SilentlyContinue
        return $connection.TcpTestSucceeded
    }
    catch {
        return $false
    }
}

# Fonction pour tuer les processus sur un port
function Stop-ProcessOnPort {
    param([int]$Port)
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        foreach ($pid in $processes) {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "Processus arrêté sur le port $Port (PID: $pid)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "Aucun processus trouvé sur le port $Port" -ForegroundColor Gray
    }
}

# Fonction pour vérifier les prérequis
function Test-Prerequisites {
    Write-Host "🔍 Vérification des prérequis..." -ForegroundColor Blue
    
    # Vérifier Python
    try {
        $pythonVersion = python --version 2>&1
        Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Python non trouvé. Veuillez installer Python 3.8+" -ForegroundColor Red
        exit 1
    }
    
    # Vérifier Node.js
    try {
        $nodeVersion = node --version 2>&1
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Node.js non trouvé. Veuillez installer Node.js 16+" -ForegroundColor Red
        exit 1
    }
    
    # Vérifier npm
    try {
        $npmVersion = npm --version 2>&1
        Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ npm non trouvé" -ForegroundColor Red
        exit 1
    }
}

# Fonction pour nettoyer les ports
function Clear-Ports {
    Write-Host "🧹 Nettoyage des ports..." -ForegroundColor Blue
    
    if (Test-Port $BackendPort) {
        Write-Host "Arrêt du processus sur le port $BackendPort..." -ForegroundColor Yellow
        Stop-ProcessOnPort $BackendPort
    }
    
    if (Test-Port $FrontendPort) {
        Write-Host "Arrêt du processus sur le port $FrontendPort..." -ForegroundColor Yellow
        Stop-ProcessOnPort $FrontendPort
    }
    
    Start-Sleep -Seconds 2
}

# Fonction pour démarrer le backend
function Start-Backend {
    Write-Host "🔧 Démarrage du backend..." -ForegroundColor Blue
    
    if (Test-Port $BackendPort) {
        Write-Host "⚠️  Le port $BackendPort est déjà utilisé" -ForegroundColor Yellow
        return
    }
    
    if (-not (Test-Path $BackendDir)) {
        Write-Host "❌ Dossier backend non trouvé" -ForegroundColor Red
        exit 1
    }
    
    Set-Location $BackendDir
    
    # Vérifier l'environnement virtuel
    if (-not (Test-Path "venv")) {
        Write-Host "📦 Création de l'environnement virtuel..." -ForegroundColor Blue
        python -m venv venv
    }
    
    # Activer l'environnement virtuel
    Write-Host "🔧 Activation de l'environnement virtuel..." -ForegroundColor Blue
    & ".\venv\Scripts\Activate.ps1"
    
    # Installer les dépendances si nécessaire
    if (-not (Test-Path "venv\Lib\site-packages\fastapi")) {
        Write-Host "📦 Installation des dépendances..." -ForegroundColor Blue
        pip install -r requirements.txt
    }
    
    # Démarrer le serveur
    Write-Host "🚀 Démarrage du serveur backend sur le port $BackendPort..." -ForegroundColor Green
    Start-Process -FilePath "python" -ArgumentList "main.py" -WindowStyle Normal
    
    # Attendre que le serveur démarre
    $attempts = 0
    while (-not (Test-Port $BackendPort) -and $attempts -lt 30) {
        Start-Sleep -Seconds 1
        $attempts++
        Write-Host "⏳ Attente du démarrage du backend... ($attempts/30)" -ForegroundColor Yellow
    }
    
    if (Test-Port $BackendPort) {
        Write-Host "✅ Backend démarré avec succès sur http://localhost:$BackendPort" -ForegroundColor Green
    } else {
        Write-Host "❌ Échec du démarrage du backend" -ForegroundColor Red
        exit 1
    }
    
    Set-Location ".."
}

# Fonction pour démarrer le frontend
function Start-Frontend {
    Write-Host "🎨 Démarrage du frontend..." -ForegroundColor Blue
    
    if (Test-Port $FrontendPort) {
        Write-Host "⚠️  Le port $FrontendPort est déjà utilisé" -ForegroundColor Yellow
        return
    }
    
    if (-not (Test-Path $FrontendDir)) {
        Write-Host "❌ Dossier frontend non trouvé" -ForegroundColor Red
        exit 1
    }
    
    Set-Location $FrontendDir
    
    # Installer les dépendances si nécessaire
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installation des dépendances..." -ForegroundColor Blue
        npm install
    }
    
    # Démarrer le serveur de développement
    Write-Host "🚀 Démarrage du serveur frontend sur le port $FrontendPort..." -ForegroundColor Green
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Normal
    
    # Attendre que le serveur démarre
    $attempts = 0
    while (-not (Test-Port $FrontendPort) -and $attempts -lt 30) {
        Start-Sleep -Seconds 1
        $attempts++
        Write-Host "⏳ Attente du démarrage du frontend... ($attempts/30)" -ForegroundColor Yellow
    }
    
    if (Test-Port $FrontendPort) {
        Write-Host "✅ Frontend démarré avec succès sur http://localhost:$FrontendPort" -ForegroundColor Green
    } else {
        Write-Host "❌ Échec du démarrage du frontend" -ForegroundColor Red
        exit 1
    }
    
    Set-Location ".."
}

# Fonction pour afficher les URLs
function Show-URLs {
    Write-Host "`n🌐 URLs d'accès:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:$FrontendPort" -ForegroundColor White
    Write-Host "   Backend API: http://localhost:$BackendPort" -ForegroundColor White
    Write-Host "   API Docs: http://localhost:$BackendPort/docs" -ForegroundColor White
    Write-Host "   Health Check: http://localhost:$BackendPort/api/health" -ForegroundColor White
    Write-Host ""
}

# Script principal
try {
    # Vérifier les prérequis
    Test-Prerequisites
    
    # Nettoyer si demandé
    if ($Clean) {
        Clear-Ports
    }
    
    # Démarrer les services selon les paramètres
    if ($BackendOnly) {
        Start-Backend
        Show-URLs
    }
    elseif ($FrontendOnly) {
        Start-Frontend
        Show-URLs
    }
    else {
        # Démarrage complet
        Start-Backend
        Start-Sleep -Seconds 3
        Start-Frontend
        Show-URLs
    }
    
    Write-Host "🎉 DocuSense AI est prêt!" -ForegroundColor Green
    Write-Host "   Appuyez sur Ctrl+C pour arrêter les services" -ForegroundColor Gray
    
    # Attendre l'interruption
    try {
        while ($true) {
            Start-Sleep -Seconds 1
        }
    }
    catch {
        Write-Host "`n👋 Arrêt des services..." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    # Nettoyer à la sortie
    Write-Host "🧹 Nettoyage..." -ForegroundColor Blue
    Clear-Ports
} 