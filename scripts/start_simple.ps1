# Script de démarrage simple pour DocuSense AI
# Démarre le backend avec l'environnement virtuel

Write-Host "🚀 Démarrage simple de DocuSense AI..." -ForegroundColor Green

# Arrêter les processus Python existants
Write-Host "🛑 Arrêt des processus Python existants..." -ForegroundColor Yellow
taskkill /F /IM python.exe 2>$null
Start-Sleep 2

# Aller dans le répertoire backend
cd backend

# Démarrer le serveur avec l'environnement virtuel
Write-Host "🔧 Démarrage du backend..." -ForegroundColor Green
Write-Host "💡 Le serveur va démarrer. Appuyez sur Ctrl+C pour l'arrêter." -ForegroundColor Yellow
Write-Host ""

# Démarrer le serveur en mode interactif
& "venv\Scripts\python.exe" "main.py" 