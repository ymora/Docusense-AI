# Configuration Centralisée des Formats Média

## 📋 Vue d'ensemble

Ce projet utilise maintenant une configuration centralisée pour tous les formats média supportés, organisée dans des fichiers dédiés pour éviter la duplication et assurer la cohérence entre le backend et le frontend.

## 🗂️ Structure des fichiers

### Backend
- **`backend/app/core/media_formats.py`** : Configuration centralisée des formats côté backend
- **`backend/app/core/file_validation.py`** : Utilise la configuration centralisée

### Frontend
- **`frontend/src/utils/mediaFormats.ts`** : Configuration centralisée des formats côté frontend
- **`frontend/src/utils/fileTypeUtils.ts`** : Utilise la configuration centralisée
- **`frontend/src/components/FileManager/MediaPlayer.tsx`** : Utilise les fonctions centralisées

## 📊 Formats supportés

### 🎵 Audio (37 formats)
**Formats courants :** MP3, WAV, FLAC, AAC, OGG, WMA, M4A, M4B, M4P, M4R

**Formats haute qualité :** OPUS, AIFF, ALAC, AMR, AWB

**Formats anciens/legacy :** AU, SND, RA, RAM, WV, APE, AC3, DTS

**Formats conteneurs :** MKA, TTA, MID, MIDI, CAF

**Formats mobiles :** 3GA, 3GP, 3GPP, 3G2

**Formats Windows :** WAX, WVX

**Formats playlist :** PLS, SD2

### 🎬 Vidéo (43 formats)
**Formats courants :** MP4, AVI, MOV, WMV, FLV, WEBM, MKV, M4V

**Formats mobiles :** 3GP, 3G2, OGV

**Formats transport stream :** TS, MTS, M2TS

**Formats conteneurs :** ASF, RM, RMVB, NUT, F4V, F4P, F4A, F4B

**Formats codec :** DIVX, XVID, H264, H265, VP8, VP9

**Formats MPEG :** MPEG, MPG, MPE, M1V, M2V, MPV, MP2, M2P, PS

**Formats autres :** EVO, OGM, OGX, MXF

**Formats streaming :** HLS, M3U8

### 🖼️ Images (43 formats)
**Formats courants :** JPG, JPEG, PNG, GIF, BMP, WEBP, SVG, TIFF, TIF, ICO

**Formats modernes :** HEIC, HEIF, AVIF, JXL

**Formats RAW (appareils photo) :** RAW, CR2, CR3, NEF, ARW, RAF, ORF, PEF, SRW, RW2, DCR, KDC, K25, MRW, X3F, 3FR, FFF, IIQ, MOS

**Formats professionnels :** PSD, DNG

**Formats bitmap :** PBM, PGM, PPM, PNM, XBM, XPM, RAS, RGB

## 🔧 Fonctions utilitaires

### Backend (Python)
```python
from app.core.media_formats import (
    initialize_mime_types,
    get_supported_formats,
    get_file_type_by_extension,
    get_mime_type_by_extension,
    is_supported_format,
    get_format_statistics
)

# Initialiser les types MIME
initialize_mime_types()

# Détecter le type de fichier
file_type = get_file_type_by_extension("video.mp4")  # "video"

# Obtenir le type MIME
mime_type = get_mime_type_by_extension("audio.mp3")  # "audio/mpeg"

# Vérifier si le format est supporté
is_supported = is_supported_format("image.jpg")  # True

# Obtenir les statistiques
stats = get_format_statistics()
```

### Frontend (TypeScript)
```typescript
import {
  getFileTypeByExtension,
  getMimeTypeByExtension,
  isSupportedFormat,
  getFormatStatistics,
  getAudioExtensionRegex,
  getVideoExtensionRegex,
  getImageExtensionRegex
} from './utils/mediaFormats';

// Détecter le type de fichier
const fileType = getFileTypeByExtension("video.mp4"); // "video"

// Obtenir le type MIME
const mimeType = getMimeTypeByExtension("audio.mp3"); // "audio/mpeg"

// Vérifier si le format est supporté
const isSupported = isSupportedFormat("image.jpg"); // true

// Obtenir les statistiques
const stats = getFormatStatistics();

// Générer des regex pour la détection
const audioRegex = getAudioExtensionRegex();
const videoRegex = getVideoExtensionRegex();
const imageRegex = getImageExtensionRegex();
```

## 📚 Bibliothèques utilisées

### Backend
- **Pillow** : Images (JPEG, PNG, GIF, WebP, TIFF, BMP, ICO, HEIC, etc.)
- **OpenCV** : Images et vidéos (AVI, MP4, MOV, etc.)
- **MoviePy** : Vidéos (MP4, AVI, MOV, MKV, etc.)
- **Pydub** : Audio (MP3, WAV, FLAC, AAC, OGG, etc.)
- **Librosa** : Audio (WAV, FLAC, MP3, OGG, etc.)
- **SoundFile** : Audio (WAV, FLAC, AIFF, etc.)
- **FFmpeg** : Conversion et streaming (tous formats)
- **AV** : Décodage vidéo/audio (tous formats)

### Frontend
- **HTML5 Native Players** : Lecture native des formats supportés
- **HLS.js** : Support du streaming HLS (si nécessaire)

## 🔄 Synchronisation

Les fichiers de configuration sont synchronisés entre le backend et le frontend pour assurer la cohérence :

1. **Extensions** : Mêmes extensions supportées des deux côtés
2. **Types MIME** : Mêmes types MIME reconnus
3. **Fonctions utilitaires** : API similaire pour la détection

## 🚀 Avantages

1. **Maintenance simplifiée** : Un seul endroit pour modifier les formats supportés
2. **Cohérence garantie** : Backend et frontend utilisent les mêmes définitions
3. **Extensibilité** : Facile d'ajouter de nouveaux formats
4. **Documentation centralisée** : Tous les formats sont documentés au même endroit
5. **Tests automatisés** : Possibilité de tester la détection des formats

## 📝 Ajout de nouveaux formats

Pour ajouter un nouveau format :

1. **Backend** : Modifier `backend/app/core/media_formats.py`
2. **Frontend** : Modifier `frontend/src/utils/mediaFormats.ts`
3. **Tester** : Vérifier que la détection fonctionne correctement
4. **Documenter** : Mettre à jour ce README si nécessaire

## 🧪 Tests

Un script de test est disponible pour vérifier la configuration :

```bash
cd backend
venv\Scripts\python.exe ..\test_media_formats.py
```

## 📈 Statistiques actuelles

- **Total formats supportés :** 123
- **Audio :** 37 formats
- **Vidéo :** 43 formats  
- **Image :** 43 formats
- **Types MIME :** 103 types différents

Cette configuration centralisée garantit une gestion cohérente et maintenable des formats média dans toute l'application. 