# 🔧 Services et API - DocuSense AI

## 📊 Architecture des Services

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

## 🔧 Services Backend

| Service | Fichier | Responsabilité |
|---------|---------|----------------|
| **FileService** | `file_service.py` | Gestion des fichiers et répertoires |
| **AnalysisService** | `analysis_service.py` | Traitement des analyses IA |
| **AIService** | `ai_service.py` | Intégration providers IA |
| **ConfigService** | `config_service.py` | Gestion de la configuration |
| **AuthService** | `auth_service.py` | Authentification et autorisation |
| **EmailService** | `email_parser_service.py` | Parsing et traitement emails |
| **PDFService** | `pdf_generator_service.py` | Génération de PDFs |
| **MultimediaService** | `multimedia_service.py` | Analyse fichiers multimédia |
| **OCRService** | `ocr_service.py` | Reconnaissance de texte |
| **DownloadService** | `download_service.py` | Téléchargement de fichiers |
| **PromptService** | `prompt_service.py` | Gestion des prompts |
| **SystemLogService** | `system_log_service.py` | Logs système |
| **SecureStreamingService** | `secure_streaming_service.py` | Streaming sécurisé |
| **DocumentExtractorService** | `document_extractor_service.py` | Extraction de contenu |
| **OfficeViewerService** | `office_viewer_service.py` | Visualisation Office |
| **VideoConverterService** | `video_converter_service.py` | Conversion vidéo |

## 🔧 Hooks Frontend

| Service | Fichier | Fonctions Principales |
|---------|---------|----------------------|
| **Authentication** | `useAuthService.ts` | `login`, `register`, `loginAsGuest`, `refreshAccessToken` |
| **Configuration** | `useConfigService.ts` | `getAIProviders`, `saveAPIKey`, `testProvider`, `setProviderPriority` |
| **Prompts** | `usePromptService.ts` | `getSpecializedPrompts`, `getDefaultPrompts`, `getPromptsByDomain` |
| **Analyses** | `useAnalysisService.ts` | `getAnalysesList`, `createAnalysis`, `retryAnalysis`, `deleteAnalysis` |
| **Files** | `useFileService.ts` | `getDrives`, `listDirectory`, `analyzeDirectory`, `streamByPath` |
| **Emails** | `useEmailService.ts` | `parseEmail`, `getEmailAttachmentPreview` |
| **Admin** | `useAdminService.ts` | `getSystemLogs`, `getPerformanceMetrics`, `healthCheck` |
| **Backend Connection** | `useBackendConnection.ts` | `conditionalRequest`, `isOnline`, `canMakeRequests` |
| **Backend Status** | `useBackendStatus.ts` | `checkBackendStatus`, `getConnectionStatus` |
| **Auth Usage** | `useAuthUsageService.ts` | `getUsageLimits`, `checkUsageStatus` |

## 📁 API Endpoints

### Gestion des Fichiers
| Endpoint | Méthode | Fonction |
|----------|---------|----------|
| `/api/files/drives` | GET | `getDrives()` - Récupérer les disques |
| `/api/files/list/{path}` | GET | `listDirectory()` - Lister répertoire |
| `/api/files/analyze-directory` | POST | `analyzeDirectory()` - Analyser répertoire |
| `/api/files/directory-files/{path}` | GET | `getDirectoryFiles()` - Fichiers du répertoire |
| `/api/files/stream-by-path/{path}` | GET | `streamByPath()` - Streamer fichier |
| `/api/files/download/{id}` | GET | `downloadFile()` - Télécharger fichier |

### Analyses IA
| Endpoint | Méthode | Fonction |
|----------|---------|----------|
| `/api/analysis/list` | GET | `getAnalysesList()` - Liste analyses |
| `/api/analysis/create` | POST | `createAnalysis()` - Créer analyse |
| `/api/analysis/{id}/retry` | POST | `retryAnalysis()` - Relancer analyse |
| `/api/analysis/{id}` | DELETE | `deleteAnalysis()` - Supprimer analyse |
| `/api/analysis/{id}` | GET | `getAnalysisById()` - Récupérer analyse |

### Configuration
| Endpoint | Méthode | Fonction |
|----------|---------|----------|
| `/api/config/ai/providers` | GET | `getAIProviders()` - Providers IA |
| `/api/config/ai/providers` | POST | `setAIProviders()` - Configurer providers |
| `/api/config/ai/test` | POST | `testProvider()` - Tester provider |
| `/api/config/ui` | GET | `getUIConfig()` - Configuration UI |

### Emails
| Endpoint | Méthode | Fonction |
|----------|---------|----------|
| `/api/emails/parse/{path}` | GET | `parseEmail()` - Parser email |
| `/api/emails/attachment-preview/{path}` | GET | `getEmailAttachmentPreview()` - Aperçu pièce jointe |

### PDFs
| Endpoint | Méthode | Fonction |
|----------|---------|----------|
| `/api/pdf-files/generate/{id}` | POST | `generatePDF()` - Générer PDF |
| `/api/pdf-files/generate-all` | POST | `generateAllCompletedPDFs()` - Générer tous les PDFs |
| `/api/pdf-files/download/{id}` | GET | `downloadPDF()` - Télécharger PDF |

### Monitoring
| Endpoint | Méthode | Fonction |
|----------|---------|----------|
| `/api/monitoring/performance` | GET | `getPerformanceMetrics()` - Métriques performance |
| `/api/monitoring/health` | GET | `healthCheck()` - Vérification santé |
| `/api/logs/system` | GET | `getSystemLogs()` - Logs système |

### Authentification
| Endpoint | Méthode | Fonction |
|----------|---------|----------|
| `/api/auth/login` | POST | `login()` - Connexion utilisateur |
| `/api/auth/register` | POST | `register()` - Inscription utilisateur |
| `/api/auth/guest` | POST | `loginAsGuest()` - Connexion invité |
| `/api/auth/refresh` | POST | `refreshAccessToken()` - Rafraîchir token |

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

## 📊 Services Frontend

### Services API
| Service | Fichier | Fonctions |
|---------|---------|-----------|
| **UnifiedApiService** | `unifiedApiService.ts` | Service central avec 50+ méthodes, guards intégrés |
| **LogService** | `logService.ts` | Logging structuré et gestion des erreurs |
| **PDFService** | `pdfService.ts` | Gestion des PDFs générés |
| **AnalysisFileService** | `analysisFileService.ts` | Gestion des fichiers d'analyse |
| **SecureStreamingService** | `secureStreamingService.ts` | Streaming sécurisé des fichiers |
| **DownloadService** | `downloadService.ts` | Téléchargement de fichiers |
| **MultimediaService** | `multimediaService.ts` | Gestion des fichiers multimédia |

### Hooks Spécialisés
| Hook | Fichier | Fonction |
|------|---------|----------|
| **useThemeSync** | `useThemeSync.ts` | Synchronisation du thème |
| **useTypography** | `useTypography.ts` | Gestion de la typographie |
| **useStartupInitialization** | `useStartupInitialization.ts` | Initialisation au démarrage |
| **useConfirmDialog** | `useConfirmDialog.ts` | Dialogues de confirmation |
| **usePageTitle** | `usePageTitle.ts` | Gestion des titres de page |
| **useViewportHeight** | `useViewportHeight.ts` | Gestion de la hauteur viewport |
| **useFileOperations** | `useFileOperations.ts` | Opérations sur les fichiers |
| **useTheme** | `useTheme.ts` | Gestion du thème |
| **useColors** | `useColors.ts` | Gestion des couleurs |
| **useConditionalInterval** | `useConditionalInterval.ts` | Intervalles conditionnels |
