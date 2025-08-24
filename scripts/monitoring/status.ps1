#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script de monitoring pour verifier le statut de DocuSense AI

.DESCRIPTION
    Ce script verifie le statut des services backend et frontend,
    ainsi que l'etat des processus et des ports.
    Version optimisee et consolidee.

.EXAMPLE
    .\status.ps1
#>

# Fonction consolidee pour la verification du statut
function Get-DocusenseStatus {
    Write-Host "Statut de DocuSense AI" -ForegroundColor Green
    Write-Host "======================" -ForegroundColor Gray

    # Verifier les processus
    $pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

    # Verifier les ports
    try {
        $port8000 = netstat -an | findstr ":8000" | findstr "LISTENING"
        $port3000 = netstat -an | findstr ":3000" | findstr "LISTENING"
    } catch {
        $port8000 = $null
        $port3000 = $null
    }

    # Verifier la sante des services
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

    # Affichage des resultats
    if ($backendHealth) {
        Write-Host "Backend: Connecte" -ForegroundColor Green
    } else {
        Write-Host "Backend: Deconnecte" -ForegroundColor Red
    }
    
    if ($frontendHealth) {
        Write-Host "Frontend: Connecte" -ForegroundColor Green
    } else {
        Write-Host "Frontend: Deconnecte" -ForegroundColor Red
    }
    
    if ($pythonProcesses.Count -le 2) {
        Write-Host "Processus Python: $($pythonProcesses.Count)" -ForegroundColor Green
    } else {
        Write-Host "Processus Python: $($pythonProcesses.Count)" -ForegroundColor Yellow
    }
    
    if ($nodeProcesses.Count -le 2) {
        Write-Host "Processus Node.js: $($nodeProcesses.Count)" -ForegroundColor Green
    } else {
        Write-Host "Processus Node.js: $($nodeProcesses.Count)" -ForegroundColor Yellow
    }
    
    if ($port8000) {
        Write-Host "Port 8000: Actif" -ForegroundColor Green
    } else {
        Write-Host "Port 8000: Inactif" -ForegroundColor Red
    }
    
    if ($port3000) {
        Write-Host "Port 3000: Actif" -ForegroundColor Green
    } else {
        Write-Host "Port 3000: Inactif" -ForegroundColor Red
    }
}

# Execution principale
Get-DocusenseStatus
