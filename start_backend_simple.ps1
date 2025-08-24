# Script PowerShell simple pour démarrer le serveur backend
Write-Host "Demarrage du serveur backend..." -ForegroundColor Green

# Aller dans le répertoire backend
Set-Location "backend"

# Démarrer le serveur
Start-Process -FilePath "python" -ArgumentList "main.py" -WindowStyle Hidden

# Attendre que le serveur démarre
Write-Host "Attente du demarrage du serveur..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Tester la connexion
Write-Host "Test de la connexion..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/health" -Method Get -TimeoutSec 10
    Write-Host "Serveur demarre avec succes !" -ForegroundColor Green
} catch {
    Write-Host "Erreur de connexion: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Serveur accessible sur: http://localhost:8000" -ForegroundColor Green
