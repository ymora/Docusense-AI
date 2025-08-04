# Script de démarrage optimisé pour DocuSense AI
# Garantit que l'environnement virtuel est utilisé et surveille les erreurs

Write-Host "🚀 Démarrage optimisé de DocuSense AI..." -ForegroundColor Green

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "backend")) {
    Write-Host "❌ Erreur: Répertoire 'backend' non trouvé. Exécutez ce script depuis la racine du projet." -ForegroundColor Red
    exit 1
}

# Vérifier que le frontend existe
if (-not (Test-Path "frontend")) {
    Write-Host "❌ Erreur: Répertoire 'frontend' non trouvé." -ForegroundColor Red
    exit 1
}

# Vérifier l'environnement virtuel
$venvPath = "backend\venv\Scripts\python.exe"
if (-not (Test-Path $venvPath)) {
    Write-Host "❌ Erreur: Environnement virtuel non trouvé. Exécutez d'abord: python -m venv backend\venv" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Environnement virtuel détecté: $venvPath" -ForegroundColor Green

# Vérifier Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: Node.js non trouvé. Installez Node.js pour le frontend." -ForegroundColor Red
    exit 1
}

# Fonction pour tuer les processus sur un port spécifique
function Kill-ProcessOnPort {
    param([int]$Port)
    
    Write-Host "🔍 Recherche de processus sur le port $Port..." -ForegroundColor Yellow
    
    try {
        # Trouver les processus qui utilisent le port
        $processes = netstat -ano | findstr ":$Port " | ForEach-Object {
            $parts = $_ -split '\s+'
            if ($parts.Length -ge 5) {
                $parts[4]  # PID
            }
        } | Where-Object { $_ -ne "" } | Sort-Object -Unique
        
        if ($processes) {
            Write-Host "🛑 Arrêt de $($processes.Count) processus sur le port $Port..." -ForegroundColor Yellow
            foreach ($pid in $processes) {
                try {
                    $processName = (Get-Process -Id $pid -ErrorAction SilentlyContinue).ProcessName
                    Write-Host "   - Arrêt du processus $pid ($processName)" -ForegroundColor Yellow
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                } catch {
                    Write-Host "   - Impossible d'arrêter le processus $pid" -ForegroundColor Red
                }
            }
            Start-Sleep 2
        } else {
            Write-Host "✅ Port $Port libre" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Erreur lors de la vérification du port $Port" -ForegroundColor Yellow
    }
}

# Arrêter les processus Python et Node existants
Write-Host "🛑 Arrêt des processus Python et Node existants..." -ForegroundColor Yellow
taskkill /F /IM python.exe 2>$null
taskkill /F /IM node.exe 2>$null

# Libérer les ports 8000 et 3000
Kill-ProcessOnPort 8000
Kill-ProcessOnPort 3000

# Attendre que les processus se terminent
Start-Sleep 3

# Vérifier que les ports sont libres
$port8000Check = netstat -an | findstr ":8000"
if ($port8000Check) {
    Write-Host "⚠️  Port 8000 encore occupé, nouvelle tentative..." -ForegroundColor Yellow
    Kill-ProcessOnPort 8000
    Start-Sleep 2
}

$port3000Check = netstat -an | findstr ":3000"
if ($port3000Check) {
    Write-Host "⚠️  Port 3000 encore occupé, nouvelle tentative..." -ForegroundColor Yellow
    Kill-ProcessOnPort 3000
    Start-Sleep 2
}

# Démarrer le backend avec l'environnement virtuel
Write-Host "🔧 Démarrage du backend..." -ForegroundColor Green
cd backend

# Démarrer le serveur en arrière-plan avec redirection des logs
$logFile = "logs\startup_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

Write-Host "📝 Logs backend disponibles dans: $logFile" -ForegroundColor Cyan

# Démarrer le serveur
Start-Process -FilePath "venv\Scripts\python.exe" -ArgumentList "main.py" -RedirectStandardOutput $logFile -WindowStyle Hidden

# Attendre que le serveur démarre
Write-Host "⏳ Attente du démarrage du serveur backend..." -ForegroundColor Yellow
Start-Sleep 8

# Vérifier que le serveur répond
$maxAttempts = 10
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts -and -not $serverReady) {
    $attempt++
    Write-Host "🔍 Test de connexion backend (tentative $attempt/$maxAttempts)..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
            Write-Host "✅ Backend démarré avec succès!" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "⏳ Backend pas encore prêt, attente..." -ForegroundColor Yellow
        Start-Sleep 3
    }
}

if (-not $serverReady) {
    Write-Host "❌ Le backend n'a pas démarré correctement" -ForegroundColor Red
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

# Retourner au répertoire racine
cd ..

# Démarrer le frontend
Write-Host "🎨 Démarrage du frontend..." -ForegroundColor Green
cd frontend

# Vérifier que package.json existe
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: package.json non trouvé dans le frontend" -ForegroundColor Red
    exit 1
}

# Vérifier que node_modules existe, sinon installer les dépendances
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances frontend..." -ForegroundColor Yellow
    npm install
}

# S'assurer que le port 3000 est libre avant de démarrer
Kill-ProcessOnPort 3000
Start-Sleep 2

# Démarrer le frontend en arrière-plan avec gestion d'erreur
Write-Host "🚀 Lancement du serveur de développement frontend sur le port 3000..." -ForegroundColor Green

# Créer un fichier de log pour le frontend
$frontendLogFile = "frontend_startup_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
Write-Host "📝 Logs frontend disponibles dans: $frontendLogFile" -ForegroundColor Cyan

# Démarrer le frontend avec redirection des logs
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -RedirectStandardOutput $frontendLogFile -WindowStyle Hidden

# Attendre que le frontend démarre
Write-Host "⏳ Attente du démarrage du frontend..." -ForegroundColor Yellow
Start-Sleep 12

# Vérifier que le frontend répond
$frontendReady = $false
$frontendAttempt = 0
$maxFrontendAttempts = 10

while ($frontendAttempt -lt $maxFrontendAttempts -and -not $frontendReady) {
    $frontendAttempt++
    Write-Host "🔍 Test de connexion frontend (tentative $frontendAttempt/$maxFrontendAttempts)..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $frontendReady = $true
            Write-Host "✅ Frontend démarré avec succès sur le port 3000!" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "⏳ Frontend pas encore prêt, attente..." -ForegroundColor Yellow
        Start-Sleep 3
    }
}

if (-not $frontendReady) {
    Write-Host "⚠️  Le frontend n'a pas démarré correctement" -ForegroundColor Yellow
    Write-Host "📋 Vérifiez les logs dans: $frontendLogFile" -ForegroundColor Cyan
    
    # Afficher les dernières lignes du log frontend
    if (Test-Path $frontendLogFile) {
        Write-Host "📄 Dernières lignes du log frontend:" -ForegroundColor Cyan
        Get-Content $frontendLogFile -Tail 10
    }
    
    Write-Host "💡 Vous pouvez accéder au backend directement via http://localhost:8000" -ForegroundColor Cyan
}

# Retourner au répertoire racine
cd ..

Write-Host ""
Write-Host "🎉 DocuSense AI est prêt!" -ForegroundColor Green
Write-Host "📊 Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "🎨 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📚 Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "📋 Logs backend: $logFile" -ForegroundColor Cyan
if (Test-Path "frontend\$frontendLogFile") {
    Write-Host "📋 Logs frontend: frontend\$frontendLogFile" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "💡 Pour arrêter les serveurs: Ctrl+C ou fermez cette fenêtre" -ForegroundColor Yellow

# Garder le script actif pour surveiller
while ($true) {
    Start-Sleep 10
    
    # Vérifier que le backend est toujours en cours d'exécution
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/" -TimeoutSec 3 -UseBasicParsing
        if ($response.StatusCode -ne 200) {
            Write-Host "⚠️  Le backend ne répond plus correctement" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ Le backend s'est arrêté!" -ForegroundColor Red
        break
    }
    
    # Vérifier que le frontend est toujours en cours d'exécution
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/" -TimeoutSec 3 -UseBasicParsing
        if ($response.StatusCode -ne 200) {
            Write-Host "⚠️  Le frontend ne répond plus correctement" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "⚠️  Le frontend ne répond plus" -ForegroundColor Yellow
    }
} 