#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script de test pour valider l'infrastructure d'audit de DocuSense AI
#>

Write-Host "🧪 TEST DE L'INFRASTRUCTURE D'AUDIT DOCUSENSE AI" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Test 1: Vérification de la structure des tests
Write-Host "`n📁 Test 1: Structure des tests" -ForegroundColor Yellow

$testStructure = @{
    "tests/backend/test_unit_services.py" = Test-Path "tests/backend/test_unit_services.py"
    "tests/backend/performance_test.py" = Test-Path "tests/backend/performance_test.py"
    "tests/backend/test_priority_mode.py" = Test-Path "tests/backend/test_priority_mode.py"
    "frontend/vitest.config.ts" = Test-Path "frontend/vitest.config.ts"
    "frontend/src/test/setup.ts" = Test-Path "frontend/src/test/setup.ts"
    "frontend/src/test/components/FileList.test.tsx" = Test-Path "frontend/src/test/components/FileList.test.tsx"
}

foreach ($test in $testStructure.GetEnumerator()) {
    $status = if ($test.Value) { "✅" } else { "❌" }
    Write-Host "  $status $($test.Key)" -ForegroundColor $(if ($test.Value) { "Green" } else { "Red" })
}

# Test 2: Vérification des fichiers de configuration
Write-Host "`n⚙️ Test 2: Configuration" -ForegroundColor Yellow

$configFiles = @{
            "audit-config.json" = Test-Path "docs/audit/audit-config.json"
    "run-tests.ps1" = Test-Path "run-tests.ps1"
    "docs/AUDIT_RECOMMANDATIONS.md" = Test-Path "docs/AUDIT_RECOMMANDATIONS.md"
    "backend/app/api/audit.py" = Test-Path "backend/app/api/audit.py"
}

foreach ($config in $configFiles.GetEnumerator()) {
    $status = if ($config.Value) { "✅" } else { "❌" }
    Write-Host "  $status $($config.Key)" -ForegroundColor $(if ($config.Value) { "Green" } else { "Red" })
}

# Test 3: Vérification des dépendances
Write-Host "`n📦 Test 3: Dépendances" -ForegroundColor Yellow

# Vérifier Python et l'environnement virtuel
if (Test-Path "backend\venv\Scripts\python.exe") {
    Write-Host "  ✅ Environnement virtuel Python trouvé" -ForegroundColor Green
} else {
    Write-Host "  ❌ Environnement virtuel Python manquant" -ForegroundColor Red
}

# Vérifier Node.js
try {
    $nodeVersion = & node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Node.js trouvé: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Node.js non trouvé" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Node.js non trouvé" -ForegroundColor Red
}

# Test 4: Analyse de la couverture de tests actuelle
Write-Host "`n📊 Test 4: Analyse de la couverture" -ForegroundColor Yellow

# Compter les fichiers de test
$backendTests = Get-ChildItem -Path "tests/backend" -Filter "*.py" -Recurse | Measure-Object | Select-Object -ExpandProperty Count
$frontendTests = Get-ChildItem -Path "frontend/src/test" -Filter "*.test.*" -Recurse | Measure-Object | Select-Object -ExpandProperty Count

Write-Host "  📁 Tests backend: $backendTests fichiers" -ForegroundColor Blue
Write-Host "  📁 Tests frontend: $frontendTests fichiers" -ForegroundColor Blue

# Estimation de la couverture (basée sur la présence de tests)
$estimatedCoverage = [math]::Min(($backendTests * 10) + ($frontendTests * 5), 100)
Write-Host "  📈 Couverture estimée: $estimatedCoverage%" -ForegroundColor $(if ($estimatedCoverage -ge 70) { "Green" } else { "Yellow" })

# Test 5: Validation de la configuration d'audit
Write-Host "`n🔍 Test 5: Configuration d'audit" -ForegroundColor Yellow

if (Test-Path "docs/audit/audit-config.json") {
    try {
        $auditConfig = Get-Content "docs/audit/audit-config.json" | ConvertFrom-Json
        Write-Host "  ✅ Configuration d'audit valide" -ForegroundColor Green
        
        # Afficher quelques métriques clés
        $qualityGates = $auditConfig.audit_config.quality_gates
        Write-Host "  🎯 Seuils de qualité configurés:" -ForegroundColor Blue
        Write-Host "     - Sécurité: $($qualityGates.security_score_min)%" -ForegroundColor Blue
        Write-Host "     - Performance: $($qualityGates.performance_score_min)%" -ForegroundColor Blue
        Write-Host "     - Qualité de code: $($qualityGates.code_quality_score_min)%" -ForegroundColor Blue
        Write-Host "     - Score global: $($qualityGates.overall_score_min)%" -ForegroundColor Blue
    } catch {
        Write-Host "  ❌ Configuration d'audit invalide" -ForegroundColor Red
    }
} else {
    Write-Host "  ❌ Configuration d'audit manquante" -ForegroundColor Red
}

# Test 6: Recommandations d'amélioration
Write-Host "`n💡 Test 6: Recommandations" -ForegroundColor Yellow

$recommendations = @()

if ($backendTests -lt 10) {
    $recommendations += "🔴 Implémenter plus de tests backend (actuel: $backendTests, recommandé: 10+)"
}

if ($frontendTests -lt 5) {
    $recommendations += "🔴 Implémenter plus de tests frontend (actuel: $frontendTests, recommandé: 5+)"
}

if ($estimatedCoverage -lt 70) {
    $recommendations += "🟡 Améliorer la couverture de tests (actuel: $estimatedCoverage%, objectif: 80%)"
}

if (-not (Test-Path "tests/backend/test_security.py")) {
    $recommendations += "🔴 Ajouter des tests de sécurité"
}

if (-not (Test-Path "tests/backend/test_integration.py")) {
    $recommendations += "🟡 Ajouter des tests d'intégration"
}

if (-not (Test-Path "tests/frontend/e2e")) {
    $recommendations += "🟡 Ajouter des tests E2E"
}

# Afficher les recommandations
if ($recommendations.Count -eq 0) {
    Write-Host "  ✅ Aucune recommandation critique" -ForegroundColor Green
} else {
    Write-Host "  📋 Recommandations d'amélioration:" -ForegroundColor Yellow
    foreach ($rec in $recommendations) {
        Write-Host "     $rec" -ForegroundColor $(if ($rec.StartsWith("🔴")) { "Red" } else { "Yellow" })
    }
}

# Résumé final
Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
Write-Host "📋 RÉSUMÉ DE L'AUDIT" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

$totalTests = $testStructure.Values | Where-Object { $_ } | Measure-Object | Select-Object -ExpandProperty Count
$totalConfigs = $configFiles.Values | Where-Object { $_ } | Measure-Object | Select-Object -ExpandProperty Count

Write-Host "✅ Tests d'infrastructure: $($totalTests)/$($testStructure.Count) passés" -ForegroundColor $(if ($totalTests -eq $testStructure.Count) { "Green" } else { "Yellow" })
Write-Host "✅ Fichiers de configuration: $($totalConfigs)/$($configFiles.Count) présents" -ForegroundColor $(if ($totalConfigs -eq $configFiles.Count) { "Green" } else { "Yellow" })
Write-Host "📊 Couverture estimée: $estimatedCoverage%" -ForegroundColor $(if ($estimatedCoverage -ge 70) { "Green" } else { "Yellow" })
Write-Host "📋 Recommandations: $($recommendations.Count)" -ForegroundColor $(if ($recommendations.Count -eq 0) { "Green" } else { "Yellow" })

# Score global
$score = [math]::Round((($totalTests / $testStructure.Count) * 0.4 + ($totalConfigs / $configFiles.Count) * 0.3 + ($estimatedCoverage / 100) * 0.3) * 100, 1)
Write-Host "`n🎯 Score global: $score%" -ForegroundColor $(if ($score -ge 80) { "Green" } elseif ($score -ge 60) { "Yellow" } else { "Red" })

if ($score -ge 80) {
    Write-Host "🎉 L'infrastructure d'audit est prête pour la commercialisation !" -ForegroundColor Green
} elseif ($score -ge 60) {
    Write-Host "⚠️ L'infrastructure d'audit nécessite des améliorations avant la commercialisation." -ForegroundColor Yellow
} else {
    Write-Host "❌ L'infrastructure d'audit nécessite des améliorations majeures." -ForegroundColor Red
}

Write-Host "`n📄 Pour plus de détails, consultez: docs/AUDIT_RECOMMANDATIONS.md" -ForegroundColor Blue
Write-Host "🚀 Pour exécuter les tests complets: .\run-tests.ps1" -ForegroundColor Blue
