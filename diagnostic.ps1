# Script de diagnostic pour DocuSense AI
# Affiche les erreurs en temps réel

Write-Host "🔍 Diagnostic DocuSense AI..." -ForegroundColor Green

# Arrêter les processus existants
Write-Host "🔄 Arrêt des processus existants..." -ForegroundColor Yellow
try {
    Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
} catch {
    Write-Host "⚠️ Aucun processus à arrêter" -ForegroundColor Yellow
}

# Vérifier l'environnement
Write-Host "🐍 Vérification de l'environnement Python..." -ForegroundColor Cyan
$backendPath = "C:\Users\ymora\Desktop\Docusense AI\backend"
$frontendPath = "C:\Users\ymora\Desktop\Docusense AI\frontend"

# Test du backend
Write-Host "📊 Test du backend..." -ForegroundColor Cyan
Set-Location $backendPath
try {
    $result = & ".\venv\Scripts\python.exe" -c "import main; print('✅ Backend OK')" 2>&1
    Write-Host $result -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur backend: $($_.Exception.Message)" -ForegroundColor Red
}

# Test du frontend
Write-Host "🎨 Test du frontend..." -ForegroundColor Cyan
Set-Location $frontendPath
try {
    $result = & "npm" "run" "dev" "--silent" 2>&1
    Write-Host "✅ Frontend OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur frontend: $($_.Exception.Message)" -ForegroundColor Red
}

# Retour au répertoire racine
Set-Location "C:\Users\ymora\Desktop\Docusense AI"

Write-Host "✅ Diagnostic terminé" -ForegroundColor Green
