# Script de test des endpoints pour DocuSense AI
# Teste tous les endpoints disponibles

Write-Host "🧪 Test des endpoints DocuSense AI..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:8000"

# Fonction pour tester un endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Name,
        [string]$Method = "GET"
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method $Method -TimeoutSec 15 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $Name - OK" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $Name - Status $($response.StatusCode)" -ForegroundColor Yellow
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) {
            Write-Host "❌ $Name - Not Found" -ForegroundColor Red
        } else {
            Write-Host "❌ $Name - Error $statusCode" -ForegroundColor Red
        }
    }
}

# Test des endpoints de base
Write-Host "📋 Test des endpoints de base..." -ForegroundColor Yellow
Test-Endpoint -Url "$baseUrl/" -Name "Root"
Test-Endpoint -Url "$baseUrl/api/health/" -Name "Health Check"

# Test des endpoints Files
Write-Host "📁 Test des endpoints Files..." -ForegroundColor Yellow
Test-Endpoint -Url "$baseUrl/api/files/drives" -Name "Files Drives"
Test-Endpoint -Url "$baseUrl/api/files/" -Name "Files List"
Test-Endpoint -Url "$baseUrl/api/files/selected" -Name "Files Selected"

# Test des endpoints Analysis
Write-Host "🔍 Test des endpoints Analysis..." -ForegroundColor Yellow
Test-Endpoint -Url "$baseUrl/api/analysis/list" -Name "Analysis List"
Test-Endpoint -Url "$baseUrl/api/analysis/stats" -Name "Analysis Stats"

# Test des endpoints Queue
Write-Host "📊 Test des endpoints Queue..." -ForegroundColor Yellow
Test-Endpoint -Url "$baseUrl/api/queue/" -Name "Queue List"
Test-Endpoint -Url "$baseUrl/api/queue/status" -Name "Queue Status"

# Test des endpoints Config
Write-Host "⚙️ Test des endpoints Config..." -ForegroundColor Yellow
Test-Endpoint -Url "$baseUrl/api/config/" -Name "Config List"
Test-Endpoint -Url "$baseUrl/api/config/ai/providers" -Name "AI Providers"

# Test des endpoints Prompts
Write-Host "💬 Test des endpoints Prompts..." -ForegroundColor Yellow
Test-Endpoint -Url "$baseUrl/api/prompts/" -Name "Prompts List"

# Test des endpoints Auth
Write-Host "🔐 Test des endpoints Auth..." -ForegroundColor Yellow
Test-Endpoint -Url "$baseUrl/api/auth/status" -Name "Auth Status"

Write-Host ""
Write-Host "🎯 Test terminé!" -ForegroundColor Green
Write-Host "💡 Les endpoints en rouge ne sont pas trouvés et doivent être corrigés." -ForegroundColor Yellow 