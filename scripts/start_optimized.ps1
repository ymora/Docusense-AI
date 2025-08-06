# Script de démarrage optimisé pour DocuSense AI
# Meilleure solution : 3 fenêtres + vraie surveillance HTTP

Write-Host "🚀 Démarrage DocuSense AI..." -ForegroundColor Green

# Fermer tous les terminaux PowerShell sauf celui-ci
$currentPID = $PID
Get-Process -Name "powershell*", "pwsh*" -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne $currentPID } | Stop-Process -Force -ErrorAction SilentlyContinue

# LIBÉRATION DES PORTS ET PROCESSUS
Write-Host "🔧 Libération des ports et processus..." -ForegroundColor Yellow

# Fermer tous les processus Python et Node
Write-Host "Arrêt des processus Python et Node..." -ForegroundColor Yellow
taskkill /F /IM python.exe 2>$null
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 2

# Libérer les ports 8000 et 3000
Write-Host "Libération des ports 8000 et 3000..." -ForegroundColor Cyan
netstat -ano | findstr ":8000 " | ForEach-Object { 
    $processId = ($_ -split '\s+')[4]
    if ($processId -match '^\d+$') {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}
netstat -ano | findstr ":3000 " | ForEach-Object { 
    $processId = ($_ -split '\s+')[4]
    if ($processId -match '^\d+$') {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Seconds 2
Write-Host "✅ Ports libérés avec succès" -ForegroundColor Green

# Créer les logs
New-Item -ItemType Directory -Force -Path "backend\logs" | Out-Null

Write-Host "📊 Ouverture des 4 fenêtres optimisées..." -ForegroundColor Cyan

# Terminal 1: Backend
Write-Host "=== TERMINAL BACKEND ===" -ForegroundColor Yellow
$backendScript = "Write-Host '=== BACKEND DOCUSENSE AI ===' -ForegroundColor Green; Write-Host 'Port: http://localhost:8000' -ForegroundColor Cyan; Write-Host 'Logs en temps réel ci-dessous:' -ForegroundColor Yellow; Write-Host ''; cd '$PWD\backend'; .\venv\Scripts\python.exe main.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

# Attendre que le backend démarre
Write-Host "⏳ Attente du démarrage du backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Terminal 2: Frontend
Write-Host "=== TERMINAL FRONTEND ===" -ForegroundColor Yellow
$frontendScript = "Write-Host '=== FRONTEND DOCUSENSE AI ===' -ForegroundColor Green; Write-Host 'Port: http://localhost:3000' -ForegroundColor Cyan; Write-Host 'Logs en temps réel ci-dessous:' -ForegroundColor Yellow; Write-Host ''; cd '$PWD\frontend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript

# Attendre que le frontend démarre
Start-Sleep -Seconds 5

# Terminal 3: Vraie surveillance HTTP (comme DevTools)
Write-Host "=== TERMINAL HTTP SURVEILLANCE ===" -ForegroundColor Yellow
$httpScript = "Write-Host '=== VRAIE SURVEILLANCE HTTP (DEVTOOLS) ===' -ForegroundColor Magenta; Write-Host 'Capture des requêtes HTTP comme F12' -ForegroundColor Cyan; Write-Host 'Appuyez sur Ctrl+C pour arrêter' -ForegroundColor Red; Write-Host ''; cd '$PWD'; Write-Host '🔍 Démarrage de la capture HTTP...' -ForegroundColor Green; Write-Host '📡 Surveillance des ports 8000 et 3000' -ForegroundColor Cyan; Write-Host '🌐 Utilisez F12 dans votre navigateur pour voir les détails' -ForegroundColor Yellow; Write-Host ''; `$lastLogLine = 0; `$requestCount = 0; while (`$true) { `$timestamp = Get-Date -Format 'HH:mm:ss'; Write-Host `"[`$timestamp] === REQUÊTES HTTP ACTIVES ===`" -ForegroundColor Green; `$connections = netstat -ano | findstr ':8000\|:3000' | findstr 'ESTABLISHED\|TIME_WAIT\|CLOSE_WAIT'; if (`$connections) { `$connections | ForEach-Object { `$parts = `$_ -split '\s+'; if (`$parts.Count -ge 5) { `$local = `$parts[1]; `$remote = `$parts[2]; `$state = `$parts[3]; `$pid = `$parts[4]; `$process = Get-Process -Id `$pid -ErrorAction SilentlyContinue; `$processName = if (`$process) { `$process.ProcessName } else { 'Unknown' }; if (`$local -match ':8000') { Write-Host `"🌐 API: `$local -> `$remote (`$state) - `$processName`" -ForegroundColor Blue } elseif (`$local -match ':3000') { Write-Host `"⚡ Frontend: `$local -> `$remote (`$state) - `$processName`" -ForegroundColor Green } else { Write-Host `"🔗 Other: `$local -> `$remote (`$state) - `$processName`" -ForegroundColor Yellow } } } } else { Write-Host '⏸️ Aucune requête HTTP active' -ForegroundColor Gray }; Write-Host `"[`$timestamp] === LOGS BACKEND ===`" -ForegroundColor Green; if (Test-Path 'backend\logs\docusense.log') { `$currentLogLines = Get-Content 'backend\logs\docusense.log'; if (`$currentLogLines.Count -gt `$lastLogLine) { `$newLines = `$currentLogLines | Select-Object -Skip `$lastLogLine; `$newLines | ForEach-Object { if (`$_ -match 'ERROR\|Exception\|Traceback\|Failed') { Write-Host `"❌ ERROR: `$_`" -ForegroundColor Red } elseif (`$_ -match 'WARNING\|Warning') { Write-Host `"⚠️ WARN: `$_`" -ForegroundColor Yellow } elseif (`$_ -match 'GET\|POST\|PUT\|DELETE') { Write-Host `"📡 REQUEST: `$_`" -ForegroundColor Green; `$requestCount++ } elseif (`$_ -match 'INFO\|Info') { Write-Host `"ℹ️ INFO: `$_`" -ForegroundColor Cyan } else { Write-Host `"📝 LOG: `$_`" -ForegroundColor White } }; `$lastLogLine = `$currentLogLines.Count } } else { Write-Host '📭 Aucun nouveau log backend' -ForegroundColor Gray }; Write-Host `"[`$timestamp] === STATS ===`" -ForegroundColor Green; Write-Host `"📊 Requêtes totales: `$requestCount`" -ForegroundColor White; `$activeConnections = (netstat -ano | findstr ':8000\|:3000' | findstr 'ESTABLISHED' | Measure-Object).Count; Write-Host `"🔗 Connexions actives: `$activeConnections`" -ForegroundColor White; Write-Host `"💡 Conseil: Ouvrez F12 dans votre navigateur pour voir les détails HTTP`" -ForegroundColor Yellow; Write-Host `"[`$timestamp] ---`" -ForegroundColor Gray; Start-Sleep -Seconds 1 }"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $httpScript

# Terminal 4: Logs détaillés en temps réel
Write-Host "=== TERMINAL LOGS DÉTAILLÉS ===" -ForegroundColor Yellow
$logsScript = "Write-Host '=== LOGS DÉTAILLÉS EN TEMPS RÉEL ===' -ForegroundColor Magenta; Write-Host 'Surveillance des fichiers de logs' -ForegroundColor Cyan; Write-Host 'Appuyez sur Ctrl+C pour arrêter' -ForegroundColor Red; Write-Host ''; cd '$PWD'; if (Test-Path 'backend\logs\docusense.log') { Write-Host '📝 Surveillance du log backend en temps réel' -ForegroundColor Green; Get-Content 'backend\logs\docusense.log' -Wait -Tail 0 | ForEach-Object { `$timestamp = Get-Date -Format 'HH:mm:ss'; Write-Host `"[`$timestamp] 📝 `$_`" -ForegroundColor Cyan } } else { Write-Host '❌ Fichier de log backend non trouvé' -ForegroundColor Red; Write-Host 'Création du fichier de log...' -ForegroundColor Yellow; New-Item -ItemType File -Force -Path 'backend\logs\docusense.log' | Out-Null; Get-Content 'backend\logs\docusense.log' -Wait -Tail 0 | ForEach-Object { `$timestamp = Get-Date -Format 'HH:mm:ss'; Write-Host `"[`$timestamp] 📝 `$_`" -ForegroundColor Cyan } }"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $logsScript

Write-Host "`n🎉 Solution optimisée avec vraie surveillance HTTP!" -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Documentation API: http://localhost:8000/docs" -ForegroundColor Cyan

Write-Host "`n📊 4 fenêtres optimisées:" -ForegroundColor Yellow
Write-Host "- Terminal 1: Backend (Python)" -ForegroundColor White
Write-Host "- Terminal 2: Frontend (Node.js)" -ForegroundColor White
Write-Host "- Terminal 3: HTTP Surveillance (comme DevTools)" -ForegroundColor White
Write-Host "- Terminal 4: Logs détaillés en temps réel" -ForegroundColor White

Write-Host "`n💡 POUR VOIR LES VRAIES REQUÊTES HTTP:" -ForegroundColor Yellow
Write-Host "1. Ouvrez votre navigateur sur http://localhost:3000" -ForegroundColor White
Write-Host "2. Appuyez sur F12 pour ouvrir les DevTools" -ForegroundColor White
Write-Host "3. Allez dans l'onglet 'Network'" -ForegroundColor White
Write-Host "4. Cliquez sur votre vidéo et regardez les requêtes apparaître!" -ForegroundColor White

Write-Host "`n🛑 Pour arrêter les services:" -ForegroundColor Yellow
Write-Host "- Fermez les terminaux ou appuyez sur Ctrl+C" -ForegroundColor White
Write-Host "- Ou utilisez: taskkill /F /IM python.exe && taskkill /F /IM node.exe" -ForegroundColor White 