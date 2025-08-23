# 🎯 Guide Utilisateur - DocuSense AI

## 🚀 Démarrage Rapide

### Installation Express (2 minutes)
```powershell
# Démarrage automatique complet
.\docusense.ps1 start

# Accéder à l'application
# Frontend : http://localhost:3000
# Backend : http://localhost:8000
```

### Démarrage Manuel
```powershell
# Backend (Port 8000)
cd backend
venv\Scripts\python.exe main.py

# Frontend (Port 3000) - Dans un autre terminal
cd frontend
npm run dev
```

### Premiers Pas
1. **Ouvrez votre navigateur** sur http://localhost:3000
2. **Sélectionnez un dossier** contenant vos documents
3. **Cliquez sur un fichier** → Affichage automatique selon le type
4. **Utilisez l'analyse IA** → Sélectionnez un prompt et lancez l'analyse

## ✨ Fonctionnalités Principales

### Interface Épurée et Intuitive
- **Affichage automatique** selon le type de fichier
- **Actions simplifiées** avec icônes minimales
- **Navigation fluide** avec bouton retour unique
- **Design très fin** avec thème sombre et style minimaliste
- **Icônes bleu clair** comme le sélecteur de disque

### Support Multi-Formats Complet

#### Documents 📄
- **PDF, DOCX, PPTX, XLSX** - Visualisation native
- **TXT, RTF, MD, CSV** - Affichage texte
- **ODT, ODS, ODP** - Formats OpenDocument

#### Images 🖼️ (43 formats)
- **JPG, PNG, GIF, WebP, HEIC, SVG, TIFF, BMP, ICO**
- **Formats RAW** : CR2, CR3, NEF, ARW, RAF, ORF, PEF, SRW, RW2, DCR, KDC, K25, MRW, X3F, 3FR, FFF, IIQ, MOS
- **Formats professionnels** : PSD, DNG
- **Boutons flottants** : Zoom, télécharger, plein écran en overlay
- **Contrôles intelligents** : Apparition au survol, indicateur de zoom

#### Vidéos 🎬 (39 formats)
- **MP4, AVI, MOV, WMV, FLV, WebM, MKV, M4V, 3GP, OGV**
- **Formats transport stream** : TS, MTS, M2TS
- **Formats conteneurs** : ASF, RM, RMVB, NUT, F4V, F4P, F4A, F4B
- **Formats codec** : DIVX, XVID, H264, H265, VP8, VP9
- **Formats MPEG** : MPEG, MPG, MPE, M1V, M2V, MPV, MP2, M2P, PS
- **Formats autres** : EVO, OGM, OGX, MXF
- **Formats streaming** : HLS, M3U8
- **Streaming natif** : Lecture directe sans téléchargement
- **Analyse complète** : Métadonnées, codecs, durée, résolution

#### Audio 🎵 (37 formats)
- **MP3, WAV, FLAC, AAC, OGG, WMA, M4A, M4B, M4P, M4R**
- **Formats haute qualité** : OPUS, AIFF, ALAC, AMR, AWB
- **Formats anciens/legacy** : AU, SND, RA, RAM, WV, APE, AC3, DTS
- **Formats conteneurs** : MKA, TTA, MID, MIDI, CAF
- **Formats mobiles** : 3GA, 3GP, 3GPP, 3G2
- **Formats Windows** : WAX, WVX
- **Formats playlist** : PLS, SD2
- **Lecteur intégré** avec contrôles simples
- **Analyse spectrale** : Tempo, fréquences, spectrogrammes

#### Emails 📧
- **EML, MSG** - Parsing complet
- **Pièces jointes** - Accès direct et prévisualisation

### Analyse IA Intelligente

#### Mode Priorité IA
- **Cascade automatique** : Si un provider ne répond pas, bascule vers le suivant
- **Fallback intelligent** : Gestion des erreurs et retry automatique
- **Providers supportés** : OpenAI, Claude, Mistral, Ollama (par défaut)
- **Queue d'analyses** : Traitement en arrière-plan avec suivi en temps réel

#### Types d'Analyses
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

#### Prompts Spécialisés
- **Juridique** : Contrats, actes, procédures
- **Technique** : Manuels, spécifications, documentation
- **Administrative** : Formulaires, rapports, correspondance
- **Général** : Analyse polyvalente

## 🔐 Authentification et Sécurité

### Rôles Utilisateurs
- **Admin** : Accès complet (logs, admin, queue, viewer)
- **Utilisateur** : Accès limité (queue, viewer)
- **Invité** : Accès basique (queue, viewer) - sans mot de passe

### Identifiants par Défaut
| Utilisateur | Mot de passe | Rôle |
|-------------|--------------|------|
| `admin` | `Admin123*` | Administrateur |
| `yannick` | `Ym120879/*-+` | Utilisateur |
| `invite` | (aucun) | Invité |

### Critères de Sécurité des Mots de Passe
- **Longueur minimale** : 8 caractères
- **Majuscule** : Au moins 1 lettre majuscule (A-Z)
- **Minuscule** : Au moins 1 lettre minuscule (a-z)
- **Chiffre** : Au moins 1 chiffre (0-9)
- **Caractère spécial** : Au moins 1 caractère spécial (!@#$%^&*(),.?":{}|<>)

### Validation Email
- **Format RFC** : `nom@domaine.com`
- **Caractères autorisés** : Lettres, chiffres, points, tirets, underscores
- **Extension** : Au moins 2 caractères (.com, .fr, .org, etc.)

### Validation Nom d'Utilisateur
- **Longueur** : 3 à 20 caractères
- **Caractères** : Lettres, chiffres, underscores uniquement
- **Format** : `^[a-zA-Z0-9_]{3,20}$`

### Rate Limiting et Protection

#### Paramètres de Rate Limiting
| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| **Tentatives max** | 5 | Nombre maximum de tentatives de connexion |
| **Durée de blocage** | 5 minutes | Temps de blocage après dépassement |
| **Scope** | `{IP}:{username}` | Combinaison unique IP + utilisateur |

#### Comportement du Rate Limiting
| Scénario | Comportement | Message d'erreur |
|----------|-------------|------------------|
| **5 tentatives échouées** | Blocage 5 minutes | "Trop de tentatives de connexion (5 maximum). Réessayez dans X minutes." |
| **Connexion réussie** | Reset du compteur | - |
| **Changement d'utilisateur** | Nouveau compteur | - |
| **Changement d'IP** | Nouveau compteur | - |
| **Expiration du délai** | Déblocage automatique | - |

### Gestion des Sessions
- **Type** : Access Token + Refresh Token
- **Expiration** : Configurable dans les paramètres
- **Stockage** : localStorage (frontend)
- **Session expirée** : Déconnexion automatique avec message

### Codes d'Erreur HTTP
| Code | Type | Description | Action Frontend |
|------|------|-------------|----------------|
| **200** | ✅ Succès | Requête réussie | - |
| **400** | ❌ Erreur client | Données invalides | Affichage message d'erreur |
| **401** | ❌ Non autorisé | Token expiré/invalide | Déconnexion + rechargement |
| **429** | ⚠️ Trop de requêtes | Rate limiting | Affichage délai d'attente |
| **500** | ❌ Erreur serveur | Problème backend | Message générique |
| **503** | ⚠️ Service indisponible | Maintenance | Message de retry |

## 🎨 Interface Utilisateur

### Design Principles
- **Style très fin** : Lignes minces, bordures minimales
- **Thème sombre** : Interface moderne et reposante
- **Design minimaliste** : Interface épurée sans encombrement
- **Icônes bleu clair** : Cohérence visuelle avec le sélecteur de disque
- **Texte informatif** : Uniquement dans les zones de sélection

### Composants Principaux
- **DiskSelector** : Sélection de disques avec dialogue de fichiers
- **FileTreeSimple** : Arborescence de fichiers simplifiée
- **QueueIAAdvanced** : Gestion avancée de la queue d'analyses
- **ConfigWindow** : Configuration des providers IA
- **EmailViewer** : Visualisation des emails avec pièces jointes
- **FileResultViewer** : Affichage des résultats d'analyses
- **UsageLimits** : Limites d'usage pour les invités
