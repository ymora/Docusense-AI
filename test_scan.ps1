$body = @{
    directory_path = "C:/Users/ymora/Desktop/Docusense AI"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/files/scan" -Method POST -ContentType "application/json" -Body $body
    Write-Host "Scan réussi:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Erreur lors du scan:" -ForegroundColor Red
    Write-Host $_.Exception.Message
} 