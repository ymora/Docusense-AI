#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script de monitoring pour vérifier le statut de DocuSense AI

.DESCRIPTION
    Ce script vérifie le statut des services backend et frontend,
    ainsi que l'état des processus et des ports.
    Version optimisée et consolidée.

.EXAMPLE
    .\status.ps1
#>

# Fonction consolidée pour la vérification du statut
function Get-DocusenseStatus {
    Write-Host "📊 Statut de DocuSense AI" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Gray

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

    # Affichage des résultats
    Write-Host "Backend: $(if ($backendHealth) { '✅ Connecté' } else { '❌ Déconnecté' })" -ForegroundColor $(if ($backendHealth) { 'Green' } else { 'Red' })
    Write-Host "Frontend: $(if ($frontendHealth) { '✅ Connecté' } else { '❌ Déconnecté' })" -ForegroundColor $(if ($frontendHealth) { 'Green' } else { 'Red' })
    Write-Host "Processus Python: $($pythonProcesses.Count)" -ForegroundColor $(if ($pythonProcesses.Count -le 2) { 'Green' } else { 'Yellow' })
    Write-Host "Processus Node.js: $($nodeProcesses.Count)" -ForegroundColor $(if ($nodeProcesses.Count -le 2) { 'Green' } else { 'Yellow' })
    Write-Host "Port 8000: $(if ($port8000) { '✅ Actif' } else { '❌ Inactif' })" -ForegroundColor $(if ($port8000) { 'Green' } else { 'Red' })
    Write-Host "Port 3000: $(if ($port3000) { '✅ Actif' } else { '❌ Inactif' })" -ForegroundColor $(if ($port3000) { 'Green' } else { 'Red' })
}

# Exécution principale
Get-DocusenseStatus
