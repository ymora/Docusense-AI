# DocuSense AI - Plateforme d'Analyse Intelligente de Documents

## 🎯 Règles Cursor - Environnement Virtuel (OBLIGATOIRE)

### ⚠️ **RÈGLE CRITIQUE : TOUJOURS UTILISER L'ENVIRONNEMENT VIRTUEL**

**🚨 OBLIGATOIRE** : Toutes les commandes Python et pip DOIVENT utiliser l'environnement virtuel `venv` !

#### 📦 **Installation de Packages**
```bash
# ✅ CORRECT - Toujours utiliser venv
cd backend
venv\Scripts\pip.exe install nom_du_package

# ❌ INCORRECT - Ne jamais utiliser pip global
pip install nom_du_package
```

#### 🚀 **Démarrage des Services**
```bash
# ✅ CORRECT - Backend avec venv
cd backend
venv\Scripts\python.exe main.py

# ✅ CORRECT - Frontend (pas de venv nécessaire)
cd frontend
npm run dev

# ❌ INCORRECT - Ne jamais utiliser python global
python main.py
```

#### 🔧 **Vérification de l'Environnement**
```bash
# Vérifier que venv fonctionne
cd backend
venv\Scripts\python.exe --version

# Vérifier les packages installés
venv\Scripts\pip.exe list
```

#### 🎯 **Raison de cette Règle**
- **Isolation** : Éviter les conflits de dépendances
- **Cohérence** : Même environnement pour tous les développeurs
- **Fiabilité** : Éviter les erreurs "ModuleNotFoundError"
- **Reproductibilité** : Environnement identique en production

---

## 🚀 Vue d'ensemble

DocuSense AI est une plateforme moderne et robuste d'analyse intelligente de documents, conçue avec une architecture propre, maintenable et performante. Elle combine des technologies de pointe pour offrir une expérience utilisateur exceptionnelle.

## ✨ Fonctionnalités Principales

### 🔍 Analyse Intelligente
- **Extraction automatique** de données depuis tous types de documents
- **Classification intelligente** par domaine d'expertise (Juridique, Technique, Administratif, Général)
- **Comparaison de documents** avec détection de différences
- **Synthèse multi-documents** avec rapports structurés
- **Prompts spécialisés** par domaine d'expertise
- **Suivi temporel complet** des analyses IA
  - **Dates d'analyse** : Demande, début, fin et durée de traitement
  - **Métadonnées enrichies** : Provider, modèle, tokens utilisés, coût estimé
  - **Horodatage précis** : Timestamps ISO pour traçabilité complète
  - **Interface dédiée** : Onglet "Analyse IA" (anciennement "Résultats") avec section "Dates d'Analyse IA"
  - **Informations détaillées** : Temps de traitement, provider utilisé, modèle IA

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
- **Formats supportés** : Documents (PDF, DOCX, PPTX, XLSX), Images (JPG, PNG, GIF, WebP, HEIC), Vidéos (MP4, AVI, MOV, MKV), Audio (MP3, WAV, FLAC), Archives (ZIP, RAR, 7Z), Code (Python, JS, TS, Java, C++), et plus de 50 formats au total
- **Visualisation intégrée** : Texte, images, audio, vidéo, documents
- **OCR intégré** pour documents scannés (en développement)
- **Métadonnées temporelles complètes** : Dates système et base de données
  - **Dates système** : Création, modification et dernier accès du fichier
  - **Dates base de données** : Ajout et modification en base
  - **Extraction automatique** : Récupération des timestamps système via `pathlib`
  - **Affichage différencié** : Séparation claire entre dates fichier et dates base
  - **Interface enrichie** : Section dédiée dans l'onglet "Détails" avec séparateur visuel

### 🎬 Support Multimédia Avancé
- **Analyse d'images** : Extraction de métadonnées EXIF, couleurs dominantes, dimensions
- **Analyse vidéo** : Durée, FPS, codec, informations audio, génération de miniatures
- **Analyse audio** : Durée, fréquence d'échantillonnage, tempo, analyse spectrale
- **Miniatures** : Génération automatique de miniatures pour tous les types de fichiers
- **Visualisation** : Lecteurs intégrés pour images, vidéos et audio
- **API multimédia** : Endpoints dédiés pour l'analyse et la génération de miniatures

### 🔍 Nouvelles Fonctionnalités (Dernière Mise à Jour)

#### 📊 Suivi Temporel Complet
- **Dates d'analyse IA** : Demande, début, fin et durée de traitement
- **Métadonnées enrichies** : Provider, modèle, tokens utilisés, coût estimé
- **Horodatage précis** : Timestamps ISO pour traçabilité complète
- **Interface dédiée** : Onglet "Analyse IA" avec section "Dates d'Analyse IA"

#### 📅 Métadonnées Temporelles des Fichiers
- **Dates système** : Création, modification et dernier accès du fichier
- **Dates base de données** : Ajout et modification en base
- **Extraction automatique** : Récupération des timestamps système
- **Affichage différencié** : Séparation claire entre dates fichier et dates base

#### 🎯 Interface Améliorée
- **Visualisation intégrée** : Affichage direct dans le panneau principal sans nouvelle page
- **Navigation directe** : Clic droit → "Voir l'image/vidéo/audio dans le panneau principal"
- **Protection des actions** : Actions désactivées quand aucun fichier n'est sélectionné
- **Labels clarifiés** : "Résultats" → "Analyse IA", "Métadonnées" → "Informations"
- **Statut d'analyse IA** : Label plus précis pour le statut des analyses

### 🔐 Accès Distant Sécurisé - Interface Unifiée
- **Interface React unifiée** : Même interface moderne pour usage local et distant
- **Authentification automatique** : Détection local/remote avec authentification pour les utilisateurs distants
  - **Utilisateur local** : Accès direct sans authentification
  - **Utilisateur distant** : Authentification requise (username: `avocat`, password: `2025*`)
  - **Modal d'authentification** : Interface élégante pour la saisie des identifiants
- **Visualisation intégrée** : Affichage des fichiers directement dans le navigateur
- **Téléchargement sécurisé** : Sauvegarde des fichiers avec authentification pour les utilisateurs distants
- **Menu contextuel complet** : Actions directes sur les fichiers
  - **Visualisation** : Affichage des fichiers directement dans le navigateur
  - **Téléchargement** : Sauvegarde des fichiers sur le PC distant
  - **Analyse IA** : Lancement d'analyses depuis l'interface
- **Sécurité renforcée** : Sessions avec timeout, protection contre les attaques
- **API REST** : Endpoints sécurisés pour l'intégration avec d'autres applications
- **Statuts en temps réel** avec indicateurs visuels colorés
- **Navigation intuitive** avec sélecteur de disque et bouton retour parent

## 🎨 Interface Utilisateur

### 🖥️ Layout Principal
- **Panneau gauche redimensionnable** : Navigation dans l'arborescence des fichiers
- **Panneau principal** : Affichage des détails et résultats d'analyse avec titre dynamique
- **Panneaux latéraux** : Configuration IA, File d'attente, Analyses terminées
- **Navigation intégrée** : Boutons "Détails", "Visualiser", "Analyse IA" dans l'en-tête
  - **États adaptatifs** : Boutons activés/désactivés selon la sélection de fichier
  - **Tooltips informatifs** : Messages explicatifs pour les actions non disponibles
  - **Protection logique** : Vérifications conditionnelles pour éviter les erreurs

### 📂 Navigation des Fichiers
- **Sélecteur de disque** : Choix du disque physique à explorer
- **Bouton retour parent** : Navigation vers le dossier parent avec synchronisation automatique
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
  - **🖼️ Voir l'image** : Affichage des images dans le navigateur
  - **🎵 Écouter l'audio** : Lecteur audio intégré pour MP3, WAV, etc.
  - **🎬 Regarder la vidéo** : Lecteur vidéo intégré pour MP4, AVI, etc.
  - **📄 Lire le texte** : Affichage du contenu des fichiers texte
  - **👁️ Visualiser le fichier** : Pour les autres types de fichiers
  - **💾 Sauvegarder (télécharger)** : Téléchargement du fichier sur le PC distant
  - **🤖 Analyse IA** : Prompts spécialisés par domaine (Juridique, Technique, Administratif, Général)
  - **🔄 Réessayer** : Relancer l'analyse pour les fichiers en échec
- **Visualisation intégrée** : Affichage direct dans le panneau principal sans nouvelle page
  - **Navigation directe** : Clic droit → "Voir l'image/vidéo/audio dans le panneau principal"
  - **Événements personnalisés** : Communication directe entre FileTree et MainPanel
  - **Sélection automatique** : Le fichier est automatiquement sélectionné lors de la visualisation
  - **Mode de vue intégré** : Basculement automatique vers le mode visualisation
- **Protection des actions** : Actions désactivées quand aucun fichier n'est sélectionné
  - **Double protection** : UI (boutons grisés) + Logique (vérifications conditionnelles)
  - **Tooltips informatifs** : Messages explicatifs pour les actions désactivées
  - **Cohérence interface** : Actions inaccessibles dans le menu contextuel si fichier non sélectionné
- **Analyse IA** : Prompts spécialisés par domaine (Juridique, Technique, Administratif, Général)
- **Sélection multiple** : Clic pour sélectionner/désélectionner plusieurs fichiers
- **Actions de masse** : Boutons pour analyser, comparer ou retry tous les fichiers sélectionnés
- **Visualisation** : Un seul fichier à la fois (désactivée en sélection multiple)
- **Feedback visuel** : Encadrement fin, compteurs et messages d'aide contextuels
- **Visualisation** : Affichage intégré des fichiers

### 🎬 Visualisation Multimédia Avancée
- **Titre dynamique** : Affichage du nom du fichier et navigation dans le panneau principal
- **Navigation par flèches** : Boutons gauche/droite pour naviguer entre les fichiers du répertoire
- **Navigation clavier** : Flèches gauche/droite et Échap pour fermer
- **Indicateur de position** : Affichage "X/Y" pour montrer la position dans le répertoire
- **Lecteurs intégrés** :
  - **Images** : Affichage optimisé avec zoom et navigation
  - **Vidéos** : Lecteur vidéo avec contrôles de lecture
  - **Audio** : Lecteur audio avec contrôles de volume et progression
  - **Documents** : Affichage du contenu texte
- **Téléchargement direct** : Bouton de téléchargement dans le viewer
- **Interface responsive** : Adaptation automatique à la taille de l'écran

### 🎨 Design et UX
- **Thème sombre/clair** : Basculement automatique avec implémentation technique avancée
  - **Attribut data-theme** : `document.body.setAttribute('data-theme', 'light')` pour le mode jour
  - **CSS variables adaptatives** : Couleurs qui changent automatiquement selon le thème
  - **Icônes dynamiques** : Soleil pour passer en mode jour, lune pour passer en mode nuit
- **Interface renommée** : Amélioration de la clarté des labels
  - **Onglet "Résultats" → "Analyse IA"** : Nom plus précis pour l'onglet d'analyse
  - **Onglet "Métadonnées" → "Informations"** : Terme plus accessible pour les utilisateurs
  - **Label "Statut" → "Statut d'analyse IA"** : Clarification du type de statut affiché
- **Icônes colorées** : Tous les éléments utilisent des couleurs cohérentes
  - **Fichiers et dossiers** : Couleur bleu clair uniforme pour tous les éléments
  - **Panneaux** : Couleurs synchronisées via variables CSS (violet, orange, vert)
  - **Thème adaptatif** : Couleurs qui s'adaptent automatiquement au mode jour/nuit
  - **Sélection** : Encadrement fin adaptatif au thème jour/nuit
- **Onglets de configuration AI** : Interface moderne avec couleurs centralisées
  - **Onglets adaptatifs** : Providers, Stratégie, Métriques avec couleurs centralisées
  - **Accent coloré** : Bordure bleue (`colors.config`) pour l'onglet actif
  - **Compatibilité jour/nuit** : Adaptation automatique au thème actuel
  - **Transitions fluides** : Changements d'état avec animations harmonieuses
  - **Interface compacte** : Design optimisé pour l'espace disponible
  - **Champs adaptatifs** : Couleurs de fond et texte selon le thème
  - **Statuts visuels** : Points colorés avec couleurs de statut centralisées
- **File d'attente** : Interface moderne avec couleurs centralisées
  - **Progression visuelle** : Barre de progression avec couleur d'accent (`colors.queue`)
  - **Groupement par type** : Interface organisée par type d'analyse
  - **Statuts colorés** : Points de statut avec couleurs centralisées
  - **Actions harmonisées** : Boutons avec couleurs d'accent et d'erreur
  - **Messages d'erreur** : Couleurs adaptatives pour les erreurs
  - **Interface compacte** : Design optimisé pour l'espace disponible
- **Gestionnaire de fichiers** : Interface unifiée avec couleurs centralisées
  - **Analyses terminées** : Aperçu avec couleurs d'accent (`colors.analyses`)
  - **Statistiques en temps réel** : Compteurs avec couleurs harmonisées
  - **Actions contextuelles** : Boutons avec couleurs d'accent
  - **États d'erreur** : Couleurs adaptatives pour les fichiers en échec
  - **Instructions** : Couleurs d'accent pour les guides utilisateur
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
  - **Onglets adaptatifs** : Providers, Stratégie, Métriques avec couleurs centralisées
  - **Compatibilité jour/nuit** : Onglets qui s'adaptent automatiquement au thème actuel
  - **Accent coloré** : Bordure bleue (`colors.config`) pour l'onglet actif
  - **Transitions fluides** : Changements d'état avec animations harmonieuses
  - **Interface compacte** : Design optimisé pour l'espace disponible
- **File d'attente** (Jaune) : Suivi des analyses en cours
  - **Couleurs centralisées** : Utilisation du système de couleurs centralisé
  - **Compatibilité jour/nuit** : Adaptation automatique au thème actuel
  - **Progression visuelle** : Barre de progression avec couleur d'accent (`colors.queue`)
  - **Statuts colorés** : Points de statut avec couleurs centralisées
  - **Actions harmonisées** : Boutons avec couleurs d'accent et d'erreur
  - **Groupement par type** : Interface organisée par type d'analyse
- **Analyses terminées** (Vert) : Consultation des résultats
  - **Gestionnaire de fichiers** : Interface unifiée pour les analyses terminées
  - **Couleurs adaptatives** : Fond, texte et bordures selon le thème
  - **Aperçu des résultats** : Cartes compactes avec couleurs centralisées
  - **Statistiques en temps réel** : Compteurs avec couleurs harmonisées
  - **Actions contextuelles** : Boutons avec couleurs d'accent (`colors.analyses`)
- **Synchronisation des couleurs** : Icônes et titres de panneaux harmonisés
- **Thème jour/nuit** : Basculement automatique avec icônes adaptées

## 🏗️ Architecture Technique

### Backend (Python FastAPI)
- **Framework** : FastAPI avec validation Pydantic
- **Base de données** : SQLAlchemy avec SQLite/PostgreSQL
  - **Modèle File enrichi** : Ajout des champs `file_created_at`, `file_modified_at`, `file_accessed_at`
  - **Modèle Analysis** : Champs `started_at` et `completed_at` pour le suivi temporel
  - **Métadonnées étendues** : Stockage des dates d'analyse dans `analysis_metadata`
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
- **Authentification** : Système de sessions avec timeout configurable
- **Gestion des tentatives** : Protection contre les attaques par force brute
- **Protection des actions** : Vérifications conditionnelles pour éviter les erreurs
  - **Validation côté client** : Désactivation des boutons selon la sélection
  - **Validation côté serveur** : Vérifications dans les endpoints API
  - **Gestion d'erreurs robuste** : Messages d'erreur informatifs et fallbacks gracieux

#### ⚡ Performance Optimisée
- **Compression Gzip** : Réduction 60-80% de la bande passante
- **Monitoring temps réel** : Métriques de performance avec psutil
- **Request ID tracking** : Traçabilité complète des requêtes
- **Logging structuré** : Traçabilité et debugging avancés
- **Communication optimisée** : Événements personnalisés pour la visualisation
  - **Événements CustomEvent** : Communication directe entre composants sans re-renders
  - **Sélection automatique** : Optimisation de la navigation entre fichiers
  - **Mode de vue intégré** : Basculement direct sans étapes intermédiaires

#### 📁 Modules Centralisés
- `core/file_utils.py` : Gestion des formats et extraction d'informations
  - **Extraction de dates** : Récupération automatique des timestamps système (création, modification, accès)
  - **Métadonnées enrichies** : Inclusion des dates dans les informations de fichier
- `core/database_utils.py` : Utilitaires de base de données
- `core/status_manager.py` : Gestion des statuts et transitions
- `core/validation.py` : Validation et gestion d'erreurs
- `core/security.py` : Gestion de l'authentification et des sessions
- `data/prompts.json` : Prompts IA centralisés et configurables
- `services/download_service.py` : Service de téléchargement avec gestion des fichiers temporaires
- `services/queue_service.py` : Service de queue avec suivi temporel des analyses
  - **Dates d'analyse** : Enregistrement automatique de `started_at` et `completed_at`
  - **Métadonnées enrichies** : Inclusion des dates dans les métadonnées d'analyse

#### 🔐 Service d'Authentification
- **Détection automatique** : Local vs Remote utilisateur
- **Sessions sécurisées** : Tokens avec expiration automatique
- **Configuration flexible** : Paramètres dans `security_config.json`
- **API endpoints** : `/api/auth/login`, `/api/auth/logout`, `/api/auth/session-info`

#### 📦 Service de Téléchargement
- **Téléchargement direct** : Endpoint `/api/files/download-by-path/{file_path:path}`
- **Archives ZIP** : Création automatique pour dossiers et fichiers multiples
- **Fichiers temporaires** : Gestion automatique dans `temp_downloads/`
- **Nettoyage automatique** : Suppression des fichiers de plus de 24h
- **Limites de taille** : Protection contre les fichiers trop volumineux

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
- `components/UI/` : Composants réutilisables (Button, Modal, AuthModal)
- `components/Layout/` : Composants de mise en page (LeftPanel, MainPanel)
  - **MainPanel** : Navigation intégrée avec boutons "Détails", "Visualiser", "Analyse IA"
  - **Protection des actions** : Désactivation conditionnelle des boutons selon la sélection
  - **Événements personnalisés** : Écoute des événements de visualisation depuis FileTree
- `components/FileManager/` : Gestion des fichiers (FileTree avec navigation intégrée, FileViewer)
  - **FileTree** : Menu contextuel avec actions conditionnelles selon la sélection
  - **FileViewer** : Visualisation intégrée sans modal, protection du téléchargement
  - **FileResultViewer** : Onglet "Analyse IA" avec section "Dates d'Analyse IA"
  - **FileDetailsPanel** : Affichage des dates système et base de données
- `components/Config/` : Configuration IA (ConfigWindow, ConfigContent)
  - **Onglets adaptatifs** : Interface avec onglets Providers, Stratégie, Métriques
  - **Couleurs centralisées** : Utilisation du système de couleurs centralisé
  - **Compatibilité thème** : Adaptation automatique jour/nuit
  - **Interface compacte** : Design optimisé pour l'espace disponible
- `components/Queue/` : File d'attente (QueuePanel, QueueContent)
- `hooks/` : Hooks personnalisés (useFileOperations, useColors, etc.)
- `utils/` : Utilitaires centralisés (fileUtils, constants, colors, etc.)
- `services/` : Services API (authService, promptService)
- **Fichiers de couleurs** : `utils/colors.ts` et `hooks/useColors.ts`
- `stores/` : Gestion d'état avec Zustand
- **Délégation intelligente** : LeftPanel délègue la gestion de l'arborescence à FileTree
- **Composants refactorisés** : ConfigContent et QueueContent pour réutilisation dans MainPanel
- **Système de couleurs centralisé** : Toutes les couleurs définies dans `utils/colors.ts`

#### 🔐 Service d'Authentification Frontend
- **AuthService** : Gestion centralisée de l'authentification
- **Détection automatique** : Local vs Remote utilisateur
- **AuthModal** : Interface d'authentification élégante
- **Gestion des tokens** : Stockage sécurisé et validation automatique
- **Intégration contextuelle** : Authentification requise pour les actions sensibles

#### 🎬 Composant FileViewer
- **Visualisation multimédia** : Support complet images, vidéos, audio, documents
- **Navigation par flèches** : Boutons et raccourcis clavier
- **Indicateur de position** : Affichage de la position dans le répertoire
- **Téléchargement intégré** : Bouton de téléchargement direct
- **Interface responsive** : Adaptation automatique à la taille d'écran

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

#### 🎬 Installation des Dépendances Multimédia

Pour activer le support complet des fichiers multimédia (images, vidéos, audio), exécutez :

```powershell
# Installation complète des dépendances multimédia
.\scripts\install_multimedia_deps.ps1

# Ou installation sélective
.\scripts\install_multimedia_deps.ps1 -SkipFrontend  # Backend uniquement
.\scripts\install_multimedia_deps.ps1 -SkipBackend   # Frontend uniquement
```

### 🔐 Configuration de l'Accès Distant

**Accès distant :**
- **Interface React unifiée** : http://localhost:3000 (même interface que locale)
- **Authentification automatique** : Détection local/remote avec authentification pour les utilisateurs distants
- **Identifiants par défaut** : username: `avocat`, password: `2025*`
- **Fonctionnalités** : Navigation, visualisation, téléchargement, analyse IA

**Formats supportés après installation :**
- **Images** : JPG, PNG, GIF, BMP, TIFF, WebP, ICO, RAW, HEIC, HEIF
- **Vidéos** : MP4, AVI, MOV, WMV, FLV, WebM, MKV, M4V, 3GP, OGV, TS, MTS, M2TS
- **Audio** : MP3, WAV, FLAC, AAC, OGG, WMA, M4A, Opus, AIFF, ALAC
- **Archives** : ZIP, RAR, 7Z, TAR, GZ, BZ2
- **Documents** : PDF, DOCX, PPTX, XLSX, RTF, ODT, Pages, Numbers, Key
- **Code** : Python, JavaScript, TypeScript, Java, C++, C#, PHP, Ruby, Go, Rust, Swift, Kotlin, HTML, CSS, XML, JSON, YAML, SQL, Shell, PowerShell

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
- **Frontend** : http://localhost:3000 (ou 3001, 3002 selon disponibilité)
- **API Docs** : http://localhost:8000/docs

## 📁 Structure du Projet

```
docusense-ai/
├── backend/
│   ├── app/
│   │   ├── api/           # Endpoints API
│   │   │   ├── auth.py    # Authentification
│   │   │   ├── files.py   # Gestion fichiers
│   │   │   ├── download.py # Téléchargements
│   │   │   └── multimedia.py # Support multimédia
│   │   ├── core/          # Modules centralisés
│   │   │   ├── file_utils.py
│   │   │   ├── database_utils.py
│   │   │   ├── status_manager.py
│   │   │   ├── validation.py
│   │   │   └── security.py # Authentification et sécurité
│   │   ├── data/          # Fichiers de données centralisés
│   │   │   └── prompts.json  # Prompts IA centralisés et configurables
│   │   ├── models/        # Modèles de données
│   │   ├── services/      # Services métier
│   │   │   ├── download_service.py # Service de téléchargement
│   │   │   └── multimedia_service.py # Service multimédia
│   │   └── utils/         # Utilitaires
│   ├── temp_downloads/    # Fichiers temporaires de téléchargement
│   ├── logs/              # Logs d'application
│   ├── venv/              # Environnement virtuel Python
│   ├── main.py            # Point d'entrée
│   ├── security_config.json # Configuration sécurité
│   └── requirements.txt   # Dépendances Python
├── frontend/
│   ├── src/
│   │   ├── components/    # Composants React
│   │   │   ├── UI/        # Composants UI (AuthModal, Modal, Button)
│   │   │   ├── Layout/    # Layout (LeftPanel, MainPanel)
│   │   │   ├── FileManager/ # Gestion fichiers (FileTree, FileViewer)
│   │   │   ├── Config/    # Configuration IA
│   │   │   └── Queue/     # File d'attente
│   │   ├── hooks/         # Hooks personnalisés
│   │   ├── services/      # Services API (authService, promptService)
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

### Configuration Sécurité
```json
// backend/security_config.json
{
  "admin_password": "admin123",
  "session_timeout": 3600,
  "max_login_attempts": 5,
  "lockout_duration": 300
}
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

#### Composants avec couleurs centralisées
- **Onglets de configuration AI** : Couleurs adaptatives avec accent `colors.config`
- **File d'attente** : Interface avec couleurs centralisées et progression visuelle
- **Gestionnaire de fichiers** : Analyses terminées avec couleurs adaptatives
- **Panneaux principaux** : Couleurs synchronisées (config: bleu, queue: jaune, analyses: vert)
- **Statuts visuels** : Points colorés avec couleurs de statut centralisées
- **Champs de saisie** : Couleurs adaptatives selon le thème jour/nuit
- **Boutons et interactions** : Couleurs d'accent harmonisées
- **Barres de progression** : Couleurs d'accent pour les indicateurs de progression

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
config: '#3b82f6'    // Bleu pour Configuration IA (onglets actifs)
queue: '#eab308'     // Jaune pour File d'attente  
analyses: '#4ade80'  // Vert pour Analyses terminées

// Couleurs de statut
pending: '#eab308'   // Jaune - En attente
processing: '#3b82f6' // Bleu - En cours
completed: '#22c55e' // Vert - Terminé
failed: '#ef4444'    // Rouge - Échec

// Couleurs d'interface adaptatives
text: '#f1f5f9'      // Texte principal (mode sombre)
textSecondary: '#94a3b8' // Texte secondaire
surface: '#1e293b'   // Surfaces (panneaux, cartes)
border: '#334155'    // Bordures
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

// Exemple d'utilisation dans les onglets
const { colors } = useColors();
// Onglet actif avec accent coloré
style={{
  backgroundColor: activeTab === 'providers' ? colors.surface : 'transparent',
  color: activeTab === 'providers' ? colors.text : colors.textSecondary,
  borderBottomColor: activeTab === 'providers' ? colors.config : 'transparent'
}}
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
- **Authentification** : Vérifier `security_config.json` et les identifiants par défaut
- **Téléchargements** : Vérifier le dossier `temp_downloads/` et les permissions
- **Actions désactivées** : Vérifier qu'un fichier est sélectionné avant d'effectuer des actions
- **Visualisation** : Les fichiers s'affichent directement dans le panneau principal, pas dans une nouvelle page
- **Dates d'analyse** : Les dates apparaissent après avoir lancé une analyse IA
- **Base de données** : En cas de modification du schéma, supprimer `docusense.db` pour recréer la base

### Contact
- **Issues** : GitHub Issues
- **Discussions** : GitHub Discussions 