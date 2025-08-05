# Script de démarrage ultra-simplifié pour DocuSense AI
# Ferme tout et lance backend/frontend en parallèle

Write-Host "🚀 Démarrage DocuSense AI..." -ForegroundColor Green

# Fermer tous les terminaux PowerShell sauf celui-ci
$currentPID = $PID
Get-Process -Name "powershell*", "pwsh*" -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne $currentPID } | Stop-Process -Force -ErrorAction SilentlyContinue

# Fermer tous les processus Python et Node
taskkill /F /IM python.exe 2>$null
taskkill /F /IM node.exe 2>$null

# Libérer les ports
netstat -ano | findstr ":8000 " | ForEach-Object { ($_ -split '\s+')[4] } | Stop-Process -Force -ErrorAction SilentlyContinue
netstat -ano | findstr ":3000 " | ForEach-Object { ($_ -split '\s+')[4] } | Stop-Process -Force -ErrorAction SilentlyContinue

# Créer les logs
New-Item -ItemType Directory -Force -Path "backend\logs" | Out-Null

# Lancer backend et frontend en parallèle
Write-Host "🔄 Lancement des services..." -ForegroundColor Cyan

Start-Process -FilePath "backend\venv\Scripts\python.exe" -ArgumentList "main.py" -WorkingDirectory "backend" -WindowStyle Hidden
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "frontend" -WindowStyle Hidden

Write-Host "✅ Services lancés!" -ForegroundColor Green
Write-Host "📊 Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "🎨 Frontend: http://localhost:3000" -ForegroundColor Cyan 