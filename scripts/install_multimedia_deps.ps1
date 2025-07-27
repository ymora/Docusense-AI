# Script d'installation des dépendances multimédia pour DocuSense AI
# Ce script installe toutes les dépendances nécessaires pour le support multimédia

param(
    [switch]$Force = $false,
    [switch]$SkipBackend = $false,
    [switch]$SkipFrontend = $false
)

Write-Host "🎬 Installation des dépendances multimédia pour DocuSense AI" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Fonction pour vérifier si une commande existe
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Vérifier Python
if (-not (Test-Command "python")) {
    Write-Host "❌ Python n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "Veuillez installer Python 3.8+ depuis https://python.org" -ForegroundColor Yellow
    exit 1
}

# Vérifier pip
if (-not (Test-Command "pip")) {
    Write-Host "❌ pip n'est pas installé" -ForegroundColor Red
    exit 1
}

# Vérifier Node.js
if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "Veuillez installer Node.js 16+ depuis https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Vérifier npm
if (-not (Test-Command "npm")) {
    Write-Host "❌ npm n'est pas installé" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prérequis vérifiés" -ForegroundColor Green

# Installation des dépendances backend
if (-not $SkipBackend) {
    Write-Host "`n🔧 Installation des dépendances backend..." -ForegroundColor Yellow
    
    # Aller dans le dossier backend
    Set-Location "backend"
    
    # Vérifier si l'environnement virtuel existe
    if (-not (Test-Path "venv")) {
        Write-Host "📦 Création de l'environnement virtuel..." -ForegroundColor Blue
        python -m venv venv
    }
    
    # Activer l'environnement virtuel
    Write-Host "🔌 Activation de l'environnement virtuel..." -ForegroundColor Blue
    & "venv\Scripts\Activate.ps1"
    
    # Mettre à jour pip
    Write-Host "📦 Mise à jour de pip..." -ForegroundColor Blue
    python -m pip install --upgrade pip
    
    # Installer les dépendances de base
    Write-Host "📦 Installation des dépendances de base..." -ForegroundColor Blue
    pip install -r requirements.txt
    
    # Installation spécifique pour les dépendances multimédia
    Write-Host "🎬 Installation des dépendances multimédia..." -ForegroundColor Blue
    
    # Dépendances pour le traitement d'images
    pip install Pillow>=10.0.0
    
    # Dépendances pour le traitement vidéo
    pip install opencv-python>=4.8.0
    pip install moviepy>=1.0.3
    pip install imageio>=2.31.0
    pip install imageio-ffmpeg>=0.4.8
    
    # Dépendances pour le traitement audio
    pip install pydub>=0.25.1
    pip install librosa>=0.10.0
    
    # Dépendances pour l'analyse
    pip install matplotlib>=3.7.0
    pip install scikit-learn>=1.3.0
    
    # Dépendances pour les archives
    pip install patool>=1.12.0
    pip install rarfile>=4.0
    pip install py7zr>=0.20.0
    
    # Dépendances pour le code
    pip install pygments>=2.15.0
    pip install markdown>=3.5.0
    
    # Dépendances pour les présentations
    pip install python-pptx>=0.6.21
    pip install openpyxl>=3.1.0
    pip install xlrd>=2.0.1
    
    Write-Host "✅ Dépendances backend installées" -ForegroundColor Green
    
    # Retourner au dossier racine
    Set-Location ".."
}

# Installation des dépendances frontend
if (-not $SkipFrontend) {
    Write-Host "`n🎨 Installation des dépendances frontend..." -ForegroundColor Yellow
    
    # Aller dans le dossier frontend
    Set-Location "frontend"
    
    # Vérifier si node_modules existe
    if (-not (Test-Path "node_modules") -or $Force) {
        Write-Host "📦 Installation des dépendances npm..." -ForegroundColor Blue
        npm install
    } else {
        Write-Host "📦 Mise à jour des dépendances npm..." -ForegroundColor Blue
        npm update
    }
    
    # Installation de dépendances spécifiques pour le multimédia
    Write-Host "🎬 Installation des dépendances multimédia frontend..." -ForegroundColor Blue
    
    # Pour la visualisation d'images
    npm install --save react-image-lightbox
    
    # Pour la lecture vidéo
    npm install --save react-player
    
    # Pour la lecture audio
    npm install --save react-audio-player
    
    # Pour les icônes de fichiers
    npm install --save @heroicons/react
    
    Write-Host "✅ Dépendances frontend installées" -ForegroundColor Green
    
    # Retourner au dossier racine
    Set-Location ".."
}

# Vérification finale
Write-Host "`n🔍 Vérification de l'installation..." -ForegroundColor Yellow

# Tester l'import des modules Python
Set-Location "backend"
& "venv\Scripts\Activate.ps1"

try {
    python -c "import PIL; print('✅ Pillow (PIL) installé')"
    python -c "import cv2; print('✅ OpenCV installé')"
    python -c "import moviepy; print('✅ MoviePy installé')"
    python -c "import librosa; print('✅ Librosa installé')"
    python -c "import matplotlib; print('✅ Matplotlib installé')"
    python -c "import sklearn; print('✅ Scikit-learn installé')"
    Write-Host "✅ Tous les modules Python sont installés correctement" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la vérification des modules Python: $_" -ForegroundColor Red
}

Set-Location ".."

Write-Host "`n🎉 Installation terminée avec succès !" -ForegroundColor Green
Write-Host "`n📋 Formats de fichiers maintenant supportés :" -ForegroundColor Cyan
Write-Host "   • Images: JPG, PNG, GIF, BMP, TIFF, WebP, ICO, RAW, HEIC" -ForegroundColor White
Write-Host "   • Vidéos: MP4, AVI, MOV, WMV, FLV, WebM, MKV, M4V, 3GP" -ForegroundColor White
Write-Host "   • Audio: MP3, WAV, FLAC, AAC, OGG, WMA, M4A, Opus" -ForegroundColor White
Write-Host "   • Archives: ZIP, RAR, 7Z, TAR, GZ, BZ2" -ForegroundColor White
Write-Host "   • Documents: PDF, DOCX, PPTX, XLSX, RTF, ODT" -ForegroundColor White
Write-Host "   • Code: Python, JavaScript, TypeScript, Java, C++, etc." -ForegroundColor White

Write-Host "`n🚀 Pour démarrer l'application :" -ForegroundColor Yellow
Write-Host "   .\scripts\dev_start.ps1" -ForegroundColor White

Write-Host "`n📚 Documentation :" -ForegroundColor Yellow
Write-Host "   • API Multimédia: http://localhost:8000/docs#multimedia" -ForegroundColor White
Write-Host "   • Formats supportés: http://localhost:8000/api/multimedia/supported-formats" -ForegroundColor White 