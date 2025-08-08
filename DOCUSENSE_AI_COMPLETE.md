# DocuSense AI - Documentation Complète

> **🎯 Plateforme d'analyse intelligente de documents - Générale mais optimisée pour usage juridique**

---

## 📋 Table des Matières

- [🎯 Vue d'ensemble](#-vue-densemble)
- [🚀 Démarrage Rapide](#-démarrage-rapide)
- [✨ Fonctionnalités Essentielles](#-fonctionnalités-essentielles)
- [🔧 Fonctionnalités Avancées](#-fonctionnalités-avancées)
- [⚙️ Fonctionnalités Techniques](#️-fonctionnalités-techniques)
- [🛠️ Installation et Configuration](#️-installation-et-configuration)
- [🎯 Utilisation Détaillée](#-utilisation-détaillée)
- [🔍 Système Anti-Régression](#-système-anti-régression)
- [🐛 Dépannage et Troubleshooting](#-dépannage-et-troubleshooting)
- [📊 Tests et Validation](#-tests-et-validation)
- [📞 Support et Maintenance](#-support-et-maintenance)

---

## 🎯 Vue d'ensemble

### **Description**
DocuSense AI est une plateforme moderne d'analyse intelligente de documents utilisant l'IA. Conçue comme une solution générale, elle est particulièrement optimisée pour les besoins juridiques, permettant l'analyse approfondie de contrats, rapports, et documents légaux.

### **Architecture**
- **Backend** : Python/FastAPI avec services modulaires
- **Frontend** : React/TypeScript avec interface épurée
- **Base de données** : SQLite avec migrations automatiques
- **IA** : Support multi-providers (OpenAI, Anthropic, etc.)

### **Cas d'usage principaux**
- Analyse de documents juridiques et contrats
- Extraction de données structurées
- OCR pour documents scannés
- Visualisation directe de tous types de fichiers
- Queue d'analyse avec prompts personnalisables

---

## 🚀 Démarrage Rapide

### **Installation Express (2 minutes)**

```bash
# 1. Cloner le projet
git clone <repository-url>
cd DocuSense-AI

# 2. Installation automatique
.\start_optimized.ps1

# 3. Accéder à l'application
# Frontend : http://localhost:3000
# Backend : http://localhost:8000
# API Docs : http://localhost:8000/docs
```

### **Premiers Pas**
1. **Ouvrez** http://localhost:3000
2. **Sélectionnez** un dossier contenant vos documents
3. **Cliquez** sur un fichier → Affichage automatique
4. **Clic droit** → "Analyser IA" → Sélectionnez un prompt
5. **Consultez** les résultats dans l'onglet "Analyses"

---

## ✨ Fonctionnalités Essentielles

### **1. Analyse IA de Documents**

#### **Description**
Système d'analyse intelligente utilisant l'IA pour extraire et analyser le contenu de tous types de documents.

#### **Utilisation**
- **Clic droit** sur un fichier → "Analyser IA"
- **Sélection** du prompt (défaut ou personnalisé)
- **Attente** du traitement (queue en temps réel)
- **Consultation** des résultats dans l'onglet "Analyses"

#### **Configuration**
```typescript
// Configuration des providers IA
{
  "openai": {
    "api_key": "sk-...",
    "model": "gpt-4",
    "priority": 1
  },
  "anthropic": {
    "api_key": "sk-ant-...",
    "model": "claude-3-sonnet",
    "priority": 2
  }
}
```

#### **Troubleshooting**
- **Erreur API** : Vérifiez les clés API dans Configuration → Providers IA
- **Timeout** : Augmentez le délai dans les paramètres
- **Résultats vides** : Vérifiez que le fichier est lisible

### **2. OCR pour PDF Scannés**

#### **Description**
Système OCR automatique pour extraire le texte des PDF scannés et images.

#### **Utilisation**
- **Glisser-déposer** un PDF scanné
- **Analyse automatique** : Le système détecte si OCR nécessaire
- **Extraction** : Texte extrait avec précision DPI 300
- **Analyse IA** : Le texte extrait peut être analysé

#### **Configuration**
```python
# Configuration OCR optimale
{
  "dpi": 300,
  "languages": ["fra", "eng"],
  "psm": 6,
  "thread_count": 2
}
```

#### **Troubleshooting**
- **Qualité médiocre** : Augmentez le DPI (400-600)
- **Langues non détectées** : Vérifiez installation Tesseract
- **Performance lente** : Réduisez le DPI (150-200)

### **3. Visualisation Directe des Fichiers Office**

#### **Description**
Affichage direct dans le navigateur des fichiers Office (DOCX, XLSX, PPTX, etc.) sans téléchargement.

#### **Utilisation**
- **Clic** sur un fichier Office
- **Affichage** automatique en HTML dans l'interface
- **Navigation** : Zoom, défilement, recherche
- **Cache** : Performance optimisée avec cache

#### **Configuration**
```python
# Formats supportés
supported_formats = [
    '.docx', '.doc', '.xlsx', '.xls', 
    '.pptx', '.ppt', '.odt', '.ods', '.odp'
]
```

#### **Troubleshooting**
- **Affichage vide** : Vérifiez que le fichier n'est pas corrompu
- **Erreur de conversion** : Installez les dépendances Python
- **Performance** : Le cache améliore les temps de chargement

---

## 🔧 Fonctionnalités Avancées

### **4. Menu Contextuel avec Queue d'Analyse**

#### **Description**
Menu contextuel intelligent permettant de mettre en queue des fichiers pour analyse IA avec sélection de prompts.

#### **Utilisation**
- **Clic droit** sur un fichier
- **Options disponibles** :
  - "Analyser IA (Prompt défaut)"
  - "Analyser IA (Prompt personnalisé)"
- **Sélection** du prompt dans le modal
- **Queue** : Suivi en temps réel des analyses

#### **Configuration**
```typescript
// Types de fichiers analysables
const analyzableTypes = [
  'text/plain', 'text/html', 'text/markdown',
  'application/pdf', 'application/json',
  'application/vnd.openxmlformats-officedocument.*'
];
```

#### **Troubleshooting**
- **Option grisée** : Vérifiez le type de fichier
- **Queue bloquée** : Redémarrez le backend
- **Prompt non disponible** : Vérifiez la configuration

### **5. Gestion des Priorités IA**

#### **Description**
Système de gestion des priorités pour les providers IA avec échange automatique.

#### **Utilisation**
- **Configuration** → "Stratégie IA"
- **Définition** des priorités (1, 2, 3...)
- **Échange automatique** : Si 1 devient 2, alors 2 devient 1
- **Numérotation dynamique** : 1 à N providers actifs

#### **Configuration**
```python
# Logique de priorité
def handle_priority_change(new_priority, provider):
    # Échange automatique si conflit
    if priority_exists(new_priority):
        swap_priorities(new_priority, provider)
    # Numérotation 1 à N
    reorder_priorities()
```

#### **Troubleshooting**
- **Priorité invalide** : Vérifiez le nombre de providers actifs
- **Échange non effectué** : Redémarrez l'application
- **Numérotation incorrecte** : Vérifiez la configuration

### **6. Configuration des Providers IA**

#### **Description**
Interface de configuration complète pour les providers IA avec validation automatique.

#### **Utilisation**
- **Configuration** → "Providers IA"
- **Ajout** des clés API
- **Test** de validation
- **Statut visuel** : Couleurs des icônes de clés

#### **Configuration**
```typescript
// Statuts des providers
const providerStatuses = {
  'no_key': '#6b7280',      // Gris
  'untested': '#eab308',    // Jaune
  'valid': '#10b981',       // Vert
  'invalid': '#ef4444'      // Rouge
};
```

#### **Troubleshooting**
- **Test échoué** : Vérifiez la clé API et la connectivité
- **Statut incorrect** : Rechargez la page
- **Provider non disponible** : Vérifiez la configuration

---

## ⚙️ Fonctionnalités Techniques

### **7. Système de Migration Automatique DB**

#### **Description**
Système de maintenance automatique de la base de données qui corrige les incohérences au démarrage.

#### **Utilisation**
- **Démarrage automatique** : Au lancement du backend
- **Corrections appliquées** :
  - Statuts de fichiers invalides
  - Types MIME manquants
  - Fichiers orphelins
  - Métadonnées incomplètes

#### **Configuration**
```python
# Migrations automatiques
def run_automatic_migrations(db):
    migrations = [
        '_migrate_file_statuses',
        '_migrate_mime_types', 
        '_cleanup_orphaned_files',
        '_update_file_metadata'
    ]
    for migration in migrations:
        execute_migration(migration, db)
```

#### **Troubleshooting**
- **Migrations échouées** : Vérifiez les logs du backend
- **Données corrompues** : Sauvegardez avant migration
- **Performance** : Les migrations sont optimisées

### **8. Prompts Spécialisés Juridiques**

#### **Description**
Collection de prompts IA spécialement conçus pour l'analyse de documents juridiques.

#### **Prompts Disponibles**
- **Analyse de Contrat** : Parties, clauses, obligations
- **Analyse de Litige** : Faits, fondements, stratégie
- **Vérification Normative** : Conformité NF, EN, ISO
- **Analyse DTU** : Documents Techniques Unifiés
- **Analyse RE2020** : Réglementation environnementale
- **Analyse RT2012** : Réglementation thermique

#### **Configuration**
```json
{
  "juridical_contract_analysis": {
    "domain": "juridical",
    "type": "analysis",
    "prompt": "Tu es un expert juridique..."
  }
}
```

#### **Troubleshooting**
- **Prompt non trouvé** : Vérifiez le fichier prompts.json
- **Résultats médiocres** : Ajustez le prompt
- **Erreur de domaine** : Vérifiez la configuration

---

## 🛠️ Installation et Configuration

### **Prérequis Système**

#### **Windows**
```bash
# Python 3.8+
python --version

# Node.js 16+
node --version

# Tesseract OCR
# Télécharger depuis https://github.com/UB-Mannheim/tesseract/wiki
```

#### **Linux**
```bash
# Installation des dépendances
sudo apt-get update
sudo apt-get install python3 python3-pip nodejs npm tesseract-ocr
```

#### **macOS**
```bash
# Installation via Homebrew
brew install python node tesseract
```

### **Installation Backend**

```bash
# 1. Création de l'environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# 2. Installation des dépendances
pip install -r backend/requirements.txt

# 3. Configuration de la base de données
cd backend
python -c "from app.core.database import init_db; init_db()"
```

### **Installation Frontend**

```bash
# 1. Installation des dépendances
cd frontend
npm install

# 2. Configuration de l'environnement
cp .env.example .env
# Éditer .env avec les URLs du backend
```

### **Configuration des Providers IA**

```bash
# 1. Accéder à l'interface
http://localhost:3000

# 2. Configuration → Providers IA
# 3. Ajouter les clés API
# 4. Tester la connexion
```

---

## 🎯 Utilisation Détaillée

### **Workflow Typique**

#### **1. Analyse de Documents**
```bash
# Sélection manuelle à partir des fichiers du disque dur

```

#### **2. Navigation et Visualisation**
```bash
# Arborescence des fichiers
# Clic sur un fichier → Affichage automatique

# Types supportés :
# - PDF : Affichage natif
# - Office : Conversion HTML
# - Images : Affichage avec contrôles
# - Audio/Video : Lecteur multimédia
```

#### **3. Analyse IA**
```bash
# Clic droit → "Analyser IA"
# Sélection du prompt :
# - Prompt défaut
# - Prompt personnalisé (juridique, technique, etc.)

# Suivi en temps réel :
# - Queue d'analyse
# - Progression
# - Résultats
```

#### **4. Consultation des Résultats**
```bash
# Onglet "Analyses"
# - Liste des analyses effectuées
# - Filtres par type, date, prompt
# - Export des résultats
```

### **Cas d'Usage Juridiques**

#### **Analyse de Contrat**
1. **Import** du contrat (PDF, DOCX)
2. **Sélection** du prompt "Analyse de Contrat"
3. **Analyse** automatique des clauses
4. **Résultats** : Parties, obligations, risques

#### **Analyse de Litige**
1. **Import** des documents de litige
2. **Sélection** du prompt "Analyse de Litige"
3. **Analyse** des faits et fondements
4. **Résultats** : Stratégie de défense

#### **Vérification Normative**
1. **Import** des documents techniques
2. **Sélection** du prompt "Vérification Normative"
3. **Analyse** de conformité
4. **Résultats** : Écarts et recommandations

---

## 🔍 Système Anti-Régression

### **Description**
Système complet de prévention des régressions avec validation automatique et règles de développement.

### **Composants**

#### **1. Script de Validation Automatique**
```powershell
# validate_app.ps1
# Vérifie automatiquement :
# - Structure des fichiers
# - Endpoints API
# - Configuration
# - Tests unitaires
```

#### **2. Règles de Développement**
```markdown
# DEVELOPMENT_RULES.md
# Règles strictes pour :
# - Éviter les duplications
# - Maintenir la cohérence
# - Préserver les fonctionnalités
# - Tests obligatoires
```

#### **3. Guide Anti-Régression**
```markdown
# ANTI_REGRESSION_GUIDE.md
# Procédures pour :
# - Validation avant commit
# - Tests de régression
# - Rollback en cas de problème
```

#### **4. Template de Chat**
```markdown
# CHAT_TEMPLATE.md
# Template pour nouveaux chats avec :
# - Contexte du projet
# - Règles à respecter
# - Procédures de validation
```

### **Utilisation**

#### **Validation Automatique**
```bash
# Exécution du script de validation
.\validate_app.ps1

# Vérification des résultats
# - ✅ Tous les tests passent
# - ❌ Erreurs détectées
```

#### **Règles de Développement**
```bash
# Avant chaque modification :
# 1. Lire DEVELOPMENT_RULES.md
# 2. Suivre les procédures
# 3. Exécuter les tests
# 4. Valider avec validate_app.ps1
```

#### **En Cas de Régression**
```bash
# 1. Identifier la cause
# 2. Consulter ANTI_REGRESSION_GUIDE.md
# 3. Appliquer les corrections
# 4. Revalider complètement
```

---

## 🐛 Dépannage et Troubleshooting

### **Problèmes Courants**

#### **1. Backend ne démarre pas**
```bash
# Symptômes : Erreur de port, dépendances manquantes
# Solutions :
# - Vérifier que le port 8000 est libre
# - Installer les dépendances : pip install -r requirements.txt
# - Vérifier Python 3.8+
# - Activer l'environnement virtuel
```

#### **2. Frontend ne se connecte pas**
```bash
# Symptômes : Erreur de connexion au backend
# Solutions :
# - Vérifier que le backend tourne sur http://localhost:8000
# - Vérifier la configuration dans .env
# - Redémarrer le frontend : npm run dev
```

#### **3. Analyse IA échoue**
```bash
# Symptômes : Erreur API, timeout, résultats vides
# Solutions :
# - Vérifier les clés API dans Configuration
# - Tester la connexion internet
# - Vérifier les quotas des providers
# - Augmenter les timeouts
```

#### **4. OCR ne fonctionne pas**
```bash
# Symptômes : Texte non extrait des PDF scannés
# Solutions :
# - Vérifier l'installation de Tesseract
# - Installer pdf2image : pip install pdf2image
# - Vérifier les langues installées
# - Augmenter le DPI si qualité médiocre
```

#### **5. Visualisation Office échoue**
```bash
# Symptômes : Fichiers Office non affichés
# Solutions :
# - Installer les dépendances : python-docx, openpyxl, python-pptx
# - Vérifier que le fichier n'est pas corrompu
# - Vider le cache du navigateur
```

#### **6. Queue d'analyse bloquée**
```bash
# Symptômes : Analyses en attente indéfiniment
# Solutions :
# - Redémarrer le backend
# - Vérifier les logs d'erreur
# - Vider la queue manuellement
# - Vérifier la configuration des providers
```

### **Logs et Debugging**

#### **Logs Backend**
```bash
# Emplacement : backend/logs/
# Types de logs :
# - app.log : Logs généraux
# - error.log : Erreurs
# - access.log : Accès API

# Consultation en temps réel :
tail -f backend/logs/app.log
```

#### **Logs Frontend**
```bash
# Console du navigateur (F12)
# Types d'informations :
# - Erreurs JavaScript
# - Requêtes API
# - État des composants
```

#### **Debugging Avancé**
```bash
# Mode debug backend
export DEBUG=1
python main.py

# Mode debug frontend
npm run dev -- --debug
```

---

## 📊 Tests et Validation

### **Système de Tests Global**

#### **Description**
Fichier de test unique qui valide toutes les fonctionnalités de l'application.

#### **Utilisation**
```bash
# Exécution des tests complets
python test_complete_system.py

# Tests par catégorie
python test_complete_system.py --category=core
python test_complete_system.py --category=ai
python test_complete_system.py --category=ui
```

#### **Tests Inclus**

##### **Tests Core**
- ✅ Structure des fichiers
- ✅ Configuration de base
- ✅ Base de données
- ✅ Services essentiels

##### **Tests IA**
- ✅ Configuration des providers
- ✅ Analyse de documents
- ✅ OCR et extraction
- ✅ Prompts spécialisés

##### **Tests UI**
- ✅ Interface utilisateur
- ✅ Menu contextuel
- ✅ Queue d'analyse
- ✅ Visualisation des fichiers

##### **Tests Intégration**
- ✅ Backend-Frontend
- ✅ API endpoints
- ✅ Migrations automatiques
- ✅ Performance

#### **Validation Automatique**
```bash
# Script de validation intégré
# Vérifie automatiquement :
# - Fonctionnalités essentielles
# - Configuration
# - Performance
# - Sécurité
```

### **Tests de Performance**

#### **Benchmarks**
```bash
# Test de charge
python test_performance.py --load-test

# Test de mémoire
python test_performance.py --memory-test

# Test de vitesse
python test_performance.py --speed-test
```

#### **Métriques**
- **Temps de réponse** : < 2s pour l'analyse
- **Utilisation mémoire** : < 500MB
- **Temps de démarrage** : < 30s
- **Concurrence** : 10 utilisateurs simultanés

---

## 📞 Support et Maintenance

### **Maintenance Préventive**

#### **Nettoyage Automatique**
```bash
# Nettoyage des fichiers temporaires
python cleanup_temp_files.py

# Nettoyage de la base de données
python cleanup_database.py

# Nettoyage des logs
python cleanup_logs.py
```

#### **Sauvegarde**
```bash
# Sauvegarde de la base de données
python backup_database.py

# Sauvegarde de la configuration
python backup_config.py

# Restauration
python restore_backup.py --file=backup_2024-01-07.db
```

### **Mise à Jour**

#### **Procédure de Mise à Jour**
```bash
# 1. Sauvegarde
python backup_all.py

# 2. Mise à jour du code
git pull origin main

# 3. Mise à jour des dépendances
pip install -r requirements.txt --upgrade
npm install --upgrade

# 4. Migration de la base de données
python migrate_database.py

# 5. Validation
python test_complete_system.py
```

#### **Rollback**
```bash
# En cas de problème
git checkout previous_version
python restore_backup.py
python test_complete_system.py
```

### **Support Technique**

#### **Documentation**
- **Guide utilisateur** : Ce document
- **API Documentation** : http://localhost:8000/docs
- **Code source** : Commenté et documenté
- **Logs** : Détailés pour debugging

#### **Contact**
- **Issues** : GitHub Issues
- **Documentation** : Wiki du projet
- **Support** : Email de support

---

## 🎉 Conclusion

DocuSense AI est une plateforme complète d'analyse intelligente de documents, optimisée pour les besoins juridiques tout en restant polyvalente. Avec ses fonctionnalités avancées d'IA, d'OCR, et de visualisation, elle offre une solution moderne et efficace pour l'analyse de documents.

### **Points Clés**
- ✅ **Analyse IA** : Multi-providers avec prompts spécialisés
- ✅ **OCR** : Support complet des PDF scannés
- ✅ **Visualisation** : Tous formats sans téléchargement
- ✅ **Anti-régression** : Système de validation robuste
- ✅ **Performance** : Optimisée et scalable
- ✅ **Maintenance** : Automatique et préventive

### **Évolutions Futures**
- 🔮 **IA Cloud** : Intégration de services cloud
- 🔮 **Collaboration** : Mode multi-utilisateurs
- 🔮 **Mobile** : Application mobile native
- 🔮 **API Public** : API publique pour intégrations

---

*Documentation mise à jour le : 2025-01-07*
*Version : 1.0.0*
*Auteur : Équipe DocuSense AI*
