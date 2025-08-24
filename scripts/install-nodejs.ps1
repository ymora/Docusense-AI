#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script d'installation automatique de Node.js pour Docusense AI

.DESCRIPTION
    Ce script installe automatiquement Node.js et npm sur Windows
    pour permettre le fonctionnement du frontend React.

.EXAMPLE
    .\scripts\install-nodejs.ps1
#>

function Install-NodeJS {
    Write-Host "🚀 Installation automatique de Node.js pour Docusense AI" -ForegroundColor Green
    Write-Host "=======================================================" -ForegroundColor Gray
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
            return $true
        }
    } catch {
        # Continue avec l'installation
    }

    Write-Host "📥 Node.js n'est pas installé. Installation en cours..." -ForegroundColor Yellow
    Write-Host ""

    try {
        # Méthode 1: Utiliser winget si disponible
        $wingetAvailable = Get-Command winget -ErrorAction SilentlyContinue
        
        if ($wingetAvailable) {
            Write-Host "📦 Installation via winget (méthode recommandée)..." -ForegroundColor Cyan
            Write-Host "⏳ Téléchargement et installation en cours..." -ForegroundColor Yellow
            
            $result = winget install OpenJS.NodeJS --accept-source-agreements --accept-package-agreements
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Installation via winget réussie!" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Installation via winget échouée, tentative avec téléchargement manuel..." -ForegroundColor Yellow
                throw "winget failed"
            }
        } else {
            throw "winget not available"
        }
        
    } catch {
        Write-Host "📦 Installation via téléchargement manuel..." -ForegroundColor Cyan
        
        try {
            # Télécharger Node.js LTS
            $nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
            $nodeInstaller = "$env:TEMP\node-installer.msi"
            
            Write-Host "🌐 Téléchargement de Node.js LTS..." -ForegroundColor Yellow
            Write-Host "URL: $nodeUrl" -ForegroundColor Gray
            
            # Télécharger avec barre de progression
            $webClient = New-Object System.Net.WebClient
            $webClient.DownloadFile($nodeUrl, $nodeInstaller)
            
            Write-Host "✅ Téléchargement terminé!" -ForegroundColor Green
            
            # Installer Node.js
            Write-Host "🔧 Installation de Node.js..." -ForegroundColor Yellow
            Write-Host "⏳ Installation en cours (cela peut prendre quelques minutes)..." -ForegroundColor Cyan
            
            $process = Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $nodeInstaller, "/quiet", "/norestart" -Wait -PassThru
            
            if ($process.ExitCode -eq 0) {
                Write-Host "✅ Installation réussie!" -ForegroundColor Green
            } else {
                throw "Installation failed with exit code: $($process.ExitCode)"
            }
            
            # Nettoyer le fichier d'installation
            Remove-Item $nodeInstaller -Force -ErrorAction SilentlyContinue
            
        } catch {
            Write-Host "❌ Erreur lors de l'installation: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ""
            Write-Host "📋 Installation manuelle requise:" -ForegroundColor Yellow
            Write-Host "1. Allez sur https://nodejs.org/" -ForegroundColor White
            Write-Host "2. Téléchargez la version LTS (recommandée)" -ForegroundColor White
            Write-Host "3. Installez Node.js en suivant les instructions" -ForegroundColor White
            Write-Host "4. Redémarrez PowerShell" -ForegroundColor White
            Write-Host "5. Relancez le script de démarrage" -ForegroundColor White
            return $false
        }
    }

    # Vérifier l'installation
    Write-Host ""
    Write-Host "🔍 Vérification de l'installation..." -ForegroundColor Cyan
    
    # Attendre un peu pour que les variables d'environnement se propagent
    Start-Sleep -Seconds 3
    
    try {
        # Recharger les variables d'environnement
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        $nodeVersion = node --version 2>$null
        $npmVersion = npm --version 2>$null
        
        if ($nodeVersion -and $npmVersion) {
            Write-Host "✅ Installation réussie!" -ForegroundColor Green
            Write-Host "Node.js: $nodeVersion" -ForegroundColor Cyan
            Write-Host "npm: $npmVersion" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "🎉 Node.js est maintenant installé et prêt à être utilisé!" -ForegroundColor Green
            Write-Host "💡 Vous pouvez maintenant lancer Docusense AI" -ForegroundColor Cyan
            return $true
        } else {
            throw "Installation verification failed"
        }
        
    } catch {
        Write-Host "⚠️ L'installation semble réussie mais la vérification échoue" -ForegroundColor Yellow
        Write-Host "🔄 Redémarrage de PowerShell recommandé..." -ForegroundColor Cyan
        Write-Host ""
        
        $choice = Read-Host "Voulez-vous redémarrer PowerShell maintenant ? (O/N)"
        if ($choice -eq "O" -or $choice -eq "o" -or $choice -eq "Y" -or $choice -eq "y") {
            Write-Host "🔄 Redémarrage de PowerShell..." -ForegroundColor Cyan
            Start-Process "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'Node.js installé! Vous pouvez maintenant lancer Docusense AI.' -ForegroundColor Green"
            exit
        }
        
        return $true
    }
}

# Exécution principale
Install-NodeJS
