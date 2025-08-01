# DocuSense AI - Plateforme d'Analyse Intelligente de Documents

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-repo/docusense-ai)
[![Python](https://img.shields.io/badge/python-3.8+-green.svg)](https://python.org)
[![Node.js](https://img.shields.io/badge/node.js-16+-orange.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

> **🎯 Plateforme moderne d'analyse intelligente de documents avec interface épurée et IA avancée**

---

## 📋 Table des Matières

- [🚀 Démarrage Rapide](#-démarrage-rapide)
- [✨ Fonctionnalités](#-fonctionnalités)
- [🛠️ Installation](#️-installation)
- [🎯 Utilisation](#-utilisation)
- [🔧 Configuration](#-configuration)
- [🐛 Dépannage](#-dépannage)
- [📞 Support](#-support)

---

## 🚀 Démarrage Rapide

### ⚡ Installation Express (2 minutes)

```bash
# 1. Cloner le projet
git clone <repository-url>
cd DocuSense-AI

# 2. Installation automatique
.\scripts\start_optimized.ps1 -Analyze -Optimize -Force

# 3. Accéder à l'application
# Frontend : http://localhost:3000
# Backend : http://localhost:8000
```

### 🎯 Premiers Pas

1. **Ouvrez votre navigateur** sur http://localhost:3000
2. **Sélectionnez un dossier** contenant vos documents
3. **Cliquez sur un fichier** → Affichage automatique selon le type
4. **Utilisez l'analyse IA** → Sélectionnez un prompt et lancez l'analyse

---

## ✨ Fonctionnalités

### 🎯 Interface Épurée et Intuitive

#### **Affichage Automatique**
- **Clic sur fichier** → Affichage direct selon le type
- **Audio/Vidéo** : Lecteur multimédia avec contrôles simples
- **Images** : Affichage avec boutons flottants (plein écran, télécharger)
- **Documents** : Visualisation native (PDF, Office, etc.)
- **Emails** : Lecture structurée avec accès aux pièces jointes

#### **Actions Simplifiées**
- **Icônes minimales** : Seulement l'essentiel (plein écran, télécharger, pièces jointes)
- **Bouton Métadonnées** : Accès aux détails via le panneau haut
- **Navigation fluide** : Bouton retour unique pour les emails

### 📁 Support Multi-Formats

#### **Documents** 📄
- **PDF, DOCX, PPTX, XLSX** - Visualisation native
- **TXT, RTF** - Affichage texte

#### **Images** 🖼️
- **JPG, PNG, GIF, WebP, HEIC, SVG, TIFF, BMP, ICO**
- **Boutons flottants** : Zoom, télécharger, plein écran en overlay
- **Contrôles intelligents** : Apparition au survol, indicateur de zoom

#### **Vidéos** 🎬
- **MP4, AVI, MOV, WMV, FLV, WebM, MKV** et **39 formats** supportés
- **Streaming natif** : Lecture directe sans téléchargement
- **Analyse complète** : Métadonnées, codecs, durée, résolution

#### **Audio** 🎵
- **MP3, WAV, FLAC, AAC, OGG, WMA, M4A** et **21 formats** supportés
- **Lecteur intégré** avec contrôles simples
- **Analyse spectrale** : Tempo, fréquences, spectrogrammes

#### **Emails** 📧
- **EML, MSG** - Parsing complet
- **Pièces jointes** - Accès direct et prévisualisation

### 🤖 Analyse IA Intelligente

#### **Fonctionnalités Principales**
- **Extraction automatique** de données depuis tous types de documents
- **Classification intelligente** par domaine (Juridique, Technique, Administratif, Général)
- **Comparaison de documents** avec détection de différences
- **Synthèse multi-documents** avec rapports structurés
- **Analyse multiple par IA** : Comparaison des résultats de plusieurs providers IA

#### **Prompts Spécialisés**
- **Général** : Analyses générales de documents
- **Résumé** : Résumés et synthèses
- **Extraction** : Extraction d'informations spécifiques
- **Comparaison** : Comparaisons entre documents
- **Classification** : Classification par domaine
- **OCR** : Reconnaissance de texte
- **Juridique** : Analyses juridiques
- **Technique** : Analyses techniques
- **Administratif** : Analyses administratives

### 📋 File d'Attente Intégrée

#### **Interface Unifiée**
- **Queue intégrée** dans la fenêtre principale avec toggle
- **Bouton queue** : Affiche/masque la queue dans la même fenêtre
- **Plus de fenêtre séparée** : Suppression du panel standalone à droite
- **Design épuré** : Interface lisible avec couleurs minimales sauf pour les états
- **Organisation par prompt** : Analyses groupées par type de prompt utilisé
- **Affichage des IA** : Distinction claire entre analyses simples et multiples par IA
- **Statistiques IA** : Compteurs par type d'IA (simple/multiple) et providers utilisés
- **Actions individuelles** : Pause, annulation, relance par item
- **Statistiques rapides** : Compteurs en attente, en cours, terminées, erreurs

### ⚖️ Vérification Normative

#### **Conformité Automatique**
- **Code civil, Code de commerce** - Vérification légale
- **DTU, NF, EN, ISO** - Normes techniques
- **RE2020, RT2012** - Réglementation
- **Détection d'incohérences** et alertes de prescription

---

## 🛠️ Installation

### 📋 Prérequis

- **Python 3.8+** avec environnement virtuel
- **Node.js 16+** et npm
- **Git** pour le versioning
- **Espace disque** : Minimum 2GB libre

### 🚀 Installation Automatique (Recommandée)

```bash
# Installation complète avec optimisation
git clone <repository-url>
cd DocuSense-AI
.\scripts\start_optimized.ps1 -Analyze -Optimize -Force
```

### 🎬 Support Multimédia (Optionnel)

```powershell
# Installation automatique FFmpeg + codecs
.\scripts\install_multimedia_deps.ps1

# Ou installation manuelle
winget install Gyan.FFmpeg --accept-source-agreements --accept-package-agreements
cd backend
venv\Scripts\pip.exe install ffmpeg-python av pytube yt-dlp
```

> **✅ IMPLÉMENTÉ** - Support multimédia complet avec 39 formats vidéo et 21 formats audio

---

## 🎯 Utilisation

### 📂 Navigation et Sélection

#### **Sélection de Fichiers**
1. **Cliquez sur un fichier** → Affichage automatique
2. **Ctrl+clic** → Ajouter/retirer de la sélection
3. **Sélection multiple** → Actions en lot disponibles

#### **Types d'Affichage**
- **📄 Documents** : Visualisation native dans le navigateur
- **🖼️ Images** : Affichage direct avec zoom
- **🎬 Vidéos** : Lecteur avec contrôles simples
- **🎵 Audio** : Lecteur audio intégré
- **📧 Emails** : Lecture structurée avec pièces jointes

### 🤖 Analyse IA

#### **Analyse Simple**
1. **Sélectionnez un fichier**
2. **Cliquez sur "Analyser"**
3. **Choisissez un prompt** dans le sélecteur
4. **Lancez l'analyse** → Résultat dans la queue

#### **Comparaison de Documents**
1. **Sélectionnez plusieurs fichiers** (Ctrl+clic)
2. **Cliquez sur "Comparer"**
3. **Choisissez un prompt** de comparaison
4. **Lancez la comparaison** → Analyse comparative

#### **Analyse en Lot**
1. **Sélectionnez plusieurs fichiers** (2+ fichiers)
2. **Cliquez sur "Analyser en lot"**
3. **Choisissez un prompt** d'analyse
4. **Lancez l'analyse** → Tous les fichiers traités

#### **Analyse Multiple par IA** ✅ IMPLÉMENTÉ
1. **Sélectionnez un ou plusieurs fichiers**
2. **Cliquez sur "Analyse Multiple par IA"**
3. **Sélectionnez les providers actifs** (OpenAI, Claude, Mistral, etc.)
4. **Choisissez un prompt** d'analyse
5. **Lancez l'analyse** → Chaque IA analyse le même fichier
6. **Comparaison automatique** → Résultats de toutes les IA côte à côte

### 📋 Gestion de la Queue

#### **Suivi des Analyses**
- **Queue intégrée** : Visible dans le panneau principal
- **Statut en temps réel** : En attente, en cours, terminée, erreur
- **Actions par item** : Pause, annulation, relance

#### **Organisation**
- **Groupement par type** : Général, Résumé, Extraction, etc.
- **Statistiques rapides** : Compteurs par statut
- **Actions par section** : Relancer/supprimer toutes les analyses d'un type

### ⚙️ Configuration IA

#### **Accès à la Configuration**
- **Bouton ⚙️** : Premier clic ouvre la config, deuxième clic ferme
- **4 providers** : OpenAI, Claude, Mistral, Ollama (local)
- **Configuration simple** : Ajoutez vos clés API

#### **Liste des Analyses IA**
- **✅ IMPLÉMENTÉ** - Bouton "Liste Analyses" : Toggle pour afficher la liste complète
- **✅ IMPLÉMENTÉ** - Tri intelligent : Par date, statut, IA (cliquez sur les en-têtes)
- **✅ IMPLÉMENTÉ** - Filtres avancés : Par statut et type de prompt
- **✅ IMPLÉMENTÉ** - Actions rapides : Relancer ou supprimer les analyses
- **✅ IMPLÉMENTÉ** - Interface épurée : Design lisible avec couleurs minimales

---

## 🔧 Configuration

### 🔑 Variables d'Environnement

#### **Backend (.env)**
```bash
DATABASE_URL=sqlite:///./docusense.db
DEBUG=false
ENVIRONMENT=production
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
MISTRAL_API_KEY=your_mistral_key
```

#### **Frontend (.env)**
```bash
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=DocuSense AI
```

### 🤖 Configuration IA

#### **Providers Supportés**
- **OpenAI** : GPT-4, GPT-3.5-turbo
- **Claude** : Claude-3, Claude-2
- **Mistral** : Mistral-7B, Mixtral-8x7B
- **Ollama** : Modèles locaux

#### **Configuration des Clés**
1. **Ouvrez la configuration** (bouton ⚙️)
2. **Ajoutez vos clés API** dans les champs correspondants
3. **Sauvegardez** → Configuration active immédiatement

---

## 🐛 Dépannage

### ❌ Problèmes Courants

#### **Environnement Virtuel Manquant**
```powershell
# Solution automatique
.\scripts\optimize_system.ps1 -System

# Solution manuelle
cd backend
python -m venv venv
venv\Scripts\activate
venv\Scripts\pip.exe install -r requirements.txt
```

#### **Ports Déjà Utilisés**
```powershell
# Solution automatique
.\scripts\start_optimized.ps1 -Force

# Solution manuelle
taskkill /F /IM python.exe /T
taskkill /F /IM node.exe /T
```

#### **Base de Données Corrompue**
```powershell
# Diagnostic
.\scripts\diagnostic_complet.ps1 -Report

# Optimisation automatique
.\scripts\optimize_system.ps1 -Database -Force
```

#### **Lecteur Vidéo Ne Fonctionne Pas**
```bash
# Vérifier les dépendances multimédia
cd backend
venv\Scripts\pip.exe install ffmpeg-python av pytube yt-dlp

# Vérifier FFmpeg
ffmpeg -version

# Tester le streaming
curl http://localhost:8000/api/files/stream-by-path/[chemin_fichier]
```

### 📊 Logs et Diagnostic

- **Logs backend** : `backend/logs/docusense.log`
- **Logs d'erreur** : `backend/logs/docusense_error.log`
- **Logs de surveillance** : `logs/monitoring_YYYYMMDD.log`
- **Rapports de diagnostic** : `logs/diagnostic_YYYYMMDD_HHMMSS.txt`

---

## 📞 Support

### 📚 Documentation

- **API Docs** : http://localhost:8000/docs
- **README** : Documentation complète du projet
- **Scripts** : Aide intégrée avec `-h` ou `--help`

### 🔧 Outils de Diagnostic

- **Diagnostic automatique** : `.\scripts\diagnostic_complet.ps1 -Report`
- **Optimisation automatique** : `.\scripts\optimize_system.ps1 -Force`
- **Surveillance continue** : `.\scripts\monitor_realtime.ps1 -Log`

### 📞 Contact

- **Issues** : Utiliser GitHub Issues pour les bugs et demandes
- **Discussions** : GitHub Discussions pour les questions générales
- **Wiki** : Documentation détaillée et guides

---

## 🎉 Remerciements

Merci à tous les contributeurs qui participent au développement de DocuSense AI !

**DocuSense AI** - L'analyse intelligente de documents, simplifiée et optimisée. 🚀 