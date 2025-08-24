# 🏗️ Architecture - DocuSense AI

## 📋 Vue d'ensemble du système

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DOCUSENSE AI                                       │
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │   FRONTEND      │    │    BACKEND      │    │   BASE DE       │            │
│  │   (React/TS)    │◄──►│   (FastAPI)     │◄──►│   DONNÉES      │            │
│  │   Port: 3000    │    │   Port: 8000    │    │   (SQLite)      │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Flux d'authentification

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │   Database  │    │   JWT Token │
│             │    │             │    │             │    │             │
│ AuthModal   │───►│ /api/auth/  │───►│ Users Table │───►│ Token Store │
│ Login Form  │    │ login       │    │ Validation  │    │ LocalStorage│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ AuthStore   │    │ JWT Verify  │    │ Role Check  │    │ Auth Header │
│ (Zustand)   │    │ Middleware  │    │ Permissions │    │ All Requests│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 📁 Gestion des fichiers

### Navigation des fichiers
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ DiskSelector│    │ FileTree    │    │ FileList    │    │ FileViewer  │
│             │    │             │    │             │    │             │
│ getDrives() │───►│ listDir()   │───►│ getFiles()  │───►│ streamFile()│
│ Drives API  │    │ Directory   │    │ File Info   │    │ File Content│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ /api/files/ │    │ /api/files/ │    │ /api/files/ │    │ /api/files/ │
│ drives      │    │ list/{path} │    │ info/{id}   │    │ stream/{id} │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Analyse de fichiers
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ FileManager │    │ Analysis    │    │ AI Provider │    │ PDF Gen     │
│             │    │ Service     │    │ Service     │    │ Service     │
│ selectFile()│───►│ create()    │───►│ process()   │───►│ generate()  │
│ File Upload │    │ Analysis DB │    │ AI Models   │    │ PDF Output  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ /api/files/ │    │ /api/       │    │ /api/config/│    │ /api/pdf-   │
│ upload      │    │ analysis/   │    │ providers   │    │ files/      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 🤖 Système d'analyse IA

### Configuration des providers
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ ConfigWindow│    │ ConfigStore │    │ AI Provider │    │ Priority    │
│             │    │             │    │ Manager     │    │ System      │
│ testProvider│───►│ saveConfig()│───►│ validate()  │───►│ setPriority()│
│ API Keys    │    │ Zustand     │    │ Connection  │    │ Auto/Manual │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ /api/config/│    │ /api/config/│    │ /api/config/│    │ /api/config/│
│ test        │    │ save        │    │ providers   │    │ priority    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Queue d'analyses
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ QueueIA     │    │ Analysis    │    │ Background  │    │ Status      │
│ Advanced    │    │ Queue       │    │ Worker      │    │ Monitor     │
│             │    │             │    │             │    │             │
│ startAnalysis│───►│ addToQueue()│───►│ processNext()│───►│ updateStatus()│
│ User Action │    │ Database    │    │ AI Service  │    │ Real-time   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ /api/       │    │ /api/       │    │ /api/       │    │ /api/       │
│ analysis/   │    │ analysis/   │    │ analysis/   │    │ analysis/   │
│ start       │    │ queue       │    │ status      │    │ results     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 🏗️ Architecture Technique

### Stack Technologique
- **Frontend** : React + TypeScript + Tailwind CSS
- **Backend** : FastAPI + Python 3.8+
- **Base de données** : SQLite (dev) / PostgreSQL (prod)
- **Cache** : Redis (production)
- **Authentification** : JWT + OAuth2

### Composants Principaux
- **API REST** : Endpoints sécurisés et documentés
- **Streams SSE** : Communication temps réel
- **Système de fichiers** : Gestion multi-formats
- **Queue d'analyses** : Traitement asynchrone
- **Interface admin** : Gestion utilisateurs et système

## 📊 État Actuel de l'Application

### Points forts identifiés
- ✅ **Guards de connexion** - Système robuste de protection
- ✅ **Logging sécurisé** - Logs en base de données avec détection d'événements
- ✅ **Architecture modulaire** - Séparation claire des responsabilités
- ✅ **Interface utilisateur** - Design cohérent et responsive

### Points d'amélioration critiques
- ❌ **Doublons de code** - Services API redondants
- ❌ **Code mort** - Références à l'ancien système d'auth
- ❌ **Validation dispersée** - Logique de validation répétée
- ❌ **Gestion d'erreurs** - Pas de standardisation

## 🧹 Optimisations Identifiées

### 1. DOUBLONS À ÉLIMINER

#### Services API redondants
```typescript
// ❌ PROBLÈME : Doublons entre services
fileService.ts:     getFiles(), listDirectory(), downloadFile()
analysisService.ts: getFiles(), listDirectory(), downloadFile()
emailService.ts:    parseEmail(), getAttachment()
```

**Solution : Créer un service unifié**
```typescript
// ✅ SOLUTION : Service API unifié
unifiedApiService.ts:
- getFiles(path: string)
- listDirectory(path: string) 
- downloadFile(id: string)
- parseEmail(path: string)
- getAttachment(path: string, index: number)
```

#### Middleware redondants
```python
# ❌ PROBLÈME : Logique d'auth répétée
AuthMiddleware:     get_current_user_jwt()
LoggingMiddleware:  get_current_user_from_request()
```

**Solution : Centraliser l'authentification**
```python
# ✅ SOLUTION : Service d'auth centralisé
auth_service.py:
- get_current_user(request, db)
- verify_token(token)
- check_permissions(user, resource)
```

### 2. CODE MORT À NETTOYER

#### Références à l'ancien système
```typescript
// ❌ À SUPPRIMER
import { security_manager } from './old_auth'  // Supprimé
console.log('Debug:', data)  // Logs de debug
```

#### Fonctions supprimées mais UI restante
```typescript
// ❌ PROBLÈME : Boutons de duplication encore présents
<button onClick={duplicateAnalysis}>  // Fonction supprimée
```

**Actions à effectuer :**
1. **Supprimer** toutes les références à `security_manager`
2. **Nettoyer** tous les `console.log` de debug
3. **Retirer** les boutons de duplication des composants UI
4. **Vérifier** les imports inutilisés

### 3. REFACTORISATION MAJEURE

#### A. Service API unifié
```typescript
// Nouveau fichier : frontend/src/services/unifiedApiService.ts
export class UnifiedApiService {
  // Fichiers
  async getFiles(path: string) { /* ... */ }
  async listDirectory(path: string) { /* ... */ }
  async downloadFile(id: string) { /* ... */ }
  
  // Analyses
  async createAnalysis(fileId: string) { /* ... */ }
  async getAnalysisStatus(id: string) { /* ... */ }
  async deleteAnalysis(id: string) { /* ... */ }
  
  // Emails
  async parseEmail(path: string) { /* ... */ }
  async getAttachment(path: string, index: number) { /* ... */ }
  
  // Configuration
  async testProvider(name: string, key?: string) { /* ... */ }
  async saveProviderConfig(name: string, config: any) { /* ... */ }
}
```

#### B. Service d'authentification centralisé
```python
# Nouveau fichier : backend/app/services/auth_service.py
class AuthService:
    def get_current_user(self, request: Request, db: Session) -> User:
        # Logique centralisée d'authentification
        pass
    
    def verify_token(self, token: str) -> dict:
        # Vérification centralisée des tokens
        pass
    
    def check_permissions(self, user: User, resource: str) -> bool:
        # Vérification centralisée des permissions
        pass
```

#### C. Validation unifiée
```python
# Nouveau fichier : backend/app/utils/validators.py
class UnifiedValidator:
    def validate_file_path(self, path: str) -> bool:
        # Validation centralisée des chemins de fichiers
        pass
    
    def validate_analysis_request(self, request: dict) -> bool:
        # Validation centralisée des requêtes d'analyse
        pass
```

## 🎯 Points d'optimisation identifiés

### Performance
1. **Cache intelligent** - Système de cache avec TTL
2. **Lazy loading** - Chargement à la demande
3. **Optimisation des requêtes** - Eager loading et index
4. **Compression** - Gzip pour les réponses API

### Sécurité
1. **Rate limiting** - Protection contre les abus
2. **Validation stricte** - Validation de tous les inputs
3. **Logs sécurisés** - Masquage des données sensibles
4. **Audit trail** - Traçabilité complète des actions

### Maintenabilité
1. **Tests unitaires** - Couverture de code
2. **Documentation API** - OpenAPI/Swagger
3. **Monitoring** - Métriques et alertes
4. **Logs structurés** - Format JSON pour l'analyse

## 🚀 Recommandations d'optimisation

### Priorité 1 (Critique)
1. **Éliminer les doublons** - Service API unifié
2. **Nettoyer le code mort** - Suppression des références obsolètes
3. **Centraliser l'authentification** - Service d'auth unifié

### Priorité 2 (Important)
1. **Optimiser les requêtes DB** - Index et eager loading
2. **Implémenter le cache** - Cache Redis pour les données fréquentes
3. **Standardiser la validation** - Validateurs unifiés

### Priorité 3 (Amélioration)
1. **Améliorer les tests** - Couverture de code
2. **Optimiser le frontend** - Lazy loading et code splitting
3. **Réduire les re-renders** - Optimisation React

## 📈 Métriques de Performance

### Standards de Production
- **Temps de réponse** : < 500ms (95e percentile)
- **Disponibilité** : > 99.9%
- **Taux d'erreur** : < 1%
- **Utilisation ressources** : < 80%

## 🔍 Monitoring et Observabilité

### Métriques à Surveiller
- **Temps de réponse API** - Latence des endpoints
- **Taux d'erreur** - Erreurs 4xx et 5xx
- **Utilisation CPU/Mémoire** - Ressources système
- **Temps de traitement IA** - Latence des analyses

### Logs Structurés
```json
{
  "timestamp": "2025-08-24T10:30:00Z",
  "level": "INFO",
  "service": "analysis",
  "user_id": "user123",
  "action": "create_analysis",
  "file_id": "file456",
  "duration_ms": 1250,
  "status": "success"
}
```

---

*Dernière mise à jour : Août 2025 - Architecture v2.0*
