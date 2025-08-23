# Script principal unifié pour Docusense AI - Version Corrigée
param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "status", "help")]
    [string]$Action = "status"
)

function Get-DocusenseStatus {
    Write-Host "Statut de Docusense AI" -ForegroundColor Green
    Write-Host "======================" -ForegroundColor Gray

    # Vérifier les processus
    $pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

    # Vérifier les ports
    try {
        $port8000 = netstat -an | findstr ":8000" | findstr "LISTENING"
        $port3000 = netstat -an | findstr ":3000" | findstr "LISTENING"
    } catch {
        $port8000 = $null
        $port3000 = $null
    }

    # Vérifier la santé des services
    $backendHealth = $false
    $frontendHealth = $false

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health/" -TimeoutSec 1 -ErrorAction Stop
        $backendHealth = $response.StatusCode -eq 200
    } catch {
        $backendHealth = $false
    }

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 1 -ErrorAction Stop
        $frontendHealth = $response.StatusCode -eq 200
    } catch {
        $frontendHealth = $false
    }

    Write-Host "Backend: $(if ($backendHealth) { 'Connecte' } else { 'Deconnecte' })" -ForegroundColor $(if ($backendHealth) { 'Green' } else { 'Red' })
    Write-Host "Frontend: $(if ($frontendHealth) { 'Connecte' } else { 'Deconnecte' })" -ForegroundColor $(if ($frontendHealth) { 'Green' } else { 'Red' })
    Write-Host "Processus Python: $($pythonProcesses.Count)" -ForegroundColor $(if ($pythonProcesses.Count -le 2) { 'Green' } else { 'Yellow' })
    Write-Host "Processus Node.js: $($nodeProcesses.Count)" -ForegroundColor $(if ($nodeProcesses.Count -le 2) { 'Green' } else { 'Yellow' })
    Write-Host "Port 8000: $(if ($port8000) { 'Actif' } else { 'Inactif' })" -ForegroundColor $(if ($port8000) { 'Green' } else { 'Red' })
    Write-Host "Port 3000: $(if ($port3000) { 'Actif' } else { 'Inactif' })" -ForegroundColor $(if ($port3000) { 'Green' } else { 'Red' })
}

function Stop-Docusense {
    Write-Host "Arret de Docusense AI..." -ForegroundColor Red

    # Arrêter tous les processus Python
    Write-Host "Arret des processus Python..." -ForegroundColor Yellow
    try {
        Get-Process -Name "python" -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Host "Arret du processus Python PID: $($_.Id)" -ForegroundColor Cyan
            $_.Kill()
        }
    } catch {
        Write-Host "Erreur lors de l'arret des processus Python: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Arrêter tous les processus Node.js
    Write-Host "Arret des processus Node.js..." -ForegroundColor Yellow
    try {
        Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Host "Arret du processus Node.js PID: $($_.Id)" -ForegroundColor Cyan
            $_.Kill()
        }
    } catch {
        Write-Host "Erreur lors de l'arret des processus Node.js: $($_.Exception.Message)" -ForegroundColor Red
    }

    Start-Sleep -Seconds 2
    Write-Host "Docusense AI arrete" -ForegroundColor Green
}

function Start-Docusense {
    Write-Host "Demarrage de Docusense AI..." -ForegroundColor Green

    # Cleanup rapide avant démarrage
    Write-Host "Nettoyage rapide des processus..." -ForegroundColor Yellow
    Stop-Docusense

    # Attendre que les processus se terminent
    Write-Host "Attente de la liberation des ressources..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3

    # Vérification des ports
    Write-Host "Verification des ports..." -ForegroundColor Cyan
    try {
        $port8000 = netstat -an | findstr ":8000" | findstr "LISTENING"
        $port3000 = netstat -an | findstr ":3000" | findstr "LISTENING"
    } catch {
        $port8000 = $null
        $port3000 = $null
    }

    if ($port8000) {
        Write-Host "Port 8000 toujours occupe apres cleanup" -ForegroundColor Red
        return
    }

    if ($port3000) {
        Write-Host "Port 3000 toujours occupe apres cleanup" -ForegroundColor Red
        return
    }

    Write-Host "Ports libres" -ForegroundColor Green

    # Démarrer le frontend
    Write-Host "Demarrage du frontend..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev" -WindowStyle Normal

    Start-Sleep -Seconds 3
    Write-Host "Frontend en cours de demarrage" -ForegroundColor Green

    # Démarrer le backend
    Write-Host "Demarrage du backend..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; & '.\venv\Scripts\python.exe' main.py" -WindowStyle Normal

    Start-Sleep -Seconds 5
    Write-Host "Backend en cours de demarrage" -ForegroundColor Green

    Write-Host "Docusense AI en cours de demarrage!" -ForegroundColor Green
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan

    # Ouvrir le navigateur
    Start-Process "http://localhost:3000"
}

# Exécution principale
switch ($Action.ToLower()) {
    "start" { Start-Docusense }
    "stop" { Stop-Docusense }
    "restart" {
        Stop-Docusense
        Start-Sleep -Seconds 2
        Start-Docusense
    }
    "status" { Get-DocusenseStatus }
    default { Get-DocusenseStatus }
}
