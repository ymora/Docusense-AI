Write-Host "Test basique PowerShell" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Gray

# Vérifier les processus
$pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

Write-Host "Processus Python: $($pythonProcesses.Count)" -ForegroundColor Green
Write-Host "Processus Node.js: $($nodeProcesses.Count)" -ForegroundColor Green

# Vérifier les ports
$port8000 = netstat -an | findstr ":8000" | findstr "LISTENING"
$port3000 = netstat -an | findstr ":3000" | findstr "LISTENING"

Write-Host "Port 8000: $(if ($port8000) { 'Actif' } else { 'Inactif' })" -ForegroundColor Green
Write-Host "Port 3000: $(if ($port3000) { 'Actif' } else { 'Inactif' })" -ForegroundColor Green
