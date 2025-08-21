# 🏗️ Architecture Complète - DocuSense AI

## 📋 **Vue d'ensemble du système**

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

## 🔄 **Flux d'authentification**

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

## 📁 **Gestion des fichiers**

### **Navigation des fichiers**
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

### **Analyse de fichiers**
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

## 🤖 **Système d'analyse IA**

### **Configuration des providers**
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

### **Queue d'analyses**
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
│ start       │    │ queue       │    │ process     │    │ status      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 📧 **Gestion des emails**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ EmailViewer │    │ EmailParser │    │ Attachment  │    │ Email       │
│             │    │ Service     │    │ Handler     │    │ Display     │
│             │    │             │    │             │    │             │
│ parseEmail()│───►│ parseFile() │───►│ extract()   │───►│ render()    │
│ .eml File   │    │ MIME Parse  │    │ Attachments │    │ HTML/Text   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ /api/emails/│    │ /api/emails/│    │ /api/emails/│    │ /api/emails/│
│ parse       │    │ preview     │    │ attachment  │    │ display     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 🛡️ **Système de sécurité et logging**

### **Middleware de sécurité**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Request     │    │ Auth        │    │ Logging     │    │ Security    │
│ Incoming    │    │ Middleware  │    │ Middleware  │    │ Detector    │
│             │    │             │    │             │    │             │
│ HTTP Request│───►│ JWT Verify  │───►│ Log Event   │───►│ Detect      │
│             │    │ User Check  │    │ Database    │    │ Threats     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ FastAPI     │    │ /api/auth/  │    │ SystemLogs  │    │ Security    │
│ Router      │    │ verify      │    │ Table       │    │ Events      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### **Monitoring et logs**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ LogService  │    │ SystemLog   │    │ LogViewer   │    │ Admin       │
│ (Frontend)  │    │ Service     │    │ Component   │    │ Dashboard   │
│             │    │             │    │             │    │             │
│ logEvent()  │───►│ createLog() │───►│ getLogs()   │───►│ viewLogs()  │
│ User Action │    │ Database    │    │ Filter/Sort │    │ Analytics   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ /api/system-│    │ /api/system-│    │ /api/system-│    │ /api/admin/ │
│ logs/event  │    │ logs/create │    │ logs/list   │    │ logs        │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 🔌 **Gestion de la connexion**

### **Connection Guards**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ useBackend  │    │ useBackend  │    │ Conditional │    │ Service     │
│ Status      │    │ Connection  │    │ Request     │    │ Wrappers    │
│             │    │             │    │             │    │             │
│ checkHealth │───►│ canMakeReq  │───►│ conditional │───►│ API Calls   │
│ Health API  │    │ State Mgmt  │    │ Request()   │    │ Protected   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ /api/health │    │ Connection  │    │ Fallback    │    │ useFile     │
│ Endpoint    │    │ State       │    │ Values      │    │ Service     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 📊 **Stores et état global**

### **Zustand Stores**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ AuthStore   │    │ ConfigStore │    │ Analysis    │    │ FileStore   │
│             │    │             │    │ Store       │    │             │
│             │    │             │    │             │    │             │
│ user, token │    │ providers   │    │ queue,      │    │ files,      │
│ login/logout│    │ priorities  │    │ status      │    │ selection   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ UIStore     │    │ PromptStore │    │ Backend     │    │ UIState     │
│             │    │             │    │ Connection  │    │             │
│ modals,     │    │ prompts,    │    │ Store       │    │ theme,      │
│ panels      │    │ templates   │    │ connection  │    │ layout      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 🎯 **Points d'optimisation identifiés**

### **1. Doublons potentiels**
- ❌ **Services API** : `fileService.ts` vs `analysisService.ts` - fonctions similaires
- ❌ **Middleware** : `AuthMiddleware` vs `LoggingMiddleware` - logique d'auth répétée
- ❌ **Validation** : Validation de fichiers dans plusieurs endroits

### **2. Code mort potentiel**
- ❌ **Ancien système d'auth** : `security_manager` supprimé mais références restantes
- ❌ **Fonctions de duplication** : Supprimées mais composants UI encore présents
- ❌ **Logs de debug** : Nombreux `console.log` non nettoyés

### **3. Refactorisation possible**
- 🔄 **Services centralisés** : Unifier tous les services API
- 🔄 **Validation centralisée** : Créer un système de validation unifié
- 🔄 **Error handling** : Standardiser la gestion d'erreurs
- 🔄 **Type definitions** : Centraliser les types TypeScript

### **4. Sécurité à renforcer**
- 🔒 **Rate limiting** : Limiter les appels API par utilisateur
- 🔒 **Input validation** : Validation plus stricte des entrées
- 🔒 **CORS policy** : Configurer CORS de manière plus restrictive
- 🔒 **SQL injection** : Vérifier toutes les requêtes SQL
- 🔒 **File upload** : Validation plus stricte des fichiers uploadés

## 📈 **Métriques de performance**

### **Backend**
- **Endpoints** : ~25 endpoints API
- **Middleware** : 3 middlewares actifs
- **Services** : 8 services principaux
- **Base de données** : 6 tables principales

### **Frontend**
- **Composants** : ~30 composants React
- **Hooks** : 8 hooks personnalisés
- **Stores** : 7 stores Zustand
- **Services** : 5 services API

## 🚀 **Recommandations d'optimisation**

### **Priorité Haute**
1. **Unifier les services API** - Éliminer les doublons
2. **Centraliser la validation** - Système unifié
3. **Nettoyer le code mort** - Supprimer les références inutiles
4. **Standardiser l'error handling** - Gestion d'erreurs uniforme

### **Priorité Moyenne**
1. **Optimiser les requêtes DB** - Index et requêtes
2. **Améliorer le caching** - Cache des données fréquentes
3. **Réduire les re-renders** - Optimisation React
4. **Bundle optimization** - Réduire la taille du bundle

### **Priorité Basse**
1. **Tests unitaires** - Couverture de tests
2. **Documentation** - Documentation API
3. **Monitoring** - Métriques de performance
4. **CI/CD** - Pipeline de déploiement

---

## 🎯 **Conclusion**

L'architecture est **solide** mais présente des **opportunités d'optimisation** importantes. Les guards de connexion et le système de logging sont **excellents**, mais il faut **nettoyer les doublons** et **centraliser les services** pour une maintenance optimale.
