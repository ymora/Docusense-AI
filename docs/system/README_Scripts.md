# 📁 Scripts DocuSense AI - Organisation Consolidée

## 🎯 Vue d'ensemble

Ce dossier contient tous les scripts PowerShell organisés de manière logique pour la gestion complète de DocuSense AI. **Version consolidée v2.0** - Optimisation et suppression des doublons.

## 📂 Structure des Scripts

### 🚀 **Startup** - Démarrage des services
```
startup/
├── docusense.ps1          # Script principal de démarrage (consolidé)
```

### 🔧 **Maintenance** - Maintenance et nettoyage
```
maintenance/
├── cleanup.ps1                    # Nettoyage général (utilise fonctions communes)
└── database_cleanup.ps1           # Nettoyage base de données
```

### 📊 **Monitoring** - Surveillance système
```
monitoring/
└── status.ps1             # Statut des services (utilise fonctions communes)
```

### 🧪 **Testing** - Tests et validation
```
testing/
├── run-finalization-tests.ps1     # Tests complets de finalisation
└── test-audit.ps1                 # Tests d'audit spécifiques
```

### 🛠️ **Utils** - Utilitaires et fonctions communes
```
utils/
├── common.ps1                     # 🆕 Fonctions communes partagées
└── download_reference_documents.py # Téléchargement documents
```

### 📦 **Installation** - Configuration système
```
install-nodejs.ps1                 # 🆕 Script d'installation Node.js unifié
```

## 🚀 Utilisation

### Menu principal interactif
```powershell
.\scripts\main.ps1
```

### Démarrage rapide
```powershell
.\scripts\startup\docusense.ps1
```

### Maintenance
```powershell
.\scripts\maintenance\cleanup.ps1
```

### Tests
```powershell
.\scripts\testing\run-finalization-tests.ps1
```

### Monitoring
```powershell
.\scripts\monitoring\status.ps1
```

### Installation Node.js
```powershell
.\scripts\install-nodejs.ps1
```

## 🔄 Consolidation et Optimisation Réalisées (v2.0)

### ✅ **Étape 1 : Consolidation des scripts Node.js**
- **Supprimé** : `install-nodejs-simple.ps1` (77 lignes)
- **Supprimé** : `setup-frontend-tests.ps1` (235 lignes)
- **Conservé** : `install-nodejs.ps1` (script principal complet)
- **Gain** : 312 lignes de code supprimées, 2 fichiers en moins

### ✅ **Étape 2 : Fonctions communes centralisées**
- **Créé** : `scripts/utils/common.ps1` avec 15 fonctions partagées
- **Fonctions communes** :
  - `Test-NodeJSInstallation` - Vérification Node.js
  - `Test-PythonInstallation` - Vérification Python
  - `Get-DocusenseProcesses` - Récupération des processus
  - `Stop-DocusenseProcesses` - Arrêt des processus
  - `Test-PortInUse` - Vérification des ports
  - `Close-BrowserOnPort` - Fermeture des navigateurs
  - `Write-TestLog` - Logging formaté
  - `Test-ServiceRunning` - Vérification des services
  - `Clean-Logs` - Nettoyage des logs
  - `Clean-TempFiles` - Nettoyage des fichiers temporaires

### ✅ **Scripts mis à jour pour utiliser les fonctions communes**
- `main.ps1` - Menu principal consolidé
- `maintenance/cleanup.ps1` - Utilise les fonctions communes
- `monitoring/status.ps1` - Utilise les fonctions communes
- `startup/docusense.ps1` - Utilise les fonctions communes

### ✅ **Suppression des doublons**
- **Avant** : Code dupliqué dans 4 scripts différents
- **Après** : Une seule source de vérité pour chaque fonction
- **Gain** : ~200 lignes de code dupliqué supprimées

## 📊 Avantages de la Consolidation v2.0

### 🎯 **Maintenabilité**
- **Code centralisé** : Modifications dans un seul endroit
- **Cohérence** : Même logique dans tous les scripts
- **Réutilisabilité** : Fonctions communes partagées

### 🚀 **Performance**
- **Moins de duplication** : Code optimisé et consolidé
- **Chargement unique** : Fonctions communes chargées une fois
- **Gestion d'erreurs uniforme** : Approche cohérente

### 🛠️ **Développement**
- **Facilité de maintenance** : Un seul point de modification
- **Tests simplifiés** : Fonctions communes testées une fois
- **Documentation centralisée** : Une seule source de vérité

### 📦 **Organisation**
- **Structure claire** : Scripts organisés par fonction
- **Navigation simplifiée** : Menu principal unifié
- **Installation unifiée** : Un seul script Node.js

## 🔧 Fonctions Communes Disponibles

### Vérification
```powershell
# Charger les fonctions communes
. ".\scripts\utils\common.ps1"

# Vérifier Node.js
if (Test-NodeJSInstallation) {
    Write-Host "Node.js installé" -ForegroundColor Green
}

# Vérifier Python
if (Test-PythonInstallation) {
    Write-Host "Python disponible" -ForegroundColor Green
}
```

### Gestion des processus
```powershell
# Récupérer tous les processus
$processes = Get-DocusenseProcesses

# Arrêter les processus
Stop-DocusenseProcesses -Force
```

### Vérification des ports
```powershell
# Vérifier si un port est utilisé
if (Test-PortInUse -Port 3000) {
    Write-Host "Port 3000 occupé" -ForegroundColor Yellow
}

# Fermer les navigateurs sur un port
Close-BrowserOnPort -Port 3000
```

### Nettoyage
```powershell
# Nettoyer les logs
$deletedLogs = Clean-Logs

# Nettoyer les fichiers temporaires
$deletedFiles = Clean-TempFiles
```

## 📋 Script Principal - Menu Unifié

Le script `main.ps1` offre un menu interactif avec :

1. **Démarrage de l'application** - Options de démarrage
2. **Vérification du statut** - Monitoring des services
3. **Nettoyage et maintenance** - Scripts de maintenance
4. **Tests et audit** - Tests automatisés
5. **Utilitaires** - Outils divers
6. **Installation Node.js** - Configuration requise

## 🔄 Historique des Consolidations

### v1.0 (Août 2025)
- Organisation initiale des scripts
- Suppression des doublons de base de données
- Consolidation des dossiers temporaires

### v2.0 (Décembre 2025) ⭐ **ACTUELLE**
- **Consolidation des scripts Node.js** : 3 scripts → 1
- **Fonctions communes centralisées** : 15 fonctions partagées
- **Suppression des doublons** : ~500 lignes de code supprimées
- **Menu principal unifié** : Navigation simplifiée
- **Documentation mise à jour** : Reflète les changements

---

*Dernière mise à jour : Décembre 2025 - Consolidation v2.0*
