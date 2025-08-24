# 💻 Documentation Développeur

Ce répertoire contient la documentation technique destinée aux développeurs de DocuSense AI.

## 📁 Contenu

### 🏗️ **Architecture et Conception**
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architecture système et composants
- **[SERVICES.md](SERVICES.md)** - Documentation complète des services backend

### 🔌 **API et Intégration**
- **[API_REFERENCE.md](API_REFERENCE.md)** - Documentation des endpoints API
- **[BASE_DONNEES.md](BASE_DONNEES.md)** - Schéma et gestion des données

### 🚀 **Déploiement et Tests**
- **[DEPLOIEMENT.md](DEPLOIEMENT.md)** - Installation et configuration
- **[TESTS.md](TESTS.md)** - Tests et qualité du code

## 🎯 Objectif

Cette documentation vise à :
- **Guider** les développeurs dans l'implémentation
- **Standardiser** les pratiques de développement
- **Faciliter** l'intégration et le déploiement
- **Assurer** la qualité du code

## 🔗 Liens Utiles

- **[Documentation principale](../README.md)**
- **[Interface utilisateur](../ui/README.md)**
- **[Standards de production](../production/STANDARDS.md)**
- **[Maintenance système](../system/README_Maintenance_Optimisation.md)**

## 🛠️ Développement

### Prérequis
- Python 3.8+
- Node.js 16+
- PostgreSQL (production)
- Redis (production)

### Installation
```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Tests
```bash
# Tests backend
cd tests && ..\backend\venv\Scripts\python.exe run_all_tests.py

# Tests frontend
cd frontend && npm test
```

## 📋 Standards

- **Code** : PEP 8 pour Python, ESLint pour JavaScript
- **Tests** : Couverture > 80%
- **Documentation** : Docstrings et commentaires
- **Git** : Conventional Commits

---

*Dernière mise à jour : Août 2025*
