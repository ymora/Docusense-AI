# Script de gestion des ports pour DocuSense AI
# Usage: .\scripts\manage_ports.ps1 [check|clean|kill]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("check", "clean", "kill")]
    [string]$Action
)

# Configuration
$BackendPort = 8000
$FrontendPort = 3000

Write-Host "🔧 Gestion des ports DocuSense AI" -ForegroundColor Green

# Fonction pour vérifier si un port est utilisé
function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -WarningAction SilentlyContinue
        return $connection.TcpTestSucceeded
    }
    catch {
        return $false
    }
}

# Fonction pour obtenir les informations sur un processus
function Get-ProcessInfo {
    param([int]$Port)
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        $processes = @()
        
        foreach ($conn in $connections) {
            $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                $processes += [PSCustomObject]@{
                    PID = $process.Id
                    Name = $process.ProcessName
                    Path = $process.Path
                    StartTime = $process.StartTime
                }
            }
        }
        
        return $processes
    }
    catch {
        return @()
    }
}

# Fonction pour vérifier l'état des ports
function Check-Ports {
    Write-Host "🔍 Vérification de l'état des ports..." -ForegroundColor Blue
    
    # Vérifier le port backend
    if (Test-Port $BackendPort) {
        Write-Host "⚠️  Port $BackendPort (Backend) - OCCUPÉ" -ForegroundColor Yellow
        $processes = Get-ProcessInfo $BackendPort
        foreach ($proc in $processes) {
            Write-Host "   PID: $($proc.PID) | Process: $($proc.Name) | Démarrage: $($proc.StartTime)" -ForegroundColor Gray
        }
    } else {
        Write-Host "✅ Port $BackendPort (Backend) - LIBRE" -ForegroundColor Green
    }
    
    # Vérifier le port frontend
    if (Test-Port $FrontendPort) {
        Write-Host "⚠️  Port $FrontendPort (Frontend) - OCCUPÉ" -ForegroundColor Yellow
        $processes = Get-ProcessInfo $FrontendPort
        foreach ($proc in $processes) {
            Write-Host "   PID: $($proc.PID) | Process: $($proc.Name) | Démarrage: $($proc.StartTime)" -ForegroundColor Gray
        }
    } else {
        Write-Host "✅ Port $FrontendPort (Frontend) - LIBRE" -ForegroundColor Green
    }
    
    Write-Host ""
}

# Fonction pour nettoyer les ports
function Clean-Ports {
    Write-Host "🧹 Nettoyage des ports..." -ForegroundColor Blue
    
    $cleaned = $false
    
    # Nettoyer le port backend
    if (Test-Port $BackendPort) {
        Write-Host "Arrêt des processus sur le port $BackendPort..." -ForegroundColor Yellow
        $processes = Get-ProcessInfo $BackendPort
        foreach ($proc in $processes) {
            try {
                Stop-Process -Id $proc.PID -Force -ErrorAction SilentlyContinue
                Write-Host "   ✅ Processus $($proc.Name) (PID: $($proc.PID)) arrêté" -ForegroundColor Green
                $cleaned = $true
            }
            catch {
                Write-Host "   ❌ Impossible d'arrêter le processus $($proc.Name) (PID: $($proc.PID))" -ForegroundColor Red
            }
        }
    }
    
    # Nettoyer le port frontend
    if (Test-Port $FrontendPort) {
        Write-Host "Arrêt des processus sur le port $FrontendPort..." -ForegroundColor Yellow
        $processes = Get-ProcessInfo $FrontendPort
        foreach ($proc in $processes) {
            try {
                Stop-Process -Id $proc.PID -Force -ErrorAction SilentlyContinue
                Write-Host "   ✅ Processus $($proc.Name) (PID: $($proc.PID)) arrêté" -ForegroundColor Green
                $cleaned = $true
            }
            catch {
                Write-Host "   ❌ Impossible d'arrêter le processus $($proc.Name) (PID: $($proc.PID))" -ForegroundColor Red
            }
        }
    }
    
    if ($cleaned) {
        Write-Host "⏳ Attente de la libération des ports..." -ForegroundColor Blue
        Start-Sleep -Seconds 3
        
        # Vérifier que les ports sont libres
        if (-not (Test-Port $BackendPort) -and -not (Test-Port $FrontendPort)) {
            Write-Host "✅ Tous les ports sont maintenant libres" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Certains ports sont encore occupés" -ForegroundColor Yellow
            Check-Ports
        }
    } else {
        Write-Host "ℹ️  Aucun processus à arrêter" -ForegroundColor Gray
    }
    
    Write-Host ""
}

# Fonction pour forcer l'arrêt des processus
function Kill-Processes {
    Write-Host "💀 Arrêt forcé des processus..." -ForegroundColor Red
    
    # Arrêter tous les processus Python et Node.js liés à DocuSense
    $processes = Get-Process | Where-Object {
        $_.ProcessName -eq "python" -or 
        $_.ProcessName -eq "node" -or
        $_.ProcessName -eq "uvicorn"
    }
    
    if ($processes) {
        foreach ($proc in $processes) {
            try {
                # Vérifier si le processus est lié à nos ports
                $connections = Get-NetTCPConnection -OwningProcess $proc.Id -ErrorAction SilentlyContinue
                $isRelevant = $connections | Where-Object { $_.LocalPort -eq $BackendPort -or $_.LocalPort -eq $FrontendPort }
                
                if ($isRelevant) {
                    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                    Write-Host "   💀 Processus $($proc.ProcessName) (PID: $($proc.Id)) arrêté" -ForegroundColor Red
                }
            }
            catch {
                Write-Host "   ❌ Impossible d'arrêter le processus $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "ℹ️  Aucun processus DocuSense trouvé" -ForegroundColor Gray
    }
    
    Start-Sleep -Seconds 2
    Check-Ports
}

# Script principal
try {
    switch ($Action) {
        "check" {
            Check-Ports
        }
        "clean" {
            Clean-Ports
        }
        "kill" {
            Kill-Processes
        }
    }
}
catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} 