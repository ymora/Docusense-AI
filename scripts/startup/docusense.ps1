# Script principal unifie pour Docusense AI - Version Optimisee
param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "cleanup", "monitor", "status", "help", "links", "backend", "frontend", "menu")]
    [string]$Action = "menu"
)

function Test-NodeJSInstallation {
    Write-Host "Verification de Node.js et npm (necessaire pour le frontend)..." -ForegroundColor Cyan
    
    $nodeInstalled = $false
    $npmInstalled = $false
    
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Host "OK Node.js installe: $nodeVersion" -ForegroundColor Green
            $nodeInstalled = $true
        }
    } catch {
        Write-Host "ERREUR Node.js non installe" -ForegroundColor Red
    }
    
    try {
        $npmVersion = npm --version 2>$null
        if ($npmVersion) {
            Write-Host "OK npm installe: $npmVersion" -ForegroundColor Green
            $npmInstalled = $true
        }
    } catch {
        Write-Host "ERREUR npm non installe" -ForegroundColor Red
    }
    
    if (-not $nodeInstalled -or -not $npmInstalled) {
        Write-Host "ATTENTION Node.js et/ou npm ne sont pas installes!" -ForegroundColor Yellow
        Write-Host "Node.js est necessaire UNIQUEMENT pour le frontend (React/Vite)" -ForegroundColor Cyan
        Write-Host "Le backend fonctionne sans Node.js (Python uniquement)" -ForegroundColor Cyan
        Write-Host ""
        
        $choice = Read-Host "Voulez-vous installer Node.js automatiquement ? (O/N)"
        
        if ($choice -eq "O" -or $choice -eq "o" -or $choice -eq "Y" -or $choice -eq "y") {
            Install-NodeJS
        } else {
            Write-Host "Instructions d'installation manuelle:" -ForegroundColor Yellow
            Write-Host "1. Telechargez Node.js depuis: https://nodejs.org/" -ForegroundColor White
            Write-Host "2. Installez Node.js (npm sera installe automatiquement)" -ForegroundColor White
            Write-Host "3. Redemarrez PowerShell" -ForegroundColor White
            Write-Host "4. Relancez ce script" -ForegroundColor White
            Write-Host ""
            Write-Host "Alternatives:" -ForegroundColor Cyan
            Write-Host "• Utilisez l'option 2 pour demarrer SEULEMENT le backend (sans Node.js)" -ForegroundColor White
            Write-Host "• Le backend est accessible via API sur http://localhost:8000" -ForegroundColor White
            Write-Host ""
            Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Cyan
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            return $false
        }
    }
    
    return $true
}

function Install-NodeJS {
    Write-Host "Installation automatique de Node.js..." -ForegroundColor Green
    
    try {
        # Verifier si winget est disponible
        $wingetAvailable = Get-Command winget -ErrorAction SilentlyContinue
        
        if ($wingetAvailable) {
            Write-Host "Installation via winget..." -ForegroundColor Cyan
            winget install OpenJS.NodeJS
        } else {
            # Telechargement manuel
            Write-Host "Telechargement de Node.js..." -ForegroundColor Cyan
            
            $nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
            $nodeInstaller = "$env:TEMP\node-installer.msi"
            
            Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
            
            Write-Host "Installation de Node.js..." -ForegroundColor Cyan
            Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $nodeInstaller, "/quiet", "/norestart" -Wait
            
            # Nettoyer
            Remove-Item $nodeInstaller -Force -ErrorAction SilentlyContinue
        }
        
        Write-Host "OK Node.js installe avec succes!" -ForegroundColor Green
        Write-Host "Redemarrage de PowerShell requis..." -ForegroundColor Yellow
        Write-Host "Fermez cette fenetre et relancez le script" -ForegroundColor Cyan
        
        $choice = Read-Host "Voulez-vous redemarrer PowerShell maintenant ? (O/N)"
        if ($choice -eq "O" -or $choice -eq "o" -or $choice -eq "Y" -or $choice -eq "y") {
            Start-Process "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\scripts\startup\docusense.ps1"
            exit
        }
        
    } catch {
        Write-Host "ERREUR lors de l'installation: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Installation manuelle requise: https://nodejs.org/" -ForegroundColor Yellow
    }
}

function Show-InteractiveMenu {
    do {
        Clear-Host
        Write-Host "Docusense AI - Menu Interactif" -ForegroundColor Green
        Write-Host "================================" -ForegroundColor Gray
        Write-Host ""

        # Verification rapide du statut (optimisee)
        $backendHealth = $false
        $frontendHealth = $false

        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health/" -TimeoutSec 1 -ErrorAction Stop
            $backendHealth = $response.StatusCode -eq 200
        } catch { $backendHealth = $false }

        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 1 -ErrorAction Stop
            $frontendHealth = $response.StatusCode -eq 200
        } catch { $frontendHealth = $false }

        # Afficher le statut actuel
        Write-Host "Statut actuel:" -ForegroundColor Cyan
        Write-Host "  Backend:  $(if ($backendHealth) { 'OK Actif' } else { 'ERREUR Inactif' })" -ForegroundColor $(if ($backendHealth) { 'Green' } else { 'Red' })
        Write-Host "  Frontend: $(if ($frontendHealth) { 'OK Actif' } else { 'ERREUR Inactif' })" -ForegroundColor $(if ($frontendHealth) { 'Green' } else { 'Red' })
        Write-Host ""

        # Menu principal organise logiquement
        Write-Host "Actions principales:" -ForegroundColor Yellow
        Write-Host "  1. Demarrer Docusense AI (demarrage complet)" -ForegroundColor White
        Write-Host "  2. Demarrer backend uniquement (debug)" -ForegroundColor White
        Write-Host "  3. Demarrer frontend uniquement (debug)" -ForegroundColor White
        Write-Host ""

        Write-Host "Autres:" -ForegroundColor Yellow
        Write-Host "  0. Quitter" -ForegroundColor White
        Write-Host ""

        # Demander le choix
        $choice = Read-Host "Choisissez une option (0-3)"

        switch ($choice.ToLower()) {
            "1" {
                Write-Host "Demarrage de Docusense AI..." -ForegroundColor Green
                Start-Docusense
                Write-Host "Action terminee. Retour au menu dans 2 secondes..." -ForegroundColor Green  
                Start-Sleep -Seconds 2
            }
            "2" {
                Write-Host "Demarrage du backend uniquement..." -ForegroundColor Yellow
                Start-DocusenseBackend
                Write-Host "Action terminee. Retour au menu dans 2 secondes..." -ForegroundColor Green  
                Start-Sleep -Seconds 2
            }
            "3" {
                Write-Host "Demarrage du frontend uniquement..." -ForegroundColor Yellow
                Start-DocusenseFrontend
                Write-Host "Action terminee. Retour au menu dans 2 secondes..." -ForegroundColor Green  
                Start-Sleep -Seconds 2
            }
            "0" {
                Write-Host "Au revoir !" -ForegroundColor Green
                return
            }
            default {
                Write-Host "Option invalide. Retour au menu dans 2 secondes..." -ForegroundColor Red    
                Start-Sleep -Seconds 2
            }
        }
    } while ($true)
}

function Start-Docusense {
    param(
        [switch]$NoBrowser
    )

    Write-Host "Demarrage de Docusense AI..." -ForegroundColor Green

    # Verifier Node.js seulement si on va demarrer le frontend
    if (-not (Test-NodeJSInstallation)) {
        Write-Host "Impossible de continuer sans Node.js (necessaire pour le frontend)" -ForegroundColor Red
        return
    }

    # Cleanup rapide avant demarrage
    Write-Host "Nettoyage rapide des processus..." -ForegroundColor Yellow
    Stop-Docusense -Silent

    # Attendre que les processus se terminent (delai reduit)
    Write-Host "Attente de la liberation des ressources..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3

    # Verification rapide des ports
    Write-Host "Verification des ports..." -ForegroundColor Cyan
    try {
        $port8000 = netstat -an | findstr ":8000" | findstr "LISTENING"
        $port3000 = netstat -an | findstr ":3000" | findstr "LISTENING"
    } catch {
        $port8000 = $null
        $port3000 = $null
    }

    if ($port8000) {
        Write-Host "Port 8000 toujours occupe apres cleanup" -ForegroundColor Red
        return
    }

    if ($port3000) {
        Write-Host "Port 3000 toujours occupe apres cleanup" -ForegroundColor Red
        return
    }

    Write-Host "Ports libres" -ForegroundColor Green

    # DEMARRER LE FRONTEND EN PREMIER (il demarre vite)
    Write-Host "Demarrage du frontend en premier (demarrage rapide)..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev" -WindowStyle Normal

    # Attendre que le frontend demarre
    Write-Host "Attente du demarrage du frontend..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3
    Write-Host "Frontend en cours de demarrage" -ForegroundColor Green

    # Demarrer le backend dans un terminal externe avec logs visibles
    Write-Host "Demarrage du backend dans un terminal externe..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; & '.\venv\Scripts\python.exe' main.py" -WindowStyle Normal

    # Attendre que le backend demarre
    Write-Host "Attente du demarrage du backend..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    Write-Host "Backend en cours de demarrage" -ForegroundColor Green

    # Verification finale
    Write-Host "Verification finale..." -ForegroundColor Cyan
    Start-Sleep -Seconds 1

    Write-Host "Docusense AI en cours de demarrage!" -ForegroundColor Green
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan

    # Ouvrir automatiquement le frontend dans le navigateur seulement si -NoBrowser n'est pas specifie
    if (-not $NoBrowser) {
        Write-Host "Ouverture automatique du frontend..." -ForegroundColor Cyan
        Start-Process "http://localhost:3000"
    }

    # Instructions pour l'utilisateur
    Write-Host "Instructions:" -ForegroundColor Yellow
    Write-Host "  • Frontend disponible sur http://localhost:3000" -ForegroundColor Gray
    Write-Host "  • Backend en cours de demarrage - verifiez le terminal backend" -ForegroundColor Gray
    Write-Host "  • Utilisez 'stop' pour arreter les services" -ForegroundColor Gray

    # Afficher les logs apres demarrage
    Write-Host "Affichage des logs recents..." -ForegroundColor Cyan
    Show-DocusenseLogs

    # Afficher le statut final
    Write-Host "Statut final des services..." -ForegroundColor Cyan
    Get-DocusenseStatus
}

function Start-DocusenseBackend {
    Write-Host "Demarrage du backend uniquement..." -ForegroundColor Yellow
    Write-Host "Note: Node.js n'est pas necessaire pour le backend (Python uniquement)" -ForegroundColor Cyan

    # Verifier si le backend est deja en cours d'execution
    $backendProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
    try {
        $port8000 = netstat -an | findstr ":8000" | findstr "LISTENING"
    } catch {
        $port8000 = $null
    }

    if ($backendProcesses -or $port8000) {
        Write-Host "Backend deja en cours d'execution" -ForegroundColor Yellow
        Write-Host "Arret du backend existant..." -ForegroundColor Cyan
        
        # Arreter seulement les processus Python (backend)
        try {
            Get-Process -Name "python" -ErrorAction SilentlyContinue | ForEach-Object {
                Write-Host "Arret du processus Python PID: $($_.Id)" -ForegroundColor Cyan
                $_.Kill()
            }
        } catch {
            Write-Host "Erreur lors de l'arret des processus Python: $($_.Exception.Message)" -ForegroundColor Red
        }

        # Liberer le port 8000
        if ($port8000) {
            try {
                $processId = (netstat -ano | findstr ":8000" | findstr "LISTENING").Split()[-1]
                if ($processId -and $processId -ne "0") {
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                }
            } catch {
                # Ignorer les erreurs de liberation de port
            }
        }

        Start-Sleep -Seconds 2
    }

    # Verifier que le port 8000 est libre
    Write-Host "Verification du port 8000..." -ForegroundColor Cyan
    try {
        $port8000 = netstat -an | findstr ":8000" | findstr "LISTENING"
    } catch {
        $port8000 = $null
    }

    if ($port8000) {
        Write-Host "Port 8000 toujours occupe" -ForegroundColor Red
        return
    }

    Write-Host "Port 8000 libre" -ForegroundColor Green

    # Demarrer le backend avec logs visibles
    Write-Host "Demarrage du backend en mode debug..." -ForegroundColor Yellow
    Write-Host "Le backend demarre dans un terminal externe avec logs visibles" -ForegroundColor Cyan
    Write-Host "Fermez le terminal pour arreter le backend" -ForegroundColor Cyan
    Write-Host "Le frontend reste actif si il etait deja demarre" -ForegroundColor Cyan
    Write-Host ""

    # Demarrer le backend dans un terminal externe pour voir les logs
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; & '.\venv\Scripts\python.exe' main.py" -WindowStyle Normal
}

function Start-DocusenseFrontend {
    Write-Host "Demarrage du frontend uniquement..." -ForegroundColor Yellow

    # Verifier Node.js avant de continuer
    if (-not (Test-NodeJSInstallation)) {
        Write-Host "Impossible de continuer sans Node.js" -ForegroundColor Red
        return
    }

    # Verifier si le frontend est deja en cours d'execution
    $frontendProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    try {
        $port3000 = netstat -an | findstr ":3000" | findstr "LISTENING"
    } catch {
        $port3000 = $null
    }

    if ($frontendProcesses -or $port3000) {
        Write-Host "Frontend deja en cours d'execution" -ForegroundColor Yellow
        Write-Host "Arret du frontend existant..." -ForegroundColor Cyan
        
        # Arreter seulement les processus Node.js (frontend)
        try {
            Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
                Write-Host "Arret du processus Node.js PID: $($_.Id)" -ForegroundColor Cyan
                $_.Kill()
            }
        } catch {
            Write-Host "Erreur lors de l'arret des processus Node.js: $($_.Exception.Message)" -ForegroundColor Red
        }

        # Liberer le port 3000
        if ($port3000) {
            try {
                $processId = (netstat -ano | findstr ":3000" | findstr "LISTENING").Split()[-1]
                if ($processId -and $processId -ne "0") {
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                }
            } catch {
                # Ignorer les erreurs de liberation de port
            }
        }

        Start-Sleep -Seconds 2
    }

    # Verifier que le port 3000 est libre
    Write-Host "Verification du port 3000..." -ForegroundColor Cyan
    try {
        $port3000 = netstat -an | findstr ":3000" | findstr "LISTENING"
    } catch {
        $port3000 = $null
    }

    if ($port3000) {
        Write-Host "Port 3000 toujours occupe" -ForegroundColor Red
        return
    }

    Write-Host "Port 3000 libre" -ForegroundColor Green

    # Demarrer le frontend avec logs visibles
    Write-Host "Demarrage du frontend en mode debug..." -ForegroundColor Yellow
    Write-Host "Le frontend demarre dans un terminal externe avec logs visibles" -ForegroundColor Cyan
    Write-Host "Fermez le terminal pour arreter le frontend" -ForegroundColor Cyan
    Write-Host "Le backend reste actif si il etait deja demarre" -ForegroundColor Cyan
    Write-Host ""

    # Demarrer le frontend dans un terminal externe pour voir les logs
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev" -WindowStyle Normal
}

function Stop-Docusense {
    param([switch]$Silent)

    if (-not $Silent) {
        Write-Host "Arret de Docusense AI..." -ForegroundColor Red
    }

    # Arreter tous les processus Python (optimise)
    if (-not $Silent) {
        Write-Host "Arret des processus Python..." -ForegroundColor Yellow
    }
    try {
        Get-Process -Name "python" -ErrorAction SilentlyContinue | ForEach-Object {
            if (-not $Silent) {
                Write-Host "Arret du processus Python PID: $($_.Id)" -ForegroundColor Cyan
            }
            $_.Kill()
        }
    } catch {
        if (-not $Silent) {
            Write-Host "Erreur lors de l'arret des processus Python: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    # Arreter tous les processus Node.js (optimise)
    if (-not $Silent) {
        Write-Host "Arret des processus Node.js..." -ForegroundColor Yellow
    }
    try {
        Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
            if (-not $Silent) {
                Write-Host "Arret du processus Node.js PID: $($_.Id)" -ForegroundColor Cyan
            }
            $_.Kill()
        }
    } catch {
        if (-not $Silent) {
            Write-Host "Erreur lors de l'arret des processus Node.js: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    # Attendre que les processus se terminent (delai reduit)
    if (-not $Silent) {
        Write-Host "Attente de la terminaison des processus..." -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 2

    # Liberer les ports (optimise)
    if (-not $Silent) {
        Write-Host "Liberation des ports..." -ForegroundColor Yellow
    }

    try {
        # Liberer le port 8000
        try {
            $port8000 = netstat -an | findstr ":8000" | findstr "LISTENING"
            if ($port8000) {
                $processId = (netstat -ano | findstr ":8000" | findstr "LISTENING").Split()[-1]
                if ($processId -and $processId -ne "0") {
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                }
            }
        } catch {
            # Ignorer les erreurs de liberation de port
        }

        # Liberer le port 3000
        try {
            $port3000 = netstat -an | findstr ":3000" | findstr "LISTENING"
            if ($port3000) {
                $processId = (netstat -ano | findstr ":3000" | findstr "LISTENING").Split()[-1]
                if ($processId -and $processId -ne "0") {
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                }
            }
        } catch {
            # Ignorer les erreurs de liberation de port
        }

        # Attendre que les connexions TIME_WAIT se liberent (delai reduit)
        if (-not $Silent) {
            Write-Host "Attente de la liberation des connexions TIME_WAIT..." -ForegroundColor Yellow
        }
        Start-Sleep -Seconds 2

        # Verification finale des ports
        try {
            $final8000 = netstat -an | findstr ":8000" | findstr "LISTENING"
            $final3000 = netstat -an | findstr ":3000" | findstr "LISTENING"
        } catch {
            $final8000 = $null
            $final3000 = $null
        }

        if (-not $Silent) {
            if (-not $final8000 -and -not $final3000) {
                Write-Host "Ports 8000 et 3000 liberes avec succes" -ForegroundColor Green
            } else {
                Write-Host "Certains ports peuvent encore etre occupes" -ForegroundColor Yellow
            }
        }
    } catch {
        if (-not $Silent) {
            Write-Host "Erreur lors de la liberation des ports: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    if (-not $Silent) {
        Write-Host "Docusense AI arrete" -ForegroundColor Green
    }
}

function Get-DocusenseStatus {
    Write-Host "Statut de Docusense AI" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Gray

    # Verifier les processus
    $pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

    # Verifier les ports
    try {
        $port8000 = netstat -an | findstr ":8000" | findstr "LISTENING"
        $port3000 = netstat -an | findstr ":3000" | findstr "LISTENING"
    } catch {
        $port8000 = $null
        $port3000 = $null
    }

    # Verifier la sante des services (optimise)
    $backendHealth = $false
    $frontendHealth = $false

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health/" -TimeoutSec 1 -ErrorAction Stop
        $backendHealth = $response.StatusCode -eq 200
    } catch {
        $backendHealth = $false
    }

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 1 -ErrorAction Stop
        $frontendHealth = $response.StatusCode -eq 200
    } catch {
        $frontendHealth = $false
    }

    Write-Host "Backend: $(if ($backendHealth) { 'OK Connecte' } else { 'ERREUR Deconnecte' })" -ForegroundColor $(if ($backendHealth) { 'Green' } else { 'Red' })
    Write-Host "Frontend: $(if ($frontendHealth) { 'OK Connecte' } else { 'ERREUR Deconnecte' })" -ForegroundColor $(if ($frontendHealth) { 'Green' } else { 'Red' })
    Write-Host "Processus Python: $($pythonProcesses.Count)" -ForegroundColor $(if ($pythonProcesses.Count -le 2) { 'Green' } else { 'Yellow' })
    Write-Host "Processus Node.js: $($nodeProcesses.Count)" -ForegroundColor $(if ($nodeProcesses.Count -le 2) { 'Green' } else { 'Yellow' })
    Write-Host "Port 8000: $(if ($port8000) { 'OK Actif' } else { 'ERREUR Inactif' })" -ForegroundColor $(if ($port8000) { 'Green' } else { 'Red' })
    Write-Host "Port 3000: $(if ($port3000) { 'OK Actif' } else { 'ERREUR Inactif' })" -ForegroundColor $(if ($port3000) { 'Green' } else { 'Red' })
}

function Show-DocusenseLogs {
    Write-Host "Affichage des logs Docusense AI" -ForegroundColor Green
    Write-Host "===================================" -ForegroundColor Gray
    Write-Host ""

    # Verifier les fichiers de logs
    $backendLogFile = "backend\logs\docusense.log"
    $backendErrorLogFile = "backend\logs\docusense_error.log"
    $frontendLogFile = "frontend\logs\docusense.log"
    $frontendErrorLogFile = "frontend\logs\docusense_error.log"

    Write-Host "Recherche des fichiers de logs..." -ForegroundColor Cyan

    # Afficher les logs du backend
    if (Test-Path $backendLogFile) {
        Write-Host "Logs du Backend (docusense.log):" -ForegroundColor Yellow
        Write-Host "=====================================" -ForegroundColor Gray
        Get-Content $backendLogFile -Tail 20 | ForEach-Object {
            Write-Host $_ -ForegroundColor White
        }
    } else {
        Write-Host "Fichier de log backend non trouve: $backendLogFile" -ForegroundColor Red
    }

    # Afficher les erreurs du backend
    if (Test-Path $backendErrorLogFile) {
        Write-Host "Erreurs du Backend (docusense_error.log):" -ForegroundColor Yellow
        Write-Host "=============================================" -ForegroundColor Gray
        Get-Content $backendErrorLogFile -Tail 10 | ForEach-Object {
            Write-Host $_ -ForegroundColor Red
        }
    } else {
        Write-Host "Aucun fichier d'erreur backend trouve" -ForegroundColor Gray
    }

    # Afficher les logs du frontend
    if (Test-Path $frontendLogFile) {
        Write-Host "Logs du Frontend (docusense.log):" -ForegroundColor Yellow
        Write-Host "=====================================" -ForegroundColor Gray
        Get-Content $frontendLogFile -Tail 20 | ForEach-Object {
            Write-Host $_ -ForegroundColor White
        }
    } else {
        Write-Host "Fichier de log frontend non trouve: $frontendLogFile" -ForegroundColor Red
    }

    # Afficher les erreurs du frontend
    if (Test-Path $frontendErrorLogFile) {
        Write-Host "Erreurs du Frontend (docusense_error.log):" -ForegroundColor Yellow
        Write-Host "=============================================" -ForegroundColor Gray
        Get-Content $frontendErrorLogFile -Tail 10 | ForEach-Object {
            Write-Host $_ -ForegroundColor Red
        }
    } else {
        Write-Host "Aucun fichier d'erreur frontend trouve" -ForegroundColor Gray
    }

    # Afficher les logs de la racine si ils existent
    $rootLogFile = "logs\docusense.log"
    $rootErrorLogFile = "logs\docusense_error.log"

    if (Test-Path $rootLogFile) {
        Write-Host "Logs de la racine (docusense.log):" -ForegroundColor Yellow
        Write-Host "=====================================" -ForegroundColor Gray
        Get-Content $rootLogFile -Tail 15 | ForEach-Object {
            Write-Host $_ -ForegroundColor White
        }
    }

    if (Test-Path $rootErrorLogFile) {
        Write-Host "Erreurs de la racine (docusense_error.log):" -ForegroundColor Yellow
        Write-Host "=============================================" -ForegroundColor Gray
        Get-Content $rootErrorLogFile -Tail 10 | ForEach-Object {
            Write-Host $_ -ForegroundColor Red
        }
    }

    Write-Host "Conseils:" -ForegroundColor Cyan
    Write-Host "  • Utilisez l'option 2 pour demarrer le backend avec logs visibles" -ForegroundColor Gray
    Write-Host "  • Utilisez l'option 3 pour demarrer le frontend avec logs visibles" -ForegroundColor Gray
    Write-Host "  • Les logs sont automatiquement mis a jour" -ForegroundColor Gray
}

# Execution principale
switch ($Action.ToLower()) {
    "menu" { Show-InteractiveMenu }
    "start" { Start-Docusense }
    "stop" { Stop-Docusense }
    "restart" {
        Stop-Docusense
        Start-Sleep -Seconds 2
        Start-Docusense -NoBrowser
    }
    "backend" { Start-DocusenseBackend }
    "frontend" { Start-DocusenseFrontend }
    "status" { Get-DocusenseStatus }
    default { Show-InteractiveMenu }
}
