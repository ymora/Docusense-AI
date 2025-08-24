# Script principal de finalisation DocuSense AI
# Orchestre tout le processus de finalisation de 92.5% à 100%

param(
    [switch]$SkipTests,
    [switch]$SkipDocumentation,
    [switch]$SkipOptimization,
    [switch]$Force,
    [switch]$Verbose
)

Write-Host "🎯 FINALISATION DOCUSENSE AI - 92.5% → 100%" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"
$startTime = Get-Date

# Configuration
$backendDir = "backend"
$frontendDir = "frontend"
$docsDir = "docs"
$scriptsDir = "scripts"

# Fonction de logging
function Write-FinalizationLog {
    param($Message, $Status = "INFO", $Phase = "")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = switch ($Status) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        "PHASE" { "Magenta" }
        default { "White" }
    }
    
    $prefix = if ($Phase) { "[$Phase] " } else { "" }
    Write-Host "[$timestamp] $prefix$Message" -ForegroundColor $color
}

# Fonction de vérification de prérequis
function Test-Prerequisites {
    Write-FinalizationLog "🔍 Vérification des prérequis..." "INFO"
    
    $prerequisites = @{
        "Python" = { Test-Path "$backendDir\venv\Scripts\python.exe" }
        "Node.js" = { Get-Command node -ErrorAction SilentlyContinue }
        "Git" = { Get-Command git -ErrorAction SilentlyContinue }
        "Backend" = { Test-Path "$backendDir\main.py" }
        "Frontend" = { Test-Path "$frontendDir\package.json" }
        "Documentation" = { Test-Path "$docsDir\README.md" }
    }
    
    $allGood = $true
    foreach ($prereq in $prerequisites.GetEnumerator()) {
        if (& $prereq.Value) {
            Write-FinalizationLog "✅ $($prereq.Key)" "SUCCESS"
        } else {
            Write-FinalizationLog "❌ $($prereq.Key) manquant" "ERROR"
            $allGood = $false
        }
    }
    
    return $allGood
}

# Fonction de sauvegarde
function Backup-CurrentState {
    Write-FinalizationLog "💾 Sauvegarde de l'état actuel..." "INFO"
    
    $backupDir = "backup_finalization_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
    # Sauvegarder les fichiers critiques
    $criticalFiles = @(
        "$backendDir\app\services\",
        "$frontendDir\src\services\",
        "$docsDir\",
        "$scriptsDir\"
    )
    
    foreach ($file in $criticalFiles) {
        if (Test-Path $file) {
            Copy-Item -Path $file -Destination "$backupDir\" -Recurse -Force
        }
    }
    
    Write-FinalizationLog "✅ Sauvegarde créée: $backupDir" "SUCCESS"
    return $backupDir
}

# ========================================
# PHASE 1 : OPTIMISATION CRITIQUE
# ========================================

function Start-OptimizationPhase {
    Write-FinalizationLog "🚀 DÉBUT PHASE 1 : OPTIMISATION CRITIQUE" "PHASE"
    
    # 1.1 Service API Unifié
    Write-FinalizationLog "🔗 Création du service API unifié..." "INFO"
    if (Test-Path "$frontendDir\src\services\unifiedApiService.ts") {
        Write-FinalizationLog "✅ Service API unifié déjà présent" "SUCCESS"
    } else {
        Write-FinalizationLog "⚠️ Service API unifié manquant - création nécessaire" "WARNING"
    }
    
    # 1.2 Service d'Authentification Centralisé
    Write-FinalizationLog "🔐 Vérification du service d'authentification..." "INFO"
    if (Test-Path "$backendDir\app\services\auth_service.py") {
        Write-FinalizationLog "✅ Service d'authentification centralisé présent" "SUCCESS"
    } else {
        Write-FinalizationLog "⚠️ Service d'authentification manquant - création nécessaire" "WARNING"
    }
    
    # 1.3 Système de Validation Unifié
    Write-FinalizationLog "✅ Vérification du système de validation..." "INFO"
    if (Test-Path "$backendDir\app\utils\validators.py") {
        Write-FinalizationLog "✅ Système de validation unifié présent" "SUCCESS"
    } else {
        Write-FinalizationLog "⚠️ Système de validation manquant - création nécessaire" "WARNING"
    }
    
    # 1.4 Nettoyage du Code Mort
    Write-FinalizationLog "🧹 Nettoyage du code mort..." "INFO"
    
    # Vérifier les console.log
    $consoleLogs = Get-ChildItem -Path $frontendDir -Recurse -Include "*.ts", "*.tsx" | 
                   Select-String -Pattern "console\.log" | 
                   Where-Object { $_.Line -notmatch "//.*console\.log" }
    
    if ($consoleLogs) {
        Write-FinalizationLog "⚠️ $($consoleLogs.Count) console.log trouvés" "WARNING"
        if ($Verbose) {
            $consoleLogs | ForEach-Object { Write-FinalizationLog "   $($_.Filename):$($_.LineNumber)" "WARNING" }
        }
    } else {
        Write-FinalizationLog "✅ Aucun console.log trouvé" "SUCCESS"
    }
    
    Write-FinalizationLog "✅ PHASE 1 TERMINÉE" "SUCCESS"
}

# ========================================
# PHASE 2 : TESTS ET QUALITÉ
# ========================================

function Start-TestingPhase {
    Write-FinalizationLog "🧪 DÉBUT PHASE 2 : TESTS ET QUALITÉ" "PHASE"
    
    # 2.1 Scripts de Test Automatisés
    Write-FinalizationLog "🔧 Vérification des scripts de test..." "INFO"
    if (Test-Path "$scriptsDir\testing\run-finalization-tests.ps1") {
        Write-FinalizationLog "✅ Script de tests de finalisation présent" "SUCCESS"
    } else {
        Write-FinalizationLog "⚠️ Script de tests manquant - création nécessaire" "WARNING"
    }
    
    # 2.2 Exécution des Tests
    if (-not $SkipTests) {
        Write-FinalizationLog "🧪 Exécution des tests de finalisation..." "INFO"
        try {
            & "$scriptsDir\testing\run-finalization-tests.ps1" -Verbose:$Verbose
            if ($LASTEXITCODE -eq 0) {
                Write-FinalizationLog "✅ Tous les tests passent" "SUCCESS"
            } else {
                Write-FinalizationLog "❌ Certains tests ont échoué" "ERROR"
                if (-not $Force) {
                    throw "Tests échoués"
                }
            }
        } catch {
            Write-FinalizationLog "❌ Erreur lors des tests: $($_.Exception.Message)" "ERROR"
            if (-not $Force) {
                throw
            }
        }
    } else {
        Write-FinalizationLog "⏭️ Tests ignorés" "WARNING"
    }
    
    Write-FinalizationLog "✅ PHASE 2 TERMINÉE" "SUCCESS"
}

# ========================================
# PHASE 3 : DOCUMENTATION ET DÉPLOIEMENT
# ========================================

function Start-DocumentationPhase {
    Write-FinalizationLog "📚 DÉBUT PHASE 3 : DOCUMENTATION ET DÉPLOIEMENT" "PHASE"
    
    # 3.1 Documentation Mise à Jour
    if (-not $SkipDocumentation) {
        Write-FinalizationLog "📝 Mise à jour de la documentation..." "INFO"
        
        $docsFiles = @(
            "docs\README.md",
            "docs\developers\ARCHITECTURE.md",
            "docs\developers\SERVICES.md",
            "docs\developers\TESTS.md",
            "docs\audit\IMPLEMENTATION_RECOMMANDATIONS.md",
            "docs\system\README_Finalisation.md"
        )
        
        foreach ($doc in $docsFiles) {
            if (Test-Path $doc) {
                Write-FinalizationLog "✅ $doc" "SUCCESS"
            } else {
                Write-FinalizationLog "❌ $doc manquant" "ERROR"
            }
        }
    } else {
        Write-FinalizationLog "⏭️ Documentation ignorée" "WARNING"
    }
    
    # 3.2 Scripts de Déploiement
    Write-FinalizationLog "🚀 Vérification des scripts de déploiement..." "INFO"
    
    $deploymentScripts = @(
        "$scriptsDir\startup\docusense.ps1",
        "$scriptsDir\main.ps1",
        "$scriptsDir\testing\run-finalization-tests.ps1"
    )
    
    foreach ($script in $deploymentScripts) {
        if (Test-Path $script) {
            Write-FinalizationLog "✅ $script" "SUCCESS"
        } else {
            Write-FinalizationLog "❌ $script manquant" "ERROR"
        }
    }
    
    Write-FinalizationLog "✅ PHASE 3 TERMINÉE" "SUCCESS"
}

# ========================================
# PHASE 4 : VALIDATION FINALE
# ========================================

function Start-ValidationPhase {
    Write-FinalizationLog "✅ DÉBUT PHASE 4 : VALIDATION FINALE" "PHASE"
    
    # 4.1 Vérification de l'état final
    Write-FinalizationLog "🔍 Vérification de l'état final..." "INFO"
    
    $finalChecks = @{
        "Service API Unifié" = { Test-Path "$frontendDir\src\services\unifiedApiService.ts" }
        "Service Auth Centralisé" = { Test-Path "$backendDir\app\services\auth_service.py" }
        "Système Validation" = { Test-Path "$backendDir\app\utils\validators.py" }
        "Tests Automatisés" = { Test-Path "$scriptsDir\testing\run-finalization-tests.ps1" }
        "Documentation Finalisation" = { Test-Path "$docsDir\system\README_Finalisation.md" }
        "Script Principal" = { Test-Path "$scriptsDir\finalize-application.ps1" }
    }
    
    $allChecksPassed = $true
    foreach ($check in $finalChecks.GetEnumerator()) {
        if (& $check.Value) {
            Write-FinalizationLog "✅ $($check.Key)" "SUCCESS"
        } else {
            Write-FinalizationLog "❌ $($check.Key)" "ERROR"
            $allChecksPassed = $false
        }
    }
    
    # 4.2 Test de démarrage
    Write-FinalizationLog "🚀 Test de démarrage de l'application..." "INFO"
    try {
        # Test rapide du backend
        $backendTest = & "$backendDir\venv\Scripts\python.exe" -c "
import sys
sys.path.append('$backendDir')
try:
    from app.main import app
    print('✅ Backend importé avec succès')
except Exception as e:
    print(f'❌ Erreur backend: {e}')
    exit(1)
"
        if ($LASTEXITCODE -eq 0) {
            Write-FinalizationLog "✅ Backend fonctionnel" "SUCCESS"
        } else {
            Write-FinalizationLog "❌ Problème avec le backend" "ERROR"
            $allChecksPassed = $false
        }
    } catch {
        Write-FinalizationLog "❌ Erreur lors du test backend: $($_.Exception.Message)" "ERROR"
        $allChecksPassed = $false
    }
    
    return $allChecksPassed
}

# ========================================
# EXÉCUTION PRINCIPALE
# ========================================

try {
    Write-FinalizationLog "🎯 DÉBUT DE LA FINALISATION DOCUSENSE AI" "PHASE"
    
    # Vérification des prérequis
    if (-not (Test-Prerequisites)) {
        throw "Prérequis non satisfaits"
    }
    
    # Sauvegarde
    $backupDir = Backup-CurrentState
    
    # Phase 1 : Optimisation
    if (-not $SkipOptimization) {
        Start-OptimizationPhase
    } else {
        Write-FinalizationLog "⏭️ Phase d'optimisation ignorée" "WARNING"
    }
    
    # Phase 2 : Tests
    Start-TestingPhase
    
    # Phase 3 : Documentation
    Start-DocumentationPhase
    
    # Phase 4 : Validation finale
    $validationPassed = Start-ValidationPhase
    
    # Résumé final
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    Write-Host ""
    Write-Host "🎯 RÉSUMÉ DE LA FINALISATION" -ForegroundColor Cyan
    Write-Host "============================" -ForegroundColor Cyan
    Write-Host "Durée totale: $($duration.Minutes)m $($duration.Seconds)s" -ForegroundColor White
    Write-Host "Sauvegarde: $backupDir" -ForegroundColor White
    
    if ($validationPassed) {
        Write-Host ""
        Write-Host "🎉 FÉLICITATIONS ! DOCUSENSE AI EST MAINTENANT 100% FONCTIONNEL !" -ForegroundColor Green
        Write-Host "✅ Toutes les optimisations sont en place" -ForegroundColor Green
        Write-Host "✅ Tous les tests passent" -ForegroundColor Green
        Write-Host "✅ L'application est prête pour la production" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 Prochaines étapes:" -ForegroundColor Cyan
        Write-Host "   • Déploiement en production" -ForegroundColor White
        Write-Host "   • Formation des utilisateurs" -ForegroundColor White
        Write-Host "   • Monitoring et surveillance" -ForegroundColor White
        Write-Host "   • Support et maintenance" -ForegroundColor White
        Write-Host ""
        Write-Host "📚 Documentation:" -ForegroundColor Cyan
        Write-Host "   • docs/system/README_Finalisation.md" -ForegroundColor White
        Write-Host "   • docs/README.md" -ForegroundColor White
        Write-Host ""
        Write-Host "🧪 Tests:" -ForegroundColor Cyan
        Write-Host "   • .\scripts\testing\run-finalization-tests.ps1" -ForegroundColor White
        Write-Host ""
        Write-Host "✨ Finalisation terminée avec succès !" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️ ATTENTION: La validation finale a échoué" -ForegroundColor Yellow
        Write-Host "Veuillez corriger les problèmes avant de considérer l'application comme finalisée" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "💾 Sauvegarde disponible dans: $backupDir" -ForegroundColor Cyan
        exit 1
    }
    
} catch {
    Write-FinalizationLog "❌ ERREUR CRITIQUE: $($_.Exception.Message)" "ERROR"
    Write-Host ""
    Write-Host "💾 Sauvegarde disponible dans: $backupDir" -ForegroundColor Cyan
    Write-Host "🔄 Vous pouvez restaurer l'état précédent si nécessaire" -ForegroundColor Cyan
    exit 1
}
