# DocuSense AI - Installation des Dépendances Multimédia
# Usage: .\scripts\install_multimedia_deps.ps1

Write-Host "🎬 DocuSense AI - Installation des Dépendances Multimédia" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# Fonction pour vérifier si FFmpeg est installé
function Test-FFmpeg {
    try {
        $ffmpegVersion = ffmpeg -version 2>&1
        if ($ffmpegVersion -match "ffmpeg version") {
            return $true
        }
        return $false
    }
    catch {
        return $false
    }
}

# Fonction pour installer FFmpeg via winget
function Install-FFmpeg {
    Write-Host "📦 Installation de FFmpeg via winget..." -ForegroundColor Yellow
    
    try {
        # Vérifier si winget est disponible
        if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
            Write-Host "❌ winget n'est pas disponible" -ForegroundColor Red
            Write-Host "💡 Installez winget ou téléchargez FFmpeg manuellement depuis https://ffmpeg.org" -ForegroundColor Yellow
            return $false
        }
        
        # Installation de FFmpeg
        Write-Host "🔄 Téléchargement et installation de FFmpeg..." -ForegroundColor Yellow
        winget install Gyan.FFmpeg --accept-source-agreements --accept-package-agreements
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ FFmpeg installé avec succès" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Échec de l'installation de FFmpeg" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Erreur lors de l'installation de FFmpeg: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Fonction pour installer les packages Python multimédia
function Install-PythonMultimedia {
    Write-Host "🐍 Installation des packages Python multimédia..." -ForegroundColor Yellow
    
    # Aller dans le dossier backend
    Set-Location backend
    
    # Vérifier si l'environnement virtuel existe
    if (-not (Test-Path "venv")) {
        Write-Host "❌ Environnement virtuel non trouvé" -ForegroundColor Red
        Write-Host "💡 Exécutez d'abord .\scripts\start_optimized.ps1" -ForegroundColor Yellow
        Set-Location ..
        return $false
    }
    
    # Activer l'environnement virtuel
    Write-Host "🔌 Activation de l'environnement virtuel..." -ForegroundColor Yellow
    & "venv\Scripts\Activate.ps1"
    
    # Liste des packages multimédia à installer
    $multimediaPackages = @(
        "ffmpeg-python",
        "av",
        "pytube",
        "yt-dlp",
        "webvtt-py",
        "pysrt",
        "soundfile",
        "audioread",
        "soxr"
    )
    
    # Installation des packages
    foreach ($package in $multimediaPackages) {
        Write-Host "📦 Installation de $package..." -ForegroundColor Yellow
        try {
            & "venv\Scripts\pip.exe" install $package
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ $package installé" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Échec de l'installation de $package" -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host "⚠️ Erreur lors de l'installation de $package: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
    # Retour au répertoire racine
    Set-Location ..
    return $true
}

# Fonction pour tester l'installation
function Test-MultimediaInstallation {
    Write-Host "🧪 Test de l'installation multimédia..." -ForegroundColor Yellow
    
    # Test FFmpeg
    if (Test-FFmpeg) {
        Write-Host "✅ FFmpeg fonctionne correctement" -ForegroundColor Green
        $ffmpegVersion = ffmpeg -version 2>&1 | Select-String "ffmpeg version" | Select-Object -First 1
        Write-Host "📋 Version: $ffmpegVersion" -ForegroundColor Cyan
    } else {
        Write-Host "❌ FFmpeg ne fonctionne pas" -ForegroundColor Red
    }
    
    # Test des packages Python
    Set-Location backend
    & "venv\Scripts\Activate.ps1"
    
    $pythonPackages = @("ffmpeg-python", "av", "pytube")
    foreach ($package in $pythonPackages) {
        try {
            & "venv\Scripts\python.exe" -c "import $package; print('✅ $package importé avec succès')"
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ $package fonctionne" -ForegroundColor Green
            } else {
                Write-Host "❌ $package ne fonctionne pas" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "❌ Erreur lors du test de $package" -ForegroundColor Red
        }
    }
    
    Set-Location ..
}

# Début de l'installation
Write-Host "🔍 Vérification de l'installation actuelle..." -ForegroundColor Yellow

# Vérifier FFmpeg
$ffmpegInstalled = Test-FFmpeg
if ($ffmpegInstalled) {
    Write-Host "✅ FFmpeg est déjà installé" -ForegroundColor Green
} else {
    Write-Host "❌ FFmpeg n'est pas installé" -ForegroundColor Red
    $installFFmpeg = Read-Host "Voulez-vous installer FFmpeg ? (O/N)"
    if ($installFFmpeg -eq "O" -or $installFFmpeg -eq "o") {
        Install-FFmpeg
    }
}

# Installer les packages Python
Write-Host "🐍 Installation des packages Python multimédia..." -ForegroundColor Yellow
Install-PythonMultimedia

# Test de l'installation
Write-Host ""
Write-Host "🧪 Test de l'installation..." -ForegroundColor Yellow
Test-MultimediaInstallation

Write-Host ""
Write-Host "🎉 Installation des dépendances multimédia terminée !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Fonctionnalités disponibles :" -ForegroundColor Cyan
Write-Host "   • Lecture de vidéos (MP4, AVI, MOV, etc.)" -ForegroundColor White
Write-Host "   • Lecture audio (MP3, WAV, FLAC, etc.)" -ForegroundColor White
Write-Host "   • Streaming multimédia" -ForegroundColor White
Write-Host "   • Extraction audio/vidéo" -ForegroundColor White
Write-Host ""
Write-Host "💡 Redémarrez DocuSense AI pour activer les nouvelles fonctionnalités" -ForegroundColor Yellow
Write-Host "   .\scripts\start_optimized.ps1 -Force" -ForegroundColor Cyan 