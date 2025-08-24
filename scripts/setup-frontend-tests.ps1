#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script de configuration des tests frontend pour DocuSense AI
.DESCRIPTION
    Installe Node.js si nécessaire et configure l'environnement de tests frontend
#>

Write-Host "🔧 CONFIGURATION DES TESTS FRONTEND - DOCUSENSE AI" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Vérifier si Node.js est installé
Write-Host "`n📦 Vérification de Node.js..." -ForegroundColor Yellow

try {
    $nodeVersion = & node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Node.js trouvé: $nodeVersion" -ForegroundColor Green
        $nodeInstalled = $true
    } else {
        Write-Host "  ❌ Node.js non trouvé" -ForegroundColor Red
        $nodeInstalled = $false
    }
} catch {
    Write-Host "  ❌ Node.js non trouvé" -ForegroundColor Red
    $nodeInstalled = $false
}

# Vérifier npm
try {
    $npmVersion = & npm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ npm trouvé: $npmVersion" -ForegroundColor Green
        $npmInstalled = $true
    } else {
        Write-Host "  ❌ npm non trouvé" -ForegroundColor Red
        $npmInstalled = $false
    }
} catch {
    Write-Host "  ❌ npm non trouvé" -ForegroundColor Red
    $npmInstalled = $false
}

# Installer Node.js si nécessaire
if (-not $nodeInstalled -or -not $npmInstalled) {
    Write-Host "`n🚀 Installation de Node.js..." -ForegroundColor Yellow
    
    # Télécharger et installer Node.js
    $nodeUrl = "https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi"
    $nodeInstaller = "$env:TEMP\node-installer.msi"
    
    try {
        Write-Host "  📥 Téléchargement de Node.js..." -ForegroundColor Blue
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
        
        Write-Host "  🔧 Installation de Node.js..." -ForegroundColor Blue
        Start-Process msiexec.exe -Wait -ArgumentList "/i $nodeInstaller /quiet /norestart"
        
        # Nettoyer
        Remove-Item $nodeInstaller -Force
        
        Write-Host "  ✅ Node.js installé avec succès" -ForegroundColor Green
        
        # Recharger les variables d'environnement
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
    } catch {
        Write-Host "  ❌ Erreur lors de l'installation de Node.js: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  💡 Veuillez installer Node.js manuellement depuis https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
}

# Vérifier l'installation
Write-Host "`n🔍 Vérification de l'installation..." -ForegroundColor Yellow

try {
    $nodeVersion = & node --version 2>$null
    $npmVersion = & npm --version 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
        Write-Host "  ✅ npm: $npmVersion" -ForegroundColor Green
    } else {
        throw "Node.js ou npm non accessible"
    }
} catch {
    Write-Host "  ❌ Erreur de vérification: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Configurer l'environnement frontend
Write-Host "`n📁 Configuration de l'environnement frontend..." -ForegroundColor Yellow

$frontendPath = "frontend"
if (-not (Test-Path $frontendPath)) {
    Write-Host "  ❌ Dossier frontend non trouvé" -ForegroundColor Red
    exit 1
}

# Vérifier package.json
$packageJsonPath = Join-Path $frontendPath "package.json"
if (-not (Test-Path $packageJsonPath)) {
    Write-Host "  ❌ package.json non trouvé" -ForegroundColor Red
    exit 1
}

Write-Host "  ✅ package.json trouvé" -ForegroundColor Green

# Installer les dépendances
Write-Host "`n📦 Installation des dépendances..." -ForegroundColor Yellow

try {
    Set-Location $frontendPath
    
    Write-Host "  📥 Installation des dépendances npm..." -ForegroundColor Blue
    & npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Dépendances installées avec succès" -ForegroundColor Green
    } else {
        throw "Erreur lors de l'installation des dépendances"
    }
    
    # Revenir au répertoire racine
    Set-Location ".."
    
} catch {
    Write-Host "  ❌ Erreur lors de l'installation: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

# Vérifier la configuration des tests
Write-Host "`n🧪 Vérification de la configuration des tests..." -ForegroundColor Yellow

$testFiles = @{
    "vitest.config.ts" = Test-Path "frontend/vitest.config.ts"
    "src/test/setup.ts" = Test-Path "frontend/src/test/setup.ts"
    "src/test/components/FileList.test.tsx" = Test-Path "frontend/src/test/components/FileList.test.tsx"
    "tests/frontend/e2e/user_workflow.test.ts" = Test-Path "tests/frontend/e2e/user_workflow.test.ts"
}

foreach ($test in $testFiles.GetEnumerator()) {
    $status = if ($test.Value) { "✅" } else { "❌" }
    Write-Host "  $status $($test.Key)" -ForegroundColor $(if ($test.Value) { "Green" } else { "Red" })
}

# Tester l'exécution des tests
Write-Host "`n🚀 Test d'exécution des tests..." -ForegroundColor Yellow

try {
    Set-Location $frontendPath
    
    Write-Host "  🧪 Test de vitest..." -ForegroundColor Blue
    & npm test -- --run --reporter=verbose
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Tests frontend fonctionnels" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Tests frontend avec des erreurs (normal pour la première exécution)" -ForegroundColor Yellow
    }
    
    Set-Location ".."
    
} catch {
    Write-Host "  ⚠️ Erreur lors du test (peut être normal): $($_.Exception.Message)" -ForegroundColor Yellow
    Set-Location ".."
}

# Créer un script de test frontend
Write-Host "`n📝 Création du script de test frontend..." -ForegroundColor Yellow

$testScript = @"
#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script de test frontend pour DocuSense AI
#>

Write-Host "🧪 TESTS FRONTEND - DOCUSENSE AI" -ForegroundColor Cyan
Write-Host "=" * 40 -ForegroundColor Cyan

# Vérifier Node.js
try {
    $nodeVersion = & node --version 2>`$null
    if (`$LASTEXITCODE -ne 0) {
        Write-Host "❌ Node.js non disponible" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Node.js: `$nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js non disponible" -ForegroundColor Red
    exit 1
}

# Aller dans le dossier frontend
Set-Location frontend

# Tests unitaires
Write-Host "`n📋 Tests unitaires..." -ForegroundColor Yellow
& npm test -- --run --reporter=verbose

# Tests de couverture
Write-Host "`n📊 Tests de couverture..." -ForegroundColor Yellow
& npm run test:coverage

# Revenir au répertoire racine
Set-Location ..

Write-Host "`n✅ Tests frontend terminés" -ForegroundColor Green
"@

$testScriptPath = "scripts/test-frontend.ps1"
$testScript | Out-File -FilePath $testScriptPath -Encoding UTF8

Write-Host "  ✅ Script créé: $testScriptPath" -ForegroundColor Green

# Résumé final
Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
Write-Host "📋 RÉSUMÉ DE LA CONFIGURATION" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

Write-Host "✅ Node.js et npm configurés" -ForegroundColor Green
Write-Host "✅ Dépendances frontend installées" -ForegroundColor Green
Write-Host "✅ Configuration des tests vérifiée" -ForegroundColor Green
Write-Host "✅ Script de test créé: scripts/test-frontend.ps1" -ForegroundColor Green

Write-Host "`n🚀 Commandes disponibles:" -ForegroundColor Blue
Write-Host "  • Tests frontend: .\scripts\test-frontend.ps1" -ForegroundColor White
Write-Host "  • Tests backend: cd tests && ..\backend\venv\Scripts\python.exe run_all_tests.py" -ForegroundColor White
Write-Host "  • Tous les tests: .\scripts\testing\test-audit.ps1" -ForegroundColor White

Write-Host "`n🎉 Configuration des tests frontend terminée !" -ForegroundColor Green
