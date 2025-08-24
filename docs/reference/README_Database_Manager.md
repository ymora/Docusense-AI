# 🗄️ Interface de Gestion de Base de Données - DocuSense AI

Interface web React pour visualiser et gérer la base de données DocuSense AI.

## 🚀 Lancement Rapide

### Prérequis
- Node.js (version 16 ou supérieure)
- Backend DocuSense AI en cours d'exécution sur le port 8000

### Installation et Lancement

1. **Lancer le backend** (si pas déjà fait) :
   ```powershell
   cd backend
   venv\Scripts\python.exe main.py
   ```

2. **Lancer l'interface de gestion** :
   ```powershell
   cd backend/database_manager
   .\start.ps1
   ```

3. **Ouvrir dans le navigateur** :
   ```
   http://localhost:3001
   ```

## 📊 Fonctionnalités

### Vue d'ensemble
- **Statistiques en temps réel** : Nombre de fichiers, analyses, tâches de queue
- **Rapport de cohérence** : Détection automatique des problèmes
- **Indicateurs visuels** : Cartes colorées pour chaque métrique

### Visualisation des Données
- **Fichiers** : Liste complète avec filtres par statut
- **Analyses** : Historique des analyses avec statuts
- **Queue** : Tâches en cours et terminées

### Actions de Nettoyage
- **Fichiers orphelins** : Suppression des fichiers introuvables
- **Analyses échouées** : Nettoyage des analyses en erreur
- **Tâches anciennes** : Suppression des tâches terminées de plus de 24h
- **Fichiers temporaires** : Nettoyage du dossier temp_downloads
- **Correction de statuts** : Réparation automatique des statuts invalides
- **Nettoyage complet** : Exécution de toutes les opérations

### Sauvegarde et Restauration
- **Création de sauvegardes** : Sauvegarde automatique avec timestamp
- **Liste des sauvegardes** : Visualisation des sauvegardes disponibles
- **Restauration** : Restauration depuis une sauvegarde existante

## 🛠️ Développement

### Structure du Projet
```
database_manager/
├── src/
│   ├── components/          # Composants React
│   │   ├── StatusCard.tsx   # Cartes de statistiques
│   │   ├── CleanupPanel.tsx # Panneau de nettoyage
│   │   └── DataTable.tsx    # Tableaux de données
│   ├── api.ts              # API client
│   ├── types.ts            # Types TypeScript
│   └── App.tsx             # Application principale
├── package.json            # Dépendances
├── vite.config.ts          # Configuration Vite
└── start.ps1              # Script de lancement
```

### Commandes de Développement
```bash
# Installation des dépendances
npm install

# Lancement en mode développement
npm run dev

# Build de production
npm run build

# Prévisualisation du build
npm run preview
```

## 🔧 Configuration

### Ports
- **Interface web** : Port 3001 (configurable dans `vite.config.ts`)
- **Backend API** : Port 8000 (doit être en cours d'exécution)

### Variables d'Environnement
L'interface se connecte automatiquement au backend sur `http://localhost:8000`.
Pour changer l'URL du backend, modifiez `src/api.ts`.

## 📱 Interface Utilisateur

### Design
- **Thème sombre/clair** : Support automatique selon les préférences système
- **Responsive** : Interface adaptée aux différentes tailles d'écran
- **Animations** : Transitions fluides et indicateurs de chargement

### Navigation
- **Onglets** : Navigation intuitive entre les différentes sections
- **Filtres** : Filtrage par statut pour chaque type de données
- **Actualisation** : Bouton de rafraîchissement des données

## 🔒 Sécurité

### Sauvegarde
- **Sauvegarde automatique** : Création d'une sauvegarde avant restauration
- **Validation** : Vérification de l'existence des fichiers avant restauration
- **Logs** : Traçabilité de toutes les opérations

### Confirmation
- **Actions critiques** : Confirmation requise pour les opérations de suppression
- **Feedback visuel** : Messages de succès/erreur pour chaque action

## 🐛 Dépannage

### Problèmes Courants

**Backend non détecté**
```
❌ Backend non détecté sur le port 8000
```
Solution : Vérifiez que le backend est en cours d'exécution avec `venv\Scripts\python.exe main.py`

**Erreur de connexion API**
```
Erreur lors de la récupération du statut
```
Solution : Vérifiez que l'API backend répond sur `http://localhost:8000/api/health`

**Dépendances manquantes**
```
❌ Erreur lors de l'installation des dépendances
```
Solution : Vérifiez que Node.js est installé et à jour

### Logs
Les erreurs sont affichées directement dans l'interface. Pour plus de détails, consultez :
- Console du navigateur (F12)
- Logs du backend dans `backend/logs/`

## 📈 Métriques

L'interface affiche les métriques suivantes :
- **Fichiers** : Total et répartition par statut
- **Analyses** : Nombre total d'analyses
- **Queue** : Tâches en cours et terminées
- **Cohérence** : Fichiers valides, statuts invalides, fichiers orphelins

## 🔄 Mise à Jour

Pour mettre à jour l'interface :
1. Arrêtez l'interface (Ctrl+C)
2. Récupérez les dernières modifications
3. Relancez avec `.\start.ps1`

L'interface se met à jour automatiquement en mode développement.
