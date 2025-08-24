# 📋 Organisation des Logs - DocuSense AI

## 🗂️ Structure des répertoires

```
logs/
├── application/           # Logs de l'application principale
│   ├── docusense.log     # Logs généraux de l'application
│   ├── docusense_error.log # Logs d'erreurs uniquement
│   └── docusense_debug.log # Logs de debug (si activé)
├── security/             # Logs de sécurité et audit
│   ├── auth.log         # Logs d'authentification
│   ├── access.log       # Logs d'accès et permissions
│   └── security_events.log # Événements de sécurité
├── api/                  # Logs des API
│   ├── requests.log     # Logs des requêtes API
│   ├── performance.log  # Métriques de performance
│   └── errors.log       # Erreurs API
├── database/            # Logs de base de données
│   ├── queries.log      # Logs des requêtes (optionnel)
│   ├── migrations.log   # Logs des migrations
│   └── errors.log       # Erreurs DB
├── system/              # Logs système
│   ├── startup.log      # Logs de démarrage
│   ├── health.log       # Logs de santé du système
│   └── maintenance.log  # Logs de maintenance
├── analysis/            # Logs des analyses IA
│   ├── processing.log   # Logs de traitement
│   ├── ai_providers.log # Logs des fournisseurs IA
│   └── errors.log       # Erreurs d'analyse
├── frontend/            # Logs frontend (optionnel)
│   ├── errors.log       # Erreurs frontend
│   └── performance.log  # Performance frontend
├── tests/               # Logs de tests (développement uniquement)
│   ├── unit_tests.log   # Tests unitaires
│   ├── integration_tests.log # Tests d'intégration
│   └── performance_tests.log # Tests de performance
└── archive/             # Logs archivés (rotation automatique)
    ├── YYYY-MM/         # Archives par mois
    └── README.md        # Documentation des archives
```

## 🔧 Configuration

### Niveaux de log par environnement

| Environnement | Application | Security | API | Database | System | Analysis |
|---------------|-------------|----------|-----|----------|--------|----------|
| **Production** | ERROR | INFO | WARNING | ERROR | INFO | ERROR |
| **Staging** | WARNING | INFO | INFO | WARNING | INFO | WARNING |
| **Development** | DEBUG | DEBUG | DEBUG | DEBUG | DEBUG | DEBUG |

### Politique de rétention

- **Logs critiques** : 90 jours
- **Logs d'erreur** : 30 jours
- **Logs de performance** : 7 jours
- **Logs de debug** : 1 jour (développement uniquement)
- **Archives** : Compression après 30 jours, suppression après 1 an

## 🚀 Maintenance

### Nettoyage automatique
- Rotation quotidienne des fichiers de log
- Compression automatique après 30 jours
- Suppression des archives après 1 an

### Nettoyage manuel
```bash
# Nettoyage complet
python backend/cleanup_logs.py --force

# Nettoyage avec paramètres personnalisés
python backend/cleanup_logs.py --max-age 48 --max-size 20
```

## 📊 Monitoring

### Métriques surveillées
- Taille des fichiers de log
- Nombre d'erreurs par catégorie
- Performance des API
- Événements de sécurité

### Alertes
- Fichiers de log > 100MB
- Taux d'erreur > 5%
- Événements de sécurité suspects
- Espace disque < 10%

## 🔒 Sécurité

### Logs sensibles
- Les logs d'authentification sont chiffrés
- Les mots de passe ne sont jamais loggés
- Les données personnelles sont anonymisées
- Accès restreint aux logs de sécurité

### Audit
- Tous les accès aux logs sont tracés
- Rotation des clés de chiffrement
- Sauvegarde sécurisée des archives
