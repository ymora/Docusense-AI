#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script de nettoyage général pour DocuSense AI

.DESCRIPTION
    Ce script nettoie les processus, les logs et les fichiers temporaires
    de l'application DocuSense AI.

.EXAMPLE
    .\cleanup.ps1
#>

function Stop-DocusenseProcesses {
    Write-Host "🧹 Arrêt des processus DocuSense AI..." -ForegroundColor Yellow
    
    # Arrêter les processus Python (optimisé)
    try {
        $pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
        if ($pythonProcesses) {
            $pythonProcesses | ForEach-Object {
                Write-Host "Arrêt du processus Python PID: $($_.Id)" -ForegroundColor Cyan
                $_.Kill()
            }
        } else {
            Write-Host "Aucun processus Python à arrêter" -ForegroundColor Gray
        }
    } catch {
        Write-Host "Aucun processus Python à arrêter" -ForegroundColor Gray
    }

    # Arrêter les processus Node.js (optimisé)
    try {
        $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($nodeProcesses) {
            $nodeProcesses | ForEach-Object {
                Write-Host "Arrêt du processus Node.js PID: $($_.Id)" -ForegroundColor Cyan
                $_.Kill()
            }
        } else {
            Write-Host "Aucun processus Node.js à arrêter" -ForegroundColor Gray
        }
    } catch {
        Write-Host "Aucun processus Node.js à arrêter" -ForegroundColor Gray
    }

    Start-Sleep -Seconds 2
    Write-Host "✅ Processus arrêtés" -ForegroundColor Green
}

function Clean-Logs {
    Write-Host "📝 Nettoyage des logs..." -ForegroundColor Yellow
    
    $logFiles = @(
        "logs\*.log",
        "*.log",
        "backend\*.log",
        "frontend\*.log"
    )
    
    $totalDeleted = 0
    foreach ($pattern in $logFiles) {
        try {
            $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
            if ($files) {
                $files | ForEach-Object {
                    Remove-Item $_.FullName -Force
                    $totalDeleted++
                }
            }
        } catch {
            # Ignorer les erreurs si aucun fichier trouvé
        }
    }
    
    Write-Host "✅ Logs nettoyés ($totalDeleted fichiers supprimés)" -ForegroundColor Green
}

function Clean-TempFiles {
    Write-Host "🗑️ Nettoyage des fichiers temporaires..." -ForegroundColor Yellow
    
    $tempPatterns = @(
        "*.tmp",
        "*.temp",
        "__pycache__",
        "*.pyc",
        "node_modules\.cache"
    )
    
    $totalDeleted = 0
    foreach ($pattern in $tempPatterns) {
        try {
            $items = Get-ChildItem -Path $pattern -Recurse -ErrorAction SilentlyContinue
            if ($items) {
                $items | ForEach-Object {
                    if ($_.PSIsContainer) {
                        Remove-Item $_.FullName -Recurse -Force
                    } else {
                        Remove-Item $_.FullName -Force
                    }
                    $totalDeleted++
                }
            }
        } catch {
            # Ignorer les erreurs
        }
    }
    
    Write-Host "✅ Fichiers temporaires nettoyés ($totalDeleted éléments supprimés)" -ForegroundColor Green
}

# Exécution principale
Write-Host "🧹 NETTOYAGE DOCUSENSE AI" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

Stop-DocusenseProcesses
Clean-Logs
Clean-TempFiles

Write-Host "`n✅ Nettoyage terminé !" -ForegroundColor Green
