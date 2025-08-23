# 🚀 Déploiement - DocuSense AI

## 📋 Prérequis

### Système
- **OS** : Windows 10/11, Linux, macOS
- **Python** : 3.8+
- **Node.js** : 16+
- **RAM** : 4GB minimum (8GB recommandé)
- **Espace disque** : 2GB minimum

### Dépendances Système
```bash
# Windows
# Aucune installation supplémentaire requise

# Linux (Ubuntu/Debian)
sudo apt update
sudo apt install python3-pip python3-venv nodejs npm ffmpeg

# macOS
brew install python3 node ffmpeg
```

## 🚀 Installation Express

### Démarrage Automatique (Recommandé)
```powershell
# 1. Cloner le projet
git clone https://github.com/your-repo/docusense-ai.git
cd docusense-ai

# 2. Démarrage automatique complet
.\docusense.ps1 start

# 3. Accéder à l'application
# Frontend : http://localhost:3000
# Backend : http://localhost:8000
```

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
    },
    {
      "name": "ollama",
      "priority": 3,
      "api_key": "",
      "models": ["llama2", "mistral"],
      "is_active": true
    }
  ]
}
```

## 📁 Scripts d'Automatisation

### Script Principal PowerShell
**Fichier :** `docusense.ps1`

#### Utilisation
```powershell
# Afficher l'aide
.\docusense.ps1 help

# Démarrer DocuSense AI
.\docusense.ps1 start

# Arrêter DocuSense AI
.\docusense.ps1 stop

# Redémarrer DocuSense AI
.\docusense.ps1 restart

# Nettoyer les processus
.\docusense.ps1 cleanup

# Surveiller le système
.\docusense.ps1 monitor

# Afficher le statut
.\docusense.ps1 status
```

#### Fonctionnalités
- **start** : Démarrage complet avec vérification des ports
- **stop** : Arrêt forcé des processus Python et Node.js
- **restart** : Redémarrage automatique complet
- **cleanup** : Nettoyage forcé de tous les processus
- **monitor** : Surveillance en temps réel (60 secondes)
- **status** : État des processus et ports en temps réel

### Scripts Backend

#### Scripts de Gestion
| Script | Fonction | Utilisation |
|--------|----------|-------------|
| `create_admin.py` | Créer un utilisateur administrateur | `cd backend && python create_admin.py` |
| `cleanup_database.py` | Nettoyer et optimiser la base de données | `cd backend && python cleanup_database.py` |
| `update_permissions.py` | Mettre à jour les permissions utilisateurs | `cd backend && python update_permissions.py` |
| `init_database.py` | Initialiser la base de données | `cd backend && python init_database.py` |
| `create_master_user.py` | Créer un utilisateur maître | `cd backend && python create_master_user.py` |
| `remove_user.py` | Supprimer un utilisateur | `cd backend && python remove_user.py` |
| `reset_user_passwords.py` | Réinitialiser les mots de passe | `cd backend && python reset_user_passwords.py` |

#### Scripts de Maintenance
| Script | Fonction | Utilisation |
|--------|----------|-------------|
| `apply_database_optimizations.py` | Appliquer les optimisations DB | `cd backend && python apply_database_optimizations.py` |
| `cleanup_logs.py` | Nettoyer les logs anciens | `cd backend && python cleanup_logs.py` |
| `generate_pdfs_for_existing_analyses.py` | Générer PDFs pour analyses existantes | `cd backend && python generate_pdfs_for_existing_analyses.py` |

## 🏗️ Architecture de Déploiement

### Structure des Répertoires
```
DocuSense-AI/
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── core/              # Configuration et sécurité
│   │   ├── models/            # Modèles de données SQLAlchemy
│   │   ├── api/               # Endpoints API
│   │   ├── services/          # Logique métier
│   │   ├── utils/             # Utilitaires
│   │   └── middleware/        # Middlewares (auth, logging, etc.)
│   ├── logs/                  # Logs du backend
│   ├── venv/                  # Environnement virtuel Python
│   └── requirements.txt       # Dépendances Python
├── frontend/                  # Interface React/TypeScript
│   ├── src/
│   │   ├── components/        # Composants React
│   │   ├── hooks/             # Hooks personnalisés
│   │   ├── services/          # Services API
│   │   ├── stores/            # Stores Zustand
│   │   ├── types/             # Types TypeScript
│   │   └── utils/             # Utilitaires
│   ├── public/               # Ressources statiques
│   └── package.json          # Dépendances Node.js
├── docusense.ps1            # Script PowerShell principal d'automatisation
├── docs/                    # Documentation
├── tests/                   # Tests unitaires
└── logs/                    # Logs système
```

### Ports et Services
| Service | Port | Description |
|---------|------|-------------|
| **Frontend** | 3000 | Interface utilisateur React |
| **Backend** | 8000 | API FastAPI |
| **API Docs** | 8000/docs | Documentation Swagger |
| **Health Check** | 8000/api/health | Vérification santé |

## 🔧 Configuration Avancée

### Configuration Backend

#### Base de Données
```python
# backend/app/core/config.py
class Settings(BaseSettings):
    database_url: str = Field(
        default="sqlite:///docusense.db",
        env="DATABASE_URL"
    )

    # Pour PostgreSQL
    # DATABASE_URL=postgresql://user:password@localhost/docusense

    # Pour MySQL
    # DATABASE_URL=mysql+pymysql://user:password@localhost/docusense
```

#### Sécurité
```python
# backend/app/core/config.py
class Settings(BaseSettings):
    secret_key: str = Field(
        default="docusense-secret-key-2024-change-in-production",
        env="SECRET_KEY"
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS
    cors_origins: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://127.0.0.1:3000"
        ],
        env="CORS_ORIGINS"
    )
```

#### Logs
```python
# backend/app/core/logging.py
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        }
    },
    "handlers": {
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "logs/docusense.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
            "formatter": "default"
        }
    },
    "root": {
        "level": "INFO",
        "handlers": ["file"]
    }
}
```

### Configuration Frontend

#### Vite
```javascript
// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
})
```

#### Tailwind CSS
```javascript
// frontend/tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
        }
      }
    }
  },
  plugins: []
}
```

## 🐛 Dépannage

### Problèmes Courants

#### Environnement Virtuel Manquant
```powershell
# Solution automatique
.\docusense.ps1 cleanup
.\docusense.ps1 start

# Solution manuelle
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

#### Ports Déjà Utilisés
```powershell
# Solution automatique
.\docusense.ps1 cleanup
.\docusense.ps1 start

# Solution manuelle
taskkill /F /IM python.exe /T
taskkill /F /IM node.exe /T
```

#### Base de Données Corrompue
```powershell
# Diagnostic
.\docusense.ps1 status

# Optimisation automatique
.\docusense.ps1 cleanup
.\docusense.ps1 start
```

#### Lecteur Vidéo Ne Fonctionne Pas
```bash
# Vérifier les dépendances multimédia
cd backend
venv\Scripts\pip.exe install ffmpeg-python av pytube yt-dlp

# Vérifier FFmpeg
ffmpeg -version

# Tester le streaming
curl http://localhost:8000/api/files/stream-by-path/[chemin_fichier]
```

### Logs et Diagnostic

#### Logs Backend
- **Application** : `backend/logs/docusense.log`
- **Erreurs** : `backend/logs/docusense_error.log`
- **Nettoyage automatique** : Toutes les 6h, max 10MB par fichier

#### Logs Frontend
- **Console** : Logs structurés avec `logService`
- **Événements** : Envoi automatique au backend
- **Erreurs** : Capture et logging centralisé

#### Outils de Diagnostic
```powershell
# Diagnostic automatique
.\docusense.ps1 status

# Surveillance continue
.\docusense.ps1 monitor

# Nettoyage complet
.\docusense.ps1 cleanup
```

#### API de Diagnostic
- **API Docs** : http://localhost:8000/docs
- **Health Check** : http://localhost:8000/api/health
- **Performance** : http://localhost:8000/api/monitoring/performance

## 📈 Performance et Monitoring

### Métriques Actuelles
- **Bundle Frontend** : ~1.8MB
- **Temps de chargement** : ~1.5s
- **Requêtes DB** : ~8 par page
- **Code dupliqué** : ~5%

### Optimisations Actives
- **Service API unifié** : 68% de réduction de code
- **Guards de connexion** : Zéro appel inutile
- **Cache localStorage** : Données fréquentes
- **Bundle splitting** : Chargement optimisé

### Monitoring
```python
# backend/app/api/monitoring.py
@router.get("/performance")
async def get_performance_metrics():
    return {
        "memory_usage": psutil.virtual_memory().percent,
        "cpu_usage": psutil.cpu_percent(),
        "disk_usage": psutil.disk_usage('/').percent,
        "active_connections": len(active_connections),
        "queue_size": len(analysis_queue)
    }
```

## 🔒 Sécurité

### Bonnes Pratiques
- **Changer la clé secrète** en production
- **Configurer HTTPS** pour le déploiement
- **Limiter les origines CORS** aux domaines autorisés
- **Activer le rate limiting** pour prévenir les attaques
- **Sauvegarder régulièrement** la base de données

### Variables d'Environnement Sensibles
```bash
# Production - À changer absolument
SECRET_KEY=your-super-secure-secret-key-here
DATABASE_URL=postgresql://user:password@localhost/docusense
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

## 🚀 Déploiement en Production

### Docker (Optionnel)
```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### SSL/TLS
```bash
# Certbot pour Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

## 📞 Support

### Ressources
- **API Docs** : http://localhost:8000/docs
- **Documentation** : `docs/`
- **Issues** : GitHub Issues pour les bugs
- **Discussions** : GitHub Discussions pour les questions

### Optimisations Récentes
- ✅ Système de logs unifié
- ✅ Guards de connexion backend
- ✅ Cache avancé avec TTL
- ✅ Scripts PowerShell unifiés
- ✅ Nettoyage et organisation du code
- ✅ Tests organisés
- ✅ Documentation centralisée
