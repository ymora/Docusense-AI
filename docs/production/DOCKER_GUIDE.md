# 🐳 Guide Docker Production - DocuSense AI

## 📋 Vue d'ensemble

Ce guide explique comment déployer DocuSense AI en production avec Docker Compose, conformément aux standards de production définis dans la documentation.

## ✅ **Améliorations Apportées**

### 🔧 **Configuration Complète**
- ✅ **Noms de conteneurs** : Identifiants uniques pour chaque service
- ✅ **Healthchecks** : Vérification automatique de la santé des services
- ✅ **Limites de ressources** : CPU et mémoire limités pour chaque service
- ✅ **Variables d'environnement** : Configuration complète et sécurisée
- ✅ **Monitoring** : Prometheus et Grafana intégrés
- ✅ **Réseau dédié** : Isolation réseau avec subnet personnalisé

### 🔒 **Sécurité Renforcée**
- ✅ **Mots de passe Redis** : Authentification obligatoire
- ✅ **Limites mémoire Redis** : Protection contre l'épuisement mémoire
- ✅ **Variables d'environnement** : Pas de secrets en dur
- ✅ **Utilisateur non-root** : Sécurité des conteneurs

### 📊 **Monitoring et Observabilité**
- ✅ **Prometheus** : Collecte de métriques
- ✅ **Grafana** : Visualisation des données
- ✅ **Healthchecks** : Surveillance automatique
- ✅ **Logs structurés** : Configuration des logs

## 🚀 **Déploiement Rapide**

### 1. **Configuration Initiale**

```bash
# Copier le fichier d'environnement
cp env.production.example .env

# Éditer le fichier .env avec vos valeurs
nano .env
```

### 2. **Déploiement**

```bash
# Déploiement complet
docker-compose up -d

# Ou avec le script de déploiement
./scripts/deploy-production.sh
```

### 3. **Vérification**

```bash
# Vérifier l'état des services
docker-compose ps

# Vérifier les logs
docker-compose logs -f

# Test de santé
curl http://localhost:8000/health
```

## 🔧 **Services Disponibles**

| Service | Port | Description | URL |
|---------|------|-------------|-----|
| **Backend API** | 8000 | API FastAPI | http://localhost:8000 |
| **Frontend** | 3000 | Interface React | http://localhost:3000 |
| **Nginx** | 80/443 | Reverse Proxy | http://localhost |
| **PostgreSQL** | 5432 | Base de données | - |
| **Redis** | 6379 | Cache | - |
| **Prometheus** | 9090 | Monitoring | http://localhost:9090 |
| **Grafana** | 3001 | Visualisation | http://localhost:3001 |

## 📁 **Structure des Fichiers**

```
├── docker-compose.yml          # Configuration principale
├── env.production.example      # Variables d'environnement (exemple)
├── .env                        # Variables d'environnement (à créer)
├── monitoring/
│   └── prometheus.yml         # Configuration Prometheus
├── scripts/
│   └── deploy-production.sh   # Script de déploiement
└── backup/                    # Sauvegardes automatiques
```

## 🔒 **Configuration Sécurisée**

### Variables d'Environnement Requises

```bash
# Base de données
POSTGRES_PASSWORD=your_secure_password

# Cache Redis
REDIS_PASSWORD=your_secure_password

# Sécurité JWT
SECRET_KEY=your_very_long_secret_key

# Configuration CORS
ALLOWED_ORIGINS=https://yourdomain.com

# URLs de production
API_BASE_URL=https://api.yourdomain.com
```

### 🔐 **Bonnes Pratiques de Sécurité**

1. **Mots de passe forts** : Minimum 16 caractères
2. **Variables d'environnement** : Jamais en dur dans le code
3. **Secrets managers** : Utiliser en production
4. **Rotation des clés** : Régulière
5. **Accès restreint** : Limiter l'accès aux fichiers sensibles

## 📊 **Monitoring et Alertes**

### Prometheus
- **URL** : http://localhost:9090
- **Métriques** : Backend, PostgreSQL, Redis, Nginx
- **Rétention** : 200 heures par défaut

### Grafana
- **URL** : http://localhost:3001
- **Login** : admin / (mot de passe dans .env)
- **Dashboards** : Métriques système et applicatives

### Métriques Collectées
- ✅ **Performance** : Temps de réponse, débit
- ✅ **Ressources** : CPU, mémoire, disque
- ✅ **Base de données** : Connexions, requêtes
- ✅ **Cache** : Hit rate, utilisation mémoire
- ✅ **Erreurs** : Taux d'erreur, logs

## 🔄 **Maintenance**

### Sauvegarde Automatique
```bash
# Sauvegarde manuelle
./scripts/deploy-production.sh backup

# Sauvegarde automatique (cron)
0 2 * * * /path/to/scripts/deploy-production.sh backup
```

### Mise à Jour
```bash
# Mise à jour complète
./scripts/deploy-production.sh deploy

# Redémarrage des services
./scripts/deploy-production.sh restart
```

### Nettoyage
```bash
# Nettoyage des images
./scripts/deploy-production.sh cleanup

# Nettoyage complet
docker system prune -a
```

## 🚨 **Gestion des Incidents**

### Vérification Rapide
```bash
# État des services
docker-compose ps

# Logs en temps réel
docker-compose logs -f backend

# Test de santé
curl -f http://localhost:8000/health
```

### Redémarrage d'Urgence
```bash
# Redémarrage complet
./scripts/deploy-production.sh restart

# Redémarrage d'un service spécifique
docker-compose restart backend
```

### Récupération
```bash
# Restauration depuis backup
docker-compose exec postgres psql -U docusense_user -d docusense < backup/db_backup_YYYYMMDD_HHMMSS.sql
```

## 📈 **Performance et Scalabilité**

### Limites de Ressources
- **Backend** : 4GB RAM, 2 CPU
- **Frontend** : 2GB RAM, 1 CPU
- **PostgreSQL** : 2GB RAM, 1 CPU
- **Redis** : 1GB RAM, 0.5 CPU
- **Nginx** : 512MB RAM, 0.5 CPU

### Optimisations
- ✅ **Cache Redis** : 512MB avec politique LRU
- ✅ **Compression** : Gzip activé
- ✅ **Rate limiting** : 100 req/min par utilisateur
- ✅ **Connection pooling** : PostgreSQL optimisé

## 🔍 **Dépannage**

### Problèmes Courants

#### Service ne démarre pas
```bash
# Vérifier les logs
docker-compose logs service_name

# Vérifier les variables d'environnement
docker-compose config
```

#### Problème de mémoire
```bash
# Vérifier l'utilisation
docker stats

# Augmenter les limites dans docker-compose.yml
```

#### Problème de réseau
```bash
# Vérifier le réseau
docker network ls
docker network inspect docusense_docusense_network
```

## 📚 **Documentation Complémentaire**

- **[Architecture](../developers/ARCHITECTURE.md)**
- **[Déploiement](../developers/DEPLOIEMENT.md)**
- **[Checklist Production](CHECKLIST.md)**
- **[Standards Production](STANDARDS.md)**

## 🎯 **Prochaines Étapes**

1. **Configurer SSL/TLS** avec Let's Encrypt
2. **Mettre en place les alertes** avec AlertManager
3. **Configurer la réplication** PostgreSQL
4. **Implémenter le load balancing** avec HAProxy
5. **Mettre en place le CI/CD** avec GitHub Actions

---

*Dernière mise à jour : Août 2025 - Docker Production v2.0*
