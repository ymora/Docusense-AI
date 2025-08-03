# Script de démarrage optimisé pour DocuSense AI
# Garantit que l'environnement virtuel est utilisé et surveille les erreurs

Write-Host "🚀 Démarrage optimisé de DocuSense AI..." -ForegroundColor Green

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "backend")) {
    Write-Host "❌ Erreur: Répertoire 'backend' non trouvé. Exécutez ce script depuis la racine du projet." -ForegroundColor Red
    exit 1
}

# Vérifier l'environnement virtuel
$venvPath = "backend\venv\Scripts\python.exe"
if (-not (Test-Path $venvPath)) {
    Write-Host "❌ Erreur: Environnement virtuel non trouvé. Exécutez d'abord: python -m venv backend\venv" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Environnement virtuel détecté: $venvPath" -ForegroundColor Green

# Arrêter les processus Python existants
Write-Host "🛑 Arrêt des processus Python existants..." -ForegroundColor Yellow
taskkill /F /IM python.exe 2>$null

# Attendre que les processus se terminent
Start-Sleep 2

# Vérifier que le port 8000 est libre
$portCheck = netstat -an | findstr ":8000"
if ($portCheck) {
    Write-Host "⚠️  Port 8000 encore occupé, attente..." -ForegroundColor Yellow
    Start-Sleep 3
}

# Démarrer le backend avec l'environnement virtuel
Write-Host "🔧 Démarrage du backend..." -ForegroundColor Green
cd backend

# Démarrer le serveur en arrière-plan avec redirection des logs
$logFile = "logs\startup_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

Write-Host "📝 Logs disponibles dans: $logFile" -ForegroundColor Cyan

# Démarrer le serveur
Start-Process -FilePath "venv\Scripts\python.exe" -ArgumentList "main.py" -RedirectStandardOutput $logFile -WindowStyle Hidden

# Attendre que le serveur démarre
Write-Host "⏳ Attente du démarrage du serveur..." -ForegroundColor Yellow
Start-Sleep 8

# Vérifier que le serveur répond
$maxAttempts = 10
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts -and -not $serverReady) {
    $attempt++
    Write-Host "🔍 Test de connexion (tentative $attempt/$maxAttempts)..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
            Write-Host "✅ Serveur démarré avec succès!" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "⏳ Serveur pas encore prêt, attente..." -ForegroundColor Yellow
        Start-Sleep 3
    }
}

if (-not $serverReady) {
    Write-Host "❌ Le serveur n'a pas démarré correctement" -ForegroundColor Red
    Write-Host "📋 Vérifiez les logs dans: $logFile" -ForegroundColor Yellow
    
    # Afficher les dernières lignes du log
    if (Test-Path $logFile) {
        Write-Host "📄 Dernières lignes du log:" -ForegroundColor Cyan
        Get-Content $logFile -Tail 10
    }
    
    exit 1
}

# Test des endpoints critiques
Write-Host "🧪 Test des endpoints critiques..." -ForegroundColor Green

$endpoints = @(
    @{url="/api/health/"; name="Health Check"},
    @{url="/api/files/drives"; name="Drives List"},
    @{url="/api/analysis/list"; name="Analysis List"},
    @{url="/api/queue/status"; name="Queue Status"}
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000$($endpoint.url)" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($endpoint.name): OK" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $($endpoint.name): Status $($response.StatusCode)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ $($endpoint.name): Erreur" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 DocuSense AI est prêt!" -ForegroundColor Green
Write-Host "📊 Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📚 Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "📋 Logs: $logFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Pour arrêter le serveur: Ctrl+C ou fermez cette fenêtre" -ForegroundColor Yellow

# Retourner au répertoire racine
cd ..

# Garder le script actif pour surveiller
while ($true) {
    Start-Sleep 10
    
    # Vérifier que le serveur est toujours en cours d'exécution
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/" -TimeoutSec 3 -UseBasicParsing
        if ($response.StatusCode -ne 200) {
            Write-Host "⚠️  Le serveur ne répond plus correctement" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ Le serveur s'est arrêté!" -ForegroundColor Red
        break
    }
} 