# Script simple pour démarrer Docusense AI
Write-Host "🚀 Démarrage de Docusense AI..." -ForegroundColor Green

# Arrêter les processus existants
Write-Host "🧹 Nettoyage des processus existants..." -ForegroundColor Yellow
try {
    Get-Process -Name "python" -ErrorAction SilentlyContinue | ForEach-Object { $_.Kill() }
    Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object { $_.Kill() }
} catch {
    Write-Host "Aucun processus à arrêter" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

# Démarrer le frontend
Write-Host "🎨 Démarrage du frontend..." -ForegroundColor Yellow
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# Démarrer le backend
Write-Host "🔧 Démarrage du backend..." -ForegroundColor Yellow
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; .\venv\Scripts\python.exe main.py" -WindowStyle Normal

Write-Host "✅ Docusense AI en cours de démarrage!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan

# Ouvrir le navigateur
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"
