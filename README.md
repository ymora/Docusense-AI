# 🚀 DocuSense AI

Application d'analyse intelligente de documents avec IA pour le secteur de la construction.

## 📖 Documentation Complète

**📚 [Consultez la documentation complète dans le répertoire `docs/`](docs/README.md)**

La documentation a été consolidée et organisée dans le répertoire `docs/` avec une structure claire et des sections dédiées pour chaque type d'utilisateur.

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

## 📁 Structure du Projet

```
DocuSense AI/
├── README.md                           # Ce fichier
├── docs/                               # 📚 Documentation consolidée
│   ├── README.md                       # Documentation principale
│   ├── users/                          # Guides utilisateurs
│   ├── developers/                     # Documentation technique
│   ├── ui/                             # Documentation interface
│   ├── system/                         # Documentation système
│   ├── reference/                      # Documents de référence
│   ├── production/                     # Standards production
│   ├── audit/                          # Audit et qualité
│   └── roadmap/                        # Améliorations futures
├── scripts/                            # Scripts utilitaires
├── tests/                              # Tests de l'application
├── backend/                            # Application backend Python
├── frontend/                           # Application frontend React
├── reference_documents/                # Documents de référence
└── logs/                               # Fichiers de logs
```

## 🌐 Accès

- **Frontend :** http://localhost:3000
- **Backend :** http://localhost:8000
- **API Documentation :** http://localhost:8000/docs

## ⚠️ Prérequis

- Python 3.8+
- Node.js 16+
- PowerShell 7+
- Environnement virtuel Python activé

## 🔗 Liens Rapides

- **[📚 Documentation Complète](docs/README.md)**
- **[🚀 Démarrage Rapide](docs/users/DEMARRAGE_RAPIDE.md)**
- **[🏗️ Architecture](docs/developers/ARCHITECTURE.md)**
- **[🔌 API Reference](docs/developers/API_REFERENCE.md)**
- **[✅ Checklist Production](docs/production/CHECKLIST.md)**

---

*Dernière mise à jour : Août 2025 - Documentation consolidée dans `docs/`*
