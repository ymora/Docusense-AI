# Script PowerShell pour démarrer le serveur backend
Write-Host "🚀 Démarrage du serveur backend..." -ForegroundColor Green

# Aller dans le répertoire backend
Set-Location "backend"

# Démarrer le serveur
Start-Process -FilePath "python" -ArgumentList "main.py" -WindowStyle Hidden

# Attendre que le serveur démarre
Write-Host "⏳ Attente du démarrage du serveur..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Tester la connexion
Write-Host "🔍 Test de la connexion..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/health" -Method Get -TimeoutSec 10
    Write-Host "✅ Serveur démarré avec succès !" -ForegroundColor Green
    Write-Host "📊 Réponse: $($response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur de connexion: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🌐 Serveur accessible sur: http://localhost:8000" -ForegroundColor Green
Write-Host "📚 Documentation: http://localhost:8000/docs" -ForegroundColor Green
