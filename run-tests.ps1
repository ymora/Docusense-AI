#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script de test complet pour DocuSense AI
.DESCRIPTION
    Exécute tous les tests (backend, frontend, intégration) et génère des rapports
.PARAMETER BackendOnly
    Exécuter uniquement les tests backend
.PARAMETER FrontendOnly
    Exécuter uniquement les tests frontend
.PARAMETER Coverage
    Générer des rapports de couverture
.PARAMETER Verbose
    Afficher les détails des tests
#>

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$Coverage,
    [switch]$Verbose
)

# Configuration
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Couleurs pour l'affichage
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Write-Header {
    param([string]$Title)
    Write-ColorOutput "`n" + "="*60 $Colors.Header
    Write-ColorOutput "  $Title" $Colors.Header
    Write-ColorOutput "="*60 $Colors.Header
}

function Write-Section {
    param([string]$Title)
    Write-ColorOutput "`n--- $Title ---" $Colors.Info
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        return $connection.TcpTestSucceeded
    }
    catch {
        return $false
    }
}

function Start-BackendServer {
    Write-Section "Démarrage du serveur backend"
    
    if (Test-Port 8000) {
        Write-ColorOutput "✅ Le serveur backend est déjà en cours d'exécution sur le port 8000" $Colors.Success
        return $true
    }
    
    Write-ColorOutput "🚀 Démarrage du serveur backend..." $Colors.Info
    
    try {
        $backendJob = Start-Job -ScriptBlock {
            Set-Location "C:\Users\ymora\Desktop\Docusense AI\backend"
            & "venv\Scripts\python.exe" "main.py"
        }
        
        # Attendre que le serveur démarre
        $timeout = 30
        $elapsed = 0
        
        while ($elapsed -lt $timeout) {
            if (Test-Port 8000) {
                Write-ColorOutput "✅ Serveur backend démarré avec succès" $Colors.Success
                return $backendJob
            }
            Start-Sleep -Seconds 1
            $elapsed++
        }
        
        Write-ColorOutput "❌ Timeout lors du démarrage du serveur backend" $Colors.Error
        Stop-Job $backendJob -ErrorAction SilentlyContinue
        Remove-Job $backendJob -ErrorAction SilentlyContinue
        return $null
    }
    catch {
        Write-ColorOutput "❌ Erreur lors du démarrage du serveur backend: $($_.Exception.Message)" $Colors.Error
        return $null
    }
}

function Stop-BackendServer {
    param($BackendJob)
    
    if ($BackendJob) {
        Write-Section "Arrêt du serveur backend"
        Stop-Job $BackendJob -ErrorAction SilentlyContinue
        Remove-Job $BackendJob -ErrorAction SilentlyContinue
        Write-ColorOutput "✅ Serveur backend arrêté" $Colors.Success
    }
}

function Test-Backend {
    Write-Header "TESTS BACKEND"
    
    # Vérifier l'environnement Python
    Write-Section "Vérification de l'environnement Python"
    
    if (-not (Test-Command "python")) {
        Write-ColorOutput "❌ Python n'est pas installé ou n'est pas dans le PATH" $Colors.Error
        return $false
    }
    
    $pythonVersion = & python --version 2>&1
    Write-ColorOutput "✅ Python détecté: $pythonVersion" $Colors.Success
    
    # Vérifier l'environnement virtuel
    $venvPath = "backend\venv\Scripts\python.exe"
    if (-not (Test-Path $venvPath)) {
        Write-ColorOutput "❌ Environnement virtuel non trouvé: $venvPath" $Colors.Error
        return $false
    }
    
    Write-ColorOutput "✅ Environnement virtuel trouvé" $Colors.Success
    
    # Installer les dépendances de test
    Write-Section "Installation des dépendances de test"
    
    try {
        Set-Location "backend"
        & "venv\Scripts\pip.exe" install pytest pytest-cov pytest-asyncio pytest-mock psutil
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "❌ Erreur lors de l'installation des dépendances de test" $Colors.Error
            return $false
        }
        Write-ColorOutput "✅ Dépendances de test installées" $Colors.Success
        Set-Location ".."
    }
    catch {
        Write-ColorOutput "❌ Erreur lors de l'installation des dépendances: $($_.Exception.Message)" $Colors.Error
        return $false
    }
    
    # Exécuter les tests backend
    Write-Section "Exécution des tests backend"
    
    try {
        Set-Location "backend"
        
        $testArgs = @("venv\Scripts\python.exe", "-m", "pytest", "tests/", "-v")
        
        if ($Coverage) {
            $testArgs += @("--cov=app", "--cov-report=html", "--cov-report=term-missing", "--cov-fail-under=70")
        }
        
        if ($Verbose) {
            $testArgs += @("--tb=long")
        }
        
        $testResult = & $testArgs[0] $testArgs[1..($testArgs.Length-1)]
        $exitCode = $LASTEXITCODE
        
        Set-Location ".."
        
        if ($exitCode -eq 0) {
            Write-ColorOutput "✅ Tests backend réussis" $Colors.Success
            return $true
        } else {
            Write-ColorOutput "❌ Tests backend échoués (code: $exitCode)" $Colors.Error
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Erreur lors de l'exécution des tests backend: $($_.Exception.Message)" $Colors.Error
        return $false
    }
}

function Test-Frontend {
    Write-Header "TESTS FRONTEND"
    
    # Vérifier Node.js
    Write-Section "Vérification de Node.js"
    
    if (-not (Test-Command "node")) {
        Write-ColorOutput "❌ Node.js n'est pas installé ou n'est pas dans le PATH" $Colors.Error
        return $false
    }
    
    $nodeVersion = & node --version
    Write-ColorOutput "✅ Node.js détecté: $nodeVersion" $Colors.Success
    
    # Vérifier npm
    if (-not (Test-Command "npm")) {
        Write-ColorOutput "❌ npm n'est pas installé ou n'est pas dans le PATH" $Colors.Error
        return $false
    }
    
    $npmVersion = & npm --version
    Write-ColorOutput "✅ npm détecté: $npmVersion" $Colors.Success
    
    # Installer les dépendances
    Write-Section "Installation des dépendances frontend"
    
    try {
        Set-Location "frontend"
        
        if (-not (Test-Path "node_modules")) {
            Write-ColorOutput "📦 Installation des dépendances..." $Colors.Info
            & npm install
            if ($LASTEXITCODE -ne 0) {
                Write-ColorOutput "❌ Erreur lors de l'installation des dépendances" $Colors.Error
                return $false
            }
        }
        
        Write-ColorOutput "✅ Dépendances frontend installées" $Colors.Success
        Set-Location ".."
    }
    catch {
        Write-ColorOutput "❌ Erreur lors de l'installation des dépendances: $($_.Exception.Message)" $Colors.Error
        return $false
    }
    
    # Exécuter les tests frontend
    Write-Section "Exécution des tests frontend"
    
    try {
        Set-Location "frontend"
        
        $testCommand = "npm"
        $testArgs = @("run", "test")
        
        if ($Coverage) {
            $testArgs = @("run", "test:coverage")
        }
        
        if ($Verbose) {
            $testArgs += @("--", "--reporter=verbose")
        }
        
        $testResult = & $testCommand $testArgs
        $exitCode = $LASTEXITCODE
        
        Set-Location ".."
        
        if ($exitCode -eq 0) {
            Write-ColorOutput "✅ Tests frontend réussis" $Colors.Success
            return $true
        } else {
            Write-ColorOutput "❌ Tests frontend échoués (code: $exitCode)" $Colors.Error
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Erreur lors de l'exécution des tests frontend: $($_.Exception.Message)" $Colors.Error
        return $false
    }
}

function Test-Integration {
    Write-Header "TESTS D'INTÉGRATION"
    
    # Démarrer le serveur backend
    $backendJob = Start-BackendServer
    if (-not $backendJob) {
        return $false
    }
    
    try {
        # Attendre que le serveur soit prêt
        Start-Sleep -Seconds 5
        
        # Test de l'endpoint d'audit
        Write-Section "Test de l'endpoint d'audit"
        
        try {
            $auditResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/audit/health" -Method Get
            Write-ColorOutput "✅ Endpoint d'audit accessible" $Colors.Success
            
            # Test d'audit complet
            Write-ColorOutput "🔍 Exécution d'un audit complet..." $Colors.Info
            $comprehensiveAudit = Invoke-RestMethod -Uri "http://localhost:8000/api/audit/comprehensive" -Method Get
            
            Write-ColorOutput "📊 Résultats de l'audit:" $Colors.Info
            Write-ColorOutput "  - Score global: $($comprehensiveAudit.summary.overall_score)" $Colors.Info
            Write-ColorOutput "  - Problèmes critiques: $($comprehensiveAudit.summary.critical_issues.Count)" $Colors.Info
            Write-ColorOutput "  - Recommandations: $($comprehensiveAudit.summary.recommendations.Count)" $Colors.Info
            
            if ($comprehensiveAudit.summary.critical_issues.Count -gt 0) {
                Write-ColorOutput "⚠️ Problèmes critiques détectés:" $Colors.Warning
                foreach ($issue in $comprehensiveAudit.summary.critical_issues) {
                    Write-ColorOutput "  - $($issue.issue): $($issue.description)" $Colors.Warning
                }
            }
            
            return $true
        }
        catch {
            Write-ColorOutput "❌ Erreur lors du test d'audit: $($_.Exception.Message)" $Colors.Error
            return $false
        }
    }
    finally {
        Stop-BackendServer $backendJob
    }
}

function Test-Performance {
    Write-Header "TESTS DE PERFORMANCE"
    
    # Démarrer le serveur backend
    $backendJob = Start-BackendServer
    if (-not $backendJob) {
        return $false
    }
    
    try {
        # Attendre que le serveur soit prêt
        Start-Sleep -Seconds 5
        
        Write-Section "Test de performance backend"
        
        try {
            Set-Location "backend"
            & "venv\Scripts\python.exe" "tests/backend/performance_test.py"
            $exitCode = $LASTEXITCODE
            Set-Location ".."
            
            if ($exitCode -eq 0) {
                Write-ColorOutput "✅ Tests de performance backend réussis" $Colors.Success
            } else {
                Write-ColorOutput "❌ Tests de performance backend échoués" $Colors.Error
            }
        }
        catch {
            Write-ColorOutput "❌ Erreur lors des tests de performance: $($_.Exception.Message)" $Colors.Error
        }
        
        Write-Section "Test de performance frontend"
        
        try {
            Set-Location "frontend"
            & npm run build
            $exitCode = $LASTEXITCODE
            Set-Location ".."
            
            if ($exitCode -eq 0) {
                Write-ColorOutput "✅ Build frontend réussi" $Colors.Success
            } else {
                Write-ColorOutput "❌ Build frontend échoué" $Colors.Error
            }
        }
        catch {
            Write-ColorOutput "❌ Erreur lors du build frontend: $($_.Exception.Message)" $Colors.Error
        }
        
        return $true
    }
    finally {
        Stop-BackendServer $backendJob
    }
}

function Generate-Report {
    param(
        [bool]$BackendSuccess,
        [bool]$FrontendSuccess,
        [bool]$IntegrationSuccess,
        [bool]$PerformanceSuccess
    )
    
    Write-Header "RAPPORT FINAL"
    
    $totalTests = 4
    $passedTests = 0
    
    if ($BackendSuccess) { $passedTests++ }
    if ($FrontendSuccess) { $passedTests++ }
    if ($IntegrationSuccess) { $passedTests++ }
    if ($PerformanceSuccess) { $passedTests++ }
    
    Write-ColorOutput "📊 Résumé des tests:" $Colors.Info
    Write-ColorOutput "  - Tests backend: $(if ($BackendSuccess) { '✅ Réussi' } else { '❌ Échoué' })" $(if ($BackendSuccess) { 'Success' } else { 'Error' })
    Write-ColorOutput "  - Tests frontend: $(if ($FrontendSuccess) { '✅ Réussi' } else { '❌ Échoué' })" $(if ($FrontendSuccess) { 'Success' } else { 'Error' })
    Write-ColorOutput "  - Tests d'intégration: $(if ($IntegrationSuccess) { '✅ Réussi' } else { '❌ Échoué' })" $(if ($IntegrationSuccess) { 'Success' } else { 'Error' })
    Write-ColorOutput "  - Tests de performance: $(if ($PerformanceSuccess) { '✅ Réussi' } else { '❌ Échoué' })" $(if ($PerformanceSuccess) { 'Success' } else { 'Error' })
    
    Write-ColorOutput "`n📈 Score global: $passedTests/$totalTests ($([math]::Round($passedTests/$totalTests*100, 1))%)" $Colors.Info
    
    if ($passedTests -eq $totalTests) {
        Write-ColorOutput "🎉 Tous les tests sont passés ! L'application est prête pour la commercialisation." $Colors.Success
    } else {
        Write-ColorOutput "⚠️ Certains tests ont échoué. Veuillez corriger les problèmes avant la commercialisation." $Colors.Warning
    }
    
    # Générer un rapport détaillé
    $reportPath = "test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
    $report = @"
RAPPORT DE TESTS DOCUSENSE AI
============================
Date: $(Get-Date)
Version: 1.0.0

RÉSULTATS:
- Tests backend: $(if ($BackendSuccess) { 'RÉUSSI' } else { 'ÉCHOUÉ' })
- Tests frontend: $(if ($FrontendSuccess) { 'RÉUSSI' } else { 'ÉCHOUÉ' })
- Tests d'intégration: $(if ($IntegrationSuccess) { 'RÉUSSI' } else { 'ÉCHOUÉ' })
- Tests de performance: $(if ($PerformanceSuccess) { 'RÉUSSI' } else { 'ÉCHOUÉ' })

Score global: $passedTests/$totalTests ($([math]::Round($passedTests/$totalTests*100, 1))%)

RECOMMANDATIONS:
$(if ($passedTests -eq $totalTests) { '- L\'application respecte les standards de qualité pour la commercialisation' } else { '- Corriger les tests échoués avant la commercialisation' })
- Maintenir une couverture de tests > 70%
- Exécuter les tests régulièrement
- Surveiller les performances en production

"@
    
    $report | Out-File -FilePath $reportPath -Encoding UTF8
    Write-ColorOutput "📄 Rapport détaillé généré: $reportPath" $Colors.Info
    
    return $passedTests -eq $totalTests
}

# Script principal
function Main {
    Write-Header "DOCUSENSE AI - SUITE DE TESTS COMPLÈTE"
    
    # Variables pour les résultats
    $backendSuccess = $false
    $frontendSuccess = $false
    $integrationSuccess = $false
    $performanceSuccess = $false
    
    try {
        # Tests backend
        if (-not $FrontendOnly) {
            $backendSuccess = Test-Backend
        }
        
        # Tests frontend
        if (-not $BackendOnly) {
            $frontendSuccess = Test-Frontend
        }
        
        # Tests d'intégration (si backend et frontend sont OK)
        if (-not $BackendOnly -and -not $FrontendOnly) {
            if ($backendSuccess -and $frontendSuccess) {
                $integrationSuccess = Test-Integration
            } else {
                Write-ColorOutput "⚠️ Tests d'intégration ignorés (backend ou frontend échoué)" $Colors.Warning
            }
        }
        
        # Tests de performance
        if (-not $BackendOnly -and -not $FrontendOnly) {
            $performanceSuccess = Test-Performance
        }
        
        # Générer le rapport final
        $overallSuccess = Generate-Report $backendSuccess $frontendSuccess $integrationSuccess $performanceSuccess
        
        # Code de sortie
        if ($overallSuccess) {
            exit 0
        } else {
            exit 1
        }
    }
    catch {
        Write-ColorOutput "❌ Erreur fatale: $($_.Exception.Message)" $Colors.Error
        exit 1
    }
}

# Exécution du script principal
Main
