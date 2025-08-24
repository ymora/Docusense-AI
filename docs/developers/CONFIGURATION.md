# ⚙️ Configuration - DocuSense AI

## 📋 Vue d'ensemble

Ce document décrit la configuration complète de DocuSense AI, incluant les variables d'environnement, les paramètres système et les configurations spécifiques.

## 🔧 Configuration Backend

### Variables d'Environnement

#### **Application**
```bash
# Nom et version de l'application
APP_NAME=DocuSense AI
APP_VERSION=1.0.0

# Mode debug (développement uniquement)
DEBUG=false
ENVIRONMENT=production  # development, production, testing
```

#### **Serveur**
```bash
# Configuration du serveur
HOST=0.0.0.0
PORT=8000
RELOAD=false  # Désactivé en production pour éviter les boucles
```

#### **Base de Données**
```bash
# URL de connexion à la base de données
DATABASE_URL=sqlite:///backend/docusense.db

# Pour PostgreSQL (production)
# DATABASE_URL=postgresql://user:password@localhost:5432/docusense
```

#### **Sécurité**
```bash
# Clé secrète pour JWT (CHANGER EN PRODUCTION)
SECRET_KEY=docusense-secret-key-2024-change-in-production

# Algorithme de chiffrement
ALGORITHM=HS256

# Expiration des tokens (minutes)
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### **CORS**
```bash
# Origines autorisées
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]

# Configuration CORS
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=["GET","POST","PUT","DELETE","OPTIONS","HEAD"]
CORS_ALLOW_HEADERS=["*"]
```

#### **Rate Limiting**
```bash
# Activation du rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60  # secondes
```

## 🤖 Configuration IA

### **Providers Supportés**

#### **OpenAI**
```bash
OPENAI_API_KEY=sk-your-openai-api-key
```

#### **Anthropic (Claude)**
```bash
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
```

#### **Mistral**
```bash
MISTRAL_API_KEY=your-mistral-api-key
```

#### **Google (Gemini)**
```bash
GEMINI_API_KEY=your-gemini-api-key
```

#### **Ollama (Local)**
```bash
OLLAMA_BASE_URL=http://localhost:11434
```

### **Configuration des Modèles**

#### **Modèles par Défaut**
```json
{
  "openai": {
    "default_model": "gpt-4",
    "fallback_model": "gpt-3.5-turbo",
    "max_tokens": 4000
  },
  "anthropic": {
    "default_model": "claude-3-opus-20240229",
    "fallback_model": "claude-3-sonnet-20240229",
    "max_tokens": 4000
  },
  "mistral": {
    "default_model": "mistral-large-latest",
    "fallback_model": "mistral-medium-latest",
    "max_tokens": 4000
  },
  "gemini": {
    "default_model": "gemini-1.5-pro",
    "fallback_model": "gemini-1.5-flash",
    "max_tokens": 4000
  },
  "ollama": {
    "default_model": "llama3.2",
    "fallback_model": "mistral",
    "max_tokens": 4000
  }
}
```

## 📝 Configuration Logging

### **Niveaux de Log**
```bash
# Niveau de log global
LOG_LEVEL=ERROR  # DEBUG, INFO, WARNING, ERROR, CRITICAL

# Configuration de logging adaptatif
PRODUCTION_LOGGING=true
GUEST_LOGGING_ENABLED=false
USER_LOGGING_LEVEL=ERROR
ADMIN_LOGGING_LEVEL=DEBUG
```

### **Limites de Performance**
```bash
# Limites de logs par seconde
MAX_LOGS_PER_SECOND=100
GUEST_MAX_LOGS_PER_SECOND=0
USER_MAX_LOGS_PER_SECOND=50
ADMIN_MAX_LOGS_PER_SECOND=500
```

### **Filtres par Module**
```bash
# Modules autorisés par rôle
GUEST_ALLOWED_MODULES=""
USER_ALLOWED_MODULES="auth,security,admin"
ADMIN_ALLOWED_MODULES="*"
```

### **Filtres par Niveau**
```bash
# Niveaux autorisés par rôle
GUEST_ALLOWED_LEVELS=""
USER_ALLOWED_LEVELS="ERROR,CRITICAL"
ADMIN_ALLOWED_LEVELS="DEBUG,INFO,WARNING,ERROR,CRITICAL"
```

## 🗄️ Configuration Base de Données

### **SQLite (Développement)**
```python
# Configuration par défaut
DATABASE_URL = "sqlite:///backend/docusense.db"

# Optimisations SQLite
PRAGMA journal_mode = WAL
PRAGMA synchronous = NORMAL
PRAGMA cache_size = 10000
PRAGMA temp_store = MEMORY
```

### **PostgreSQL (Production)**
```python
# Configuration PostgreSQL
DATABASE_URL = "postgresql://user:password@localhost:5432/docusense"

# Pool de connexions
POOL_SIZE = 20
MAX_OVERFLOW = 30
POOL_TIMEOUT = 30
POOL_RECYCLE = 3600
```

## 🔐 Configuration Sécurité

### **Authentification**
```python
# Configuration JWT
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 30
JWT_REFRESH_EXPIRATION_DAYS = 7

# Hachage des mots de passe
PASSWORD_HASH_ALGORITHM = "bcrypt"
PASSWORD_HASH_ROUNDS = 12
```

### **Permissions**
```python
# Rôles et permissions
ROLES = {
    "guest": {
        "max_files": 5,
        "max_file_size": 10 * 1024 * 1024,  # 10MB
        "max_analyses": 10
    },
    "user": {
        "max_files": 100,
        "max_file_size": 100 * 1024 * 1024,  # 100MB
        "max_analyses": 1000
    },
    "admin": {
        "max_files": -1,  # Illimité
        "max_file_size": -1,  # Illimité
        "max_analyses": -1  # Illimité
    }
}
```

## 📁 Configuration Fichiers

### **Formats Supportés**
```python
# Formats de documents
SUPPORTED_DOCUMENT_FORMATS = [
    ".pdf", ".docx", ".doc", ".pptx", ".ppt", 
    ".xlsx", ".xls", ".txt", ".rtf", ".md", ".csv"
]

# Formats d'images
SUPPORTED_IMAGE_FORMATS = [
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic",
    ".svg", ".tiff", ".tif", ".bmp", ".ico", ".raw"
]

# Formats vidéo
SUPPORTED_VIDEO_FORMATS = [
    ".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm", ".mkv"
]

# Formats audio
SUPPORTED_AUDIO_FORMATS = [
    ".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma"
]
```

### **Limites de Fichiers**
```python
# Tailles maximales
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
MAX_UPLOAD_SIZE = 500 * 1024 * 1024  # 500MB

# Dossier temporaire
TEMP_DIR = "backend/temp_downloads"
UPLOAD_DIR = "backend/uploads"
```

## 🎨 Configuration Frontend

### **Variables d'Environnement**
```bash
# Configuration Vite
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=DocuSense AI
VITE_APP_VERSION=1.0.0

# Configuration de développement
VITE_DEV_MODE=true
VITE_ENABLE_DEBUG=true
```

### **Configuration Tailwind**
```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}
```

## 🧪 Configuration Tests

### **Configuration Backend**
```python
# Configuration des tests
TEST_DATABASE_URL = "sqlite:///test.db"
TEST_LOG_LEVEL = "ERROR"
TEST_AI_PROVIDERS = ["mock"]

# Couverture de tests
COVERAGE_MIN_PERCENT = 80
COVERAGE_FAIL_UNDER = 70
```

### **Configuration Frontend**
```javascript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
})
```

## 🚀 Configuration Déploiement

### **Docker**
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### **Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/docusense
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_BASE_URL=http://localhost:8000

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=docusense
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### **Variables d'Environnement Production**
```bash
# .env.production
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=ERROR

# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/docusense

# Cache Redis
REDIS_URL=redis://localhost:6379

# Sécurité
SECRET_KEY=your-super-secret-key-change-this
CORS_ORIGINS=["https://yourdomain.com"]

# IA Providers
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Performance
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
MAX_LOGS_PER_SECOND=100
```

## 📊 Configuration Monitoring

### **Métriques de Performance**
```python
# Seuils de performance
PERFORMANCE_THRESHOLDS = {
    "response_time_ms": 500,
    "memory_usage_mb": 512,
    "cpu_usage_percent": 80,
    "disk_usage_percent": 90
}

# Alertes
ALERT_EMAILS = ["admin@example.com"]
ALERT_WEBHOOK_URL = "https://hooks.slack.com/..."
```

### **Logs de Monitoring**
```python
# Configuration des logs
LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        },
        "json": {
            "format": "%(asctime)s %(name)s %(levelname)s %(message)s",
            "class": "pythonjsonlogger.jsonlogger.JsonFormatter"
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
            "level": "INFO"
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "logs/app.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
            "formatter": "json",
            "level": "ERROR"
        }
    },
    "loggers": {
        "": {
            "handlers": ["console", "file"],
            "level": "INFO"
        }
    }
}
```

## 🔧 Configuration Scripts

### **PowerShell Scripts**
```powershell
# Configuration des scripts
$Config = @{
    PythonPath = "venv\Scripts\python.exe"
    NodePath = "node"
    BackendPort = 8000
    FrontendPort = 3000
    DatabasePath = "backend\docusense.db"
    LogsPath = "logs"
}
```

### **Scripts de Maintenance**
```powershell
# Configuration maintenance
$MaintenanceConfig = @{
    CleanupInterval = "24h"
    BackupInterval = "7d"
    LogRetention = "30d"
    TempFileRetention = "7d"
    MaxLogSize = "100MB"
}
```

## 📋 Checklist de Configuration

### **Développement**
- [ ] Variables d'environnement configurées
- [ ] Base de données SQLite créée
- [ ] Providers IA configurés (optionnel)
- [ ] Logs configurés pour debug
- [ ] CORS configuré pour localhost

### **Production**
- [ ] Variables d'environnement sécurisées
- [ ] Base de données PostgreSQL configurée
- [ ] Redis configuré pour le cache
- [ ] Providers IA configurés
- [ ] Logs configurés pour production
- [ ] CORS configuré pour le domaine
- [ ] Rate limiting activé
- [ ] Monitoring configuré
- [ ] Sauvegarde automatique configurée

### **Sécurité**
- [ ] Clé secrète changée
- [ ] Mots de passe forts configurés
- [ ] Permissions utilisateurs configurées
- [ ] Rate limiting activé
- [ ] Logs de sécurité activés
- [ ] HTTPS configuré (si applicable)

---

*Dernière mise à jour : Août 2025 - Configuration v1.0*
