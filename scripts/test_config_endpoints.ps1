# Script de test pour les endpoints de configuration AI
Write-Host "🧪 Test des endpoints de configuration AI" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Test 1: Récupération des providers
Write-Host "`n1. Test récupération des providers..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/config/ai/providers" -Method GET
    Write-Host "✅ Providers récupérés avec succès" -ForegroundColor Green
    Write-Host "   Nombre de providers: $($response.providers.Count)" -ForegroundColor Gray
    foreach ($provider in $response.providers) {
        Write-Host "   - $($provider.name): Priorité $($provider.priority), Modèles: $($provider.models.Count)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Erreur lors de la récupération des providers: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Récupération de la stratégie
Write-Host "`n2. Test récupération de la stratégie..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/config/ai/strategy" -Method GET
    Write-Host "✅ Stratégie récupérée avec succès: $($response.strategy)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la récupération de la stratégie: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Récupération des priorités
Write-Host "`n3. Test récupération des priorités..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/config/ai/priority" -Method GET
    Write-Host "✅ Priorités récupérées avec succès" -ForegroundColor Green
    foreach ($provider in $response.priority.Keys) {
        Write-Host "   - $provider`: Priorité $($response.priority[$provider])" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Erreur lors de la récupération des priorités: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Récupération des métriques
Write-Host "`n4. Test récupération des métriques..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/config/ai/metrics" -Method GET
    Write-Host "✅ Métriques récupérées avec succès" -ForegroundColor Green
    Write-Host "   Nombre de providers avec métriques: $($response.metrics.Keys.Count)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur lors de la récupération des métriques: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Test de sauvegarde d'une clé API (simulation)
Write-Host "`n5. Test de sauvegarde d'une clé API (simulation)..." -ForegroundColor Yellow
try {
    $testKey = "test_key_123"
    $body = @{ api_key = $testKey } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/config/ai/key?provider=test" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Test de sauvegarde de clé API réussi" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors du test de sauvegarde de clé API: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Test de changement de stratégie
Write-Host "`n6. Test de changement de stratégie..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/config/ai/strategy?strategy=quality" -Method POST
    Write-Host "✅ Changement de stratégie réussi" -ForegroundColor Green
    
    # Remettre la stratégie originale
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/config/ai/strategy?strategy=cost" -Method POST
    Write-Host "✅ Retour à la stratégie originale" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors du changement de stratégie: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Tests terminés!" -ForegroundColor Cyan
Write-Host "Le panneau de configuration devrait maintenant fonctionner correctement." -ForegroundColor Green 