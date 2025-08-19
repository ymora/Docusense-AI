# 🎯 FONCTIONNEMENT UTILISATEUR - DOCUSENSE AI

## 📋 Vue d'ensemble

DocuSense AI est une application de gestion et d'analyse de fichiers avec interface unifiée. L'utilisateur peut naviguer dans l'arborescence de fichiers, sélectionner des éléments, et les analyser avec l'IA, le tout dans une interface moderne et intuitive.

---

## 🗂️ NAVIGATION ET SÉLECTION

### **Sélection du Disque**
- L'utilisateur sélectionne d'abord le disque à explorer
- L'arborescence se charge automatiquement

### **Navigation Arborescente**
- **Deux modes de navigation :**
  1. **Développement** : Cliquer pour développer/réduire les dossiers
  2. **Navigation directe** : Cliquer pour voir uniquement le contenu du répertoire

### **Chemin de Navigation**
- Barre de chemin toujours visible indiquant la position actuelle
- Permet de remonter rapidement de plusieurs niveaux d'un coup
- Navigation rapide dans l'arborescence

### **Ascenseur Vertical**
- Ascenseur fin mais visible pour les longues listes
- Masqué par la légende en bas du panneau gauche
- Permet de naviguer dans les listes longues

### **Sélection Multiple**
- Possibilité de sélectionner plusieurs dossiers ou fichiers
- Sélection avec Ctrl/Cmd + clic
- Sélection multiple visible visuellement

---

## 🎨 VISUALISATION UNIFIÉE

### **Onglet "Visualiseur" Unique**
**Tous les types de fichiers sont visualisés dans le même onglet :**

#### 🖼️ **Images**
- Affichage direct avec zoom
- Contrôles flottants (zoom, téléchargement)
- Support de tous formats (JPG, PNG, GIF, WebP, etc.)

#### 🎬 **Vidéos**
- Lecteur vidéo intégré avec contrôles complets
- Support de 40+ formats (MP4, AVI, MOV, MKV, etc.)
- Contrôles de lecture (play, pause, volume, etc.)

#### 🎵 **Audio**
- Lecteur audio intégré avec contrôles
- Support de 30+ formats (MP3, WAV, FLAC, AAC, etc.)
- Contrôles de lecture complets

#### 📄 **PDFs**
- Affichage natif dans iframe
- Navigation complète dans le document
- Zoom et défilement

#### 📊 **Documents Office**
- Word, Excel, PowerPoint
- Affichage HTML converti
- Navigation dans les documents

#### 📧 **Emails**
- Affichage du contenu email
- Pièces jointes intégrées
- Navigation entre pièces jointes

#### 📝 **Fichiers Texte**
- Affichage en mode texte
- Coloration syntaxique
- Défilement et recherche

### **Ouverture Automatique**
- **Clic simple** sur un fichier → Ouverture automatique dans l'onglet Visualiseur
- **Sélection multiple** → Affichage de miniatures dans le Visualiseur
- **Navigation fluide** entre tous les types

---

## 🎮 MENUS CONTEXTUELS

### **Actions Disponibles**
- **Fichiers et dossiers** ont des menus contextuels cliquables
- **Actions multiples** disponibles selon le type

### **Envoi en Queue IA**
- **Sélection multiple** → Envoi de plusieurs fichiers en queue IA
- **Dossiers** → Envoi automatique des fichiers supportés uniquement
- **Filtrage intelligent** des formats pris en charge

### **Accès aux Analyses**
- **Analyses terminées** listées dans le menu contextuel
- **Accès direct** aux rapports PDF générés
- **Historique** des analyses par fichier

---

## 🔄 QUEUE IA

### **Réception des Fichiers**
- Le panneau Queue IA reçoit la liste des fichiers du disque
- **Ajout un par un** dans la queue d'analyse

### **Configuration des Analyses**
- **Deux menus déroulants distincts :**
  1. **IA** : Sélection du modèle IA (uniquement si actif)
  2. **Prompt** : Sélection du prompt à utiliser

### **Statuts Visuels**
- **🟡 Jaune** = En attente
- **🔵 Bleu** = En cours
- **🟢 Vert** = Terminé
- **🔴 Rouge** = Échoué/Annulé
- **⚫ Gris** = Non supporté

### **Tooltips Informatifs**
- **Survol des statuts** → Tooltip indiquant l'action au clic
- **Messages clairs** sur ce qui va se passer

### **Actions sur les Analyses**
- **Clic sur "En cours"** → Annulation de l'analyse
- **Bouton devient rouge** avec texte "Annulé"
- **Duplication** d'analyses en cours (statut repasse en attente)

### **Duplication d'Analyses**
- **Statut requis** : En attente
- **Nouvelle configuration** : Choix IA et prompt (peut être identique)
- **Lancement manuel** par l'utilisateur
- **Liaison** : Analyses terminées reliées au fichier d'origine

---

## 📄 GÉNÉRATION PDF

### **Génération Automatique**
- **Chaque analyse terminée** génère un fichier PDF
- **PDF de visualisation** pour le menu contextuel
- **Accès direct** aux rapports d'analyse

### **Accès aux PDFs**
- **Menu contextuel** sur les fichiers
- **Liste des analyses** disponibles
- **Clic sur l'analyse** → Ouverture dans l'onglet Visualiseur

---

## 🎨 INTERFACE UTILISATEUR

### **Design Moderne**
- **Thème sombre** avec lignes fines
- **Design minimaliste** et épuré
- **Peu de bordures** pour éviter l'encombrement

### **Icônes et Couleurs**
- **Icônes bleu clair** comme demandé
- **Couleurs cohérentes** pour les statuts
- **Interface réactive** et intuitive

### **Organisation des Panneaux**
- **Panneau gauche** : Arborescence et navigation
- **Panneau principal** : Visualiseur unifié
- **Panneau Queue IA** : Gestion des analyses
- **Menus contextuels** : Actions rapides

---

## 🔧 FONCTIONNALITÉS TECHNIQUES

### **Support Multimédia Étendu**
- **118+ formats supportés** (audio, vidéo, image, document)
- **Validation automatique** des types de fichiers
- **Fallback intelligent** pour formats non supportés

### **Sécurité et Performance**
- **Validation des chemins** sécurisée
- **Streaming en temps réel** pour audio/vidéo
- **Cache intelligent** pour les performances
- **Gestion des erreurs** robuste

### **Monitoring Automatique**
- **Détection d'erreurs** en temps réel
- **Correction automatique** des problèmes
- **Redémarrage automatique** des services
- **Installation automatique** des modules manquants

---

## 🎯 FLUX UTILISATEUR TYPIQUE

1. **Sélection du disque** → Chargement de l'arborescence
2. **Navigation** → Développement ou navigation directe
3. **Sélection de fichiers** → Clic simple ou multiple
4. **Visualisation** → Ouverture automatique dans l'onglet Visualiseur
5. **Envoi en queue IA** → Menu contextuel → Sélection IA/Prompt
6. **Suivi des analyses** → Statuts visuels avec tooltips
7. **Accès aux résultats** → Menu contextuel → PDFs générés
8. **Visualisation des rapports** → Ouverture dans le Visualiseur

---

## ✅ POINTS CLÉS

- **Interface unifiée** : Tous les types dans le même Visualiseur
- **Navigation intuitive** : Deux modes de navigation
- **Statuts visuels** : Couleurs et tooltips informatifs
- **Actions contextuelles** : Menus adaptés au type de fichier
- **Génération automatique** : PDFs pour chaque analyse
- **Correction automatique** : Monitoring et résolution d'erreurs
- **Design moderne** : Thème sombre, lignes fines, icônes bleues

---

*Ce document décrit le fonctionnement utilisateur tel que spécifié pour DocuSense AI.*
