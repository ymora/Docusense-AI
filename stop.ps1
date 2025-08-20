# Script pour arrêter DocuSense AI
Write-Host "🛑 Arrêt de DocuSense AI..." -ForegroundColor Red

# Fermer les terminaux DocuSense
$backendWindows = Get-Process | Where-Object { $_.MainWindowTitle -like "*DocuSense Backend*" }
$frontendWindows = Get-Process | Where-Object { $_.MainWindowTitle -like "*DocuSense Frontend*" }

$backendWindows | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
$frontendWindows | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }

# Arrêter les processus
Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "✅ DocuSense AI arrêté!" -ForegroundColor Green
