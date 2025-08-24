#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script principal pour accéder à tous les scripts DocuSense AI

.DESCRIPTION
    Ce script fournit un menu interactif pour accéder facilement
    à tous les scripts organisés dans le répertoire scripts/.

.EXAMPLE
    .\scripts\main.ps1
#>

function Show-MainMenu {
    Clear-Host
    Write-Host "🚀 DOCUSENSE AI - MENU PRINCIPAL DES SCRIPTS" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "🎯 Actions principales:" -ForegroundColor Yellow
    Write-Host "  1. 🚀 Démarrage de l'application" -ForegroundColor White
    Write-Host "  2. 📊 Vérification du statut" -ForegroundColor White
    Write-Host "  3. 🧹 Nettoyage et maintenance" -ForegroundColor White
    Write-Host "  4. 🧪 Tests et audit" -ForegroundColor White
    Write-Host "  5. 🔧 Utilitaires" -ForegroundColor White
    Write-Host ""

    Write-Host "🔧 Configuration:" -ForegroundColor Yellow
    Write-Host "  6. 📦 Installer Node.js (requis pour le frontend)" -ForegroundColor White
    Write-Host ""

    Write-Host "❓ Autres:" -ForegroundColor Yellow
    Write-Host "  0. ❌ Quitter" -ForegroundColor White
    Write-Host ""

    $choice = Read-Host "Choisissez une option (0-6)"

    switch ($choice) {
        "1" { Show-StartupMenu }
        "2" { Show-MonitoringMenu }
        "3" { Show-MaintenanceMenu }
        "4" { Show-TestsMenu }
        "5" { Show-UtilsMenu }
        "6" { 
            Write-Host "`n📦 Installation de Node.js..." -ForegroundColor Green
            & ".\scripts\install-nodejs-simple.ps1"
        }
        "0" { 
            Write-Host "`n👋 Au revoir !" -ForegroundColor Green
            return 
        }
        default {
            Write-Host "`n❌ Option invalide. Retour au menu dans 2 secondes..." -ForegroundColor Red
            Start-Sleep -Seconds 2
            Show-MainMenu
        }
    }
}

function Show-StartupMenu {
    Clear-Host
    Write-Host "🚀 MENU DE DÉMARRAGE" -ForegroundColor Yellow
    Write-Host "====================" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "  1. 🎯 Démarrage complet (menu interactif)" -ForegroundColor White
    Write-Host "  2. ⚡ Démarrage simple" -ForegroundColor White
    Write-Host "  3. 🔧 Démarrage backend uniquement" -ForegroundColor White
    Write-Host "  4. 🎨 Démarrage frontend uniquement" -ForegroundColor White
    Write-Host "  0. ⬅️ Retour au menu principal" -ForegroundColor White
    Write-Host ""

    $choice = Read-Host "Choisissez une option (0-4)"

    switch ($choice) {
        "1" { 
            Write-Host "`n🚀 Lancement du démarrage complet..." -ForegroundColor Green
            & ".\scripts\startup\docusense.ps1"
        }
        "2" { 
            Write-Host "`n⚡ Lancement du démarrage simple..." -ForegroundColor Green
            & ".\scripts\startup\start.ps1"
        }
        "3" { 
            Write-Host "`n🔧 Lancement du backend uniquement..." -ForegroundColor Green
            & ".\scripts\startup\docusense.ps1" "backend"
        }
        "4" { 
            Write-Host "`n🎨 Lancement du frontend uniquement..." -ForegroundColor Green
            & ".\scripts\startup\docusense.ps1" "frontend"
        }
        "0" { Show-MainMenu }
        default {
            Write-Host "`n❌ Option invalide." -ForegroundColor Red
            Start-Sleep -Seconds 2
            Show-StartupMenu
        }
    }

    Write-Host "`n✅ Action terminée. Retour au menu dans 3 secondes..." -ForegroundColor Green
    Start-Sleep -Seconds 3
    Show-MainMenu
}

function Show-MonitoringMenu {
    Clear-Host
    Write-Host "📊 MENU DE MONITORING" -ForegroundColor Yellow
    Write-Host "=====================" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "  1. 📊 Vérification du statut" -ForegroundColor White
    Write-Host "  0. ⬅️ Retour au menu principal" -ForegroundColor White
    Write-Host ""

    $choice = Read-Host "Choisissez une option (0-1)"

    switch ($choice) {
        "1" { 
            Write-Host "`n📊 Vérification du statut..." -ForegroundColor Green
            & ".\scripts\monitoring\status.ps1"
        }
        "0" { Show-MainMenu }
        default {
            Write-Host "`n❌ Option invalide." -ForegroundColor Red
            Start-Sleep -Seconds 2
            Show-MonitoringMenu
        }
    }

    Write-Host "`n✅ Action terminée. Retour au menu dans 3 secondes..." -ForegroundColor Green
    Start-Sleep -Seconds 3
    Show-MainMenu
}

function Show-MaintenanceMenu {
    Clear-Host
    Write-Host "🧹 MENU DE MAINTENANCE" -ForegroundColor Yellow
    Write-Host "======================" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "  1. 🧹 Nettoyage général" -ForegroundColor White
    Write-Host "  2. 🗄️ Nettoyage base de données" -ForegroundColor White
    Write-Host "  0. ⬅️ Retour au menu principal" -ForegroundColor White
    Write-Host ""

    $choice = Read-Host "Choisissez une option (0-2)"

    switch ($choice) {
        "1" { 
            Write-Host "`n🧹 Nettoyage général..." -ForegroundColor Green
            & ".\scripts\maintenance\cleanup.ps1"
        }
        "2" { 
            Write-Host "`n🗄️ Nettoyage base de données..." -ForegroundColor Green
            & ".\scripts\maintenance\database_cleanup.ps1"
        }
        "0" { Show-MainMenu }
        default {
            Write-Host "`n❌ Option invalide." -ForegroundColor Red
            Start-Sleep -Seconds 2
            Show-MaintenanceMenu
        }
    }

    Write-Host "`n✅ Action terminée. Retour au menu dans 3 secondes..." -ForegroundColor Green
    Start-Sleep -Seconds 3
    Show-MainMenu
}

function Show-TestsMenu {
    Clear-Host
    Write-Host "🧪 MENU DE TESTS" -ForegroundColor Yellow
    Write-Host "================" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "  1. 🔍 Tests d'audit" -ForegroundColor White
    Write-Host "  2. 🧪 Tous les tests" -ForegroundColor White
    Write-Host "  3. ⚡ Tests basiques" -ForegroundColor White
    Write-Host "  4. 📊 Tests simples" -ForegroundColor White
    Write-Host "  0. ⬅️ Retour au menu principal" -ForegroundColor White
    Write-Host ""

    $choice = Read-Host "Choisissez une option (0-4)"

    switch ($choice) {
        "1" { 
            Write-Host "`n🔍 Tests d'audit..." -ForegroundColor Green
            & ".\tests\scripts\test-audit.ps1"
        }
        "2" { 
            Write-Host "`n🧪 Tous les tests..." -ForegroundColor Green
            & ".\tests\scripts\run-tests.ps1"
        }
        "3" { 
            Write-Host "`n⚡ Tests basiques..." -ForegroundColor Green
            & ".\tests\scripts\test-basic.ps1"
        }
        "4" { 
            Write-Host "`n📊 Tests simples..." -ForegroundColor Green
            & ".\tests\scripts\test-simple.ps1"
        }
        "0" { Show-MainMenu }
        default {
            Write-Host "`n❌ Option invalide." -ForegroundColor Red
            Start-Sleep -Seconds 2
            Show-TestsMenu
        }
    }

    Write-Host "`n✅ Action terminée. Retour au menu dans 3 secondes..." -ForegroundColor Green
    Start-Sleep -Seconds 3
    Show-MainMenu
}

function Show-UtilsMenu {
    Clear-Host
    Write-Host "🔧 MENU UTILITAIRES" -ForegroundColor Yellow
    Write-Host "==================" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "  1. 📚 Téléchargement documents de référence" -ForegroundColor White
    Write-Host "  0. ⬅️ Retour au menu principal" -ForegroundColor White
    Write-Host ""

    $choice = Read-Host "Choisissez une option (0-1)"

    switch ($choice) {
        "1" { 
            Write-Host "`n📚 Téléchargement documents de référence..." -ForegroundColor Green
            python ".\scripts\utils\download_reference_documents.py"
        }
        "0" { Show-MainMenu }
        default {
            Write-Host "`n❌ Option invalide." -ForegroundColor Red
            Start-Sleep -Seconds 2
            Show-UtilsMenu
        }
    }

    Write-Host "`n✅ Action terminée. Retour au menu dans 3 secondes..." -ForegroundColor Green
    Start-Sleep -Seconds 3
    Show-MainMenu
}

# Exécution principale
Show-MainMenu
