# Script optimisé pour démarrer DocuSense AI
# Version 2.1 - Optimisé et allégé

param(
    [switch]$External,  # Mode externe avec terminaux séparés
    [switch]$KillOnly,  # Mode arrêt uniquement
    [switch]$Quiet      # Mode silencieux (moins de logs)
)

# Configuration des couleurs selon le mode
$InfoColor = if ($Quiet) { "Gray" } else { "Cyan" }
$SuccessColor = "Green"
$WarningColor = "Yellow"
$ErrorColor = "Red"

Write-Host "🚀 DocuSense AI - Gestionnaire de Services" -ForegroundColor $SuccessColor
if (-not $Quiet) {
    Write-Host "================================================" -ForegroundColor Gray
}

# Obtenir le chemin absolu du projet
$projectPath = Get-Location
$backendPath = Join-Path $projectPath "backend"
$frontendPath = Join-Path $projectPath "frontend"
$databaseManagerPath = Join-Path $backendPath "database_manager"

# Vérifier que les dossiers existent
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Erreur: Dossier backend introuvable" -ForegroundColor $ErrorColor
    exit 1
}

if (-not (Test-Path $frontendPath)) {
    Write-Host "❌ Erreur: Dossier frontend introuvable" -ForegroundColor $ErrorColor
    exit 1
}

$hasDatabaseManager = Test-Path $databaseManagerPath
if (-not $hasDatabaseManager -and -not $Quiet) {
    Write-Host "⚠️ Interface de gestion de base de données non trouvée" -ForegroundColor $WarningColor
}

# Fonction pour arrêter les services
function Stop-Services {
    if (-not $Quiet) {
        Write-Host "🔄 Arrêt des services..." -ForegroundColor $WarningColor
    }
    
    # Arrêter les processus par port (plus efficace)
    $ports = @(3000, 3001, 8000)
    foreach ($port in $ports) {
        try {
            $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            if ($connection) {
                Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
                if (-not $Quiet) {
                    Write-Host "✅ Port $port libéré" -ForegroundColor $SuccessColor
                }
            }
        } catch {}
    }
    
    # Arrêter les jobs PowerShell existants
    Get-Job -ErrorAction SilentlyContinue | Stop-Job -ErrorAction SilentlyContinue | Remove-Job -ErrorAction SilentlyContinue
    
    Start-Sleep -Seconds 1
    if (-not $Quiet) {
        Write-Host "✅ Services arrêtés" -ForegroundColor $SuccessColor
    }
}

# Fonction pour vérifier l'environnement virtuel
function Test-VirtualEnvironment {
    $venvPath = Join-Path $backendPath "venv"
    if (-not (Test-Path $venvPath)) {
        if (-not $Quiet) {
            Write-Host "🐍 Création de l'environnement virtuel..." -ForegroundColor $InfoColor
        }
        Set-Location $backendPath
        python -m venv venv | Out-Null
        Set-Location $projectPath
    }
}

# Fonction pour démarrer les services en mode intégré
function Start-Services-Integrated {
    if (-not $Quiet) {
        Write-Host "🔧 Mode INTÉGRÉ" -ForegroundColor $InfoColor
    }
    
    # Vérifier l'environnement virtuel
    Test-VirtualEnvironment
    
    # Démarrer le backend
    if (-not $Quiet) {
        Write-Host "📊 Démarrage du Backend..." -ForegroundColor $InfoColor
    }
    Set-Location $backendPath
    $backendJob = Start-Job -ScriptBlock {
        param($backendPath)
        Set-Location $backendPath
        .\venv\Scripts\python.exe main.py
    } -ArgumentList $backendPath
    
    Set-Location $projectPath
    
    # Attendre et vérifier le backend
    Start-Sleep -Seconds 6
    $backendReady = $false
    for ($i = 0; $i -lt 5; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -TimeoutSec 3 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                $backendReady = $true
                break
            }
        } catch {}
        Start-Sleep -Seconds 2
    }
    
    if ($backendReady -and -not $Quiet) {
        Write-Host "✅ Backend opérationnel" -ForegroundColor $SuccessColor
    }
    
    # Démarrer le frontend
    if (-not $Quiet) {
        Write-Host "🎨 Démarrage du Frontend..." -ForegroundColor $InfoColor
    }
    Set-Location $frontendPath
    $frontendJob = Start-Job -ScriptBlock {
        param($frontendPath)
        Set-Location $frontendPath
        npm run dev
    } -ArgumentList $frontendPath
    
    Set-Location $projectPath
    Start-Sleep -Seconds 3
    
    # Démarrer l'interface de gestion de base de données
    $databaseManagerJob = $null
    if ($hasDatabaseManager) {
        if (-not $Quiet) {
            Write-Host "🗄️ Démarrage de l'interface DB..." -ForegroundColor $InfoColor
        }
        
        # Vérifier Node.js
        try {
            node --version | Out-Null
        } catch {
            if (-not $Quiet) {
                Write-Host "❌ Node.js non trouvé, interface DB ignorée" -ForegroundColor $ErrorColor
            }
        }
        
        if ($?) {
            Set-Location $databaseManagerPath
            
            # Installer les dépendances si nécessaire
            if (-not (Test-Path "node_modules")) {
                if (-not $Quiet) {
                    Write-Host "📦 Installation des dépendances..." -ForegroundColor $WarningColor
                }
                npm install | Out-Null
            }
            
            $databaseManagerJob = Start-Job -ScriptBlock {
                param($databaseManagerPath)
                Set-Location $databaseManagerPath
                npm run dev
            } -ArgumentList $databaseManagerPath
            
            Set-Location $projectPath
        }
    }
    
    # Affichage des URLs
    Write-Host "✅ Services démarrés!" -ForegroundColor $SuccessColor
    Write-Host "Backend: http://localhost:8000" -ForegroundColor $InfoColor
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor $InfoColor
    if ($databaseManagerJob) {
        Write-Host "🗄️ Interface DB: http://localhost:3001" -ForegroundColor $InfoColor
    }
    
    if (-not $Quiet) {
        Write-Host "💡 Utilisez 'Get-Job' pour voir les jobs, 'Stop-Job' pour les arrêter" -ForegroundColor $WarningColor
        Write-Host "💡 Ou relancez ce script avec -KillOnly pour tout arrêter" -ForegroundColor $WarningColor
    }
    
    return @{
        BackendJob = $backendJob
        FrontendJob = $frontendJob
        DatabaseManagerJob = $databaseManagerJob
    }
}

# Fonction pour démarrer les services en mode externe
function Start-Services-External {
    if (-not $Quiet) {
        Write-Host "🔧 Mode EXTERNE" -ForegroundColor $InfoColor
    }
    
    # Vérifier l'environnement virtuel
    Test-VirtualEnvironment
    
    # Démarrer le backend
    if (-not $Quiet) {
        Write-Host "📊 Démarrage du Backend..." -ForegroundColor $InfoColor
    }
    $backendTitle = "DocuSense Backend"
    $backendCmd = @"
`$host.ui.RawUI.WindowTitle = '$backendTitle'
cd '$backendPath'
Write-Host '🐍 Backend démarré' -ForegroundColor Green
Write-Host '🌐 http://localhost:8000' -ForegroundColor Cyan
.\venv\Scripts\python.exe main.py
"@
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
    
    Start-Sleep -Seconds 6
    
    # Démarrer le frontend
    if (-not $Quiet) {
        Write-Host "🎨 Démarrage du Frontend..." -ForegroundColor $InfoColor
    }
    $frontendTitle = "DocuSense Frontend"
    $frontendCmd = @"
`$host.ui.RawUI.WindowTitle = '$frontendTitle'
cd '$frontendPath'
Write-Host '⚛️ Frontend démarré' -ForegroundColor Green
Write-Host '🌐 http://localhost:3000' -ForegroundColor Cyan
npm run dev
"@
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
    
    # Démarrer l'interface de gestion de base de données
    if ($hasDatabaseManager) {
        if (-not $Quiet) {
            Write-Host "🗄️ Démarrage de l'interface DB..." -ForegroundColor $InfoColor
        }
        
        try {
            node --version | Out-Null
            if ($?) {
                $databaseTitle = "DocuSense Database Manager"
                $databaseCmd = @"
`$host.ui.RawUI.WindowTitle = '$databaseTitle'
cd '$databaseManagerPath'
Write-Host '🗄️ Interface DB démarrée' -ForegroundColor Green
Write-Host '🌐 http://localhost:3001' -ForegroundColor Cyan

if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
    npm install
}

npm run dev
"@
                Start-Process powershell -ArgumentList "-NoExit", "-Command", $databaseCmd
            }
        } catch {
            if (-not $Quiet) {
                Write-Host "❌ Node.js non trouvé, interface DB ignorée" -ForegroundColor $ErrorColor
            }
        }
    }
    
    # Affichage des URLs
    Write-Host "✅ Services démarrés!" -ForegroundColor $SuccessColor
    Write-Host "Backend: http://localhost:8000" -ForegroundColor $InfoColor
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor $InfoColor
    if ($hasDatabaseManager) {
        Write-Host "🗄️ Interface DB: http://localhost:3001" -ForegroundColor $InfoColor
    }
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

Write-Host "🎉 DocuSense AI prêt!" -ForegroundColor $SuccessColor
