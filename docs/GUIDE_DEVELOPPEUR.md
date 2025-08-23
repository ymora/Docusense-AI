# 🛠️ Guide Développeur - DocuSense AI

## 🏗️ Architecture Technique

### Vue d'Ensemble
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend        │    │   Base de       │
│   React/TS      │◄──►│   FastAPI        │◄──►│   Données       │
│                 │    │                  │    │   SQLite        │
│ - Components    │    │ - Services       │    │                 │
│ - Hooks         │    │ - API Routes     │    │ - Users         │
│ - Stores        │    │ - Middleware     │    │ - Files         │
│ - Services      │    │ - Models         │    │ - Analyses      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Providers IA   │
                    │                  │
                    │ - OpenAI         │
                    │ - Claude         │
                    │ - Mistral        │
                    │ - Ollama         │
                    └──────────────────┘
```

### Technologies Utilisées

#### Backend
- **FastAPI** : Framework web moderne et rapide
- **SQLAlchemy** : ORM pour la gestion de base de données
- **SQLite** : Base de données légère et portable
- **Pydantic** : Validation de données et sérialisation
- **Uvicorn** : Serveur ASGI pour FastAPI
- **JWT** : Authentification par tokens
- **Pillow** : Traitement d'images
- **FFmpeg** : Traitement audio/vidéo
- **PyPDF2** : Manipulation de PDFs

#### Frontend
- **React 18** : Framework UI avec hooks
- **TypeScript** : Typage statique
- **Vite** : Build tool moderne
- **Tailwind CSS** : Framework CSS utilitaire
- **Zustand** : Gestion d'état légère
- **Axios** : Client HTTP
- **React Router** : Navigation SPA

## 📁 Structure du Projet

```
DocuSense-AI/
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── core/              # Configuration et sécurité
│   │   │   ├── config.py      # Paramètres d'application
│   │   │   ├── database.py    # Configuration DB
│   │   │   ├── logging.py     # Configuration logs
│   │   │   ├── security.py    # Sécurité et authentification
│   │   │   └── types.py       # Types communs
│   │   ├── models/            # Modèles de données SQLAlchemy
│   │   │   ├── user.py        # Modèle utilisateur
│   │   │   ├── file.py        # Modèle fichier
│   │   │   ├── analysis.py    # Modèle analyse
│   │   │   ├── config.py      # Modèle configuration
│   │   │   └── system_log.py  # Modèle log système
│   │   ├── api/               # Endpoints API
│   │   │   ├── auth.py        # Authentification
│   │   │   ├── files.py       # Gestion fichiers
│   │   │   ├── analysis.py    # Analyses IA
│   │   │   ├── config.py      # Configuration
│   │   │   └── monitoring.py  # Monitoring
│   │   ├── services/          # Logique métier
│   │   │   ├── file_service.py        # Service fichiers
│   │   │   ├── analysis_service.py    # Service analyses
│   │   │   ├── ai_service.py          # Service IA
│   │   │   ├── config_service.py      # Service config
│   │   │   ├── auth_service.py        # Service auth
│   │   │   ├── email_service.py       # Service emails
│   │   │   ├── pdf_service.py         # Service PDFs
│   │   │   ├── multimedia_service.py  # Service multimédia
│   │   │   ├── ocr_service.py         # Service OCR
│   │   │   └── download_service.py    # Service téléchargement
│   │   ├── utils/             # Utilitaires
│   │   │   ├── api_utils.py   # Utilitaires API
│   │   │   ├── logger.py      # Logger personnalisé
│   │   │   └── response_formatter.py # Formatage réponses
│   │   └── middleware/        # Middlewares
│   │       ├── auth_middleware.py     # Middleware auth
│   │       ├── log_requests.py        # Logging requêtes
│   │       └── simple_logging_middleware.py # Logging simple
│   ├── logs/                  # Logs du backend
│   ├── venv/                  # Environnement virtuel Python
│   └── requirements.txt       # Dépendances Python
├── frontend/                  # Interface React/TypeScript
│   ├── src/
│   │   ├── components/        # Composants React
│   │   │   ├── DiskSelector.tsx       # Sélecteur disques
│   │   │   ├── FileTreeSimple.tsx     # Arborescence fichiers
│   │   │   ├── QueueIAAdvanced.tsx    # Queue analyses
│   │   │   ├── ConfigWindow.tsx       # Configuration
│   │   │   ├── EmailViewer.tsx        # Visualiseur emails
│   │   │   ├── FileResultViewer.tsx   # Résultats analyses
│   │   │   └── UsageLimits.tsx        # Limites usage
│   │   ├── hooks/             # Hooks personnalisés
│   │   │   ├── useAuthService.ts      # Service auth
│   │   │   ├── useConfigService.ts    # Service config
│   │   │   ├── usePromptService.ts    # Service prompts
│   │   │   ├── useAnalysisService.ts  # Service analyses
│   │   │   ├── useFileService.ts      # Service fichiers
│   │   │   ├── useEmailService.ts     # Service emails
│   │   │   ├── useAdminService.ts     # Service admin
│   │   │   ├── useBackendConnection.ts # Connexion backend
│   │   │   └── useBackendStatus.ts    # Statut backend
│   │   ├── services/          # Services API
│   │   │   ├── unifiedApiService.ts   # Service API unifié
│   │   │   ├── logService.ts          # Service logs
│   │   │   ├── pdfService.ts          # Service PDFs
│   │   │   ├── downloadService.ts     # Service téléchargement
│   │   │   └── multimediaService.ts   # Service multimédia
│   │   ├── stores/            # Stores Zustand
│   │   │   ├── authStore.ts           # Store authentification
│   │   │   ├── configStore.ts         # Store configuration
│   │   │   ├── analysisStore.ts       # Store analyses
│   │   │   ├── promptStore.ts         # Store prompts
│   │   │   ├── fileStore.ts           # Store fichiers
│   │   │   ├── uiStore.ts             # Store interface
│   │   │   └── startupStore.ts        # Store démarrage
│   │   ├── types/             # Types TypeScript
│   │   │   ├── auth.ts                # Types authentification
│   │   │   ├── file.ts                # Types fichiers
│   │   │   ├── analysis.ts            # Types analyses
│   │   │   ├── config.ts              # Types configuration
│   │   │   └── api.ts                 # Types API
│   │   └── utils/             # Utilitaires
│   │       ├── constants.ts           # Constantes
│   │       ├── helpers.ts             # Fonctions utilitaires
│   │       ├── validators.ts          # Validateurs
│   │       └── formatters.ts          # Formateurs
│   ├── public/               # Ressources statiques
│   └── package.json          # Dépendances Node.js
├── scripts/                  # Scripts PowerShell d'automatisation
├── docs/                    # Documentation
├── tests/                   # Tests unitaires
└── logs/                    # Logs système
```

## 🔧 Configuration

### Configuration Backend

#### Variables d'Environnement
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

#### Configuration API Keys
```json
{
  "openai_api_key": "sk-...",
  "anthropic_api_key": "sk-ant-...",
  "mistral_api_key": "mistral-...",
  "ollama_url": "http://localhost:11434"
}
```

### Configuration Frontend

#### Variables d'Environnement
```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
VITE_APP_NAME=DocuSense AI
VITE_APP_VERSION=1.0.0
VITE_DEBUG=false
```

#### Configuration Tailwind
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
  }
}
```

## 🧪 Tests et Validation

### Tests Disponibles

#### Tests Backend
```bash
# Tests unitaires
cd backend
venv\Scripts\python.exe -m pytest tests/

# Tests spécifiques
venv\Scripts\python.exe tests/test_priority_mode.py
venv\Scripts\python.exe tests/test_logs_performance.py
venv\Scripts\python.exe tests/performance_test.py
```

#### Tests Frontend
```bash
# Tests unitaires
cd frontend
npm test

# Tests E2E
npm run test:e2e
```

### Validation

#### Types TypeScript
- **Validation compile-time** : Tous les types sont validés
- **Interfaces strictes** : Pas de types `any` non nécessaires
- **Guards de type** : Validation runtime pour les données externes

#### Pydantic Models
- **Validation runtime** : Toutes les données API sont validées
- **Schémas stricts** : Validation automatique des entrées
- **Sérialisation** : Conversion automatique JSON ↔ Python

#### Guards de Connexion
- **Validation état** : Vérification avant chaque appel API
- **Fallbacks intelligents** : Valeurs de secours appropriées
- **Logging stratégique** : Warnings pour requêtes bloquées

## 🔄 Mode Priorité IA

### Vue d'ensemble
Le **Mode Priorité IA** est un système intelligent qui permet d'utiliser plusieurs providers IA en cascade avec fallback automatique. Si un provider ne répond pas ou génère une erreur, le système bascule automatiquement vers le provider suivant dans la liste de priorité.

### Configuration des Providers
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

### Logique de Fallback
1. **Tentative Provider 1** : OpenAI (priorité 1)
2. **Si échec** → Provider 2 : Claude (priorité 2)
3. **Si échec** → Provider 3 : Ollama (priorité 3)
4. **Si tous échouent** → Erreur avec retry automatique

### Métriques de Performance
- **Temps de réponse** : < 2s pour le premier provider
- **Fallback automatique** : < 5s pour le provider suivant
- **Retry automatique** : 3 tentatives par provider
- **Cache intelligent** : Réutilisation des réponses similaires

## 🛡️ Guards de Connexion

### Système de Protection
Le système de guards de connexion assure une gestion intelligente de la connexion backend pour **éliminer complètement** les appels API inutiles et les logs d'erreur quand le backend est déconnecté.

### Fonctionnalités
- **Zéro appel API** quand backend déconnecté
- **Zéro log d'erreur** inutile
- Interface utilisateur fluide avec fallbacks
- Gestion centralisée et intelligente

### Services Centralisés

#### Service de fichiers (`fileService.ts`)
```typescript
export const useFileService = () => {
  const { conditionalRequest } = useBackendConnection();
  
  return {
    getDrives: () => conditionalRequest(
      () => baseFileService.getDrives(),
      [] // Fallback: liste vide
    ),
    listDirectory: (directory: string) => conditionalRequest(
      () => baseFileService.listDirectory(directory),
      { files: [], directories: [], error: 'Backend déconnecté' }
    ),
    // ... autres méthodes
  };
};
```

#### Service d'emails (`emailService.ts`)
```typescript
export const useEmailService = () => {
  const { conditionalRequest } = useBackendConnection();
  
  return {
    parseEmail: (filePath: string) => conditionalRequest(
      () => baseEmailService.parseEmail(filePath),
      { success: false, error: 'Backend déconnecté', email: null }
    ),
    // ... autres méthodes
  };
};
```

### Composants avec Guards
1. **`DiskSelector.tsx`** : Utilise `useFileService()`
2. **`UsageLimits.tsx`** : Utilise `useAuthUsageService()`
3. **`QueueIAAdvanced.tsx`** : Utilise `useAnalysisService()`
4. **`ConfigWindow.tsx`** : Utilise `useBackendConnection()`

## 📊 Stores et État Global

### Stores Zustand

#### AuthStore
```typescript
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

#### ConfigStore
```typescript
interface ConfigStore {
  aiProviders: AIProvider[];
  selectedProvider: string;
  uiConfig: UIConfig;
  isLoading: boolean;
  setAIProviders: (providers: AIProvider[]) => void;
  setSelectedProvider: (provider: string) => void;
  saveAPIKey: (provider: string, key: string) => Promise<void>;
  testProvider: (provider: string) => Promise<void>;
}
```

#### AnalysisStore
```typescript
interface AnalysisStore {
  analyses: Analysis[];
  currentAnalysis: Analysis | null;
  queue: Analysis[];
  isLoading: boolean;
  setAnalyses: (analyses: Analysis[]) => void;
  addAnalysis: (analysis: Analysis) => void;
  updateAnalysis: (id: number, updates: Partial<Analysis>) => void;
  removeAnalysis: (id: number) => void;
}
```

#### PromptStore
```typescript
interface PromptStore {
  prompts: Prompt[];
  specializedPrompts: Prompt[];
  defaultPrompts: Prompt[];
  selectedPrompt: Prompt | null;
  setPrompts: (prompts: Prompt[]) => void;
  setSelectedPrompt: (prompt: Prompt | null) => void;
  getPromptsByDomain: (domain: string) => Prompt[];
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
venv\Scripts\pip.exe install -r requirements.txt
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
