# 📖 Documentation DocuSense AI

## 🎯 Vue d'ensemble

Bienvenue dans la documentation complète de **DocuSense AI**, la plateforme d'analyse intelligente de documents avec interface épurée et IA avancée pour le secteur de la construction.

## 📁 Structure de la Documentation

### 👥 **Pour les Utilisateurs**
- **[📋 Documentation Utilisateur](users/README.md)** - Guide complet pour utilisateurs
- **[🚀 Guide Utilisateur](users/GUIDE_UTILISATEUR.md)** - Guide complet d'utilisation
- **[⚡ Démarrage Rapide](users/DEMARRAGE_RAPIDE.md)** - Installation et premiers pas
- **[🐛 Dépannage](users/DEPANNAGE.md)** - Problèmes courants et solutions

### 💻 **Pour les Développeurs**
- **[📋 Documentation Développeur](developers/README.md)** - Guide complet pour développeurs
- **[🏗️ Architecture](developers/ARCHITECTURE.md)** - Architecture système et composants
- **[🔧 Services Backend](developers/SERVICES.md)** - Documentation complète des services
- **[🔌 API Reference](developers/API_REFERENCE.md)** - Documentation des endpoints
- **[🗄️ Base de Données](developers/BASE_DONNEES.md)** - Schéma et gestion des données
- **[🚀 Déploiement](developers/DEPLOIEMENT.md)** - Installation et configuration
- **[🧪 Tests](developers/TESTS.md)** - Tests et qualité du code

### 🎨 **Interface Utilisateur**
- **[📋 Documentation UI](ui/README.md)** - Guide complet de l'interface utilisateur
- **[🔘 Composants Button](ui/README_Button.md)** - Documentation des boutons
- **[📊 Composants Table](ui/README_UnifiedTable.md)** - Documentation des tableaux unifiés

### 🔧 **Système et Maintenance**
- **[📋 Documentation Système](system/README.md)** - Guide complet du système
- **[📝 Logs](system/README_Logs.md)** - Gestion des logs système
- **[📦 Archive Logs](system/README_Logs_Archive.md)** - Archivage des logs
- **[🛠️ Scripts](system/README_Scripts.md)** - Scripts utilitaires
- **[🔧 Maintenance](system/README_Maintenance_Optimisation.md)** - Procédures de maintenance

### 📚 **Références**
- **[📋 Documentation de Référence](reference/README.md)** - Guide complet des références
- **[📄 Documents de Référence](reference/README_Reference_Documents.md)** - Documents de référence
- **[🗄️ Gestionnaire Base de Données](reference/README_Database_Manager.md)** - Interface de gestion BDD
- **[⚙️ Implémentation Référence](reference/README_Implementation_Reference.md)** - Implémentation des documents de référence

### 🔮 **Roadmap et Améliorations**
- **[📋 Documentation Roadmap](roadmap/README.md)** - Guide complet de la roadmap
- **[🚀 Améliorations Futures](roadmap/AMELIORATIONS_FUTURES.md)** - Roadmap technique et stratégie commerciale
- **[📈 Stratégie Commerciale](roadmap/README_Strategie_Commerciale_Developpement.md)** - Stratégie commerciale et développement

### 📋 **Production et Standards**
- **[📋 Documentation Production](production/README.md)** - Guide complet de production
- **[✅ Checklist Production](production/CHECKLIST.md)** - Checklist de déploiement
- **[🏭 Standards Production](production/STANDARDS.md)** - Standards de production
- **[🐳 Guide Docker Production](production/DOCKER_GUIDE.md)** - Déploiement avec Docker

### 🔍 **Audit et Qualité**
- **[📊 Audit Complet](audit/AUDIT_COMPLET.md)** - État actuel et recommandations
- **[📋 Recommandations](audit/IMPLEMENTATION_RECOMMANDATIONS.md)** - Recommandations d'implémentation et état d'avancement
- **[⚙️ Configuration Audit](audit/audit-config.json)** - Configuration du système d'audit
- **[🔧 Optimisation](audit/README_Optimisation_Audit_System.md)** - Optimisation audit et système
- **[📋 Implémentation](audit/IMPLEMENTATION_RECOMMANDATIONS.md)** - Recommandations d'implémentation

### 🎥 **Présentation et Marketing**
- **[📋 Kit de Présentation](presentation/README.md)** - Kit complet pour vidéo de présentation
- **[🎬 Script Principal](presentation/script/script_principal.md)** - Script narratif de la vidéo
- **[🎨 Storyboard](presentation/script/storyboard.md)** - Découpage visuel détaillé
- **[🎯 Points Clés](presentation/script/points_cles.md)** - Messages essentiels à transmettre
- **[🚀 Fonctionnalités](presentation/content/fonctionnalites.md)** - Description des fonctionnalités
- **[🏗️ Cas d'Usage](presentation/content/cas_usage.md)** - Exemples concrets d'utilisation
- **[🔒 Sécurité](presentation/content/securite.md)** - Aspects sécurité et conformité
- **[🎨 Guide de Style](presentation/specifications/style_guide.md)** - Standards visuels
- **[📋 Spécifications](presentation/specifications/requirements.md)** - Exigences techniques

## 🚀 Démarrage Rapide

### Option 1 : Menu interactif (recommandé)
```powershell
.\scripts\main.ps1
```

### Option 2 : Démarrage direct
```powershell
# Démarrage complet avec menu interactif
.\scripts\startup\docusense.ps1

# Démarrage simple
.\scripts\startup\start.ps1
```

### Option 3 : Commandes manuelles
```powershell
# Backend
cd backend
venv\Scripts\python.exe main.py

# Frontend (dans un autre terminal)
cd frontend
npm run dev
```

### Option 4 : Déploiement Production avec Docker
```bash
# Configuration
cp env.production.example .env
# Éditer .env avec vos valeurs

# Déploiement
docker-compose up -d

# Vérification
docker-compose ps
curl http://localhost:8000/health
```

**📖 [Guide Docker Production complet](production/DOCKER_GUIDE.md)**

## 📊 Vérification du Statut

```powershell
# Vérification rapide
.\scripts\monitoring\status.ps1

# Ou via le menu principal
.\scripts\main.ps1
```

## 🧪 Tests

```powershell
# Tests backend
cd tests && ..\backend\venv\Scripts\python.exe run_all_tests.py

# Tests de sécurité
cd tests && ..\backend\venv\Scripts\python.exe backend\test_security.py

# Tests frontend (après configuration)
.\scripts\setup-frontend-tests.ps1
.\scripts\test-frontend.ps1

# Audit complet
.\scripts\testing\test-audit.ps1
```

## 🧹 Maintenance

```powershell
# Nettoyage général
.\scripts\maintenance\cleanup.ps1

# Nettoyage base de données
.\scripts\maintenance\database_cleanup.ps1
```

## 🔧 Utilitaires

```powershell
# Téléchargement documents de référence
python scripts/utils/download_reference_documents.py
```

## ✨ Fonctionnalités Principales

### 🎯 Interface Épurée et Intuitive
- **Affichage automatique** selon le type de fichier
- **Actions simplifiées** avec icônes minimales
- **Navigation fluide** et responsive

### 📁 Support Multi-Formats Complet
- **Documents** : PDF, DOCX, PPTX, XLSX, TXT, RTF, MD, CSV
- **Images** : 43 formats (JPG, PNG, GIF, WebP, HEIC, SVG, TIFF, BMP, ICO, RAW...)
- **Vidéos** : 39 formats (MP4, AVI, MOV, WMV, FLV, WebM, MKV...)
- **Audio** : 37 formats (MP3, WAV, FLAC, AAC, OGG, WMA...)

### 🤖 Analyse IA Avancée
- **Multi-providers** : OpenAI, Claude, Ollama, Local
- **Système de priorité** : Auto/Manuel
- **Queue d'analyses** : Traitement en arrière-plan
- **Streams temps réel** : Mise à jour instantanée

### 🔐 Sécurité et Authentification
- **JWT Tokens** sécurisés
- **Gestion des rôles** : Invité, Utilisateur, Admin
- **Rate limiting** et protection CORS
- **Logs structurés** et monitoring

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

## 📊 Métriques de Performance

### Standards de Production
- **Temps de réponse** : < 500ms (95e percentile)
- **Disponibilité** : > 99.9%
- **Taux d'erreur** : < 1%
- **Utilisation ressources** : < 80%

## 🌐 Accès

### Développement Local
- **Frontend :** http://localhost:3000
- **Backend :** http://localhost:8000
- **API Documentation :** http://localhost:8000/docs

### Production Docker
- **Frontend :** http://localhost:3000
- **Backend :** http://localhost:8000
- **Nginx :** http://localhost:80
- **Prometheus :** http://localhost:9090
- **Grafana :** http://localhost:3001

## ⚠️ Prérequis

### Développement Local
- Python 3.8+
- Node.js 16+
- PowerShell 7+
- Environnement virtuel Python activé

### Production Docker
- Docker & Docker Compose
- 8GB+ RAM
- 100GB+ espace disque

## 🔗 Liens Rapides

- **[🚀 Améliorations Futures](roadmap/AMELIORATIONS_FUTURES.md)** - Roadmap technique et stratégie commerciale
- **[🚀 Démarrage Rapide](users/DEMARRAGE_RAPIDE.md)**
- **[🏗️ Architecture](developers/ARCHITECTURE.md)**
- **[🔧 Services Backend](developers/SERVICES.md)**
- **[🔌 API Reference](developers/API_REFERENCE.md)**
- **[🐳 Docker Production](production/DOCKER_GUIDE.md)**
- **[✅ Checklist Production](production/CHECKLIST.md)**

---

*Dernière mise à jour : Août 2025 - Documentation v2.4 - Consolidation complète* 