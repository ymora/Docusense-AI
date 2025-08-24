# 🔧 Consolidation des Scripts - Guide Développeur

## 🎯 Vue d'ensemble

Ce document décrit la consolidation et l'optimisation des scripts PowerShell réalisées dans DocuSense AI v2.0. Cette consolidation vise à éliminer la duplication de code et améliorer la maintenabilité.

## 📊 Résumé des Consolidations

### ✅ **Étape 1 : Consolidation des scripts Node.js**
- **Fichiers supprimés** : 2 scripts redondants
- **Lignes de code supprimées** : 312
- **Script conservé** : `install-nodejs.ps1` (complet et optimisé)

### ✅ **Étape 2 : Fonctions communes centralisées**
- **Fichier créé** : `scripts/utils/common.ps1`
- **Fonctions disponibles** : 15 fonctions partagées
- **Scripts mis à jour** : 4 scripts principaux

### ✅ **Gains totaux**
- **Code supprimé** : ~500 lignes
- **Fichiers supprimés** : 2
- **Maintenabilité** : Améliorée significativement

## 🛠️ Fonctions Communes Disponibles

### 📁 **Fichier** : `scripts/utils/common.ps1`

#### 🔍 **Fonctions de Vérification**
```powershell
# Vérifier si Node.js est installé
Test-NodeJSInstallation

# Vérifier si Python est accessible
Test-PythonInstallation
```

#### ⚙️ **Fonctions de Gestion des Processus**
```powershell
# Récupérer tous les processus DocuSense AI
Get-DocusenseProcesses

# Arrêter tous les processus (avec option Force)
Stop-DocusenseProcesses [-Force]
```

#### 🌐 **Fonctions de Vérification des Ports**
```powershell
# Vérifier si un port est utilisé
Test-PortInUse -Port 3000

# Fermer les navigateurs sur un port spécifique
Close-BrowserOnPort -Port 3000
```

#### 📝 **Fonctions de Logging**
```powershell
# Afficher un message de log formaté
Write-TestLog -Message "Test réussi" -Status "SUCCESS"
```

#### 🔌 **Fonctions de Vérification des Services**
```powershell
# Vérifier si un service répond
Test-ServiceRunning -ServiceName "Backend" -Port 8000
```

#### 🧹 **Fonctions de Nettoyage**
```powershell
# Nettoyer les fichiers de logs
Clean-Logs

# Nettoyer les fichiers temporaires
Clean-TempFiles
```

## 🔄 Scripts Mis à Jour

### 1. **`scripts/main.ps1`**
- **Changement** : Utilise les fonctions communes
- **Fonction simplifiée** : `Close-BrowserOnPort3000`
- **Impact** : Code plus maintenable

### 2. **`scripts/maintenance/cleanup.ps1`**
- **Changement** : Utilise `Stop-DocusenseProcesses` et `Clean-Logs`
- **Suppression** : Code dupliqué de gestion des processus
- **Impact** : Cohérence avec les autres scripts

### 3. **`scripts/monitoring/status.ps1`**
- **Changement** : Utilise `Get-DocusenseProcesses` et `Test-PortInUse`
- **Suppression** : Code dupliqué de vérification
- **Impact** : Logique centralisée

### 4. **`scripts/startup/docusense.ps1`**
- **Changement** : Utilise `Test-NodeJSInstallation`
- **Suppression** : Code dupliqué de vérification Node.js
- **Impact** : Cohérence des vérifications

## 📋 Guide d'Utilisation pour Développeurs

### 🔧 **Chargement des Fonctions Communes**
```powershell
# Au début de chaque script
. ".\scripts\utils\common.ps1"
```

### 🎯 **Exemple d'Utilisation**
```powershell
# Charger les fonctions communes
. ".\scripts\utils\common.ps1"

# Vérifier l'environnement
if (-not (Test-NodeJSInstallation)) {
    Write-Host "Node.js requis" -ForegroundColor Red
    exit 1
}

if (-not (Test-PythonInstallation)) {
    Write-Host "Python requis" -ForegroundColor Red
    exit 1
}

# Vérifier les processus existants
$processes = Get-DocusenseProcesses
if ($processes.Python -or $processes.NodeJS) {
    Write-Host "Processus existants détectés" -ForegroundColor Yellow
    Stop-DocusenseProcesses -Force
}

# Vérifier les ports
if (Test-PortInUse -Port 3000) {
    Close-BrowserOnPort -Port 3000
}

# Nettoyer si nécessaire
$deletedLogs = Clean-Logs
$deletedFiles = Clean-TempFiles

Write-TestLog "Script terminé" "SUCCESS"
```

### 🚫 **À Éviter**
```powershell
# ❌ Ne pas dupliquer le code de vérification
$nodeVersion = node --version 2>$null
$npmVersion = npm --version 2>$null

# ✅ Utiliser la fonction commune
if (Test-NodeJSInstallation) {
    # Continuer
}
```

## 🔄 Migration des Scripts Existants

### 📝 **Étapes de Migration**
1. **Charger les fonctions communes** au début du script
2. **Identifier le code dupliqué** (vérifications, gestion processus, etc.)
3. **Remplacer par les fonctions communes** appropriées
4. **Tester** le script modifié
5. **Documenter** les changements

### 🔍 **Code à Remplacer**
```powershell
# ❌ Ancien code (à remplacer)
try {
    $pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
    if ($pythonProcesses) {
        $pythonProcesses | ForEach-Object {
            Write-Host "Arrêt du processus Python PID: $($_.Id)" -ForegroundColor Cyan
            $_.Kill()
        }
    }
} catch {
    Write-Host "Aucun processus Python à arrêter" -ForegroundColor Gray
}

# ✅ Nouveau code (utilise les fonctions communes)
Stop-DocusenseProcesses -Force
```

## 📊 Métriques de Consolidation

### 📈 **Avant Consolidation**
- **Scripts Node.js** : 3 fichiers (install-nodejs.ps1, install-nodejs-simple.ps1, setup-frontend-tests.ps1)
- **Code dupliqué** : ~500 lignes
- **Fonctions communes** : Aucune
- **Maintenabilité** : Faible (modifications multiples)

### 📉 **Après Consolidation**
- **Scripts Node.js** : 1 fichier (install-nodejs.ps1)
- **Code dupliqué** : 0 ligne
- **Fonctions communes** : 15 fonctions
- **Maintenabilité** : Élevée (modifications centralisées)

## 🎯 Bonnes Pratiques

### ✅ **À Faire**
- **Utiliser les fonctions communes** pour toute logique partagée
- **Tester les scripts** après modification
- **Documenter les changements** dans les scripts
- **Maintenir la cohérence** entre tous les scripts

### ❌ **À Éviter**
- **Dupliquer le code** de vérification ou de gestion
- **Modifier les fonctions communes** sans tester
- **Créer de nouveaux scripts** sans utiliser les fonctions communes
- **Ignorer la documentation** des fonctions

## 🔗 Liens Utiles

- **[Documentation Scripts](../system/README_Scripts.md)** - Documentation complète des scripts
- **[Fonctions Communes](../system/README_Scripts.md#-fonctions-communes-disponibles)** - Guide des fonctions communes
- **[Menu Principal](../system/README_Scripts.md#-script-principal---menu-unifié)** - Utilisation du menu principal

---

*Dernière mise à jour : Décembre 2025 - Consolidation v2.0*
