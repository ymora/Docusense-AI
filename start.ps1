# Script optimisé pour démarrer DocuSense AI
# Version 2.0 - Gestion intelligente des processus

param(
    [switch]$External,  # Mode externe avec terminaux séparés
    [switch]$KillOnly   # Mode arrêt uniquement
)

Write-Host "🚀 DocuSense AI - Gestionnaire de Services" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Gray

# Obtenir le chemin absolu du projet
$projectPath = Get-Location
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

# Fonction pour arrêter les services
function Stop-Services {
    Write-Host "🔄 Arrêt des services DocuSense..." -ForegroundColor Yellow
    
    # Arrêter les processus Python et Node spécifiques à DocuSense
    $pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*main.py*" -or $_.ProcessName -eq "python"
    }
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*npm*" -or $_.CommandLine -like "*vite*"
    }
    
    if ($pythonProcesses) {
        Write-Host "🛑 Arrêt de $($pythonProcesses.Count) processus Python..." -ForegroundColor Yellow
        $pythonProcesses | Stop-Process -Force
    }
    
    if ($nodeProcesses) {
        Write-Host "🛑 Arrêt de $($nodeProcesses.Count) processus Node..." -ForegroundColor Yellow
        $nodeProcesses | Stop-Process -Force
    }
    
    # Libérer les ports
    Write-Host "🔍 Libération des ports..." -ForegroundColor Cyan
    try {
        $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
        if ($port3000) {
            Stop-Process -Id $port3000.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Host "✅ Port 3000 libéré" -ForegroundColor Green
        }
    } catch {}
    
    try {
        $port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
        if ($port8000) {
            Stop-Process -Id $port8000.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Host "✅ Port 8000 libéré" -ForegroundColor Green
        }
    } catch {}
    
    Start-Sleep -Seconds 2
    Write-Host "✅ Services arrêtés" -ForegroundColor Green
}

# Fonction pour démarrer les services en mode intégré
function Start-Services-Integrated {
    Write-Host "🔧 Mode INTÉGRÉ - Services dans le terminal actuel" -ForegroundColor Cyan
    Write-Host "💡 Recommandé pour Cursor et développement" -ForegroundColor Green
    
    # Vérifier l'environnement virtuel
    Write-Host "🐍 Vérification de l'environnement virtuel..." -ForegroundColor Cyan
    $venvPath = Join-Path $backendPath "venv"
    if (-not (Test-Path $venvPath)) {
        Write-Host "❌ Environnement virtuel manquant, création..." -ForegroundColor Red
        Set-Location $backendPath
        python -m venv venv
        Set-Location $projectPath
    }
    
    # Démarrer le backend en arrière-plan
    Write-Host "📊 Démarrage du Backend..." -ForegroundColor Cyan
    Set-Location $backendPath
    $backendJob = Start-Job -ScriptBlock {
        param($backendPath)
        Set-Location $backendPath
        .\venv\Scripts\python.exe main.py
    } -ArgumentList $backendPath
    
    Set-Location $projectPath
    
    # Attendre que le backend démarre
    Write-Host "⏳ Attente du démarrage du backend..." -ForegroundColor Yellow
    Start-Sleep -Seconds 8
    
    # Vérifier que le backend fonctionne
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend opérationnel" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️ Backend en cours de démarrage..." -ForegroundColor Yellow
    }
    
    # Démarrer le frontend en arrière-plan
    Write-Host "🎨 Démarrage du Frontend..." -ForegroundColor Cyan
    Set-Location $frontendPath
    $frontendJob = Start-Job -ScriptBlock {
        param($frontendPath)
        Set-Location $frontendPath
        npm run dev
    } -ArgumentList $frontendPath
    
    Set-Location $projectPath
    
    # Attendre que le frontend démarre
    Start-Sleep -Seconds 5
    
    Write-Host "✅ Services démarrés en mode intégré!" -ForegroundColor Green
    Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "💡 Utilisez 'Get-Job' pour voir les jobs, 'Stop-Job' pour les arrêter" -ForegroundColor Yellow
    Write-Host "💡 Ou relancez ce script avec -KillOnly pour tout arrêter" -ForegroundColor Yellow
    
    # Retourner les jobs pour référence
    return @{
        BackendJob = $backendJob
        FrontendJob = $frontendJob
    }
}

# Fonction pour démarrer les services en mode externe
function Start-Services-External {
    Write-Host "🔧 Mode EXTERNE - Services dans des terminaux séparés" -ForegroundColor Cyan
    Write-Host "💡 Utile pour voir les logs en temps réel" -ForegroundColor Green
    
    # Vérifier l'environnement virtuel
    Write-Host "🐍 Vérification de l'environnement virtuel..." -ForegroundColor Cyan
    $venvPath = Join-Path $backendPath "venv"
    if (-not (Test-Path $venvPath)) {
        Write-Host "❌ Environnement virtuel manquant, création..." -ForegroundColor Red
        Set-Location $backendPath
        python -m venv venv
        Set-Location $projectPath
    }
    
    # Démarrer le backend dans un nouveau terminal
    Write-Host "📊 Démarrage du Backend..." -ForegroundColor Cyan
    $backendTitle = "DocuSense Backend - Python Server"
    $backendCmd = @"
`$host.ui.RawUI.WindowTitle = '$backendTitle'
cd '$backendPath'
Write-Host '🐍 DocuSense Backend démarré' -ForegroundColor Green
Write-Host '🌐 Serveur: http://localhost:8000' -ForegroundColor Cyan
Write-Host '📝 Logs du backend:' -ForegroundColor Yellow
.\venv\Scripts\python.exe main.py
"@
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
    
    # Attendre que le backend démarre
    Start-Sleep -Seconds 8
    
    # Démarrer le frontend dans un nouveau terminal
    Write-Host "🎨 Démarrage du Frontend..." -ForegroundColor Cyan
    $frontendTitle = "DocuSense Frontend - React Dev Server"
    $frontendCmd = @"
`$host.ui.RawUI.WindowTitle = '$frontendTitle'
cd '$frontendPath'
Write-Host '⚛️ DocuSense Frontend démarré' -ForegroundColor Green
Write-Host '🌐 Application: http://localhost:3000' -ForegroundColor Cyan
Write-Host '📝 Logs du frontend:' -ForegroundColor Yellow
npm run dev
"@
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
    
    Write-Host "✅ Services démarrés en mode externe!" -ForegroundColor Green
    Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "💡 Les terminaux sont maintenant ouverts séparément" -ForegroundColor Yellow
}

# Logique principale
if ($KillOnly) {
    Stop-Services
    exit 0
}

# Arrêter les services existants avant de redémarrer
Stop-Services

# Démarrer selon le mode choisi
if ($External) {
    Start-Services-External
} else {
    Start-Services-Integrated
}

Write-Host "🎉 DocuSense AI prêt!" -ForegroundColor Green
