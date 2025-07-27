# Créer un fichier audio de test simple
$sampleRate = 44100
$duration = 3  # 3 secondes
$frequency = 440  # La note A4

# Générer des échantillons audio
$samples = @()
for ($i = 0; $i -lt ($sampleRate * $duration); $i++) {
    $sample = [Math]::Sin(2 * [Math]::PI * $frequency * $i / $sampleRate)
    $samples += [byte](($sample + 1) * 127)
}

# Écrire le fichier WAV
$wavHeader = @(
    0x52, 0x49, 0x46, 0x46,  # "RIFF"
    0x00, 0x00, 0x00, 0x00,  # Taille du fichier (à calculer)
    0x57, 0x41, 0x56, 0x45,  # "WAVE"
    0x66, 0x6D, 0x74, 0x20,  # "fmt "
    0x10, 0x00, 0x00, 0x00,  # Taille du format
    0x01, 0x00,              # Format PCM
    0x01, 0x00,              # Mono
    0x44, 0xAC, 0x00, 0x00,  # Sample rate (44100)
    0x88, 0x58, 0x01, 0x00,  # Byte rate
    0x01, 0x00,              # Block align
    0x08, 0x00,              # Bits per sample
    0x64, 0x61, 0x74, 0x61,  # "data"
    0x00, 0x00, 0x00, 0x00   # Taille des données (à calculer)
)

$dataSize = $samples.Count
$fileSize = 36 + $dataSize

# Mettre à jour les tailles dans l'en-tête
$wavHeader[4] = [byte]($fileSize -band 0xFF)
$wavHeader[5] = [byte](($fileSize -shr 8) -band 0xFF)
$wavHeader[6] = [byte](($fileSize -shr 16) -band 0xFF)
$wavHeader[7] = [byte](($fileSize -shr 24) -band 0xFF)

$wavHeader[40] = [byte]($dataSize -band 0xFF)
$wavHeader[41] = [byte](($dataSize -shr 8) -band 0xFF)
$wavHeader[42] = [byte](($dataSize -shr 16) -band 0xFF)
$wavHeader[43] = [byte](($dataSize -shr 24) -band 0xFF)

# Combiner l'en-tête et les données
$wavData = $wavHeader + $samples

# Écrire le fichier
[System.IO.File]::WriteAllBytes("test_audio.wav", $wavData)

Write-Host "Fichier audio de test créé: test_audio.wav" -ForegroundColor Green
Write-Host "Durée: $duration secondes" -ForegroundColor Green
Write-Host "Fréquence: $frequency Hz" -ForegroundColor Green 