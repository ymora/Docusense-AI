# 📚 DocuSense AI - Documentation Complète

> **Plateforme moderne d'analyse intelligente de documents avec interface épurée et IA avancée**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-repo/docusense-ai)
[![Python](https://img.shields.io/badge/python-3.8+-green.svg)](https://python.org)
[![Node.js](https://img.shields.io/badge/node.js-16+-orange.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

---

## 📋 Table des Matières

### 🎯 [Guide Utilisateur](#-guide-utilisateur)
1. [🚀 Démarrage Rapide](#-démarrage-rapide)
2. [✨ Fonctionnalités Principales](#-fonctionnalités-principales)
3. [🔐 Authentification et Sécurité](#-authentification-et-sécurité)
4. [📁 Support Multi-Formats](#-support-multi-formats)
5. [🤖 Analyse IA Intelligente](#-analyse-ia-intelligente)
6. [🎨 Interface Utilisateur](#-interface-utilisateur)

### 🛠️ [Guide Développeur](#-guide-développeur)
1. [🏗️ Architecture Technique](#️-architecture-technique)
2. [🔧 Services et API](#-services-et-api)
3. [🗄️ Base de Données](#-base-de-données)
4. [📊 Stores et État Global](#-stores-et-état-global)
5. [🛡️ Guards de Connexion](#-guards-de-connexion)
6. [🔄 Mode Priorité IA](#-mode-priorité-ia)
7. [⚙️ Configuration](#️-configuration)
8. [🧪 Tests et Validation](#-tests-et-validation)
9. [🐛 Dépannage](#-dépannage)

---

## 🎯 Guide Utilisateur

### 🚀 Démarrage Rapide

#### **Installation Express (2 minutes)**

```powershell
# 1. Démarrage automatique complet
.\docusense.ps1 start

# 2. Accéder à l'application
# Frontend : http://localhost:3000
# Backend : http://localhost:8000
```

#### **Démarrage Manuel**

```powershell
# Backend (Port 8000)
cd backend
venv\Scripts\python.exe main.py

# Frontend (Port 3000) - Dans un autre terminal
cd frontend
npm run dev
```

#### **🎯 Premiers Pas**

1. **Ouvrez votre navigateur** sur http://localhost:3000
2. **Sélectionnez un dossier** contenant vos documents
3. **Cliquez sur un fichier** → Affichage automatique selon le type
4. **Utilisez l'analyse IA** → Sélectionnez un prompt et lancez l'analyse

### ✨ Fonctionnalités Principales

#### **🎯 Interface Épurée et Intuitive**
- **Affichage automatique** selon le type de fichier
- **Actions simplifiées** avec icônes minimales
- **Navigation fluide** avec bouton retour unique
- **Design très fin** avec thème sombre et style minimaliste
- **Icônes bleu clair** comme le sélecteur de disque

#### **📁 Support Multi-Formats Complet**

##### **Documents** 📄
- **PDF, DOCX, PPTX, XLSX** - Visualisation native
- **TXT, RTF, MD, CSV** - Affichage texte
- **ODT, ODS, ODP** - Formats OpenDocument

##### **Images** 🖼️ (43 formats)
- **JPG, PNG, GIF, WebP, HEIC, SVG, TIFF, BMP, ICO**
- **Formats RAW** : CR2, CR3, NEF, ARW, RAF, ORF, PEF, SRW, RW2, DCR, KDC, K25, MRW, X3F, 3FR, FFF, IIQ, MOS
- **Formats professionnels** : PSD, DNG
- **Boutons flottants** : Zoom, télécharger, plein écran en overlay
- **Contrôles intelligents** : Apparition au survol, indicateur de zoom

##### **Vidéos** 🎬 (39 formats)
- **MP4, AVI, MOV, WMV, FLV, WebM, MKV, M4V, 3GP, OGV**
- **Formats transport stream** : TS, MTS, M2TS
- **Formats conteneurs** : ASF, RM, RMVB, NUT, F4V, F4P, F4A, F4B
- **Formats codec** : DIVX, XVID, H264, H265, VP8, VP9
- **Formats MPEG** : MPEG, MPG, MPE, M1V, M2V, MPV, MP2, M2P, PS
- **Formats autres** : EVO, OGM, OGX, MXF
- **Formats streaming** : HLS, M3U8
- **Streaming natif** : Lecture directe sans téléchargement
- **Analyse complète** : Métadonnées, codecs, durée, résolution

##### **Audio** 🎵 (37 formats)
- **MP3, WAV, FLAC, AAC, OGG, WMA, M4A, M4B, M4P, M4R**
- **Formats haute qualité** : OPUS, AIFF, ALAC, AMR, AWB
- **Formats anciens/legacy** : AU, SND, RA, RAM, WV, APE, AC3, DTS
- **Formats conteneurs** : MKA, TTA, MID, MIDI, CAF
- **Formats mobiles** : 3GA, 3GP, 3GPP, 3G2
- **Formats Windows** : WAX, WVX
- **Formats playlist** : PLS, SD2
- **Lecteur intégré** avec contrôles simples
- **Analyse spectrale** : Tempo, fréquences, spectrogrammes

##### **Emails** 📧
- **EML, MSG** - Parsing complet
- **Pièces jointes** - Accès direct et prévisualisation

#### **🤖 Analyse IA Intelligente**

##### **Mode Priorité IA**
- **Cascade automatique** : Si un provider ne répond pas, bascule vers le suivant
- **Fallback intelligent** : Gestion des erreurs et retry automatique
- **Providers supportés** : OpenAI, Claude, Mistral, Ollama (par défaut)
- **Queue d'analyses** : Traitement en arrière-plan avec suivi en temps réel

##### **Types d'Analyses**
- **Général** : Analyse de contenu basique
- **Résumé** : Synthèse du document
- **Extraction** : Extraction d'informations spécifiques
- **Comparaison** : Comparaison entre documents
- **Classification** : Catégorisation automatique
- **OCR** : Reconnaissance de texte dans les images
- **Juridique** : Analyse de documents légaux
- **Technique** : Analyse de documents techniques
- **Administrative** : Analyse de documents administratifs
- **Multiple IA** : Analyse avec plusieurs providers

##### **Prompts Spécialisés**
- **Juridique** : Contrats, actes, procédures
- **Technique** : Manuels, spécifications, documentation
- **Administrative** : Formulaires, rapports, correspondance
- **Général** : Analyse polyvalente

### 🔐 Authentification et Sécurité

#### **👥 Rôles Utilisateurs**
- **Admin** : Accès complet (logs, admin, queue, viewer)
- **Utilisateur** : Accès limité (queue, viewer)
- **Invité** : Accès basique (queue, viewer) - sans mot de passe

#### **🔑 Identifiants par Défaut**
| Utilisateur | Mot de passe | Rôle |
|-------------|--------------|------|
| `admin` | `Admin123*` | Administrateur |
| `yannick` | `Ym120879/*-+` | Utilisateur |
| `invite` | (aucun) | Invité |

#### **🛡️ Critères de Sécurité des Mots de Passe**
- **Longueur minimale** : 8 caractères
- **Majuscule** : Au moins 1 lettre majuscule (A-Z)
- **Minuscule** : Au moins 1 lettre minuscule (a-z)
- **Chiffre** : Au moins 1 chiffre (0-9)
- **Caractère spécial** : Au moins 1 caractère spécial (!@#$%^&*(),.?":{}|<>)

#### **📧 Validation Email**
- **Format RFC** : `nom@domaine.com`
- **Caractères autorisés** : Lettres, chiffres, points, tirets, underscores
- **Extension** : Au moins 2 caractères (.com, .fr, .org, etc.)

#### **🔢 Validation Nom d'Utilisateur**
- **Longueur** : 3 à 20 caractères
- **Caractères** : Lettres, chiffres, underscores uniquement
- **Format** : `^[a-zA-Z0-9_]{3,20}$`

#### **🚫 Rate Limiting et Protection**

##### **⏱️ Paramètres de Rate Limiting**
| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| **Tentatives max** | 5 | Nombre maximum de tentatives de connexion |
| **Durée de blocage** | 5 minutes | Temps de blocage après dépassement |
| **Scope** | `{IP}:{username}` | Combinaison unique IP + utilisateur |

##### **🔄 Comportement du Rate Limiting**
| Scénario | Comportement | Message d'erreur |
|----------|-------------|------------------|
| **5 tentatives échouées** | Blocage 5 minutes | "Trop de tentatives de connexion (5 maximum). Réessayez dans X minutes." |
| **Connexion réussie** | Reset du compteur | - |
| **Changement d'utilisateur** | Nouveau compteur | - |
| **Changement d'IP** | Nouveau compteur | - |
| **Expiration du délai** | Déblocage automatique | - |

#### **⏰ Gestion des Sessions**
- **Type** : Access Token + Refresh Token
- **Expiration** : Configurable dans les paramètres
- **Stockage** : localStorage (frontend)
- **Session expirée** : Déconnexion automatique avec message

#### **📋 Codes d'Erreur HTTP**
| Code | Type | Description | Action Frontend |
|------|------|-------------|----------------|
| **200** | ✅ Succès | Requête réussie | - |
| **400** | ❌ Erreur client | Données invalides | Affichage message d'erreur |
| **401** | ❌ Non autorisé | Token expiré/invalide | Déconnexion + rechargement |
| **429** | ⚠️ Trop de requêtes | Rate limiting | Affichage délai d'attente |
| **500** | ❌ Erreur serveur | Problème backend | Message générique |
| **503** | ⚠️ Service indisponible | Maintenance | Message de retry |

### 🎨 Interface Utilisateur

#### **🎯 Design Principles**
- **Style très fin** : Lignes minces, bordures minimales
- **Thème sombre** : Interface moderne et reposante
- **Design minimaliste** : Interface épurée sans encombrement
- **Icônes bleu clair** : Cohérence visuelle avec le sélecteur de disque
- **Texte informatif** : Uniquement dans les zones de sélection

#### **📱 Composants Principaux**
- **DiskSelector** : Sélection de disques avec dialogue de fichiers
- **FileTreeSimple** : Arborescence de fichiers simplifiée
- **QueueIAAdvanced** : Gestion avancée de la queue d'analyses
- **ConfigWindow** : Configuration des providers IA
- **EmailViewer** : Visualisation des emails avec pièces jointes
- **FileResultViewer** : Affichage des résultats d'analyses
- **UsageLimits** : Limites d'usage pour les invités

---

## 🛠️ Guide Développeur

### 🏗️ Architecture Technique

#### **📁 Structure du Projet**
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
├── scripts/                  # Scripts PowerShell d'automatisation
├── docs/                    # Documentation
├── tests/                   # Tests unitaires
└── logs/                    # Logs système
```

#### **🔧 Technologies Utilisées**

##### **Backend**
- **FastAPI** : Framework web moderne et rapide
- **SQLAlchemy** : ORM pour la gestion de base de données
- **SQLite** : Base de données légère et portable
- **Pydantic** : Validation de données et sérialisation
- **Uvicorn** : Serveur ASGI pour FastAPI
- **JWT** : Authentification par tokens
- **Pillow** : Traitement d'images
- **FFmpeg** : Traitement audio/vidéo
- **PyPDF2** : Manipulation de PDFs

##### **Frontend**
- **React 18** : Framework UI avec hooks
- **TypeScript** : Typage statique
- **Vite** : Build tool moderne
- **Tailwind CSS** : Framework CSS utilitaire
- **Zustand** : Gestion d'état légère
- **Axios** : Client HTTP
- **React Router** : Navigation SPA

### 🔧 Services et API

#### **📊 Architecture des Services**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Composants    │    │  Hooks Service   │    │     Stores      │
│                 │    │                  │    │                 │
│ - AuthManager   │───▶│ - useAuthService │───▶│ - authStore     │
│ - ConfigWindow  │───▶│ - useConfigService│───▶│ - configStore   │
│ - QueueIA       │───▶│ - usePromptService│───▶│ - promptStore   │
│ - FileManager   │───▶│ - useAnalysisService│───▶│ - analysisStore │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ useUnifiedApiService │
                    │                  │
                    │ - get()          │
                    │ - post()         │
                    │ - put()          │
                    │ - delete()       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ useBackendConnection │
                    │                  │
                    │ - conditionalRequest │
                    │ - isOnline       │
                    │ - canMakeRequests│
                    └──────────────────┘
```

#### **🔧 Services Backend**

| Service | Fichier | Responsabilité |
|---------|---------|----------------|
| **FileService** | `file_service.py` | Gestion des fichiers et répertoires |
| **AnalysisService** | `analysis_service.py` | Traitement des analyses IA |
| **AIService** | `ai_service.py` | Intégration providers IA |
| **ConfigService** | `config_service.py` | Gestion de la configuration |
| **AuthService** | `auth_service.py` | Authentification et autorisation |
| **EmailService** | `email_service.py` | Parsing et traitement emails |
| **PDFService** | `pdf_service.py` | Génération de PDFs |
| **MultimediaService** | `multimedia_service.py` | Analyse fichiers multimédia |
| **OCRService** | `ocr_service.py` | Reconnaissance de texte |
| **DownloadService** | `download_service.py` | Téléchargement de fichiers |
| **PromptService** | `prompt_service.py` | Gestion des prompts |

#### **🔧 Hooks Frontend**

| Service | Fichier | Fonctions Principales |
|---------|---------|----------------------|
| **Authentication** | `useAuthService.ts` | `login`, `register`, `loginAsGuest`, `refreshAccessToken` |
| **Configuration** | `useConfigService.ts` | `getAIProviders`, `saveAPIKey`, `testProvider`, `setProviderPriority` |
| **Prompts** | `usePromptService.ts` | `getSpecializedPrompts`, `getDefaultPrompts`, `getPromptsByDomain` |
| **Analyses** | `useAnalysisService.ts` | `getAnalysesList`, `createAnalysis`, `retryAnalysis`, `deleteAnalysis` |
| **API Unifié** | `useUnifiedApiService.ts` | Service central avec 50+ méthodes, guards intégrés |

#### **📁 API Endpoints**

##### **Gestion des Fichiers**
| Endpoint | Méthode | Fonction |
|----------|---------|----------|
| `/api/files/drives` | GET | `getDrives()` - Récupérer les disques |
| `/api/files/list/{path}` | GET | `listDirectory()` - Lister répertoire |
| `/api/files/analyze-directory` | POST | `analyzeDirectory()` - Analyser répertoire |
| `/api/files/directory-files/{path}` | GET | `getDirectoryFiles()` - Fichiers du répertoire |
| `/api/files/stream-by-path/{path}` | GET | `streamByPath()` - Streamer fichier |
| `/api/files/download/{id}` | GET | `downloadFile()` - Télécharger fichier |

##### **Analyses IA**
| Endpoint | Méthode | Fonction |
|----------|---------|----------|
| `/api/analysis/list` | GET | `getAnalysesList()` - Liste analyses |
| `/api/analysis/create` | POST | `createAnalysis()` - Créer analyse |
| `/api/analysis/{id}/retry` | POST | `retryAnalysis()` - Relancer analyse |
| `/api/analysis/{id}` | DELETE | `deleteAnalysis()` - Supprimer analyse |
| `/api/analysis/{id}` | GET | `getAnalysisById()` - Récupérer analyse |

##### **Configuration**
| Endpoint | Méthode | Fonction |
|----------|---------|----------|
| `/api/config/ai/providers` | GET | `getAIProviders()` - Providers IA |
| `/api/config/ai/providers` | POST | `setAIProviders()` - Configurer providers |
| `/api/config/ai/test` | POST | `testProvider()` - Tester provider |
| `/api/config/ui` | GET | `getUIConfig()` - Configuration UI |

##### **Emails**
| Endpoint | Méthode | Fonction |
|----------|---------|----------|
| `/api/emails/parse/{path}` | GET | `parseEmail()` - Parser email |
| `/api/emails/attachment-preview/{path}` | GET | `getEmailAttachmentPreview()` - Aperçu pièce jointe |

##### **PDFs**
| Endpoint | Méthode | Fonction |
|----------|---------|----------|
| `/api/pdf-files/generate/{id}` | POST | `generatePDF()` - Générer PDF |
| `/api/pdf-files/generate-all` | POST | `generateAllCompletedPDFs()` - Générer tous les PDFs |
| `/api/pdf-files/download/{id}` | GET | `downloadPDF()` - Télécharger PDF |

##### **Monitoring**
| Endpoint | Méthode | Fonction |
|----------|---------|----------|
| `/api/monitoring/performance` | GET | `getPerformanceMetrics()` - Métriques performance |
| `/api/monitoring/health` | GET | `healthCheck()` - Vérification santé |
| `/api/logs/system` | GET | `getSystemLogs()` - Logs système |

### 🗄️ Base de Données

#### **📊 Modèles Principaux**

##### **Table `users`**
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### **Table `files`**
```sql
CREATE TABLE files (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    path VARCHAR(1000) UNIQUE NOT NULL,
    size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    extracted_text TEXT,
    analysis_result TEXT,
    analysis_metadata JSON,
    error_message TEXT,
    is_selected BOOLEAN DEFAULT FALSE,
    parent_directory VARCHAR(1000),
    file_created_at TIMESTAMP,
    file_modified_at TIMESTAMP,
    file_accessed_at TIMESTAMP
);
```

##### **Table `analyses`**
```sql
CREATE TABLE analyses (
    id INTEGER PRIMARY KEY,
    file_id INTEGER NOT NULL,
    analysis_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    prompt TEXT NOT NULL,
    result TEXT,
    pdf_path VARCHAR(500),
    analysis_metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    progress FLOAT DEFAULT 0.0,
    current_step VARCHAR(100),
    total_steps INTEGER DEFAULT 1,
    estimated_completion TIMESTAMP,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    user_id INTEGER,
    FOREIGN KEY (file_id) REFERENCES files(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

##### **Table `configs`**
```sql
CREATE TABLE configs (
    id INTEGER PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### **Table `system_logs`**
```sql
CREATE TABLE system_logs (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    event_type VARCHAR(100) NOT NULL,
    details JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(20) DEFAULT 'info',
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### **🔗 Relations**
- `Analysis` → `File` (Many-to-One)
- `Analysis` → `User` (Many-to-One)
- `SystemLog` → `User` (Many-to-One)
- `File` → `Analysis` (One-to-Many)

#### **📊 Statuts et Types**

##### **FileStatus**
```python
class FileStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    UNSUPPORTED = "unsupported"
    NONE = "none"
```

##### **AnalysisStatus**
```python
class AnalysisStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
```

##### **AnalysisType**
```python
class AnalysisType(str, Enum):
    GENERAL = "general"
    SUMMARY = "summary"
    EXTRACTION = "extraction"
    COMPARISON = "comparison"
    CLASSIFICATION = "classification"
    OCR = "ocr"
    JURIDICAL = "juridical"
    TECHNICAL = "technical"
    ADMINISTRATIVE = "administrative"
    MULTIPLE_AI = "multiple_ai"
```

##### **UserRole**
```python
class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"
```

### 📊 Stores et État Global

#### **🔧 Stores Zustand**

##### **AuthStore**
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

##### **ConfigStore**
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

##### **AnalysisStore**
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

##### **PromptStore**
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

### 🛡️ Guards de Connexion

#### **📋 Système de Protection**

Le système de guards de connexion assure une gestion intelligente de la connexion backend pour **éliminer complètement** les appels API inutiles et les logs d'erreur quand le backend est déconnecté.

#### **✅ Fonctionnalités**
- **Zéro appel API** quand backend déconnecté
- **Zéro log d'erreur** inutile
- Interface utilisateur fluide avec fallbacks
- Gestion centralisée et intelligente

#### **🔧 Services Centralisés**

##### **Service de fichiers (`fileService.ts`)**
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

##### **Service d'emails (`emailService.ts`)**
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

#### **🎨 Composants avec Guards**
1. **`DiskSelector.tsx`** : Utilise `useFileService()`
2. **`UsageLimits.tsx`** : Utilise `useAuthUsageService()`
3. **`QueueIAAdvanced.tsx`** : Utilise `useAnalysisService()`
4. **`ConfigWindow.tsx`** : Utilise `useBackendConnection()`

### 🔄 Mode Priorité IA

#### **🎯 Vue d'ensemble**

Le **Mode Priorité IA** est un système intelligent qui permet d'utiliser plusieurs providers IA en cascade avec fallback automatique. Si un provider ne répond pas ou génère une erreur, le système bascule automatiquement vers le provider suivant dans la liste de priorité.

#### **🔧 Configuration des Providers**
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

#### **🔄 Logique de Fallback**
1. **Tentative Provider 1** : OpenAI (priorité 1)
2. **Si échec** → Provider 2 : Claude (priorité 2)
3. **Si échec** → Provider 3 : Ollama (priorité 3)
4. **Si tous échouent** → Erreur avec retry automatique

#### **📊 Métriques de Performance**
- **Temps de réponse** : < 2s pour le premier provider
- **Fallback automatique** : < 5s pour le provider suivant
- **Retry automatique** : 3 tentatives par provider
- **Cache intelligent** : Réutilisation des réponses similaires

### ⚙️ Configuration

#### **🔧 Configuration Backend**

##### **Variables d'Environnement**
```bash
# Base de données
DATABASE_URL=sqlite:///./docusense.db

# Sécurité
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Serveur
HOST=0.0.0.0
PORT=8000
DEBUG=False

# Logs
LOG_LEVEL=INFO
LOG_FILE=logs/docusense.log
```

##### **Configuration API Keys**
```json
{
  "openai_api_key": "sk-...",
  "anthropic_api_key": "sk-ant-...",
  "mistral_api_key": "mistral-...",
  "ollama_url": "http://localhost:11434"
}
```

#### **🔧 Configuration Frontend**

##### **Variables d'Environnement**
```bash
# API
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000

# Application
VITE_APP_NAME=DocuSense AI
VITE_APP_VERSION=1.0.0
VITE_DEBUG=false
```

##### **Configuration Tailwind**
```javascript
// tailwind.config.js
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

### 🧪 Tests et Validation

#### **🧪 Tests Disponibles**

##### **Tests Backend**
```bash
# Tests unitaires
cd backend
venv\Scripts\python.exe -m pytest tests/

# Tests spécifiques
venv\Scripts\python.exe tests/test_priority_mode.py
venv\Scripts\python.exe tests/test_logs_performance.py
venv\Scripts\python.exe tests/performance_test.py
```

##### **Tests Frontend**
```bash
# Tests unitaires
cd frontend
npm test

# Tests E2E
npm run test:e2e
```

#### **🔍 Validation**

##### **Types TypeScript**
- **Validation compile-time** : Tous les types sont validés
- **Interfaces strictes** : Pas de types `any` non nécessaires
- **Guards de type** : Validation runtime pour les données externes

##### **Pydantic Models**
- **Validation runtime** : Toutes les données API sont validées
- **Schémas stricts** : Validation automatique des entrées
- **Sérialisation** : Conversion automatique JSON ↔ Python

##### **Guards de Connexion**
- **Validation état** : Vérification avant chaque appel API
- **Fallbacks intelligents** : Valeurs de secours appropriées
- **Logging stratégique** : Warnings pour requêtes bloquées

### 🐛 Dépannage

#### **❌ Problèmes Courants**

##### **Environnement Virtuel Manquant**
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

##### **Ports Déjà Utilisés**
```powershell
# Solution automatique
.\docusense.ps1 cleanup
.\docusense.ps1 start

# Solution manuelle
taskkill /F /IM python.exe /T
taskkill /F /IM node.exe /T
```

##### **Base de Données Corrompue**
```powershell
# Diagnostic
.\docusense.ps1 status

# Optimisation automatique
.\docusense.ps1 cleanup
.\docusense.ps1 start
```

##### **Lecteur Vidéo Ne Fonctionne Pas**
```bash
# Vérifier les dépendances multimédia
cd backend
venv\Scripts\pip.exe install ffmpeg-python av pytube yt-dlp

# Vérifier FFmpeg
ffmpeg -version

# Tester le streaming
curl http://localhost:8000/api/files/stream-by-path/[chemin_fichier]
```

#### **📊 Logs et Diagnostic**

##### **Logs Backend**
- **Application** : `backend/logs/docusense.log`
- **Erreurs** : `backend/logs/docusense_error.log`
- **Nettoyage automatique** : Toutes les 6h, max 10MB par fichier

##### **Logs Frontend**
- **Console** : Logs structurés avec `logService`
- **Événements** : Envoi automatique au backend
- **Erreurs** : Capture et logging centralisé

#### **🔧 Outils de Diagnostic**

##### **Scripts PowerShell**
```powershell
# Diagnostic automatique
.\docusense.ps1 status

# Surveillance continue
.\docusense.ps1 monitor

# Nettoyage complet
.\docusense.ps1 cleanup
```

##### **API de Diagnostic**
- **API Docs** : http://localhost:8000/docs
- **Health Check** : http://localhost:8000/api/health
- **Performance** : http://localhost:8000/api/monitoring/performance

#### **📈 Performance et Monitoring**

##### **Métriques Actuelles**
- **Bundle Frontend** : ~1.8MB
- **Temps de chargement** : ~1.5s
- **Requêtes DB** : ~8 par page
- **Code dupliqué** : ~5%

##### **Optimisations Actives**
- **Service API unifié** : 68% de réduction de code
- **Guards de connexion** : Zéro appel inutile
- **Cache localStorage** : Données fréquentes
- **Bundle splitting** : Chargement optimisé

---

## 🚀 Scripts d'Automatisation

### **📁 Script Principal**

#### **Utilisation**
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

#### **Fonctionnalités**
- **start** : Démarrage complet avec vérification des ports
- **stop** : Arrêt forcé des processus Python et Node.js
- **restart** : Redémarrage automatique complet
- **cleanup** : Nettoyage forcé de tous les processus
- **monitor** : Surveillance en temps réel (60 secondes)
- **status** : État des processus et ports en temps réel

### **🔧 Scripts Backend**

| Script | Fonction |
|--------|----------|
| `create_admin.py` | Créer un utilisateur administrateur |
| `cleanup_database.py` | Nettoyer et optimiser la base de données |
| `update_permissions.py` | Mettre à jour les permissions utilisateurs |
| `init_database.py` | Initialiser la base de données |
| `create_master_user.py` | Créer un utilisateur maître |
| `remove_user.py` | Supprimer un utilisateur |
| `reset_user_passwords.py` | Réinitialiser les mots de passe |

---

## 📞 Support

### **🔗 Ressources**
- **API Docs** : http://localhost:8000/docs
- **Documentation complète** : `docs/README.md`
- **Guide utilisateur** : `docs/GUIDE_UTILISATEUR.md`
- **Guide développeur** : `docs/GUIDE_DEVELOPPEUR.md`
- **Services et API** : `docs/SERVICES_API.md`
- **Base de données** : `docs/BASE_DONNEES.md`
- **Interface utilisateur** : `docs/INTERFACE_UTILISATEUR.md`
- **Déploiement** : `docs/DEPLOIEMENT.md`
- **Issues** : GitHub Issues pour les bugs et demandes
- **Discussions** : GitHub Discussions pour les questions générales

### **🎯 Optimisations Récentes**
- ✅ Système de logs unifié
- ✅ Guards de connexion backend
- ✅ Cache avancé avec TTL
- ✅ Scripts PowerShell unifiés
- ✅ Nettoyage et organisation du code
- ✅ Tests organisés
- ✅ Documentation centralisée

---

## 🎉 Remerciements

Merci à tous les contributeurs qui participent au développement de DocuSense AI !

**DocuSense AI** - L'analyse intelligente de documents, simplifiée et optimisée. 🚀
