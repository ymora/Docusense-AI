# Script pour arrêter DocuSense AI
# Version 2.0 - Compatible avec les deux modes

Write-Host "🛑 Arrêt de DocuSense AI..." -ForegroundColor Red
Write-Host "================================================" -ForegroundColor Gray

# Fonction pour arrêter les services
function Stop-Services {
    Write-Host "🔄 Arrêt des services DocuSense..." -ForegroundColor Yellow
    
    # Arrêter les jobs PowerShell (mode intégré)
    $jobs = Get-Job -ErrorAction SilentlyContinue
    if ($jobs) {
        Write-Host "🛑 Arrêt de $($jobs.Count) jobs PowerShell..." -ForegroundColor Yellow
        $jobs | Stop-Job -PassThru | Remove-Job
    }
    
    # Arrêter les processus Python et Node spécifiques à DocuSense
    $pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*main.py*" -or $_.ProcessName -eq "python"
    }
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*npm*" -or $_.CommandLine -like "*vite*"
    }
    
    if ($pythonProcesses) {
        Write-Host "🛑 Arrêt de $($pythonProcesses.Count) processus Python..." -ForegroundColor Yellow
        $pythonProcesses | Stop-Process -Force
    }
    
    if ($nodeProcesses) {
        Write-Host "🛑 Arrêt de $($nodeProcesses.Count) processus Node..." -ForegroundColor Yellow
        $nodeProcesses | Stop-Process -Force
    }
    
    # Libérer les ports
    Write-Host "🔍 Libération des ports..." -ForegroundColor Cyan
    try {
        $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
        if ($port3000) {
            Stop-Process -Id $port3000.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Host "✅ Port 3000 libéré" -ForegroundColor Green
        }
    } catch {}
    
    try {
        $port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
        if ($port8000) {
            Stop-Process -Id $port8000.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Host "✅ Port 8000 libéré" -ForegroundColor Green
        }
    } catch {}
    
    Start-Sleep -Seconds 2
    Write-Host "✅ Services arrêtés" -ForegroundColor Green
}

# Arrêter les services
Stop-Services

Write-Host "🎉 DocuSense AI arrêté!" -ForegroundColor Green
