#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script PowerShell pour lancer tous les tests DocuSense AI
.DESCRIPTION
    Lance le script de test unifié avec gestion d'erreurs et affichage coloré
#>

Write-Host "🧪 LANCEMENT DES TESTS DOCUSENSE AI" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# Vérifier si Python est disponible
try {
    $pythonVersion = & python --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Python détecté : $pythonVersion" -ForegroundColor Green
    } else {
        throw "Python non trouvé"
    }
} catch {
    Write-Host "❌ Erreur : Python n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "💡 Solution : Installez Python depuis https://python.org" -ForegroundColor Yellow
    exit 1
}

# Vérifier si le script de test existe
$testScript = Join-Path $PSScriptRoot "tests\run_all_tests.py"
if (-not (Test-Path $testScript)) {
    Write-Host "❌ Erreur : Script de test non trouvé : $testScript" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Script de test trouvé : $testScript" -ForegroundColor Green

# Vérifier l'environnement virtuel
$venvPath = Join-Path $PSScriptRoot "backend\venv\Scripts\python.exe"
if (Test-Path $venvPath) {
    Write-Host "✅ Environnement virtuel trouvé" -ForegroundColor Green
    $pythonExe = $venvPath
} else {
    Write-Host "⚠️ Environnement virtuel non trouvé, utilisation de Python système" -ForegroundColor Yellow
    $pythonExe = "python"
}

# Lancer les tests
Write-Host "`n🚀 Lancement des tests..." -ForegroundColor Blue
Write-Host "-" * 30 -ForegroundColor Blue

try {
    $startTime = Get-Date
    
    # Lancer le script de test
    $process = Start-Process -FilePath $pythonExe -ArgumentList "`"$testScript`"" -WorkingDirectory $PSScriptRoot -Wait -PassThru -NoNewWindow
    
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    Write-Host "`n" + "=" * 50 -ForegroundColor Cyan
    Write-Host "📊 RÉSUMÉ DES TESTS" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Cyan
    
    if ($process.ExitCode -eq 0) {
        Write-Host "🎉 Tous les tests sont passés avec succès !" -ForegroundColor Green
        Write-Host "✅ Code de sortie : $($process.ExitCode)" -ForegroundColor Green
    } else {
        Write-Host "❌ Certains tests ont échoué" -ForegroundColor Red
        Write-Host "❌ Code de sortie : $($process.ExitCode)" -ForegroundColor Red
    }
    
    Write-Host "⏱️ Durée totale : $($duration.TotalSeconds.ToString('F2')) secondes" -ForegroundColor Blue
    
} catch {
    Write-Host "❌ Erreur lors de l'exécution des tests : $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Pour plus d'informations, consultez :" -ForegroundColor Blue
Write-Host "   📖 docs/system/README_Scripts_Consolidated.md" -ForegroundColor White
Write-Host "   🧪 tests/README.md" -ForegroundColor White

# Code de sortie
if ($process.ExitCode -eq 0) {
    exit 0
} else {
    exit 1
}
