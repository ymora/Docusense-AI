# DocuSense AI - Plateforme d'Analyse Intelligente de Documents

## 🚀 Vue d'ensemble

DocuSense AI est une plateforme moderne et robuste d'analyse intelligente de documents, conçue avec une architecture propre, maintenable et performante. Elle combine des technologies de pointe pour offrir une expérience utilisateur exceptionnelle.

## ✨ Fonctionnalités Principales

### 🔍 Analyse Intelligente
- **Extraction automatique** de données depuis tous types de documents
- **Classification intelligente** par domaine d'expertise (Juridique, Technique, Administratif, Général)
- **Comparaison de documents** avec détection de différences
- **Synthèse multi-documents** avec rapports structurés
- **Prompts spécialisés** par domaine d'expertise

### ⚖️ Vérification Normative
- **Conformité légale** automatique (Code civil, Code de commerce, etc.)
- **Vérification des normes techniques** (DTU, NF, EN, ISO)
- **Analyse réglementaire** (RE2020, RT2012, etc.)
- **Détection d'incohérences** et alertes de prescription

### 🤖 Assistance IA - Configuration Avancée
- **4 providers IA** : OpenAI, Claude, Mistral, Ollama (local)
- **6 stratégies de sélection** : Priority, Cost, Performance, Fallback, Quality, Speed
- **Système de priorité intelligent** : Recalcul automatique selon les providers actifs
- **Interface adaptative** : Priorités éditables en mode "Priority", automatiques pour les autres
- **Configuration adaptative** des clés API
- **Queue d'analyse** avec reprise automatique

### 📁 Gestion Avancée des Fichiers
- **Formats supportés** : pdf, docx, doc, txt, eml, msg, xlsx, xls, csv, jpg, jpeg, png, html
- **Visualisation intégrée** : Texte, images, audio, vidéo, documents
- **OCR intégré** pour documents scannés (en développement)
- **Statuts en temps réel** avec indicateurs visuels colorés
- **Navigation intuitive** avec sélecteur de disque et bouton retour parent

## 🎨 Interface Utilisateur

### 🖥️ Layout Principal
- **Panneau gauche redimensionnable** : Navigation dans l'arborescence des fichiers
- **Panneau principal** : Affichage des détails et résultats d'analyse
- **Panneaux latéraux** : Configuration IA, File d'attente, Analyses terminées

### 📂 Navigation des Fichiers
- **Sélecteur de disque** : Choix du disque physique à explorer
- **Bouton retour parent** : Navigation vers le dossier parent
- **Arborescence interactive** : Navigation intelligente avec séparation des actions
  - **Clic sur chevron** : Expansion/réduction du dossier pour voir son contenu
  - **Clic sur nom du dossier** : Navigation vers ce dossier (charge son contenu)
  - **Logs de debug** : Traçabilité complète de la navigation dans la console
- **Arborescence redimensionnable** avec gestion optimisée des ascenseurs
  - **Ascenseur unique** : Un seul ascenseur dans l'arborescence (pas de double ascenseur)
  - **Apparition automatique** : L'ascenseur n'apparaît que si le contenu dépasse la hauteur disponible
  - **Espace optimisé** : Suppression des paddings redondants pour maximiser l'espace d'affichage

### 🎯 Actions sur les Fichiers
- **Menu contextuel** : Clic droit pour accéder aux actions
- **Analyse IA** : Prompts spécialisés par domaine (Juridique, Technique, Administratif, Général)
- **Sélection multiple** : Clic pour sélectionner/désélectionner plusieurs fichiers
- **Actions de masse** : Boutons pour analyser, comparer ou retry tous les fichiers sélectionnés
- **Visualisation** : Un seul fichier à la fois (désactivée en sélection multiple)
- **Feedback visuel** : Encadrement fin, compteurs et messages d'aide contextuels
- **Visualisation** : Affichage intégré des fichiers

### 🎨 Design et UX
- **Thème sombre/clair** : Basculement automatique avec implémentation technique avancée
  - **Attribut data-theme** : `document.body.setAttribute('data-theme', 'light')` pour le mode jour
  - **CSS variables adaptatives** : Couleurs qui changent automatiquement selon le thème
  - **Icônes dynamiques** : Soleil pour passer en mode jour, lune pour passer en mode nuit
- **Icônes colorées** : Tous les éléments utilisent des couleurs cohérentes
  - **Fichiers et dossiers** : Couleur bleu clair uniforme pour tous les éléments
  - **Panneaux** : Couleurs synchronisées via variables CSS (violet, orange, vert)
  - **Thème adaptatif** : Couleurs qui s'adaptent automatiquement au mode jour/nuit
  - **Sélection** : Encadrement fin adaptatif au thème jour/nuit
- **Statuts visuels** : Points colorés pour indiquer l'état des fichiers
  - **Vert** : Analyse terminée
  - **Jaune** : En attente de traitement ou en pause (avec effet pulsant)
  - **Bleu** : En cours de traitement (avec effet pulsant)
  - **Rouge** : Échec
  - **Noir** : Format non supporté
- **Couleurs cohérentes** : Palette harmonieuse avec icônes colorées
- **Responsive design** : Adaptation mobile et desktop

### ⚙️ Panneaux de Configuration
- **Configuration IA** (Bleu) : Gestion des providers et stratégies
- **File d'attente** (Jaune) : Suivi des analyses en cours
- **Analyses terminées** (Vert) : Consultation des résultats
- **Synchronisation des couleurs** : Icônes et titres de panneaux harmonisés
- **Thème jour/nuit** : Basculement automatique avec icônes adaptées

## 🏗️ Architecture Technique

### Backend (Python FastAPI)
- **Framework** : FastAPI avec validation Pydantic
- **Base de données** : SQLAlchemy avec SQLite/PostgreSQL
- **IA Providers** : OpenAI, Anthropic, Mistral, Ollama
- **OCR** : Tesseract avec support français (en développement)
- **Cache** : Redis ou fichier JSON
- **Tests** : pytest avec couverture 80%+

#### 🔒 Sécurité Avancée
- **Rate Limiting** : Protection contre les attaques DDoS
- **CORS Restrictif** : Origines autorisées limitées
- **Clé secrète sécurisée** : Génération automatique 32+ caractères
- **Headers de sécurité** : XSS, CSRF protection
- **Trusted Host Middleware** : Protection contre host header attacks

#### ⚡ Performance Optimisée
- **Compression Gzip** : Réduction 60-80% de la bande passante
- **Monitoring temps réel** : Métriques de performance avec psutil
- **Request ID tracking** : Traçabilité complète des requêtes
- **Logging structuré** : Traçabilité et debugging avancés

#### 📁 Modules Centralisés
- `core/file_utils.py` : Gestion des formats et extraction d'informations
- `core/database_utils.py` : Utilitaires de base de données
- `core/status_manager.py` : Gestion des statuts et transitions
- `core/validation.py` : Validation et gestion d'erreurs
- `data/prompts.json` : Prompts IA centralisés et configurables

### Frontend (React TypeScript)
- **Framework** : React 18 avec TypeScript strict
- **Styling** : Tailwind CSS avec thèmes personnalisés
- **État global** : Zustand avec persistance et cache intelligent
- **Responsive** : Mobile-first design
- **Accessibilité** : Navigation clavier et ARIA labels

#### 🚀 Performance Frontend
- **Code Splitting** : Chunks optimisés par fonctionnalité
- **Cache intelligent** : Persistance et invalidation automatique
- **Hot Reload optimisé** : Vite avec configuration avancée
- **Alias de modules** : Imports optimisés avec résolution de chemins
- **Build optimisé** : Minification, compression, assets optimisés

#### 🔄 Développement Optimisé
- **Error handling** : Gestion d'erreurs robuste avec mécanismes spécifiques
  - **Try/catch** : Gestion d'erreurs dans `loadFilesystemData` et `handleDirectoryNavigation`
  - **Logs d'erreur** : Messages d'erreur détaillés dans la console avec contexte
  - **Fallback gracieux** : Interface reste fonctionnelle même en cas d'erreur
- **Timeout management** : Gestion des timeouts avec AbortController
  - **Requêtes API** : Timeout configurable pour éviter les blocages
  - **Annulation** : Possibilité d'annuler les requêtes en cours
  - **Retry automatique** : Tentatives de reconnexion en cas d'échec
- **State management** : Zustand avec devtools et persist middleware
- **Logs de debug frontend** : Traçabilité complète avec logs détaillés
  - **Navigation** : Logs avec emojis pour tracer les clics et la navigation
  - **Données backend** : Debug des réponses API et des données reçues
  - **Console accessible** : F12 pour voir les logs de debug en temps réel

#### 📁 Architecture Modulaire
- `components/UI/` : Composants réutilisables (Button, Modal, etc.)
- `components/Layout/` : Composants de mise en page (LeftPanel, MainPanel)
- `components/FileManager/` : Gestion des fichiers (FileTree avec navigation intégrée)
- `components/Config/` : Configuration IA (ConfigWindow, ConfigContent)
- `components/Queue/` : File d'attente (QueuePanel, QueueContent)
- `hooks/` : Hooks personnalisés (useFileOperations, useColors, etc.)
- `utils/` : Utilitaires centralisés (fileUtils, constants, colors, etc.)
- **Fichiers de couleurs** : `utils/colors.ts` et `hooks/useColors.ts`
- `stores/` : Gestion d'état avec Zustand
- **Délégation intelligente** : LeftPanel délègue la gestion de l'arborescence à FileTree
- **Composants refactorisés** : ConfigContent et QueueContent pour réutilisation dans MainPanel
- **Système de couleurs centralisé** : Toutes les couleurs définies dans `utils/colors.ts`

#### 📊 Synchronisation Intelligente en Temps Réel
- **Statuts en temps réel** avec indicateurs visuels colorés et animations
- **Synchronisation adaptative** : 
  - Base : 8-10 secondes (LeftPanel/FileTree)
  - Actions en cours : 1-3 secondes (suivi intensif)
  - Immédiate : Après chaque action utilisateur
- **Suivi de progression** : Synchronisation continue pendant le traitement
- **Arrêt automatique** : Synchronisation intensive s'arrête quand l'action est terminée
- **Queue d'analyse** : Rechargement automatique des éléments en cours et du statut global
- **Conditionnelle** : Synchronisation uniquement quand un disque est sélectionné
- **Communication bidirectionnelle** : Événements CustomEvent entre LeftPanel et Layout
- **État synchronisé** : activePanel partagé entre composants pour cohérence des couleurs

## 🚀 Démarrage Rapide

### Prérequis
- **Python 3.8+**
- **Node.js 16+**
- **npm 8+**

### Installation et Démarrage

#### Option 1 : Démarrage Automatique Optimisé (Recommandé)
```bash
# Cloner le projet
git clone <repository-url>
cd docusense-ai

# Démarrer les serveurs automatiquement avec gestion intelligente des processus
.\scripts\dev_start.ps1
```

#### Option 2 : Démarrage Manuel avec Gestion Intelligente

**Backend :**
```bash
# Vérifier et nettoyer les ports
.\scripts\manage_ports.ps1 check
.\scripts\manage_ports.ps1 clean
Start-Sleep -Seconds 3

# Démarrer le backend (depuis la racine du projet)
cd backend
venv\Scripts\python.exe main.py
```

**Frontend :**
```bash
# Vérifier et nettoyer les ports
.\scripts\manage_ports.ps1 check
.\scripts\manage_ports.ps1 clean

# Démarrer le frontend (depuis la racine du projet)
cd frontend
npm run dev
```

### Ports et Accès
- **Backend** : http://localhost:8000
- **Frontend** : http://localhost:3000
- **API Docs** : http://localhost:8000/docs

## 📁 Structure du Projet

```
docusense-ai/
├── backend/
│   ├── app/
│   │   ├── api/           # Endpoints API
│   │   ├── core/          # Modules centralisés
│   │   │   ├── file_utils.py
│   │   │   ├── database_utils.py
│   │   │   ├── status_manager.py
│   │   │   └── validation.py
│   │   ├── data/          # Fichiers de données centralisés
│   │   │   └── prompts.json  # Prompts IA centralisés et configurables
│   │   ├── models/        # Modèles de données
│   │   ├── services/      # Services métier
│   │   └── utils/         # Utilitaires
│   ├── logs/              # Logs d'application
│   ├── venv/              # Environnement virtuel Python
│   ├── main.py            # Point d'entrée
│   └── requirements.txt   # Dépendances Python
├── frontend/
│   ├── src/
│   │   ├── components/    # Composants React
│   │   ├── hooks/         # Hooks personnalisés
│   │   ├── services/      # Services API
│   │   ├── stores/        # Gestion d'état Zustand
│   │   └── utils/         # Utilitaires
│   ├── public/            # Assets statiques
│   └── package.json       # Dépendances Node.js
├── scripts/               # Scripts de démarrage et gestion
├── logs/                  # Logs globaux
├── README.md             # Documentation principale
├── 📚 DOCUMENTATION_INDEX.md          # Index de tous les documents
├── COLORS_GUIDE.md       # Guide du système de couleurs
├── COLORS_CENTRALIZATION_SUMMARY.md  # Résumé centralisation couleurs
├── REFACTORING_REPORT.md # Rapport de refactoring
└── CLEANUP_SYNCHRONIZATION_REPORT.md # Rapport de nettoyage
```

## 🔧 Configuration

### Variables d'Environnement Backend
```bash
# Base de données
DATABASE_URL=sqlite:///./docusense.db

# Sécurité
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=["http://localhost:3000"]

# IA Providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
MISTRAL_API_KEY=your-mistral-key
OLLAMA_BASE_URL=http://localhost:11434
```

### Configuration Frontend
```typescript
// src/utils/constants.ts
export const API_BASE_URL = 'http://localhost:8000'
export const SYNC_INTERVAL = 5000 // 5 secondes
```

### 🎨 Système de Couleurs Centralisé

Toutes les couleurs de l'interface sont centralisées pour faciliter les modifications :

#### Fichiers de couleurs
- **`frontend/src/utils/colors.ts`** : Définition de toutes les couleurs
- **`frontend/src/hooks/useColors.ts`** : Hooks pour utiliser les couleurs
- **`COLORS_GUIDE.md`** : Guide complet d'utilisation

### 🔧 Optimisations Interface

#### Animations d'Activation
- **Scale + Ring** : Au lieu de remplissage de couleur qui masque les icônes
- **Pulsation** : Animation continue pour les boutons actifs
- **Transitions fluides** : 300ms pour tous les changements d'état

#### Champs de Saisie
- **Œil unique** : Utilisation de l'œil natif du navigateur pour les champs password
- **Suppression redondance** : Plus de double œil dans les champs de clés API
- **Interface épurée** : Moins d'éléments visuels superflus

#### Couleurs principales
```typescript
// Couleurs des panneaux
config: '#3b82f6'    // Bleu pour Configuration IA
queue: '#eab308'     // Jaune pour File d'attente  
analyses: '#4ade80'  // Vert pour Analyses terminées

// Couleurs de statut
pending: '#eab308'   // Jaune - En attente
processing: '#3b82f6' // Bleu - En cours
completed: '#22c55e' // Vert - Terminé
failed: '#ef4444'    // Rouge - Échec
```

#### Utilisation dans les composants
```typescript
import { useColors, usePanelColors, useStatusColors } from '../hooks/useColors';

// Hook principal
const { colors, colorMode } = useColors();

// Hook spécialisé pour les panneaux
const { config, queue, analyses } = usePanelColors();

// Hook spécialisé pour les statuts
const { pending, completed, getStatusColor } = useStatusColors();
```

## 🧪 Tests

### Backend
```bash
cd backend
venv\Scripts\python.exe -m pytest tests/ -v --cov=app --cov-report=html
```

### Frontend
```bash
cd frontend
npm test
npm run test:coverage
```

## 📊 Monitoring et Métriques

### Logs
- **Backend** : `backend/logs/` et `logs/`
- **Frontend** : Console navigateur (F12)
- **Debug** : Logs détaillés avec emojis pour la navigation

### Métriques de Performance
- **Temps de réponse API** : Monitoring automatique
- **Utilisation mémoire** : psutil integration
- **Queue d'analyse** : Statuts en temps réel

## 🔄 Déploiement

### Production
```bash
# Build frontend
cd frontend
npm run build

# Démarrage backend production
cd backend
venv\Scripts\python.exe main.py --env production
```

### Docker (Optionnel)
```bash
docker-compose up -d
```

## 🤝 Contribution

### Développement
1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Standards de Code
- **Backend** : PEP 8, type hints, docstrings
- **Frontend** : ESLint, Prettier, TypeScript strict
- **Tests** : Couverture 80%+ requise

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📚 Documentation et Ressources

### Documentation Principale
- **README.md** : Documentation principale du projet
- **📚 Index** : `DOCUMENTATION_INDEX.md` - Index complet de tous les documents
- **API Docs** : http://localhost:8000/docs
- **Architecture** : `ARCHITECTURE_CENTRALISEE.md`

### Rapports et Guides
- **Refactoring** : `REFACTORING_REPORT.md` - Rapport détaillé du refactoring
- **Nettoyage** : `CLEANUP_SYNCHRONIZATION_REPORT.md` - Rapport de nettoyage et synchronisation
- **Couleurs** : `COLORS_GUIDE.md` - Guide complet du système de couleurs centralisé
- **Centralisation** : `COLORS_CENTRALIZATION_SUMMARY.md` - Résumé de la centralisation des couleurs

## 🆘 Support

### Problèmes Courants
- **Ports occupés** : Utiliser `.\scripts\manage_ports.ps1 clean`
- **Environnement virtuel** : Toujours utiliser `venv\Scripts\python.exe`
- **Frontend port 3000** : Forcer le port avec `taskkill /F /IM node.exe /T`

### Contact
- **Issues** : GitHub Issues
- **Discussions** : GitHub Discussions 