# ⚡ Démarrage Rapide - DocuSense AI

## 🚀 Installation Express (2 minutes)

### Prérequis
- **Python 3.8+** avec environnement virtuel
- **Node.js 16+** et npm
- **Git** pour le versioning
- **Espace disque** : Minimum 2GB libre

### Installation Automatique (Recommandée)

```bash
# 1. Cloner le projet
git clone <repository-url>
cd DocuSense-AI

# 2. Démarrage automatique complet
.\docusense.ps1 start

# 3. Accéder à l'application
# Frontend : http://localhost:3000
# Backend : http://localhost:8000
```

### 🎯 Premiers Pas

1. **Ouvrez votre navigateur** sur http://localhost:3000
2. **Sélectionnez un dossier** contenant vos documents
3. **Cliquez sur un fichier** → Affichage automatique selon le type
4. **Utilisez l'analyse IA** → Sélectionnez un prompt et lancez l'analyse

## 🛠️ Installation Manuelle

### Démarrage Manuel
```powershell
# Backend (Port 8000)
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py

# Frontend (Port 3000) - Dans un autre terminal
cd frontend
npm install
npm run dev
```

## 🎬 Support Multimédia (Optionnel)

```powershell
# Installation automatique FFmpeg + codecs
winget install Gyan.FFmpeg --accept-source-agreements --accept-package-agreements

# Ou installation manuelle
winget install Gyan.FFmpeg --accept-source-agreements --accept-package-agreements
cd backend
venv\Scripts\pip.exe install ffmpeg-python av pytube yt-dlp
```

> **✅ IMPLÉMENTÉ** - Support multimédia complet avec 39 formats vidéo et 37 formats audio

## 🔧 Configuration

### Variables d'Environnement Backend
```bash
# backend/.env
DATABASE_URL=sqlite:///./docusense.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
HOST=0.0.0.0
PORT=8000
DEBUG=False
LOG_LEVEL=INFO
LOG_FILE=logs/docusense.log
RATE_LIMIT_ENABLED=True
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60
```

### Variables d'Environnement Frontend
```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
VITE_APP_NAME=DocuSense AI
VITE_APP_VERSION=1.0.0
VITE_DEBUG=false
```

### Configuration des Providers IA
```json
{
  "providers": [
    {
      "name": "openai",
      "priority": 1,
      "api_key": "sk-...",
      "models": ["gpt-4", "gpt-3.5-turbo"],
      "is_active": true
    },
    {
      "name": "claude",
      "priority": 2,
      "api_key": "sk-ant-...",
      "models": ["claude-3-opus", "claude-3-sonnet"],
      "is_active": true
    }
  ]
}
```

## 🔐 Première Configuration

### 1. Créer un Compte Admin
```bash
# Créer un utilisateur admin
cd backend
python create_admin.py

# Ou utiliser l'interface web
# Allez sur http://localhost:3000
# Cliquez sur "Créer un compte"
# Remplissez les informations
```

### 2. Configurer les Providers IA
1. **Ouvrez l'application** sur http://localhost:3000
2. **Cliquez sur le bouton ⚙️** (configuration)
3. **Ajoutez vos clés API** :
   - **OpenAI** : https://platform.openai.com/api-keys
   - **Claude** : https://console.anthropic.com/
   - **Mistral** : https://console.mistral.ai/
   - **Gemini** : https://makersuite.google.com/app/apikey
4. **Testez chaque provider** avec le bouton "Tester"
5. **Sauvegardez la configuration**

### 3. Tester l'Installation
1. **Sélectionnez un dossier** avec des documents
2. **Cliquez sur un fichier** → Vérifiez l'affichage
3. **Lancez une analyse IA** → Vérifiez le traitement
4. **Consultez la queue** → Vérifiez les résultats

## 🐛 Dépannage Rapide

### Problèmes Courants

#### **Environnement Virtuel Manquant**
```powershell
# Solution automatique
.\docusense.ps1 cleanup

# Solution manuelle
cd backend
python -m venv venv
venv\Scripts\activate
venv\Scripts\pip.exe install -r requirements.txt
```

#### **Ports Déjà Utilisés**
```powershell
# Solution automatique
.\docusense.ps1 restart

# Solution manuelle
taskkill /F /IM python.exe /T
taskkill /F /IM node.exe /T
```

#### **Base de Données Corrompue**
```powershell
# Diagnostic
.\docusense.ps1 status

# Optimisation automatique
.\docusense.ps1 cleanup
```

### Vérification de l'Installation

#### **Test Backend**
```bash
# Vérifier que le backend répond
curl http://localhost:8000/health

# Vérifier la documentation API
# Ouvrez http://localhost:8000/docs
```

#### **Test Frontend**
```bash
# Vérifier que le frontend répond
curl http://localhost:3000

# Vérifier les logs
tail -f backend/logs/docusense.log
```

## 📊 Scripts Utiles

### Commandes de Gestion
```powershell
# Démarrer l'application
.\docusense.ps1 start

# Arrêter l'application
.\docusense.ps1 stop

# Redémarrer l'application
.\docusense.ps1 restart

# Vérifier le statut
.\docusense.ps1 status

# Nettoyer et optimiser
.\docusense.ps1 cleanup

# Surveillance continue
.\docusense.ps1 monitor
```

### Commandes de Développement
```powershell
# Installation des dépendances
.\docusense.ps1 install

# Mise à jour des dépendances
.\docusense.ps1 update

# Tests automatiques
.\docusense.ps1 test

# Build de production
.\docusense.ps1 build
```

## 🎯 Prochaines Étapes

1. **Consultez le [Guide Utilisateur](GUIDE_UTILISATEUR.md)** pour découvrir toutes les fonctionnalités
2. **Explorez l'[Architecture](developers/ARCHITECTURE.md)** pour comprendre le système
3. **Configurez la [Production](production/CHECKLIST.md)** pour un déploiement en ligne
4. **Consultez les [Améliorations Futures](roadmap/AMELIORATIONS_FUTURES.md)** pour la roadmap

## 📞 Support

- **Documentation API** : http://localhost:8000/docs
- **Logs d'erreur** : `backend/logs/docusense_error.log`
- **Diagnostic automatique** : `.\docusense.ps1 status`

---

*Dernière mise à jour : Août 2025 - Démarrage Rapide v2.0*
