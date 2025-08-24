# 📁 Scripts DocuSense AI - Organisation Consolidée

## 🎯 Vue d'ensemble

Ce dossier contient tous les scripts PowerShell organisés de manière logique pour la gestion complète de DocuSense AI.

## 📂 Structure des Scripts

### 🚀 **Startup** - Démarrage des services
```
startup/
├── docusense.ps1          # Script principal de démarrage
└── start.ps1              # Démarrage rapide
```

### 🔧 **Maintenance** - Maintenance et nettoyage
```
maintenance/
├── cleanup.ps1                    # Nettoyage général optimisé
└── database_cleanup.ps1           # Nettoyage base de données
```

### 📊 **Monitoring** - Surveillance système
```
monitoring/
└── status.ps1             # Statut des services
```

### 🧪 **Testing** - Tests et validation
```
testing/
└── test-audit.ps1         # Tests d'audit complets
```

### 🛠️ **Utils** - Utilitaires
```
utils/
└── [utilitaires divers]
```

## 🚀 Utilisation

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
.\scripts\testing\test-audit.ps1
```

### Monitoring
```powershell
.\scripts\monitoring\status.ps1
```

## 📋 Script Principal

Le script principal `main.ps1` à la racine du dossier scripts permet d'accéder à toutes les fonctionnalités via un menu interactif.

## 🔄 Consolidation et Optimisation Réalisées

### ✅ **Fichiers de base de données**
- **Avant** : 4 copies de `docusense.db` dispersées
- **Après** : 1 seule base dans `backend/docusense.db`

### ✅ **Dossiers temporaires**
- **Avant** : 3 dossiers `temp_downloads` dupliqués
- **Après** : 1 seul dossier `backend/temp_downloads`

### ✅ **Scripts PowerShell**
- **Avant** : Scripts dispersés dans plusieurs dossiers
- **Après** : Organisation logique dans `scripts/`

### ✅ **Optimisations de code**
- **Suppression des doublons** : 2 scripts de nettoyage DB identiques
- **Consolidation des tests** : Suppression du script `test-simple.ps1` redondant
- **Optimisation des performances** : Amélioration des boucles et gestion d'erreurs
- **Réduction de la redondance** : Fonctions de statut consolidées

## 📊 Avantages de la Consolidation et Optimisation

1. **Réduction de l'espace disque** : Suppression des doublons
2. **Organisation claire** : Structure logique des scripts
3. **Maintenance simplifiée** : Un seul endroit pour chaque type de script
4. **Cohérence** : Chemins standardisés dans toute l'application
5. **Performance améliorée** : Scripts optimisés et consolidés
6. **Réduction de la redondance** : Code réutilisable entre scripts

---

*Dernière mise à jour : Août 2025 - Consolidation v1.0*
