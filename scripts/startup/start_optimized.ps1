# Script de démarrage optimisé pour DocuSense AI
# Utilise les optimisations de performance implémentées

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "status", "optimize", "help")]
    [string]$Action = "start"
)

function Show-OptimizedMenu {
    Clear-Host
    Write-Host "🚀 DOCUSENSE AI - DÉMARRAGE OPTIMISÉ" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🎯 Actions disponibles:" -ForegroundColor Yellow
    Write-Host "  1. 🚀 Démarrer (optimisé)" -ForegroundColor White
    Write-Host "  2. 🛑 Arrêter" -ForegroundColor White
    Write-Host "  3. 🔄 Redémarrer (optimisé)" -ForegroundColor White
    Write-Host "  4. 📊 Statut" -ForegroundColor White
    Write-Host "  5. ⚡ Optimiser" -ForegroundColor White
    Write-Host "  0. ❌ Quitter" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Choisissez une option (0-5)"
    
    switch ($choice) {
        "1" { Start-OptimizedDocusense }
        "2" { Stop-Docusense }
        "3" { Restart-OptimizedDocusense }
        "4" { Get-DocusenseStatus }
        "5" { Optimize-System }
        "0" { Write-Host "👋 Au revoir !" -ForegroundColor Green; return }
        default { Write-Host "❌ Option invalide" -ForegroundColor Red }
    }
}

function Start-OptimizedDocusense {
    Write-Host "🚀 Démarrage optimisé de DocuSense AI..." -ForegroundColor Green
    
    # Vérifier l'environnement
    if (-not (Test-Environment)) {
        return
    }
    
    # Nettoyer les processus existants
    Stop-Docusense -Silent
    
    # Attendre la libération des ressources
    Write-Host "⏳ Libération des ressources..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    # Vérifier les ports
    if (-not (Test-Ports)) {
        return
    }
    
    # Démarrer avec optimisations
    Write-Host "⚡ Application des optimisations..." -ForegroundColor Cyan
    
    # Démarrer le frontend optimisé
    Write-Host "🎨 Démarrage du frontend optimisé..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev" -WindowStyle Normal
    
    Start-Sleep -Seconds 3
    
    # Démarrer le backend optimisé
    Write-Host "🔧 Démarrage du backend optimisé..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; `$env:ENVIRONMENT='production'; venv\Scripts\python.exe main.py" -WindowStyle Normal
    
    Start-Sleep -Seconds 5
    
    # Vérification finale
    Write-Host "🔍 Vérification des services optimisés..." -ForegroundColor Cyan
    Start-Sleep -Seconds 2
    
    # Afficher les informations
    Write-Host "`n🎉 DocuSense AI démarré avec optimisations !" -ForegroundColor Green
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host "Optimisations: http://localhost:8000/api/optimization/health" -ForegroundColor Cyan
    
    # Ouvrir le navigateur
    Start-Process "http://localhost:3000"
    
    # Afficher les métriques d'optimisation
    Show-OptimizationMetrics
}

function Stop-Docusense {
    param([switch]$Silent)
    
    if (-not $Silent) {
        Write-Host "🛑 Arrêt de DocuSense AI..." -ForegroundColor Red
    }
    
    # Arrêter les processus Python
    try {
        Get-Process -Name "python" -ErrorAction SilentlyContinue | ForEach-Object {
            if (-not $Silent) {
                Write-Host "Arrêt du processus Python PID: $($_.Id)" -ForegroundColor Cyan
            }
            $_.Kill()
        }
    } catch {
        if (-not $Silent) {
            Write-Host "Erreur lors de l'arrêt des processus Python: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    # Arrêter les processus Node.js
    try {
        Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
            if (-not $Silent) {
                Write-Host "Arrêt du processus Node.js PID: $($_.Id)" -ForegroundColor Cyan
            }
            $_.Kill()
        }
    } catch {
        if (-not $Silent) {
            Write-Host "Erreur lors de l'arrêt des processus Node.js: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Start-Sleep -Seconds 2
    
    if (-not $Silent) {
        Write-Host "✅ DocuSense AI arrêté" -ForegroundColor Green
    }
}

function Restart-OptimizedDocusense {
    Write-Host "🔄 Redémarrage optimisé de DocuSense AI..." -ForegroundColor Yellow
    Stop-Docusense
    Start-Sleep -Seconds 3
    Start-OptimizedDocusense
}

function Test-Environment {
    # Vérifier Python
    try {
        $pythonVersion = & "backend\venv\Scripts\python.exe" --version 2>$null
        if ($pythonVersion) {
            Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
        } else {
            Write-Host "❌ Python non trouvé" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Erreur Python: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    
    # Vérifier Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
        } else {
            Write-Host "❌ Node.js non trouvé" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Erreur Node.js: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    
    return $true
}

function Test-Ports {
    # Vérifier le port 8000
    try {
        $port8000 = netstat -an | findstr ":8000" | findstr "LISTENING"
        if ($port8000) {
            Write-Host "❌ Port 8000 occupé" -ForegroundColor Red
            return $false
        }
    } catch {
        # Ignorer les erreurs
    }
    
    # Vérifier le port 3000
    try {
        $port3000 = netstat -an | findstr ":3000" | findstr "LISTENING"
        if ($port3000) {
            Write-Host "❌ Port 3000 occupé" -ForegroundColor Red
            return $false
        }
    } catch {
        # Ignorer les erreurs
    }
    
    Write-Host "✅ Ports libres" -ForegroundColor Green
    return $true
}

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
    
    Write-Host "Backend: $(if ($backendHealth) { '✅ Connecté' } else { '❌ Déconnecté' })" -ForegroundColor $(if ($backendHealth) { 'Green' } else { 'Red' })
    Write-Host "Frontend: $(if ($frontendHealth) { '✅ Connecté' } else { '❌ Déconnecté' })" -ForegroundColor $(if ($frontendHealth) { 'Green' } else { 'Red' })
    Write-Host "Processus Python: $($pythonProcesses.Count)" -ForegroundColor $(if ($pythonProcesses.Count -le 2) { 'Green' } else { 'Yellow' })
    Write-Host "Processus Node.js: $($nodeProcesses.Count)" -ForegroundColor $(if ($nodeProcesses.Count -le 2) { 'Green' } else { 'Yellow' })
    Write-Host "Port 8000: $(if ($port8000) { '✅ Actif' } else { '❌ Inactif' })" -ForegroundColor $(if ($port8000) { 'Green' } else { 'Red' })
    Write-Host "Port 3000: $(if ($port3000) { '✅ Actif' } else { '❌ Inactif' })" -ForegroundColor $(if ($port3000) { 'Green' } else { 'Red' })
    
    # Afficher les métriques d'optimisation si disponibles
    if ($backendHealth) {
        Show-OptimizationMetrics
    }
}

function Show-OptimizationMetrics {
    Write-Host "`n⚡ Métriques d'optimisation:" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/optimization/health" -TimeoutSec 2 -ErrorAction Stop
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.status -eq "success") {
            $health = $data.data
            Write-Host "État: $($health.health_status)" -ForegroundColor $(if ($health.health_status -eq "healthy") { 'Green' } else { 'Yellow' })
            
            if ($health.warnings.Count -gt 0) {
                Write-Host "⚠️ Avertissements:" -ForegroundColor Yellow
                foreach ($warning in $health.warnings) {
                    Write-Host "  • $warning" -ForegroundColor Yellow
                }
            }
            
            # Métriques de performance
            $perf = $health.performance
            Write-Host "Temps de réponse: $([math]::Round($perf.avg_response_time_ms, 2))ms" -ForegroundColor Cyan
            Write-Host "Requêtes/sec: $([math]::Round($perf.requests_per_second, 2))" -ForegroundColor Cyan
            
            # Métriques système
            $sys = $health.system
            Write-Host "CPU: $([math]::Round($sys.cpu_percent, 1))%" -ForegroundColor Cyan
            Write-Host "Mémoire: $([math]::Round($sys.memory_mb, 1))MB" -ForegroundColor Cyan
            
            # Cache
            $cache = $health.cache
            Write-Host "Cache: $($cache.size)/$($cache.max_size) éléments" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "❌ Impossible de récupérer les métriques d'optimisation" -ForegroundColor Red
    }
}

function Optimize-System {
    Write-Host "⚡ Optimisation du système..." -ForegroundColor Cyan
    
    # Nettoyer la mémoire
    Write-Host "🧹 Nettoyage de la mémoire..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/optimization/memory/cleanup" -Method POST -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ Nettoyage mémoire effectué" -ForegroundColor Green
    } catch {
        Write-Host "❌ Impossible de nettoyer la mémoire" -ForegroundColor Red
    }
    
    # Vider le cache
    Write-Host "🗑️ Vidage du cache..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/optimization/cache/clear" -Method POST -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ Cache vidé" -ForegroundColor Green
    } catch {
        Write-Host "❌ Impossible de vider le cache" -ForegroundColor Red
    }
    
    # Afficher les recommandations
    Write-Host "📋 Récupération des recommandations..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/optimization/recommendations" -TimeoutSec 5 -ErrorAction Stop
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.status -eq "success") {
            $recommendations = $data.data.recommendations
            if ($recommendations.Count -gt 0) {
                Write-Host "💡 Recommandations d'optimisation:" -ForegroundColor Cyan
                foreach ($rec in $recommendations) {
                    $color = if ($rec.priority -eq "high") { "Red" } else { "Yellow" }
                    Write-Host "  • [$($rec.priority.ToUpper())] $($rec.message)" -ForegroundColor $color
                    Write-Host "    Action: $($rec.action)" -ForegroundColor Gray
                }
            } else {
                Write-Host "✅ Aucune recommandation d'optimisation nécessaire" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "❌ Impossible de récupérer les recommandations" -ForegroundColor Red
    }
    
    Write-Host "`n✅ Optimisation terminée" -ForegroundColor Green
}

# Exécution principale
switch ($Action.ToLower()) {
    "start" { Start-OptimizedDocusense }
    "stop" { Stop-Docusense }
    "restart" { Restart-OptimizedDocusense }
    "status" { Get-DocusenseStatus }
    "optimize" { Optimize-System }
    "help" { 
        Write-Host "🚀 Script de démarrage optimisé DocuSense AI" -ForegroundColor Green
        Write-Host "Usage: .\start_optimized.ps1 [start|stop|restart|status|optimize|help]" -ForegroundColor Cyan
    }
    default { Show-OptimizedMenu }
}
