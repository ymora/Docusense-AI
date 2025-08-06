# 🎬 Streaming en Temps Réel avec FFmpeg

## 📋 Vue d'ensemble

Le système de streaming en temps réel permet de lire n'importe quel format audio/vidéo stocké sur votre PC en utilisant FFmpeg pour transcoder directement vers le navigateur, sans créer de fichiers temporaires.

## ✨ Fonctionnalités

### 🎯 Streaming Universel
- **Support de 40+ formats vidéo** : MP4, AVI, MOV, WMV, FLV, WebM, MKV, etc.
- **Support de 25+ formats audio** : MP3, WAV, FLAC, AAC, OGG, WMA, M4A, etc.
- **Transcodage en temps réel** : Conversion directe vers des formats compatibles navigateur
- **Aucun fichier temporaire** : Streaming direct sans stockage intermédiaire

### 🚀 Performance Optimisée
- **Streaming progressif** : Lecture pendant le téléchargement
- **Qualité configurable** : Low, Medium, High
- **Seeking supporté** : Navigation temporelle dans les fichiers
- **CORS configuré** : Compatible avec tous les navigateurs

## 🔧 Installation

### Prérequis
- **FFmpeg** installé sur le système
- **Python 3.8+** avec les dépendances installées

### Installation FFmpeg

#### Windows
```powershell
# Installation automatique via winget
winget install Gyan.FFmpeg --accept-source-agreements --accept-package-agreements

# Ou téléchargement manuel depuis https://ffmpeg.org/download.html
```

#### macOS
```bash
# Via Homebrew
brew install ffmpeg

# Ou via MacPorts
sudo port install ffmpeg
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# CentOS/RHEL
sudo yum install ffmpeg

# Arch Linux
sudo pacman -S ffmpeg
```

## 🎮 Utilisation

### Endpoints API

#### 1. Streaming en Temps Réel
```
GET /api/files/stream-realtime/{file_path}
```

**Paramètres :**
- `quality` : Qualité de transcodage (`low`, `medium`, `high`) - défaut: `medium`
- `start_time` : Temps de début en secondes (optionnel)
- `duration` : Durée en secondes (optionnel)
- `chunk_size` : Taille des chunks (défaut: 8192)

**Exemple :**
```bash
# Streamer un fichier vidéo en qualité moyenne
curl "http://localhost:8000/api/files/stream-realtime/C%3A%2FVideos%2Fmovie.avi?quality=medium"

# Streamer un fichier audio en qualité haute
curl "http://localhost:8000/api/files/stream-realtime/C%3A%2FMusic%2Fsong.flac?quality=high"

# Streamer à partir de 30 secondes
curl "http://localhost:8000/api/files/stream-realtime/C%3A%2FVideos%2Fmovie.avi?start_time=30"
```

#### 2. Informations de Streaming
```
GET /api/files/stream-info/{file_path}
```

**Retourne :**
```json
{
  "file_path": "C:\\Videos\\movie.avi",
  "file_name": "movie.avi",
  "file_size": 1048576000,
  "file_size_mb": 1000.0,
  "media_type": "video",
  "is_streamable": true,
  "ffmpeg_available": true,
  "can_stream_realtime": true,
  "output_format": "mp4",
  "content_type": "video/mp4",
  "quality_options": ["low", "medium", "high"],
  "supports_seeking": true,
  "supports_duration": true
}
```

### Frontend (React)

Le MediaPlayer utilise automatiquement le streaming en temps réel :

```typescript
// URL générée automatiquement par le MediaPlayer
const mediaUrl = `http://localhost:8000/api/files/stream-realtime/${encodeURIComponent(file.path)}?quality=medium`;

// Utilisation avec ReactPlayer
<ReactPlayer
  url={mediaUrl}
  controls={true}
  width="100%"
  height="100%"
  config={{
    file: {
      attributes: {
        crossOrigin: "anonymous"
      }
    }
  }}
/>
```

## 🛠️ Configuration

### Qualités de Transcodage

#### Vidéo
- **Low** : CRF 28, preset fast (rapide, qualité réduite)
- **Medium** : CRF 23, preset medium (équilibré)
- **High** : CRF 18, preset slow (lent, haute qualité)

#### Audio
- **Low** : 64 kbps
- **Medium** : 128 kbps
- **High** : 320 kbps

### Formats de Sortie

#### Vidéo
- **Format** : MP4
- **Codec vidéo** : H.264 (libx264)
- **Codec audio** : AAC
- **Optimisations** : Streaming progressif activé

#### Audio
- **Format** : MP3
- **Codec** : MP3 (libmp3lame)

## 🔍 Dépannage

### FFmpeg non trouvé
```
Erreur: FFmpeg non disponible pour le streaming en temps réel
```

**Solution :**
1. Vérifier l'installation de FFmpeg
2. Ajouter FFmpeg au PATH système
3. Redémarrer l'application

### Format non supporté
```
Erreur: Format non supporté pour le streaming
```

**Solution :**
1. Vérifier que le format est dans la liste des formats supportés
2. Utiliser l'endpoint de streaming classique si nécessaire

### Erreur de transcodage
```
Erreur: Erreur de transcodage
```

**Solution :**
1. Vérifier l'intégrité du fichier source
2. Réduire la qualité de transcodage
3. Vérifier les logs FFmpeg

## 📊 Monitoring

### Logs
Le système génère des logs détaillés :
```
🎬 STREAM-REALTIME - Demande: C:\Videos\movie.avi
🎬 STREAM-REALTIME - Paramètres: quality=medium, start_time=None, duration=None
🎬 STREAM-REALTIME - Démarrage streaming: video - C:\Videos\movie.avi
🎬 STREAM-REALTIME - Streaming démarré: video - mp4
```

### Métriques
- Temps de réponse du streaming
- Qualité de transcodage
- Utilisation CPU/GPU
- Bande passante utilisée

## 🔒 Sécurité

### Contrôles de Sécurité
- **Validation des chemins** : Empêche l'accès hors du dossier autorisé
- **Validation des formats** : Seuls les formats supportés sont acceptés
- **Limitation de taille** : Protection contre les fichiers trop volumineux
- **Timeout** : Arrêt automatique des processus FFmpeg

### Bonnes Pratiques
- Utiliser des chemins relatifs quand possible
- Valider les fichiers avant le streaming
- Surveiller l'utilisation des ressources
- Nettoyer les processus FFmpeg orphelins

## 🚀 Optimisations Futures

### Fonctionnalités Prévues
- **Cache intelligent** : Mise en cache des conversions fréquentes
- **Adaptive Bitrate** : Qualité adaptative selon la bande passante
- **Streaming HLS/DASH** : Support des protocoles de streaming avancés
- **GPU Acceleration** : Utilisation du GPU pour le transcodage
- **Multi-threading** : Parallélisation des conversions

### Améliorations Techniques
- **WebRTC** : Streaming peer-to-peer
- **WebAssembly** : FFmpeg compilé en WASM
- **Service Workers** : Cache côté client
- **Progressive Web App** : Support hors ligne

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs de l'application
2. Tester avec un fichier simple (MP4, MP3)
3. Vérifier l'installation de FFmpeg
4. Consulter la documentation FFmpeg

---

**🎯 Le streaming en temps réel transforme votre application en lecteur multimédia universel capable de lire n'importe quel format audio/vidéo !** 