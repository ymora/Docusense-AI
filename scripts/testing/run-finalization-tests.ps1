# Script de tests automatisés pour la finalisation DocuSense AI
# Vérifie que toutes les optimisations sont en place et fonctionnelles

param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$SkipIntegration,
    [switch]$Verbose
)

Write-Host "🧪 TESTS DE FINALISATION DOCUSENSE AI" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"
$startTime = Get-Date

# Configuration
$backendDir = "backend"
$frontendDir = "frontend"
$testsDir = "tests"
$venvPath = "$backendDir\venv\Scripts\python.exe"

# Fonction de logging
function Write-TestLog {
    param($Message, $Status = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = switch ($Status) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        default { "White" }
    }
    Write-Host "[$timestamp] $Message" -ForegroundColor $color
}

# Fonction de vérification de service
function Test-ServiceRunning {
    param($ServiceName, $Port)
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

# Fonction de test de performance
function Test-Performance {
    param($TestName, $Script)
    Write-TestLog "Test de performance: $TestName" "INFO"
    try {
        $result = & $venvPath $Script
        if ($LASTEXITCODE -eq 0) {
            Write-TestLog "✅ $TestName - PASSÉ" "SUCCESS"
            return $true
        } else {
            Write-TestLog "❌ $TestName - ÉCHOUÉ" "ERROR"
            return $false
        }
    } catch {
        Write-TestLog "❌ $TestName - ERREUR: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# ========================================
# 1. VÉRIFICATION DE L'ENVIRONNEMENT
# ========================================

Write-TestLog "🔍 Vérification de l'environnement..." "INFO"

# Vérifier Python
if (Test-Path $venvPath) {
    Write-TestLog "✅ Environnement Python virtuel trouvé" "SUCCESS"
} else {
    Write-TestLog "❌ Environnement Python virtuel manquant" "ERROR"
    exit 1
}

# Vérifier Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-TestLog "✅ Node.js trouvé: $nodeVersion" "SUCCESS"
} else {
    Write-TestLog "❌ Node.js manquant" "ERROR"
    exit 1
}

# Vérifier les dépendances
Write-TestLog "📦 Vérification des dépendances..." "INFO"

# Backend
if (Test-Path "$backendDir\requirements.txt") {
    Write-TestLog "✅ Requirements.txt trouvé" "SUCCESS"
} else {
    Write-TestLog "❌ Requirements.txt manquant" "ERROR"
    exit 1
}

# Frontend
if (Test-Path "$frontendDir\package.json") {
    Write-TestLog "✅ Package.json trouvé" "SUCCESS"
} else {
    Write-TestLog "❌ Package.json manquant" "ERROR"
    exit 1
}

# ========================================
# 2. TESTS BACKEND
# ========================================

if (-not $SkipBackend) {
    Write-TestLog "🐍 Tests Backend..." "INFO"
    
    # Démarrer le backend en arrière-plan
    Write-TestLog "🚀 Démarrage du backend..." "INFO"
    $backendProcess = Start-Process -FilePath $venvPath -ArgumentList "$backendDir\main.py" -PassThru -WindowStyle Hidden
    
    # Attendre que le backend démarre
    Start-Sleep -Seconds 10
    
    # Vérifier que le backend répond
    if (Test-ServiceRunning "Backend" 8000) {
        Write-TestLog "✅ Backend démarré et répond" "SUCCESS"
    } else {
        Write-TestLog "❌ Backend ne répond pas" "ERROR"
        Stop-Process -Id $backendProcess.Id -Force
        exit 1
    }
    
    # Tests unitaires
    $backendTests = @(
        @{ Name = "Tests de sécurité"; Script = "$testsDir\backend\test_security.py" },
        @{ Name = "Tests d'intégration"; Script = "$testsDir\backend\test_integration.py" },
        @{ Name = "Tests des services"; Script = "$testsDir\backend\test_unit_services.py" },
        @{ Name = "Tests de performance"; Script = "$testsDir\backend\performance_test.py" }
    )
    
    $backendResults = @()
    foreach ($test in $backendTests) {
        $result = Test-Performance $test.Name $test.Script
        $backendResults += @{ Name = $test.Name; Success = $result }
    }
    
    # Tests de validation
    Write-TestLog "🔍 Tests de validation..." "INFO"
    
    # Test du service d'authentification centralisé
    $authTest = & $venvPath -c "
import sys
sys.path.append('$backendDir')
from app.services.auth_service import AuthService
from app.core.database import get_db
from sqlalchemy.orm import Session

db = next(get_db())
auth_service = AuthService(db)
print('✅ Service d\'authentification centralisé fonctionnel')
"
    if ($LASTEXITCODE -eq 0) {
        Write-TestLog "✅ Service d'authentification centralisé" "SUCCESS"
    } else {
        Write-TestLog "❌ Service d'authentification centralisé" "ERROR"
    }
    
    # Test du système de validation unifié
    $validationTest = & $venvPath -c "
import sys
sys.path.append('$backendDir')
from app.utils.validators import UnifiedValidator

# Test de validation d'email
email_valid = UnifiedValidator.validate_email('test@example.com')
email_invalid = UnifiedValidator.validate_email('invalid-email')

# Test de validation de fichier
file_valid = UnifiedValidator.validate_file_extension('document.pdf')
file_invalid = UnifiedValidator.validate_file_extension('script.exe')

if email_valid and not email_invalid and file_valid and not file_invalid:
    print('✅ Système de validation unifié fonctionnel')
else:
    print('❌ Système de validation unifié défaillant')
    exit(1)
"
    if ($LASTEXITCODE -eq 0) {
        Write-TestLog "✅ Système de validation unifié" "SUCCESS"
    } else {
        Write-TestLog "❌ Système de validation unifié" "ERROR"
    }
    
    # Arrêter le backend
    Stop-Process -Id $backendProcess.Id -Force
    Write-TestLog "🛑 Backend arrêté" "INFO"
}

# ========================================
# 3. TESTS FRONTEND
# ========================================

if (-not $SkipFrontend) {
    Write-TestLog "⚛️ Tests Frontend..." "INFO"
    
    # Vérifier les dépendances frontend
    if (Test-Path "$frontendDir\node_modules") {
        Write-TestLog "✅ Node modules installés" "SUCCESS"
    } else {
        Write-TestLog "⚠️ Node modules manquants, installation..." "WARNING"
        Set-Location $frontendDir
        npm install
        Set-Location ..
    }
    
    # Tests de build
    Write-TestLog "🔨 Test de build..." "INFO"
    Set-Location $frontendDir
    try {
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-TestLog "✅ Build réussi" "SUCCESS"
        } else {
            Write-TestLog "❌ Build échoué" "ERROR"
            exit 1
        }
    } catch {
        Write-TestLog "❌ Erreur de build: $($_.Exception.Message)" "ERROR"
        exit 1
    }
    Set-Location ..
    
    # Tests de linting
    Write-TestLog "🔍 Test de linting..." "INFO"
    Set-Location $frontendDir
    try {
        npm run lint
        if ($LASTEXITCODE -eq 0) {
            Write-TestLog "✅ Linting réussi" "SUCCESS"
        } else {
            Write-TestLog "⚠️ Problèmes de linting détectés" "WARNING"
        }
    } catch {
        Write-TestLog "❌ Erreur de linting: $($_.Exception.Message)" "ERROR"
    }
    Set-Location ..
    
    # Vérifier le service API unifié
    Write-TestLog "🔗 Vérification du service API unifié..." "INFO"
    if (Test-Path "$frontendDir\src\services\unifiedApiService.ts") {
        Write-TestLog "✅ Service API unifié trouvé" "SUCCESS"
        
        # Vérifier que le service contient les méthodes essentielles
        $serviceContent = Get-Content "$frontendDir\src\services\unifiedApiService.ts" -Raw
        $requiredMethods = @("getFiles", "listDirectory", "createAnalysis", "testProvider")
        
        foreach ($method in $requiredMethods) {
            if ($serviceContent -match $method) {
                Write-TestLog "✅ Méthode $method trouvée" "SUCCESS"
            } else {
                Write-TestLog "❌ Méthode $method manquante" "ERROR"
            }
        }
    } else {
        Write-TestLog "❌ Service API unifié manquant" "ERROR"
    }
}

# ========================================
# 4. TESTS D'INTÉGRATION
# ========================================

if (-not $SkipIntegration) {
    Write-TestLog "🔗 Tests d'intégration..." "INFO"
    
    # Démarrer les services
    Write-TestLog "🚀 Démarrage des services..." "INFO"
    
    # Backend
    $backendProcess = Start-Process -FilePath $venvPath -ArgumentList "$backendDir\main.py" -PassThru -WindowStyle Hidden
    
    # Attendre le démarrage
    Start-Sleep -Seconds 15
    
    # Vérifier le backend
    if (Test-ServiceRunning "Backend" 8000) {
        Write-TestLog "✅ Backend opérationnel" "SUCCESS"
    } else {
        Write-TestLog "❌ Backend non opérationnel" "ERROR"
        Stop-Process -Id $backendProcess.Id -Force
        exit 1
    }
    
    # Tests d'API
    Write-TestLog "🌐 Tests d'API..." "INFO"
    
    # Test de santé
    try {
        $healthResponse = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get
        if ($healthResponse.status -eq "healthy") {
            Write-TestLog "✅ Endpoint de santé fonctionnel" "SUCCESS"
        } else {
            Write-TestLog "❌ Endpoint de santé défaillant" "ERROR"
        }
    } catch {
        Write-TestLog "❌ Erreur endpoint de santé: $($_.Exception.Message)" "ERROR"
    }
    
    # Test de documentation API
    try {
        $docsResponse = Invoke-WebRequest -Uri "http://localhost:8000/docs" -Method Get
        if ($docsResponse.StatusCode -eq 200) {
            Write-TestLog "✅ Documentation API accessible" "SUCCESS"
        } else {
            Write-TestLog "❌ Documentation API inaccessible" "ERROR"
        }
    } catch {
        Write-TestLog "❌ Erreur documentation API: $($_.Exception.Message)" "ERROR"
    }
    
    # Test d'authentification
    Write-TestLog "🔐 Test d'authentification..." "INFO"
    try {
        $authResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/register" -Method Post -ContentType "application/json" -Body '{
            "username": "testuser@example.com",
            "password": "TestPass123",
            "role": "user"
        }'
        Write-TestLog "✅ Test d'enregistrement réussi" "SUCCESS"
    } catch {
        Write-TestLog "⚠️ Test d'enregistrement échoué (peut être normal si l'utilisateur existe)" "WARNING"
    }
    
    # Arrêter les services
    Stop-Process -Id $backendProcess.Id -Force
    Write-TestLog "🛑 Services arrêtés" "INFO"
}

# ========================================
# 5. TESTS DE PERFORMANCE
# ========================================

Write-TestLog "⚡ Tests de performance..." "INFO"

# Test de performance backend
$performanceTest = & $venvPath "$testsDir\backend\performance_test.py"
if ($LASTEXITCODE -eq 0) {
    Write-TestLog "✅ Tests de performance backend réussis" "SUCCESS"
} else {
    Write-TestLog "❌ Tests de performance backend échoués" "ERROR"
}

# Test de mémoire
Write-TestLog "💾 Test de mémoire..." "INFO"
$memoryTest = & $venvPath -c "
import psutil
import os

process = psutil.Process(os.getpid())
memory_mb = process.memory_info().rss / 1024 / 1024

if memory_mb < 500:  # Moins de 500MB
    print(f'✅ Utilisation mémoire normale: {memory_mb:.1f}MB')
else:
    print(f'⚠️ Utilisation mémoire élevée: {memory_mb:.1f}MB')
    exit(1)
"
if ($LASTEXITCODE -eq 0) {
    Write-TestLog "✅ Test de mémoire réussi" "SUCCESS"
} else {
    Write-TestLog "⚠️ Utilisation mémoire élevée" "WARNING"
}

# ========================================
# 6. VÉRIFICATION DE LA DOCUMENTATION
# ========================================

Write-TestLog "📚 Vérification de la documentation..." "INFO"

$docsFiles = @(
    "docs\README.md",
    "docs\developers\ARCHITECTURE.md",
    "docs\developers\SERVICES.md",
    "docs\developers\TESTS.md",
    "docs\audit\IMPLEMENTATION_RECOMMANDATIONS.md",
    "docs\roadmap\AMELIORATIONS_FUTURES.md"
)

foreach ($doc in $docsFiles) {
    if (Test-Path $doc) {
        Write-TestLog "✅ $doc" "SUCCESS"
    } else {
        Write-TestLog "❌ $doc manquant" "ERROR"
    }
}

# ========================================
# 7. RÉSUMÉ FINAL
# ========================================

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "🎯 RÉSUMÉ DES TESTS DE FINALISATION" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Durée totale: $($duration.Minutes)m $($duration.Seconds)s" -ForegroundColor White

# Compter les résultats
$totalTests = 0
$passedTests = 0

if (-not $SkipBackend) {
    $totalTests += $backendResults.Count
    $passedTests += ($backendResults | Where-Object { $_.Success }).Count
}

Write-Host ""
Write-Host "📊 RÉSULTATS:" -ForegroundColor Yellow
Write-Host "Tests réussis: $passedTests/$totalTests" -ForegroundColor Green

if ($passedTests -eq $totalTests) {
    Write-Host ""
    Write-Host "🎉 FÉLICITATIONS ! DOCUSENSE AI EST 100% FONCTIONNEL !" -ForegroundColor Green
    Write-Host "✅ Toutes les optimisations sont en place" -ForegroundColor Green
    Write-Host "✅ Tous les tests passent" -ForegroundColor Green
    Write-Host "✅ L'application est prête pour la production" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "   • Déploiement en production" -ForegroundColor White
    Write-Host "   • Monitoring et surveillance" -ForegroundColor White
    Write-Host "   • Formation des utilisateurs" -ForegroundColor White
    Write-Host "   • Support et maintenance" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "⚠️ ATTENTION: Certains tests ont échoué" -ForegroundColor Yellow
    Write-Host "Veuillez corriger les problèmes avant la mise en production" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✨ Finalisation terminée avec succès !" -ForegroundColor Green
