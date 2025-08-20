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

Write-Host "DocuSense AI - Gestionnaire de Services" -ForegroundColor $SuccessColor
if (-not $Quiet) {
    Write-Host "================================================" -ForegroundColor Gray
}

# Obtenir le chemin absolu du script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Chemin du script: $scriptPath" -ForegroundColor Gray

# Déterminer le chemin du projet
$projectPath = $scriptPath
$currentFolder = Split-Path $projectPath -Leaf

# Si on est dans le dossier backend, remonter d'un niveau
if ($currentFolder -eq "backend") {
    $projectPath = Split-Path $projectPath -Parent
    Write-Host "Detection: execution depuis le dossier backend, remonte au parent" -ForegroundColor Yellow
}

# Si on est dans le dossier frontend, remonter d'un niveau
if ($currentFolder -eq "frontend") {
    $projectPath = Split-Path $projectPath -Parent
    Write-Host "Detection: execution depuis le dossier frontend, remonte au parent" -ForegroundColor Yellow
}

Write-Host "Repertoire de travail: $projectPath" -ForegroundColor Gray

$backendPath = Join-Path $projectPath "backend"
$frontendPath = Join-Path $projectPath "frontend"
$databaseManagerPath = Join-Path $backendPath "database_manager"

Write-Host "Chemin backend: $backendPath" -ForegroundColor Gray
Write-Host "Chemin frontend: $frontendPath" -ForegroundColor Gray

# Vérifier que les dossiers existent
if (-not (Test-Path $backendPath)) {
    Write-Host "Erreur: Dossier backend introuvable" -ForegroundColor $ErrorColor
    Write-Host "Chemin teste: $backendPath" -ForegroundColor Red
    Write-Host "Contenu du repertoire actuel:" -ForegroundColor Red
    Get-ChildItem | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Red }
    exit 1
}

if (-not (Test-Path $frontendPath)) {
    Write-Host "Erreur: Dossier frontend introuvable" -ForegroundColor $ErrorColor
    exit 1
}

$hasDatabaseManager = Test-Path $databaseManagerPath
if (-not $hasDatabaseManager -and -not $Quiet) {
    Write-Host "Interface de gestion de base de données non trouvée" -ForegroundColor $WarningColor
}

# Fonction pour arrêter les services
function Stop-Services {
    if (-not $Quiet) {
        Write-Host "Arret des services..." -ForegroundColor $WarningColor
    }
    
    # Arrêter les jobs PowerShell existants (pour le mode intégré)
    $jobs = Get-Job -ErrorAction SilentlyContinue
    if ($jobs) {
        $jobs | Stop-Job -ErrorAction SilentlyContinue | Remove-Job -ErrorAction SilentlyContinue
        if (-not $Quiet) {
            Write-Host "Jobs PowerShell arretes" -ForegroundColor $SuccessColor
        }
    }
    
    # Arrêter les processus par port (plus efficace)
    $ports = @(3000, 3001, 8000)
    foreach ($port in $ports) {
        try {
            $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            if ($connection) {
                Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
                if (-not $Quiet) {
                    Write-Host "Port $port libere" -ForegroundColor $SuccessColor
                }
            }
        } catch {}
    }
    
    # Arrêter les processus Node.js et Python spécifiques
    try {
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Get-Process -Name "python.exe" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    } catch {}
    
    Start-Sleep -Seconds 1
    if (-not $Quiet) {
        Write-Host "Services arretes" -ForegroundColor $SuccessColor
    }
}

# Fonction pour vérifier l'environnement virtuel
function Test-VirtualEnvironment {
    $venvPath = Join-Path $backendPath "venv"
    if (-not (Test-Path $venvPath)) {
        if (-not $Quiet) {
            Write-Host "Creation de l'environnement virtuel..." -ForegroundColor $InfoColor
        }
        $originalLocation = Get-Location
        Set-Location $backendPath
        python -m venv venv | Out-Null
        Set-Location $originalLocation
    }
}

# Fonction pour démarrer les services en mode intégré
function Start-Services-Integrated {
    if (-not $Quiet) {
        Write-Host "Mode INTEGRE" -ForegroundColor $InfoColor
    }
    
    # Vérifier l'environnement virtuel
    Test-VirtualEnvironment
    
    # Démarrer le backend en arrière-plan
    if (-not $Quiet) {
        Write-Host "Demarrage du Backend..." -ForegroundColor $InfoColor
    }
    
    $venvPythonPath = Join-Path $backendPath "venv\Scripts\python.exe"
    if (Test-Path $venvPythonPath) {
        Write-Host "Environnement virtuel trouve" -ForegroundColor Green
        Write-Host "Version Python: $(& $venvPythonPath --version)" -ForegroundColor Gray
        
        # Test d'import des modules
        Write-Host "Test d'import des modules..." -ForegroundColor Gray
        try {
            $testResult = & $venvPythonPath -c "import fastapi; import uvicorn; print('Modules principaux OK')"
            Write-Host $testResult -ForegroundColor Green
        } catch {
            Write-Host "Erreur import modules: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # Test d'import de l'application
        Write-Host "Test d'import de l'application..." -ForegroundColor Gray
        try {
            $backendPathEscaped = $backendPath.Replace('\', '\\')
            $appResult = & $venvPythonPath -c "import sys; sys.path.append(r'$backendPathEscaped'); from main import app; print('Application FastAPI OK')"
            Write-Host $appResult -ForegroundColor Green
        } catch {
            Write-Host "Erreur import application: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # Démarrer le backend en arrière-plan
        Write-Host "Lancement du backend en arriere-plan..." -ForegroundColor Yellow
        $env:LOG_LEVEL = "INFO"
        $backendJob = Start-Job -ScriptBlock {
            param($backendPath, $venvPythonPath)
            Set-Location $backendPath
            & $venvPythonPath main.py
        } -ArgumentList $backendPath, $venvPythonPath
        
        # Attendre que le backend démarre
        Start-Sleep -Seconds 3
        
        # Vérifier que le backend fonctionne
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "Backend demarre avec succes sur http://localhost:8000" -ForegroundColor Green
            }
        } catch {
            Write-Host "Backend en cours de demarrage..." -ForegroundColor Yellow
        }
        
        # Démarrer le frontend
        if (-not $Quiet) {
            Write-Host "Demarrage du Frontend..." -ForegroundColor $InfoColor
        }
        
        Write-Host "Lancement du frontend..." -ForegroundColor Yellow
        Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
        Write-Host "Appuyez sur Ctrl+C pour arreter" -ForegroundColor Yellow
        Write-Host "================================================" -ForegroundColor Gray
        
        # Démarrer le frontend dans le terminal principal
        Set-Location $frontendPath
        npm run dev
        
    } else {
        Write-Host "Environnement virtuel introuvable" -ForegroundColor Red
        Write-Host "Chemin teste: $venvPythonPath" -ForegroundColor Gray
        Write-Host "Contenu du repertoire backend:" -ForegroundColor Gray
        Get-ChildItem $backendPath | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }
    }
}

# Fonction pour démarrer les services en mode externe
function Start-Services-External {
    if (-not $Quiet) {
        Write-Host "Mode EXTERNE" -ForegroundColor $InfoColor
    }
    
    # Vérifier l'environnement virtuel
    Test-VirtualEnvironment
    
    # Démarrer le backend
    if (-not $Quiet) {
        Write-Host "Demarrage du Backend..." -ForegroundColor $InfoColor
    }
    $backendTitle = "DocuSense Backend"
    $backendCmd = @"
`$host.ui.RawUI.WindowTitle = '$backendTitle'
cd '$backendPath'
Write-Host 'DocuSense Backend - Demarrage...' -ForegroundColor Green
Write-Host 'http://localhost:8000' -ForegroundColor Cyan
Write-Host '================================================' -ForegroundColor Gray
`$env:LOG_LEVEL = 'INFO'
`$venvPythonPath = Join-Path '$backendPath' 'venv\Scripts\python.exe'
& `$venvPythonPath main.py
"@
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
    
    Start-Sleep -Seconds 6
    
    # Démarrer le frontend
    if (-not $Quiet) {
        Write-Host "Demarrage du Frontend..." -ForegroundColor $InfoColor
    }
    $frontendTitle = "DocuSense Frontend"
    $frontendCmd = @"
`$host.ui.RawUI.WindowTitle = '$frontendTitle'
cd '$frontendPath'
Write-Host 'Frontend demarre' -ForegroundColor Green
Write-Host 'http://localhost:3000' -ForegroundColor Cyan
npm run dev
"@
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
    
    # Démarrer l'interface de gestion de base de données
    if ($hasDatabaseManager) {
        if (-not $Quiet) {
            Write-Host "Demarrage de l'interface DB..." -ForegroundColor $InfoColor
        }
        
        try {
            node --version | Out-Null
            if ($?) {
                $databaseTitle = "DocuSense Database Manager"
                $databaseCmd = @"
`$host.ui.RawUI.WindowTitle = '$databaseTitle'
cd '$databaseManagerPath'
Write-Host 'Interface DB demarree' -ForegroundColor Green
Write-Host 'http://localhost:3001' -ForegroundColor Cyan

if (-not (Test-Path "node_modules")) {
    Write-Host "Installation des dependances..." -ForegroundColor Yellow
    npm install
}

npm run dev
"@
                Start-Process powershell -ArgumentList "-NoExit", "-Command", $databaseCmd
            }
        } catch {
            if (-not $Quiet) {
                Write-Host "Node.js non trouve, interface DB ignoree" -ForegroundColor $ErrorColor
            }
        }
    }
    
    # Affichage des URLs
    Write-Host "Services demarres!" -ForegroundColor $SuccessColor
    Write-Host "Backend: http://localhost:8000" -ForegroundColor $InfoColor
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor $InfoColor
    if ($hasDatabaseManager) {
        Write-Host "Interface DB: http://localhost:3001" -ForegroundColor $InfoColor
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

Write-Host "DocuSense AI pret!" -ForegroundColor $SuccessColor
