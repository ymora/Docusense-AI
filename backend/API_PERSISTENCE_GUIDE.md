# 🔐 Guide de Persistance des Clés API

## 📋 Vue d'ensemble

Le système de persistance des clés API garantit que vos clés API sont automatiquement sauvegardées et restaurées entre les redémarrages de l'application, sans dépendre des variables d'environnement.

## ✨ Fonctionnalités

### 🔄 Persistance Automatique
- **Sauvegarde automatique** : Les clés API sont automatiquement sauvegardées dans la base de données
- **Restauration au démarrage** : Les clés sont rechargées depuis la base de données au démarrage
- **Migration automatique** : Les clés des variables d'environnement sont automatiquement migrées
- **Synchronisation bidirectionnelle** : Maintient la cohérence entre la base de données et les settings

### 🛡️ Sécurité
- **Chiffrement** : Les clés API sont stockées avec le flag `is_encrypted=True`
- **Isolation** : Chaque clé est stockée séparément avec son propre identifiant
- **Validation** : Vérification automatique de l'intégrité des clés

### 🔧 Gestion des Providers
- **OpenAI** : `openai_api_key`
- **Anthropic/Claude** : `anthropic_api_key`
- **Mistral** : `mistral_api_key`
- **Ollama** : Configuration locale (pas de clé API)

## 🚀 Utilisation

### Démarrage Standard (Recommandé)
```bash
cd backend
venv\Scripts\python.exe main.py
```

**Le démarrage standard inclut automatiquement :**
- ✅ Migration automatique des clés API
- ✅ Chargement depuis la base de données
- ✅ Synchronisation des settings
- ✅ Vérification de cohérence

### Migration Manuelle (Optionnel)
```bash
cd backend
venv\Scripts\python.exe migrate_api_keys.py
```

### Test de Persistance (Optionnel)
```bash
cd backend
venv\Scripts\python.exe test_api_persistence.py
```

## 🔧 Configuration

### Structure de la Base de Données
```sql
-- Table Config
CREATE TABLE config (
    id INTEGER PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    category VARCHAR(100),
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Clés API stockées
INSERT INTO config (key, value, description, category, is_encrypted) VALUES
('openai_api_key', 'sk-...', 'API key for OpenAI', 'ai', TRUE),
('anthropic_api_key', 'sk-ant-...', 'API key for Anthropic', 'ai', TRUE),
('mistral_api_key', '...', 'API key for Mistral', 'ai', TRUE);
```

### Mapping des Providers
| Provider | Clé Base de Données | Attribut Settings |
|----------|-------------------|-------------------|
| OpenAI | `openai_api_key` | `settings.openai_api_key` |
| Claude/Anthropic | `anthropic_api_key` | `settings.anthropic_api_key` |
| Mistral | `mistral_api_key` | `settings.mistral_api_key` |

## 🔄 Processus de Migration Automatique

### 1. Détection au Démarrage
Le système détecte automatiquement les clés API existantes dans :
- Variables d'environnement
- Base de données
- Settings de l'application

### 2. Synchronisation Automatique
- **Priorité à la base de données** : Si une clé existe en base, elle est utilisée
- **Migration automatique** : Les clés des variables d'environnement sont migrées vers la base
- **Résolution des conflits** : En cas de différence, la base de données fait autorité

### 3. Persistance Continue
- **Sauvegarde immédiate** : Chaque nouvelle clé est immédiatement sauvegardée
- **Chargement au démarrage** : Les clés sont rechargées automatiquement
- **Validation continue** : Vérification de l'intégrité à chaque accès

## 📊 Monitoring

### Logs de Migration Automatique
```
INFO:app.services.config_service:🔄 Migrating API keys to persistence system...
INFO:app.services.config_service:✅ Migrated API key for openai
INFO:app.services.config_service:✅ 2 API key(s) migrated/synchronized
INFO:app.services.config_service:✅ API keys loaded from database
```

### Vérification des Clés
```python
from app.services.config_service import ConfigService
from app.core.database import SessionLocal

db = SessionLocal()
config_service = ConfigService(db)

# Vérifier une clé spécifique
api_key = config_service.get_ai_provider_key("openai")

# Charger toutes les clés
config_service.load_api_keys_from_database()
```

## 🛠️ Dépannage

### Problème : Clés non persistées
**Symptôme** : Les clés API sont perdues après redémarrage

**Solution** :
1. Redémarrer normalement : `venv\Scripts\python.exe main.py`
2. La migration automatique devrait résoudre le problème
3. Si problème persiste, vérifier : `python test_api_persistence.py`

### Problème : Conflit de clés
**Symptôme** : Différentes clés entre variables d'environnement et base de données

**Solution** :
1. La base de données fait autorité par défaut
2. Redémarrer : `venv\Scripts\python.exe main.py`
3. La synchronisation automatique résoudra les conflits

### Problème : Erreur de base de données
**Symptôme** : Erreurs lors du chargement des clés

**Solution** :
1. Vérifier la connexion à la base de données
2. S'assurer que les tables sont créées
3. Vérifier les permissions d'accès

## 🔒 Sécurité

### Bonnes Pratiques
- ✅ Les clés API sont chiffrées en base de données
- ✅ Accès restreint aux fichiers de configuration
- ✅ Logs sécurisés (pas d'affichage des clés complètes)
- ✅ Validation des clés avant sauvegarde

### Recommandations
- 🔐 Utiliser des clés API avec des permissions minimales
- 🔄 Renouveler régulièrement les clés API
- 📊 Monitorer l'utilisation des clés API
- 🛡️ Limiter l'accès à la base de données

## 📈 Avantages

### Pour les Développeurs
- **Simplicité** : Plus besoin de gérer les variables d'environnement
- **Fiabilité** : Les clés sont toujours disponibles après redémarrage
- **Flexibilité** : Possibilité de changer les clés via l'interface
- **Automatisation** : Migration et synchronisation automatiques

### Pour la Production
- **Robustesse** : Pas de perte de clés lors des redémarrages
- **Sécurité** : Stockage chiffré en base de données
- **Traçabilité** : Historique des modifications des clés
- **Maintenance** : Aucune intervention manuelle requise

## 🎯 Conclusion

Le système de persistance des clés API est maintenant **intégré dans le démarrage standard** de DocuSense AI. Il offre une solution robuste et sécurisée qui élimine la dépendance aux variables d'environnement et garantit la disponibilité des clés entre les redémarrages.

**Commande principale** :
- `venv\Scripts\python.exe main.py` : Démarrage avec persistance automatique

**Commandes optionnelles** :
- `python migrate_api_keys.py` : Migration manuelle des clés
- `python test_api_persistence.py` : Test de persistance 