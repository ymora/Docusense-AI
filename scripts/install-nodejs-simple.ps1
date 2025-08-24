#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Guide d'installation de Node.js pour Docusense AI

.DESCRIPTION
    Ce script guide l'utilisateur pour installer Node.js manuellement
    et vérifie l'installation.

.EXAMPLE
    .\scripts\install-nodejs-simple.ps1
#>

function Show-NodeJSInstallationGuide {
    Write-Host "🚀 Guide d'installation de Node.js pour Docusense AI" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Gray
    Write-Host ""

    # Vérifier si Node.js est déjà installé
    try {
        $nodeVersion = node --version 2>$null
        $npmVersion = npm --version 2>$null
        
        if ($nodeVersion -and $npmVersion) {
            Write-Host "✅ Node.js et npm sont déjà installés!" -ForegroundColor Green
            Write-Host "Node.js: $nodeVersion" -ForegroundColor Cyan
            Write-Host "npm: $npmVersion" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "🎉 Vous pouvez maintenant utiliser Docusense AI!" -ForegroundColor Green
            Write-Host "💡 Lancez le script principal: .\scripts\main.ps1" -ForegroundColor Cyan
            return $true
        }
    } catch {
        # Continue avec le guide d'installation
    }

    Write-Host "❌ Node.js n'est pas installé sur votre système." -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Instructions d'installation:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1️⃣ Ouvrez votre navigateur web" -ForegroundColor White
    Write-Host "2️⃣ Allez sur: https://nodejs.org/" -ForegroundColor Cyan
    Write-Host "3️⃣ Cliquez sur le bouton vert 'LTS' (version recommandée)" -ForegroundColor White
    Write-Host "4️⃣ Téléchargez le fichier .msi pour Windows" -ForegroundColor White
    Write-Host "5️⃣ Double-cliquez sur le fichier téléchargé" -ForegroundColor White
    Write-Host "6️⃣ Suivez les instructions d'installation (cliquez 'Next' partout)" -ForegroundColor White
    Write-Host "7️⃣ Redémarrez PowerShell après l'installation" -ForegroundColor White
    Write-Host "8️⃣ Relancez ce script pour vérifier l'installation" -ForegroundColor White
    Write-Host ""

    Write-Host "🔗 Lien direct: https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi" -ForegroundColor Cyan
    Write-Host ""

    $choice = Read-Host "Voulez-vous ouvrir le site de Node.js maintenant ? (O/N)"
    
    if ($choice -eq "O" -or $choice -eq "o" -or $choice -eq "Y" -or $choice -eq "y") {
        Write-Host "🌐 Ouverture du site Node.js..." -ForegroundColor Cyan
        Start-Process "https://nodejs.org/"
    }

    Write-Host ""
    Write-Host "💡 Après l'installation:" -ForegroundColor Yellow
    Write-Host "   • Fermez cette fenêtre PowerShell" -ForegroundColor White
    Write-Host "   • Ouvrez une nouvelle fenêtre PowerShell" -ForegroundColor White
    Write-Host "   • Naviguez vers votre projet: cd 'C:\Users\ymora\Desktop\Docusense AI'" -ForegroundColor White
    Write-Host "   • Relancez ce script: .\scripts\install-nodejs-simple.ps1" -ForegroundColor White
    Write-Host ""

    Write-Host "⏸️ Appuyez sur une touche pour continuer..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    return $false
}

# Exécution principale
Show-NodeJSInstallationGuide
