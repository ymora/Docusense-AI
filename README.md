# 🚀 DocuSense AI

**Application d'analyse intelligente de documents avec IA pour le secteur de la construction**

## 📖 Documentation Complète

**📚 [Consultez la documentation complète dans le répertoire `docs/`](docs/README.md)**

La documentation a été consolidée et organisée dans le répertoire `docs/` avec une structure claire et des sections dédiées pour chaque type d'utilisateur.

## 🚀 Démarrage Rapide

### Option 1 : Menu interactif (recommandé)
```powershell
.\scripts\startup\docusense.ps1
```

### Option 2 : Commandes manuelles
```powershell
# Backend
cd backend
venv\Scripts\python.exe main.py

# Frontend (dans un autre terminal)
cd frontend
npm run dev
```

### Option 3 : Déploiement Production avec Docker
```bash
# Configuration
cp env.production.example .env
# Éditer .env avec vos valeurs

# Déploiement
docker-compose up -d
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
- **[🐳 Docker Production](docs/production/DOCKER_GUIDE.md)**
- **[🏗️ Architecture](docs/developers/ARCHITECTURE.md)**
- **[✅ Checklist Production](docs/production/CHECKLIST.md)**

## 📊 Statut du Projet

**✅ Backend :** Fonctionnel (port 8000)  
**❌ Frontend :** Nécessite Node.js  
**✅ Base de données :** Connectée  
**✅ API :** Opérationnelle  
**✅ Docker :** Configuration production complète  

---

*Dernière mise à jour : Août 2025 - Documentation consolidée dans `docs/`*
