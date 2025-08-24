#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script principal pour acceder a tous les scripts DocuSense AI

.DESCRIPTION
    Ce script fournit un menu interactif pour acceder facilement
    a tous les scripts organises dans le repertoire scripts/.

.EXAMPLE
    .\scripts\main.ps1
#>

function Show-MainMenu {
    Clear-Host
    Write-Host "DOCUSENSE AI - MENU PRINCIPAL DES SCRIPTS" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "Actions principales:" -ForegroundColor Yellow
    Write-Host "  1. Demarrage de l'application" -ForegroundColor White
    Write-Host "  2. Verification du statut" -ForegroundColor White
    Write-Host "  3. Nettoyage et maintenance" -ForegroundColor White
    Write-Host "  4. Tests et audit" -ForegroundColor White
    Write-Host "  5. Utilitaires" -ForegroundColor White
    Write-Host ""

    Write-Host "Configuration:" -ForegroundColor Yellow
    Write-Host "  6. Installer Node.js (requis pour le frontend)" -ForegroundColor White
    Write-Host ""

    Write-Host "Autres:" -ForegroundColor Yellow
    Write-Host "  0. Quitter" -ForegroundColor White
    Write-Host ""

    $choice = Read-Host "Choisissez une option (0-6)"

    switch ($choice) {
        "1" { Show-StartupMenu }
        "2" { Show-MonitoringMenu }
        "3" { Show-MaintenanceMenu }
        "4" { Show-TestsMenu }
        "5" { Show-UtilsMenu }
        "6" { 
            Write-Host "Installation de Node.js..." -ForegroundColor Green
            & ".\scripts\install-nodejs-simple.ps1"
        }
        "0" { 
            Write-Host "Au revoir !" -ForegroundColor Green
            return 
        }
        default {
            Write-Host "Option invalide. Retour au menu dans 2 secondes..." -ForegroundColor Red
            Start-Sleep -Seconds 2
            Show-MainMenu
        }
    }
}

function Close-BrowserOnPort3000 {
    Write-Host "Verification des fenetres de navigateur sur le port 3000..." -ForegroundColor Cyan
    
    try {
        # Rechercher les processus qui utilisent le port 3000
        $port3000Processes = netstat -ano | findstr ":3000" | findstr "LISTENING"
        
        if ($port3000Processes) {
            Write-Host "Port 3000 detecte comme utilise" -ForegroundColor Yellow
            
            # Obtenir les PIDs des processus
            $pids = $port3000Processes | ForEach-Object { 
                ($_ -split '\s+')[-1] 
            } | Sort-Object -Unique
            
            foreach ($processId in $pids) {
                try {
                    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-Host "Processus detecte: $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
                        
                        # Vérifier si c'est un navigateur
                        $browserProcesses = @("chrome", "firefox", "msedge", "iexplore", "opera", "brave")
                        if ($browserProcesses -contains $process.ProcessName.ToLower()) {
                            Write-Host "Fermeture du navigateur $($process.ProcessName)..." -ForegroundColor Green
                            $process.CloseMainWindow() | Out-Null
                            Start-Sleep -Seconds 2
                            
                            # Si le processus ne se ferme pas proprement, le forcer
                            if (!$process.HasExited) {
                                Write-Host "Forçage de la fermeture..." -ForegroundColor Yellow
                                $process.Kill()
                            }
                            Write-Host "Navigateur ferme avec succes" -ForegroundColor Green
                        } else {
                            Write-Host "Processus non-navigateur detecte: $($process.ProcessName)" -ForegroundColor Cyan
                        }
                    }
                } catch {
                    Write-Host "Erreur lors de la fermeture du processus $processId : $($_.Exception.Message)" -ForegroundColor Red
                }
            }
            
            # Attendre que le port soit libere
            Write-Host "Attente de la liberation du port 3000..." -ForegroundColor Cyan
            $timeout = 30
            $elapsed = 0
            while ($elapsed -lt $timeout) {
                $stillInUse = netstat -ano | findstr ":3000" | findstr "LISTENING"
                if (!$stillInUse) {
                    Write-Host "Port 3000 libere avec succes" -ForegroundColor Green
                    break
                }
                Start-Sleep -Seconds 1
                $elapsed++
                Write-Host "Attente... ($elapsed/$timeout secondes)" -ForegroundColor Yellow
            }
            
            if ($elapsed -ge $timeout) {
                Write-Host "ATTENTION: Le port 3000 n'a pas ete libere apres $timeout secondes" -ForegroundColor Red
            }
        } else {
            Write-Host "Port 3000 libre" -ForegroundColor Green
        }
    } catch {
        Write-Host "Erreur lors de la verification du port 3000: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Show-StartupMenu {
    Clear-Host
    Write-Host "MENU DE DEMARRAGE" -ForegroundColor Yellow
    Write-Host "=================" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "  1. Demarrage complet (menu interactif)" -ForegroundColor White
    Write-Host "  2. Demarrage simple" -ForegroundColor White
    Write-Host "  3. Demarrage backend uniquement" -ForegroundColor White
    Write-Host "  4. Demarrage frontend uniquement" -ForegroundColor White
    Write-Host "  5. Gestion automatique navigateur + demarrage" -ForegroundColor Green
    Write-Host "  0. Retour au menu principal" -ForegroundColor White
    Write-Host ""

    $choice = Read-Host "Choisissez une option (0-5)"

    switch ($choice) {
        "1" { 
            Write-Host "Lancement du demarrage complet..." -ForegroundColor Green
            & ".\scripts\startup\docusense.ps1"
        }
        "2" { 
            Write-Host "Lancement du demarrage simple..." -ForegroundColor Green
            & ".\scripts\startup\docusense.ps1" "menu"
        }
        "3" { 
            Write-Host "Lancement du backend uniquement..." -ForegroundColor Green
            & ".\scripts\startup\docusense.ps1" "backend"
        }
        "4" { 
            Write-Host "Lancement du frontend uniquement..." -ForegroundColor Green
            & ".\scripts\startup\docusense.ps1" "frontend"
        }
        "5" { 
            Write-Host "Gestion automatique du navigateur..." -ForegroundColor Green
            Close-BrowserOnPort3000
            Write-Host "Lancement du demarrage simple..." -ForegroundColor Green
            & ".\scripts\startup\docusense.ps1" "menu"
        }
        "0" { Show-MainMenu }
        default {
            Write-Host "Option invalide." -ForegroundColor Red
            Start-Sleep -Seconds 2
            Show-StartupMenu
        }
    }

    Write-Host "Action terminee. Retour au menu dans 3 secondes..." -ForegroundColor Green
    Start-Sleep -Seconds 3
    Show-MainMenu
}

function Show-MonitoringMenu {
    Clear-Host
    Write-Host "MENU DE MONITORING" -ForegroundColor Yellow
    Write-Host "==================" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "  1. Verification du statut" -ForegroundColor White
    Write-Host "  0. Retour au menu principal" -ForegroundColor White
    Write-Host ""

    $choice = Read-Host "Choisissez une option (0-1)"

    switch ($choice) {
        "1" { 
            Write-Host "Verification du statut..." -ForegroundColor Green
            & ".\scripts\monitoring\status.ps1"
        }
        "0" { Show-MainMenu }
        default {
            Write-Host "Option invalide." -ForegroundColor Red
            Start-Sleep -Seconds 2
            Show-MonitoringMenu
        }
    }

    Write-Host "Action terminee. Retour au menu dans 3 secondes..." -ForegroundColor Green
    Start-Sleep -Seconds 3
    Show-MainMenu
}

function Show-MaintenanceMenu {
    Clear-Host
    Write-Host "MENU DE MAINTENANCE" -ForegroundColor Yellow
    Write-Host "===================" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "  1. Nettoyage general" -ForegroundColor White
    Write-Host "  2. Nettoyage base de donnees" -ForegroundColor White
    Write-Host "  0. Retour au menu principal" -ForegroundColor White
    Write-Host ""

    $choice = Read-Host "Choisissez une option (0-2)"

    switch ($choice) {
        "1" { 
            Write-Host "Nettoyage general..." -ForegroundColor Green
            & ".\scripts\maintenance\cleanup.ps1"
        }
        "2" { 
            Write-Host "Nettoyage base de donnees..." -ForegroundColor Green
            & ".\scripts\maintenance\database_cleanup.ps1"
        }
        "0" { Show-MainMenu }
        default {
            Write-Host "Option invalide." -ForegroundColor Red
            Start-Sleep -Seconds 2
            Show-MaintenanceMenu
        }
    }

    Write-Host "Action terminee. Retour au menu dans 3 secondes..." -ForegroundColor Green
    Start-Sleep -Seconds 3
    Show-MainMenu
}

function Show-TestsMenu {
    Clear-Host
    Write-Host "MENU DE TESTS" -ForegroundColor Yellow
    Write-Host "=============" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "  1. Tests d'audit" -ForegroundColor White
    Write-Host "  2. Tous les tests" -ForegroundColor White
    Write-Host "  3. Tests basiques" -ForegroundColor White
    Write-Host "  4. Tests simples" -ForegroundColor White
    Write-Host "  0. Retour au menu principal" -ForegroundColor White
    Write-Host ""

    $choice = Read-Host "Choisissez une option (0-4)"

    switch ($choice) {
        "1" { 
            Write-Host "Tests d'audit..." -ForegroundColor Green
            & ".\scripts\testing\test-audit.ps1"
        }
        "2" { 
            Write-Host "Tous les tests..." -ForegroundColor Green
            & ".\scripts\testing\run-finalization-tests.ps1"
        }
        "3" { 
            Write-Host "Tests basiques..." -ForegroundColor Green
            & ".\tests\run_all_tests.py"
        }
        "4" { 
            Write-Host "Tests simples..." -ForegroundColor Green
            & ".\scripts\setup-frontend-tests.ps1"
        }
        "0" { Show-MainMenu }
        default {
            Write-Host "Option invalide." -ForegroundColor Red
            Start-Sleep -Seconds 2
            Show-TestsMenu
        }
    }

    Write-Host "Action terminee. Retour au menu dans 3 secondes..." -ForegroundColor Green
    Start-Sleep -Seconds 3
    Show-MainMenu
}

function Show-UtilsMenu {
    Clear-Host
    Write-Host "MENU UTILITAIRES" -ForegroundColor Yellow
    Write-Host "================" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "  1. Telechargement documents de reference" -ForegroundColor White
    Write-Host "  0. Retour au menu principal" -ForegroundColor White
    Write-Host ""

    $choice = Read-Host "Choisissez une option (0-1)"

    switch ($choice) {
        "1" { 
            Write-Host "Telechargement documents de reference..." -ForegroundColor Green
            python ".\scripts\utils\download_reference_documents.py"
        }
        "0" { Show-MainMenu }
        default {
            Write-Host "Option invalide." -ForegroundColor Red
            Start-Sleep -Seconds 2
            Show-UtilsMenu
        }
    }

    Write-Host "Action terminee. Retour au menu dans 3 secondes..." -ForegroundColor Green
    Start-Sleep -Seconds 3
    Show-MainMenu
}

# Execution principale
Show-MainMenu
