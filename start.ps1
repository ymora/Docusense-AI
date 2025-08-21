# Script simplifié pour démarrer DocuSense AI
# Version 6.0 - Fenêtres PowerShell dans Cursor avec IDs

Write-Host "🚀 DocuSense AI - Démarrage automatique" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Gray

# Obtenir le chemin absolu du script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectPath = $scriptPath
$backendPath = Join-Path $projectPath "backend"
$frontendPath = Join-Path $projectPath "frontend"

# Vérifier que les dossiers existent
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Erreur: Dossier backend introuvable" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendPath)) {
    Write-Host "❌ Erreur: Dossier frontend introuvable" -ForegroundColor Red
    exit 1
}

# Variables globales pour les processus
$global:backendProcess = $null
$global:frontendProcess = $null

# Fonction pour arrêter les processus existants
function Stop-ExistingProcesses {
    Write-Host "🔄 Arrêt des processus existants..." -ForegroundColor Yellow
    
    # Arrêter les processus Node.js
    try {
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Processus Node.js arrêtés" -ForegroundColor Green
    } catch {}
    
    # Arrêter les processus Python
    try {
        Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Get-Process -Name "python.exe" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Processus Python arrêtés" -ForegroundColor Green
    } catch {}
    
    # Libérer les ports
    $ports = @(3000, 3001, 3002, 8000)
    foreach ($port in $ports) {
        try {
            $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            if ($connection) {
                Write-Host "⚠️ Port $port occupé, libération..." -ForegroundColor Yellow
                Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        } catch {}
    }
    
    # Fermer les fenêtres PowerShell avec nos titres spécifiques
    try {
        Get-Process -Name "powershell" -ErrorAction SilentlyContinue | Where-Object {
            $_.MainWindowTitle -like "*DocuSense Backend*" -or $_.MainWindowTitle -like "*DocuSense Frontend*"
        } | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Fenêtres PowerShell DocuSense fermées" -ForegroundColor Green
    } catch {}
    
    Start-Sleep -Seconds 2
}

# Fonction pour démarrer le backend
function Start-Backend {
    Write-Host "`n🔧 Démarrage du Backend..." -ForegroundColor Yellow
    
    # Vérifier l'environnement virtuel
    $venvPythonPath = Join-Path $backendPath "venv\Scripts\python.exe"
    if (-not (Test-Path $venvPythonPath)) {
        Write-Host "🔧 Création de l'environnement virtuel..." -ForegroundColor Yellow
        Set-Location $backendPath
        python -m venv venv
        Set-Location $projectPath
    }
    
    # Démarrer le backend dans une nouvelle fenêtre PowerShell avec ID
    $backendCmd = @"
`$host.ui.RawUI.WindowTitle = 'DocuSense Backend - PID: ' + `$PID
Set-Location '$backendPath'
Write-Host '🔧 Démarrage du backend Python...' -ForegroundColor Cyan
Write-Host '📁 Répertoire: ' (Get-Location) -ForegroundColor Cyan
Write-Host '🆔 Process ID: ' `$PID -ForegroundColor Cyan
`$env:LOG_LEVEL = 'INFO'
`$env:PYTHONIOENCODING = 'utf-8'
& 'venv\Scripts\python.exe' main.py
"@
    
    $global:backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -PassThru
    Write-Host "🐍 Backend démarré dans une nouvelle fenêtre (PID: $($global:backendProcess.Id))" -ForegroundColor Cyan
    
    return $true
}

# Fonction pour démarrer le frontend
function Start-Frontend {
    Write-Host "`n🎨 Démarrage du Frontend..." -ForegroundColor Yellow
    
    # Démarrer le frontend dans une nouvelle fenêtre PowerShell avec ID
    $frontendCmd = @"
`$host.ui.RawUI.WindowTitle = 'DocuSense Frontend - PID: ' + `$PID
Set-Location '$frontendPath'
Write-Host '🎨 Démarrage du frontend...' -ForegroundColor Cyan
Write-Host '📁 Répertoire: ' (Get-Location) -ForegroundColor Cyan
Write-Host '🆔 Process ID: ' `$PID -ForegroundColor Cyan
Write-Host '🔧 Vérification Node.js...' -ForegroundColor Cyan
node --version
Write-Host '📦 Vérification npm...' -ForegroundColor Cyan
npm --version
Write-Host '🚀 Démarrage du frontend...' -ForegroundColor Green
npm run dev
"@
    
    $global:frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd -PassThru
    Write-Host "🎨 Frontend démarré dans une nouvelle fenêtre (PID: $($global:frontendProcess.Id))" -ForegroundColor Cyan
    
    return $true
}

# Fonction pour afficher le statut des services
function Show-ServiceStatus {
    Write-Host "`n📊 Statut des services:" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Gray
    
    if ($global:backendProcess -and -not $global:backendProcess.HasExited) {
        Write-Host "✅ Backend: En cours d'exécution (PID: $($global:backendProcess.Id))" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend: Arrêté" -ForegroundColor Red
    }
    
    if ($global:frontendProcess -and -not $global:frontendProcess.HasExited) {
        Write-Host "✅ Frontend: En cours d'exécution (PID: $($global:frontendProcess.Id))" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend: Arrêté" -ForegroundColor Red
    }
    
    Write-Host "================================================" -ForegroundColor Gray
    Write-Host "🌐 Backend: http://localhost:8000" -ForegroundColor Blue
    Write-Host "🎨 Frontend: http://localhost:3000" -ForegroundColor Blue
    Write-Host "================================================" -ForegroundColor Gray
}

# Fonction pour arrêter proprement tous les services
function Stop-AllServices {
    Write-Host "`n🛑 Arrêt de tous les services..." -ForegroundColor Red
    
    if ($global:backendProcess -and -not $global:backendProcess.HasExited) {
        $global:backendProcess.Kill()
        Write-Host "✅ Backend arrêté" -ForegroundColor Green
    }
    
    if ($global:frontendProcess -and -not $global:frontendProcess.HasExited) {
        $global:frontendProcess.Kill()
        Write-Host "✅ Frontend arrêté" -ForegroundColor Green
    }
    
    # Arrêter tous les processus Node.js et Python
    try {
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Get-Process -Name "python.exe" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    } catch {}
    
    Write-Host "✅ Tous les services arrêtés" -ForegroundColor Green
}

# Gestionnaire pour Ctrl+C
try {
    $null = [Console]::TreatControlCAsInput = $true
} catch {}

# EXÉCUTION PRINCIPALE
try {
    Write-Host "`n🔄 Préparation du démarrage..." -ForegroundColor Yellow
    
    # Arrêter les processus existants
    Stop-ExistingProcesses
    
    # Démarrer le backend
    $backendOK = Start-Backend
    if (-not $backendOK) {
        Write-Host "❌ Impossible de démarrer le backend" -ForegroundColor Red
        exit 1
    }
    
    # Démarrer le frontend
    $frontendOK = Start-Frontend
    if (-not $frontendOK) {
        Write-Host "❌ Impossible de démarrer le frontend" -ForegroundColor Red
        exit 1
    }
    
    # Affichage du statut
    Show-ServiceStatus
    
    Write-Host "💡 Les services sont maintenant dans des fenêtres séparées" -ForegroundColor Yellow
    Write-Host "💡 Appuyez sur Ctrl+C pour arrêter tous les services" -ForegroundColor Yellow
    Write-Host "💡 Ou fermez ce script pour laisser les services tourner" -ForegroundColor Yellow
    
    # Boucle d'attente avec surveillance
    try {
        while ($true) {
            # Vérifier si un des processus s'est arrêté
            if (($global:backendProcess -and $global:backendProcess.HasExited) -or 
                ($global:frontendProcess -and $global:frontendProcess.HasExited)) {
                Write-Host "`n⚠️ Un service s'est arrêté inopinément" -ForegroundColor Yellow
                Show-ServiceStatus
                break
            }
            
            Start-Sleep -Seconds 5
        }
    } catch {
        # Ctrl+C détecté
        Write-Host "`n🛑 Arrêt demandé par l'utilisateur" -ForegroundColor Red
    }
    
    # Arrêter proprement
    Stop-AllServices
    
} catch {
    Write-Host "`n❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Stop-AllServices
    exit 1
}
