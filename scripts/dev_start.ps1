#!/usr/bin/env pwsh

# Script de démarrage intelligent pour DocuSense AI
# Gère automatiquement les ports, les répertoires et les services

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$Force
)

Write-Host "🚀 Démarrage intelligent DocuSense AI" -ForegroundColor Cyan

# Fonction pour vérifier si on est dans le bon répertoire
function Test-ProjectRoot {
    if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
        Write-Host "❌ Erreur: Ce script doit être exécuté depuis la racine du projet" -ForegroundColor Red
        Write-Host "   Répertoire actuel: $(Get-Location)" -ForegroundColor Yellow
        Write-Host "   Répertoires attendus: backend/, frontend/" -ForegroundColor Yellow
        exit 1
    }
}

# Fonction pour nettoyer les ports
function Clear-Ports {
    Write-Host "🧹 Nettoyage des ports..." -ForegroundColor Yellow
    
    # Nettoyer les processus Python (backend)
    $pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
    if ($pythonProcesses) {
        Write-Host "   Arrêt des processus Python..." -ForegroundColor Yellow
        Stop-Process -Name "python" -Force -ErrorAction SilentlyContinue
    }
    
    # Nettoyer les processus Node (frontend)
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "   Arrêt des processus Node..." -ForegroundColor Yellow
        Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    }
    
    # Attendre que les ports soient libérés
    Start-Sleep -Seconds 3
    Write-Host "✅ Ports nettoyés" -ForegroundColor Green
}

# Fonction pour vérifier l'environnement virtuel
function Test-VirtualEnvironment {
    if (-not (Test-Path "backend\venv\Scripts\python.exe")) {
        Write-Host "❌ Environnement virtuel manquant dans backend\venv\" -ForegroundColor Red
        Write-Host "   Création de l'environnement virtuel..." -ForegroundColor Yellow
        Set-Location "backend"
        python -m venv venv
        .\venv\Scripts\activate
        pip install -r requirements.txt
        Set-Location ".."
    }
}

# Fonction pour démarrer le backend
function Start-Backend {
    Write-Host "🐍 Démarrage du backend..." -ForegroundColor Green
    
    # Vérifier l'environnement virtuel
    Test-VirtualEnvironment
    
    # Démarrer le backend
    Set-Location "backend"
    Start-Process -FilePath "venv\Scripts\python.exe" -ArgumentList "main.py" -WindowStyle Normal
    Set-Location ".."
    
    # Attendre que le backend soit prêt
    Write-Host "   Attente du démarrage du backend..." -ForegroundColor Yellow
    $attempts = 0
    do {
        Start-Sleep -Seconds 2
        $attempts++
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/" -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Backend démarré sur http://localhost:8000" -ForegroundColor Green
                return $true
            }
        } catch {
            if ($attempts -ge 15) {
                Write-Host "❌ Timeout: Le backend n'a pas démarré en 30 secondes" -ForegroundColor Red
                return $false
            }
        }
    } while ($attempts -lt 15)
    
    return $false
}

# Fonction pour démarrer le frontend
function Start-Frontend {
    Write-Host "⚛️  Démarrage du frontend..." -ForegroundColor Green
    
    # Forcer la libération du port 3000
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "   Libération du port 3000..." -ForegroundColor Yellow
        Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    # Démarrer le frontend
    Set-Location "frontend"
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Normal
    Set-Location ".."
    
    # Attendre que le frontend soit prêt
    Write-Host "   Attente du démarrage du frontend..." -ForegroundColor Yellow
    $attempts = 0
    do {
        Start-Sleep -Seconds 2
        $attempts++
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/" -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Frontend démarré sur http://localhost:3000" -ForegroundColor Green
                return $true
            }
        } catch {
            if ($attempts -ge 15) {
                Write-Host "❌ Timeout: Le frontend n'a pas démarré en 30 secondes" -ForegroundColor Red
                return $false
            }
        }
    } while ($attempts -lt 15)
    
    return $false
}

# Fonction pour surveiller les services
function Watch-Services {
    Write-Host "👀 Surveillance des services..." -ForegroundColor Cyan
    Write-Host "   Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Yellow
    
    while ($true) {
        $backendStatus = $false
        $frontendStatus = $false
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/" -TimeoutSec 2 -ErrorAction Stop
            $backendStatus = ($response.StatusCode -eq 200)
        } catch {
            $backendStatus = $false
        }
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/" -TimeoutSec 2 -ErrorAction Stop
            $frontendStatus = ($response.StatusCode -eq 200)
        } catch {
            $frontendStatus = $false
        }
        
        $timestamp = Get-Date -Format "HH:mm:ss"
        $backendIcon = if ($backendStatus) { "🟢" } else { "🔴" }
        $frontendIcon = if ($frontendStatus) { "🟢" } else { "🔴" }
        
        Write-Host "[$timestamp] Backend: $backendIcon Frontend: $frontendIcon" -ForegroundColor Gray
        
        Start-Sleep -Seconds 10
    }
}

# Main execution
try {
    # Vérifier le répertoire
    Test-ProjectRoot
    
    # Nettoyer les ports si demandé
    if ($Force) {
        Clear-Ports
    }
    
    # Démarrer les services selon les paramètres
    if ($BackendOnly) {
        Start-Backend
    } elseif ($FrontendOnly) {
        Start-Frontend
    } else {
        # Démarrer les deux services
        $backendStarted = Start-Backend
        if ($backendStarted) {
            Start-Sleep -Seconds 2
            $frontendStarted = Start-Frontend
            
            if ($backendStarted -and $frontendStarted) {
                Write-Host "🎉 Tous les services sont démarrés !" -ForegroundColor Green
                Write-Host "   Backend: http://localhost:8000" -ForegroundColor Cyan
                Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
                Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
                
                # Démarrer la surveillance
                Watch-Services
            }
        }
    }
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} 