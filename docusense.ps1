# Script principal unifié pour Docusense AI - Version Optimisée
param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "cleanup", "monitor", "status", "help", "links", "backend", "frontend", "menu")]
    [string]$Action = "menu"
)

function Show-InteractiveMenu {
    do {
        Clear-Host
        Write-Host "🚀 Docusense AI - Menu Interactif" -ForegroundColor Green
        Write-Host "=================================" -ForegroundColor Gray
        Write-Host ""

        # Vérification rapide du statut
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
        Write-Host "📊 Statut actuel:" -ForegroundColor Cyan
        Write-Host "  Backend:  $(if ($backendHealth) { '✅ Actif' } else { '❌ Inactif' })" -ForegroundColor $(if ($backendHealth) { 'Green' } else { 'Red' })
        Write-Host "  Frontend: $(if ($frontendHealth) { '✅ Actif' } else { '❌ Inactif' })" -ForegroundColor $(if ($frontendHealth) { 'Green' } else { 'Red' })
        Write-Host ""

        # Menu principal organisé logiquement
        Write-Host "🎯 Actions principales:" -ForegroundColor Yellow
        Write-Host "  1. 🚀 Démarrer Docusense AI (démarrage complet)" -ForegroundColor White
        Write-Host "  2. 🔧 Démarrer backend uniquement (debug)" -ForegroundColor White
        Write-Host "  3. 🎨 Démarrer frontend uniquement (debug)" -ForegroundColor White
        Write-Host ""

        Write-Host "❓ Autres:" -ForegroundColor Yellow
        Write-Host "  0. ❌ Quitter" -ForegroundColor White
        Write-Host ""

        # Demander le choix
        $choice = Read-Host "Choisissez une option (0-3)"

        switch ($choice.ToLower()) {
            "1" {
                Write-Host "`n🚀 Démarrage de Docusense AI..." -ForegroundColor Green
                Start-Docusense
                Write-Host "`n✅ Action terminée. Retour au menu dans 2 secondes..." -ForegroundColor Green  
                Start-Sleep -Seconds 2
            }
            "2" {
                Write-Host "`n🔧 Démarrage du backend uniquement..." -ForegroundColor Yellow
                Start-DocusenseBackend
                Write-Host "`n✅ Action terminée. Retour au menu dans 2 secondes..." -ForegroundColor Green  
                Start-Sleep -Seconds 2
            }
            "3" {
                Write-Host "`n🎨 Démarrage du frontend uniquement..." -ForegroundColor Yellow
                Start-DocusenseFrontend
                Write-Host "`n✅ Action terminée. Retour au menu dans 2 secondes..." -ForegroundColor Green  
                Start-Sleep -Seconds 2
            }
            "0" {
                Write-Host "`n👋 Au revoir !" -ForegroundColor Green
                return
            }
            default {
                Write-Host "`n❌ Option invalide. Retour au menu dans 2 secondes..." -ForegroundColor Red    
                Start-Sleep -Seconds 2
            }
        }
    } while ($true)
}

function Start-Docusense {
    param(
        [switch]$NoBrowser
    )

    Write-Host "🚀 Démarrage de Docusense AI..." -ForegroundColor Green

    # Cleanup rapide avant démarrage
    Write-Host "🧹 Nettoyage rapide des processus..." -ForegroundColor Yellow
    Stop-Docusense -Silent

    # Attendre que les processus se terminent (délai réduit)
    Write-Host "Attente de la libération des ressources..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3

    # Vérification rapide des ports
    Write-Host "Vérification des ports..." -ForegroundColor Cyan
    $port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Where-Object { $_.State -ne "TimeWait" }
    $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Where-Object { $_.State -ne "TimeWait" }

    if ($port8000) {
        Write-Host "❌ Port 8000 toujours occupé après cleanup" -ForegroundColor Red
        return
    }

    if ($port3000) {
        Write-Host "❌ Port 3000 toujours occupé après cleanup" -ForegroundColor Red
        return
    }

    Write-Host "✅ Ports libres" -ForegroundColor Green

    # DÉMARRER LE FRONTEND EN PREMIER (il démarre vite)
    Write-Host "`n🎨 Démarrage du frontend en premier (démarrage rapide)..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev" -WindowStyle Normal

    # Attendre que le frontend démarre
    Write-Host "Attente du démarrage du frontend..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3
    Write-Host "✅ Frontend en cours de démarrage" -ForegroundColor Green

    # Démarrer le backend dans un terminal externe avec logs visibles
    Write-Host "`n🔧 Démarrage du backend dans un terminal externe..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; & '.\venv\Scripts\python.exe' main.py" -WindowStyle Normal

    # Attendre que le backend démarre
    Write-Host "Attente du démarrage du backend..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    Write-Host "✅ Backend en cours de démarrage" -ForegroundColor Green

    # Vérification finale
    Write-Host "`n🔍 Vérification finale..." -ForegroundColor Cyan
    Start-Sleep -Seconds 1

    Write-Host "`n🎉 Docusense AI en cours de démarrage!" -ForegroundColor Green
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan

    # Ouvrir automatiquement le frontend dans le navigateur seulement si -NoBrowser n'est pas spécifié
    if (-not $NoBrowser) {
        Write-Host "`n🌐 Ouverture automatique du frontend..." -ForegroundColor Cyan
        Start-Process "http://localhost:3000"
    }

    # Instructions pour l'utilisateur
    Write-Host "`n💡 Instructions:" -ForegroundColor Yellow
    Write-Host "  • Frontend disponible sur http://localhost:3000" -ForegroundColor Gray
    Write-Host "  • Backend en cours de démarrage - vérifiez le terminal backend" -ForegroundColor Gray
    Write-Host "  • Utilisez 'stop' pour arrêter les services" -ForegroundColor Gray

    # Afficher les logs après démarrage
    Write-Host "`n📋 Affichage des logs récents..." -ForegroundColor Cyan
    Show-DocusenseLogs

    # Afficher le statut final
    Write-Host "`n📊 Statut final des services..." -ForegroundColor Cyan
    Get-DocusenseStatus
}

function Start-DocusenseBackend {
    Write-Host "🔧 Démarrage du backend uniquement..." -ForegroundColor Yellow

    # Vérifier si le backend est déjà en cours d'exécution
    $backendProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { 
        $_.CommandLine -like "*main.py*" -or $_.ProcessName -eq "python"
    }
    $port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Where-Object { $_.State -ne "TimeWait" }

    if ($backendProcesses -or $port8000) {
        Write-Host "⚠️ Backend déjà en cours d'exécution" -ForegroundColor Yellow
        Write-Host "💡 Arrêt du backend existant..." -ForegroundColor Cyan
        
        # Arrêter seulement les processus Python (backend)
        try {
            Get-Process -Name "python" -ErrorAction SilentlyContinue | ForEach-Object {
                Write-Host "Arrêt du processus Python PID: $($_.Id)" -ForegroundColor Cyan
                $_.Kill()
            }
        } catch {
            Write-Host "Erreur lors de l'arrêt des processus Python: $($_.Exception.Message)" -ForegroundColor Red
        }

        # Libérer le port 8000
        if ($port8000) {
            if ($port8000.OwningProcess -ne 0) {
                Stop-Process -Id $port8000.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }

        Start-Sleep -Seconds 2
    }

    # Vérifier que le port 8000 est libre
    Write-Host "Vérification du port 8000..." -ForegroundColor Cyan
    $port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Where-Object { $_.State -ne "TimeWait" }

    if ($port8000) {
        Write-Host "❌ Port 8000 toujours occupé" -ForegroundColor Red
        return
    }

    Write-Host "✅ Port 8000 libre" -ForegroundColor Green

    # Démarrer le backend avec logs visibles
    Write-Host "`n🔧 Démarrage du backend en mode debug..." -ForegroundColor Yellow
    Write-Host "💡 Le backend démarre dans un terminal externe avec logs visibles" -ForegroundColor Cyan
    Write-Host "💡 Fermez le terminal pour arrêter le backend" -ForegroundColor Cyan
    Write-Host "💡 Le frontend reste actif si il était déjà démarré" -ForegroundColor Cyan
    Write-Host "`n" -ForegroundColor White

    # Démarrer le backend dans un terminal externe pour voir les logs
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; & '.\venv\Scripts\python.exe' main.py" -WindowStyle Normal
}

function Start-DocusenseFrontend {
    Write-Host "🎨 Démarrage du frontend uniquement..." -ForegroundColor Yellow

    # Vérifier si le frontend est déjà en cours d'exécution
    $frontendProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { 
        $_.CommandLine -like "*npm*" -or $_.CommandLine -like "*vite*" -or $_.ProcessName -eq "node"
    }
    $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Where-Object { $_.State -ne "TimeWait" }

    if ($frontendProcesses -or $port3000) {
        Write-Host "⚠️ Frontend déjà en cours d'exécution" -ForegroundColor Yellow
        Write-Host "💡 Arrêt du frontend existant..." -ForegroundColor Cyan
        
        # Arrêter seulement les processus Node.js (frontend)
        try {
            Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
                Write-Host "Arrêt du processus Node.js PID: $($_.Id)" -ForegroundColor Cyan
                $_.Kill()
            }
        } catch {
            Write-Host "Erreur lors de l'arrêt des processus Node.js: $($_.Exception.Message)" -ForegroundColor Red
        }

        # Libérer le port 3000
        if ($port3000) {
            if ($port3000.OwningProcess -ne 0) {
                Stop-Process -Id $port3000.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }

        Start-Sleep -Seconds 2
    }

    # Vérifier que le port 3000 est libre
    Write-Host "Vérification du port 3000..." -ForegroundColor Cyan
    $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Where-Object { $_.State -ne "TimeWait" }

    if ($port3000) {
        Write-Host "❌ Port 3000 toujours occupé" -ForegroundColor Red
        return
    }

    Write-Host "✅ Port 3000 libre" -ForegroundColor Green

    # Démarrer le frontend avec logs visibles
    Write-Host "`n🎨 Démarrage du frontend en mode debug..." -ForegroundColor Yellow
    Write-Host "💡 Le frontend démarre dans un terminal externe avec logs visibles" -ForegroundColor Cyan
    Write-Host "💡 Fermez le terminal pour arrêter le frontend" -ForegroundColor Cyan
    Write-Host "💡 Le backend reste actif si il était déjà démarré" -ForegroundColor Cyan
    Write-Host "`n" -ForegroundColor White

    # Démarrer le frontend dans un terminal externe pour voir les logs
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev" -WindowStyle Normal
}

function Stop-Docusense {
    param([switch]$Silent)

    if (-not $Silent) {
        Write-Host "🛑 Arrêt de Docusense AI..." -ForegroundColor Red
    }

    # Arrêter tous les processus Python (optimisé)
    if (-not $Silent) {
        Write-Host "Arrêt des processus Python..." -ForegroundColor Yellow
    }
    try {
        Get-Process -Name "python" -ErrorAction SilentlyContinue | ForEach-Object {
            if (-not $Silent) {
                Write-Host "Arrêt du processus Python PID: $($_.Id)" -ForegroundColor Cyan
            }
            $_.Kill()
        }
    } catch {
        if (-not $Silent) {
            Write-Host "Erreur lors de l'arrêt des processus Python: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    # Arrêter tous les processus Node.js (optimisé)
    if (-not $Silent) {
        Write-Host "Arrêt des processus Node.js..." -ForegroundColor Yellow
    }
    try {
        Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
            if (-not $Silent) {
                Write-Host "Arrêt du processus Node.js PID: $($_.Id)" -ForegroundColor Cyan
            }
            $_.Kill()
        }
    } catch {
        if (-not $Silent) {
            Write-Host "Erreur lors de l'arrêt des processus Node.js: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    # Attendre que les processus se terminent (délai réduit)
    if (-not $Silent) {
        Write-Host "Attente de la terminaison des processus..." -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 2

    # Libérer les ports (optimisé)
    if (-not $Silent) {
        Write-Host "Libération des ports..." -ForegroundColor Yellow
    }

    try {
        # Libérer le port 8000
        $port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
        if ($port8000) {
            if ($port8000.OwningProcess -ne 0) {
                Stop-Process -Id $port8000.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }

        # Libérer le port 3000
        $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
        if ($port3000) {
            if ($port3000.OwningProcess -ne 0) {
                Stop-Process -Id $port3000.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }

        # Attendre que les connexions TIME_WAIT se libèrent (délai réduit)
        if (-not $Silent) {
            Write-Host "Attente de la libération des connexions TIME_WAIT..." -ForegroundColor Yellow
        }
        Start-Sleep -Seconds 2

        # Vérification finale des ports
        $final8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Where-Object { $_.State -ne "TimeWait" }
        $final3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Where-Object { $_.State -ne "TimeWait" }

        if (-not $Silent) {
            if (-not $final8000 -and -not $final3000) {
                Write-Host "✅ Ports 8000 et 3000 libérés avec succès" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Certains ports peuvent encore être occupés" -ForegroundColor Yellow
            }
        }
    } catch {
        if (-not $Silent) {
            Write-Host "Erreur lors de la libération des ports: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    if (-not $Silent) {
        Write-Host "✅ Docusense AI arrêté" -ForegroundColor Green
    }
}

function Get-DocusenseStatus {
    Write-Host "📊 Statut de Docusense AI" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Gray

    # Vérifier les processus
    $pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

    # Vérifier les ports
    $port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
    $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

    # Vérifier la santé des services (optimisé)
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

    Write-Host "Backend: $(if ($backendHealth) { '✅ Connecté' } else { '❌ Déconnecté' })" -ForegroundColor $(if ($backendHealth) { 'Green' } else { 'Red' })
    Write-Host "Frontend: $(if ($frontendHealth) { '✅ Connecté' } else { '❌ Déconnecté' })" -ForegroundColor $(if ($frontendHealth) { 'Green' } else { 'Red' })
    Write-Host "Processus Python: $($pythonProcesses.Count)" -ForegroundColor $(if ($pythonProcesses.Count -le 2) { 'Green' } else { 'Yellow' })
    Write-Host "Processus Node.js: $($nodeProcesses.Count)" -ForegroundColor $(if ($nodeProcesses.Count -le 2) { 'Green' } else { 'Yellow' })
    Write-Host "Port 8000: $(if ($port8000) { '✅ Actif' } else { '❌ Inactif' })" -ForegroundColor $(if ($port8000) { 'Green' } else { 'Red' })
    Write-Host "Port 3000: $(if ($port3000) { '✅ Actif' } else { '❌ Inactif' })" -ForegroundColor $(if ($port3000) { 'Green' } else { 'Red' })
}

function Show-DocusenseLogs {
    Write-Host "📋 Affichage des logs Docusense AI" -ForegroundColor Green
    Write-Host "===================================" -ForegroundColor Gray
    Write-Host ""

    # Vérifier les fichiers de logs
    $backendLogFile = "backend\logs\docusense.log"
    $backendErrorLogFile = "backend\logs\docusense_error.log"
    $frontendLogFile = "frontend\logs\docusense.log"
    $frontendErrorLogFile = "frontend\logs\docusense_error.log"

    Write-Host "🔍 Recherche des fichiers de logs..." -ForegroundColor Cyan

    # Afficher les logs du backend
    if (Test-Path $backendLogFile) {
        Write-Host "`n🔧 Logs du Backend (docusense.log):" -ForegroundColor Yellow
        Write-Host "=====================================" -ForegroundColor Gray
        Get-Content $backendLogFile -Tail 20 | ForEach-Object {
            Write-Host $_ -ForegroundColor White
        }
    } else {
        Write-Host "`n❌ Fichier de log backend non trouvé: $backendLogFile" -ForegroundColor Red
    }

    # Afficher les erreurs du backend
    if (Test-Path $backendErrorLogFile) {
        Write-Host "`n🔧 Erreurs du Backend (docusense_error.log):" -ForegroundColor Yellow
        Write-Host "=============================================" -ForegroundColor Gray
        Get-Content $backendErrorLogFile -Tail 10 | ForEach-Object {
            Write-Host $_ -ForegroundColor Red
        }
    } else {
        Write-Host "`nℹ️ Aucun fichier d'erreur backend trouvé" -ForegroundColor Gray
    }

    # Afficher les logs du frontend
    if (Test-Path $frontendLogFile) {
        Write-Host "`n🎨 Logs du Frontend (docusense.log):" -ForegroundColor Yellow
        Write-Host "=====================================" -ForegroundColor Gray
        Get-Content $frontendLogFile -Tail 20 | ForEach-Object {
            Write-Host $_ -ForegroundColor White
        }
    } else {
        Write-Host "`n❌ Fichier de log frontend non trouvé: $frontendLogFile" -ForegroundColor Red
    }

    # Afficher les erreurs du frontend
    if (Test-Path $frontendErrorLogFile) {
        Write-Host "`n🎨 Erreurs du Frontend (docusense_error.log):" -ForegroundColor Yellow
        Write-Host "=============================================" -ForegroundColor Gray
        Get-Content $frontendErrorLogFile -Tail 10 | ForEach-Object {
            Write-Host $_ -ForegroundColor Red
        }
    } else {
        Write-Host "`nℹ️ Aucun fichier d'erreur frontend trouvé" -ForegroundColor Gray
    }

    # Afficher les logs de la racine si ils existent
    $rootLogFile = "logs\docusense.log"
    $rootErrorLogFile = "logs\docusense_error.log"

    if (Test-Path $rootLogFile) {
        Write-Host "`n📁 Logs de la racine (docusense.log):" -ForegroundColor Yellow
        Write-Host "=====================================" -ForegroundColor Gray
        Get-Content $rootLogFile -Tail 15 | ForEach-Object {
            Write-Host $_ -ForegroundColor White
        }
    }

    if (Test-Path $rootErrorLogFile) {
        Write-Host "`n📁 Erreurs de la racine (docusense_error.log):" -ForegroundColor Yellow
        Write-Host "=============================================" -ForegroundColor Gray
        Get-Content $rootErrorLogFile -Tail 10 | ForEach-Object {
            Write-Host $_ -ForegroundColor Red
        }
    }

    Write-Host "`n💡 Conseils:" -ForegroundColor Cyan
    Write-Host "  • Utilisez l'option 2 pour démarrer le backend avec logs visibles" -ForegroundColor Gray
    Write-Host "  • Utilisez l'option 3 pour démarrer le frontend avec logs visibles" -ForegroundColor Gray
    Write-Host "  • Les logs sont automatiquement mis à jour" -ForegroundColor Gray
}

# Exécution principale
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
