# Script unique pour démarrer DocuSense AI
# Version simple et robuste

Write-Host "🚀 Démarrage DocuSense AI..." -ForegroundColor Green

# Obtenir le chemin absolu du projet
$projectPath = Get-Location
$backendPath = Join-Path $projectPath "backend"
$frontendPath = Join-Path $projectPath "frontend"

# Vérifier que les dossiers existent
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Erreur: Dossier backend introuvable" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendPath)) {
    Write-Host "❌ Erreur: Dossier frontend introuvable" -ForegroundColor Red
    exit 1
}

# Arrêter tous les processus existants
Write-Host "🔄 Arrêt des processus existants..." -ForegroundColor Yellow
try {
    Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
} catch {
    Write-Host "⚠️ Aucun processus à arrêter" -ForegroundColor Yellow
}

# Libérer les ports 3000 et 8000
Write-Host "🔍 Libération des ports..." -ForegroundColor Cyan
try {
    $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($port3000) {
        Stop-Process -Id $port3000.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Port 3000 libéré" -ForegroundColor Green
    }
} catch {}

try {
    $port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
    if ($port8000) {
        Stop-Process -Id $port8000.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Port 8000 libéré" -ForegroundColor Green
    }
} catch {}

# Vérifier l'environnement virtuel
Write-Host "🐍 Vérification de l'environnement virtuel..." -ForegroundColor Cyan
$venvPath = Join-Path $backendPath "venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "❌ Environnement virtuel manquant, création..." -ForegroundColor Red
    Set-Location $backendPath
    python -m venv venv
    Set-Location $projectPath
}

# Démarrer le backend avec l'environnement virtuel
Write-Host "📊 Démarrage du Backend..." -ForegroundColor Cyan
$backendCmd = "cd '$backendPath'; .\venv\Scripts\python.exe main.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

# Attendre que le backend démarre
Start-Sleep -Seconds 5

# Démarrer le frontend
Write-Host "🎨 Démarrage du Frontend..." -ForegroundColor Cyan
$frontendCmd = "cd '$frontendPath'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host "✅ DocuSense AI démarré avec succès!" -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "💡 Les services sont maintenant opérationnels" -ForegroundColor Green
