# Script corrigé pour démarrer DocuSense AI

Write-Host "🚀 Démarrage DocuSense AI..." -ForegroundColor Green

# Tuer les processus existants
taskkill /F /IM python.exe 2>$null
taskkill /F /IM node.exe 2>$null

# Démarrer le backend
Write-Host "📊 Démarrage du Backend..." -ForegroundColor Cyan
$backendCmd = "cd '$PWD\backend'; venv\Scripts\python.exe main.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

# Attendre un peu
Start-Sleep -Seconds 3

# Démarrer le frontend
Write-Host "📊 Démarrage du Frontend..." -ForegroundColor Cyan
$frontendCmd = "cd '$PWD\frontend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host "✅ DocuSense AI démarré!" -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
