# Script principal unifié pour Docusense AI
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

        # Vérifier le statut actuel
        $pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
        $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
        $port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
        $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

        $backendHealth = $false
        $frontendHealth = $false

        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health/" -TimeoutSec 2 -ErrorAction Stop
            $backendHealth = $response.StatusCode -eq 200
        } catch { $backendHealth = $false }

        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction Stop
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
        Write-Host "  4. 🔄 Redémarrer Docusense AI" -ForegroundColor White
        Write-Host "  5. 🛑 Arrêter Docusense AI" -ForegroundColor White
        Write-Host ""

        Write-Host "❓ Autres:" -ForegroundColor Yellow
        Write-Host "  0. ❌ Quitter" -ForegroundColor White
        Write-Host ""

        # Demander le choix
        $choice = Read-Host "Choisissez une option (0-5)"

        switch ($choice.ToLower()) {
            "1" {
                Write-Host "`n🚀 Démarrage de Docusense AI..." -ForegroundColor Green
                Start-Docusense
                Write-Host "`n✅ Action terminée. Retour au menu dans 3 secondes..." -ForegroundColor Green  
                Start-Sleep -Seconds 3
            }
            "2" {
                Write-Host "`n🔧 Démarrage du backend uniquement..." -ForegroundColor Yellow
                Start-DocusenseBackend
                Write-Host "`n✅ Action terminée. Retour au menu dans 3 secondes..." -ForegroundColor Green  
                Start-Sleep -Seconds 3
            }
            "3" {
                Write-Host "`n🎨 Démarrage du frontend uniquement..." -ForegroundColor Yellow
                Start-DocusenseFrontend
                Write-Host "`n✅ Action terminée. Retour au menu dans 3 secondes..." -ForegroundColor Green  
                Start-Sleep -Seconds 3
            }
            "4" {
                Write-Host "`n🔄 Redémarrage de Docusense AI..." -ForegroundColor Yellow
                Stop-Docusense
                Start-Sleep -Seconds 3
                Start-Docusense -NoBrowser
                Write-Host "`n✅ Action terminée. Retour au menu dans 3 secondes..." -ForegroundColor Green  
                Start-Sleep -Seconds 3
            }
            "5" {
                Write-Host "`n🛑 Arrêt de Docusense AI..." -ForegroundColor Red
                Stop-Docusense
                Write-Host "`n✅ Action terminée. Retour au menu dans 3 secondes..." -ForegroundColor Green  
                Start-Sleep -Seconds 3
            }
            "0" {
                Write-Host "`n👋 Au revoir !" -ForegroundColor Green
                return
            }
            default {
                Write-Host "`n❌ Option invalide. Retour au menu dans 3 secondes..." -ForegroundColor Red    
                Start-Sleep -Seconds 3
            }
        }
    } while ($true)
}

function Start-Docusense {
    param(
        [switch]$NoBrowser
    )

    Write-Host "🚀 Démarrage de Docusense AI..." -ForegroundColor Green

    # Cleanup automatique avant démarrage
    Write-Host "🧹 Nettoyage automatique des processus..." -ForegroundColor Yellow
    Stop-Docusense -Silent

    # Attendre que les processus se terminent et que les ports soient libérés
    Write-Host "Attente de la libération complète des ressources..." -ForegroundColor Yellow
    Start-Sleep -Seconds 8

    # Vérifier que les ports sont libres (ignorer les connexions TIME_WAIT)
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

    # Démarrer le backend dans un terminal externe avec logs visibles
    Write-Host "`n🔧 Démarrage du backend dans un terminal externe..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; venv\Scripts\python.exe main.py" -WindowStyle Normal

    # Attendre que le backend démarre
    Write-Host "Attente du démarrage du backend..." -ForegroundColor Cyan
    $backendReady = $false
    $attempts = 0
    $maxAttempts = 5

    while (-not $backendReady -and $attempts -lt $maxAttempts) {
        Start-Sleep -Seconds 2
        $attempts++

        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health/" -TimeoutSec 5 -ErrorAction Stop

            if ($response.StatusCode -eq 200) {
                $backendReady = $true
                Write-Host "✅ Backend prêt (tentative $attempts)" -ForegroundColor Green
            }
        } catch {
            Write-Host "⏳ Attente backend... ($attempts/$maxAttempts)" -ForegroundColor Yellow
        }
    }

    if (-not $backendReady) {
        Write-Host "❌ Backend non accessible après $maxAttempts tentatives" -ForegroundColor Red
        return
    }

    # Démarrer le frontend dans un terminal externe avec logs visibles
    Write-Host "`n🎨 Démarrage du frontend dans un terminal externe..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev" -WindowStyle Normal

    # Attendre que le frontend démarre
    Write-Host "Attente du démarrage du frontend..." -ForegroundColor Cyan
    $frontendReady = $false
    $attempts = 0
    $maxAttempts = 5

    while (-not $frontendReady -and $attempts -lt $maxAttempts) {
        Start-Sleep -Seconds 2
        $attempts++

        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop

            if ($response.StatusCode -eq 200) {
                $frontendReady = $true
                Write-Host "✅ Frontend prêt (tentative $attempts)" -ForegroundColor Green
            }
        } catch {
            Write-Host "⏳ Attente frontend... ($attempts/$maxAttempts)" -ForegroundColor Yellow
        }
    }

    if (-not $frontendReady) {
        Write-Host "❌ Frontend non accessible après $maxAttempts tentatives" -ForegroundColor Red
        return
    }

    # Vérification finale
    Write-Host "`n🔍 Vérification finale..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3

    $backendCheck = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
    $frontendCheck = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

    if ($backendCheck -and $frontendCheck) {
        Write-Host "`n🎉 Docusense AI démarré avec succès!" -ForegroundColor Green
        Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
        Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan

        # Ouvrir automatiquement le frontend dans le navigateur seulement si -NoBrowser n'est pas spécifié
        if (-not $NoBrowser) {
            Write-Host "`n🌐 Ouverture automatique du frontend..." -ForegroundColor Cyan
            Start-Process "http://localhost:3000"
        }

        # Instructions pour l'utilisateur
        Write-Host "`n💡 Instructions:" -ForegroundColor Yellow
        Write-Host "  • Frontend et backend ouverts automatiquement dans le navigateur" -ForegroundColor Gray
        Write-Host "  • Utilisez 'stop' pour arrêter les services" -ForegroundColor Gray

        # Afficher les logs après démarrage
        Write-Host "`n📋 Affichage des logs récents..." -ForegroundColor Cyan
        Show-DocusenseLogs

        # Afficher le statut final
        Write-Host "`n📊 Statut final des services..." -ForegroundColor Cyan
        Get-DocusenseStatus
    } else {
        Write-Host "❌ Problème lors du démarrage" -ForegroundColor Red
    }
}

function Start-DocusenseBackend {
    Write-Host "🔧 Démarrage du backend uniquement..." -ForegroundColor Yellow

    # Cleanup automatique avant démarrage
    Write-Host "🧹 Nettoyage automatique des processus..." -ForegroundColor Yellow
    Stop-Docusense -Silent

    # Attendre que les processus se terminent et que les ports soient libérés
    Write-Host "Attente de la libération complète des ressources..." -ForegroundColor Yellow
    Start-Sleep -Seconds 8

    # Vérifier que le port 8000 est libre
    Write-Host "Vérification du port 8000..." -ForegroundColor Cyan
    $port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Where-Object { $_.State -ne "TimeWait" }

    if ($port8000) {
        Write-Host "❌ Port 8000 toujours occupé après cleanup" -ForegroundColor Red
        return
    }

    Write-Host "✅ Port 8000 libre" -ForegroundColor Green

    # Démarrer le backend avec logs visibles
    Write-Host "`n🔧 Démarrage du backend avec logs..." -ForegroundColor Yellow
    Write-Host "💡 Les logs du backend s'afficheront dans cette fenêtre" -ForegroundColor Cyan
    Write-Host "💡 Appuyez sur Ctrl+C pour arrêter le backend" -ForegroundColor Cyan
    Write-Host "`n" -ForegroundColor White

    # Démarrer le backend en mode debug (terminal externe)
    Write-Host "`n🔧 Démarrage du backend en mode debug..." -ForegroundColor Yellow
    Write-Host "💡 Le backend démarre dans un terminal externe avec logs visibles" -ForegroundColor Cyan
    Write-Host "💡 Fermez le terminal pour arrêter le backend" -ForegroundColor Cyan
    Write-Host "`n" -ForegroundColor White

    # Démarrer le backend dans un terminal externe pour voir les logs
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; venv\Scripts\python.exe main.py" -WindowStyle Normal
}

function Start-DocusenseFrontend {
    Write-Host "🎨 Démarrage du frontend uniquement..." -ForegroundColor Yellow

    # Cleanup automatique avant démarrage
    Write-Host "🧹 Nettoyage automatique des processus..." -ForegroundColor Yellow
    Stop-Docusense -Silent

    # Attendre que les processus se terminent et que les ports soient libérés
    Write-Host "Attente de la libération complète des ressources..." -ForegroundColor Yellow
    Start-Sleep -Seconds 8

    # Vérifier que le port 3000 est libre
    Write-Host "Vérification du port 3000..." -ForegroundColor Cyan
    $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Where-Object { $_.State -ne "TimeWait" }

    if ($port3000) {
        Write-Host "❌ Port 3000 toujours occupé après cleanup" -ForegroundColor Red
        return
    }

    Write-Host "✅ Port 3000 libre" -ForegroundColor Green

    # Démarrer le frontend avec logs visibles
    Write-Host "`n🎨 Démarrage du frontend avec logs..." -ForegroundColor Yellow
    Write-Host "💡 Les logs du frontend s'afficheront dans cette fenêtre" -ForegroundColor Cyan
    Write-Host "💡 Appuyez sur Ctrl+C pour arrêter le frontend" -ForegroundColor Cyan
    Write-Host "`n" -ForegroundColor White

    # Démarrer le frontend en mode debug (terminal externe)
    Write-Host "`n🎨 Démarrage du frontend en mode debug..." -ForegroundColor Yellow
    Write-Host "💡 Le frontend démarre dans un terminal externe avec logs visibles" -ForegroundColor Cyan
    Write-Host "💡 Fermez le terminal pour arrêter le frontend" -ForegroundColor Cyan
    Write-Host "`n" -ForegroundColor White

    # Démarrer le frontend dans un terminal externe pour voir les logs
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev" -WindowStyle Normal
}

function Stop-Docusense {
    param([switch]$Silent)

    if (-not $Silent) {
        Write-Host "🛑 Arrêt de Docusense AI..." -ForegroundColor Red
    }

    # Arrêter tous les processus Python
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

    # Arrêter tous les processus Node.js
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

    # Attendre que les processus se terminent
    if (-not $Silent) {
        Write-Host "Attente de la terminaison des processus..." -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 5

    # Libérer les ports
    if (-not $Silent) {
        Write-Host "Libération des ports..." -ForegroundColor Yellow
    }

    # Forcer la libération des ports avec netstat
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

        # Attendre que les connexions TIME_WAIT se libèrent
        if (-not $Silent) {
            Write-Host "Attente de la libération des connexions TIME_WAIT..." -ForegroundColor Yellow
        }
        Start-Sleep -Seconds 5

        # Vérifier à nouveau et forcer si nécessaire
        $remaining8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
        $remaining3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

        if ($remaining8000 -or $remaining3000) {
            if (-not $Silent) {
                Write-Host "Attente supplémentaire pour libération des ports..." -ForegroundColor Yellow
            }
            Start-Sleep -Seconds 8
        }

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

    # Vérifier la santé des services
    $backendHealth = $false
    $frontendHealth = $false

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health/" -TimeoutSec 3 -ErrorAction Stop
        $backendHealth = $response.StatusCode -eq 200
    } catch {
        $backendHealth = $false
    }

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3 -ErrorAction Stop
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
        Start-Sleep -Seconds 3
        Start-Docusense -NoBrowser
    }
    default { Show-InteractiveMenu }
}
