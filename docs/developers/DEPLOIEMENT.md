# 🚀 Déploiement - DocuSense AI

## 📋 Vue d'ensemble

Ce guide couvre le déploiement de DocuSense AI en production avec les meilleures pratiques de sécurité, performance et scalabilité.

## 🏗️ Architecture de Production

### Infrastructure Recommandée
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCTION ENVIRONMENT                             │
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │   Load Balancer │    │   Web Server    │    │   Database      │            │
│  │   (Nginx)       │◄──►│   (FastAPI)     │◄──►│   (PostgreSQL)  │            │
│  │   Port: 80/443  │    │   Port: 8000    │    │   Port: 5432    │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│           │                       │                       │                    │
│           ▼                       ▼                       ▼                    │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │   CDN/Static    │    │   Cache         │    │   Backup        │            │
│  │   (CloudFlare)  │    │   (Redis)       │    │   (Automated)   │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔧 Prérequis

### Serveur de Production
- **OS** : Ubuntu 22.04 LTS ou CentOS 8
- **CPU** : 4+ cores (Intel/AMD)
- **RAM** : 8GB+ (16GB recommandé)
- **Stockage** : 100GB+ SSD
- **Réseau** : 1Gbps+ avec IP publique

### Logiciels Requis
```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation des dépendances
sudo apt install -y python3.11 python3.11-venv python3.11-dev
sudo apt install -y nginx postgresql postgresql-contrib redis-server
sudo apt install -y git curl wget unzip build-essential
sudo apt install -y ffmpeg libffi-dev libssl-dev
```

## 🐳 Déploiement avec Docker

### Docker Compose Production
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # Base de données PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: docusense_postgres
    environment:
      POSTGRES_DB: docusense
      POSTGRES_USER: docusense_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backup:/backup
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U docusense_user -d docusense"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Cache Redis
  redis:
    image: redis:7-alpine
    container_name: docusense_redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend FastAPI
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: docusense_backend
    environment:
      - DATABASE_URL=postgresql://docusense_user:${POSTGRES_PASSWORD}@postgres:5432/docusense
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - ENVIRONMENT=production
      - LOG_LEVEL=INFO
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend React
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: docusense_frontend
    environment:
      - VITE_API_BASE_URL=${API_BASE_URL}
      - VITE_APP_NAME=DocuSense AI
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

  # Reverse Proxy Nginx
  nginx:
    image: nginx:alpine
    container_name: docusense_nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Dockerfile Backend Production
```dockerfile
# backend/Dockerfile.prod
FROM python:3.11-slim

# Installation des dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libffi-dev \
    libssl-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Création de l'utilisateur non-root
RUN useradd --create-home --shell /bin/bash app

# Définition du répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY requirements.txt .

# Installation des dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code source
COPY . .

# Changement de propriétaire
RUN chown -R app:app /app

# Utilisateur non-root
USER app

# Exposition du port
EXPOSE 8000

# Commande de démarrage
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### Dockerfile Frontend Production
```dockerfile
# frontend/Dockerfile.prod
FROM node:18-alpine AS builder

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm ci --only=production

# Copie du code source
COPY . .

# Build de production
RUN npm run build

# Stage de production avec Nginx
FROM nginx:alpine

# Copie des fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Copie de la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

## 🔒 Configuration Sécurisée

### Variables d'Environnement
```bash
# .env.production
# Base de données
POSTGRES_PASSWORD=your_secure_postgres_password
DATABASE_URL=postgresql://docusense_user:your_secure_postgres_password@localhost:5432/docusense

# Cache Redis
REDIS_PASSWORD=your_secure_redis_password
REDIS_URL=redis://:your_secure_redis_password@localhost:6379/0

# Sécurité
SECRET_KEY=your_very_long_and_secure_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Configuration de l'application
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8000

# Rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# API URLs
API_BASE_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### Configuration Nginx Sécurisée
```nginx
# nginx/nginx.conf
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:80;
}

# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# Configuration HTTPS
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # Certificats SSL
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Configuration SSL sécurisée
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Frontend (React)
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts pour les analyses longues
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
    }

    # Streams SSE
    location /api/streams/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Configuration SSE
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 24h;
    }

    # Fichiers statiques
    location /static/ {
        alias /usr/share/nginx/html/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🔐 Certificats SSL

### Let's Encrypt avec Certbot
```bash
# Installation de Certbot
sudo apt install certbot python3-certbot-nginx

# Génération du certificat
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Renouvellement automatique
sudo crontab -e
# Ajouter cette ligne :
0 12 * * * /usr/bin/certbot renew --quiet
```

### Certificat Auto-signé (Développement)
```bash
# Génération d'un certificat auto-signé
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/key.pem \
    -out nginx/ssl/cert.pem \
    -subj "/C=FR/ST=State/L=City/O=Organization/CN=localhost"
```

## 📊 Monitoring et Logs

### Configuration des Logs
```python
# backend/logging_config.py
import logging
import logging.handlers
import os

def setup_logging():
    # Création du répertoire de logs
    os.makedirs('logs', exist_ok=True)
    
    # Configuration du logger principal
    logger = logging.getLogger('docusense')
    logger.setLevel(logging.INFO)
    
    # Handler pour fichier
    file_handler = logging.handlers.RotatingFileHandler(
        'logs/docusense.log',
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(logging.INFO)
    
    # Handler pour erreurs
    error_handler = logging.handlers.RotatingFileHandler(
        'logs/docusense_error.log',
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    error_handler.setLevel(logging.ERROR)
    
    # Format des logs
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    file_handler.setFormatter(formatter)
    error_handler.setFormatter(formatter)
    
    logger.addHandler(file_handler)
    logger.addHandler(error_handler)
    
    return logger
```

### Monitoring avec Prometheus
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'docusense-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'docusense-postgres'
    static_configs:
      - targets: ['postgres:5432']
    scrape_interval: 30s

  - job_name: 'docusense-redis'
    static_configs:
      - targets: ['redis:6379']
    scrape_interval: 30s
```

### Métriques FastAPI
```python
# backend/metrics.py
from prometheus_client import Counter, Histogram, Gauge
import time

# Métriques
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')
ACTIVE_USERS = Gauge('active_users', 'Number of active users')
ANALYSIS_QUEUE_SIZE = Gauge('analysis_queue_size', 'Number of pending analyses')

# Middleware pour collecter les métriques
@app.middleware("http")
async def collect_metrics(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    REQUEST_DURATION.observe(duration)
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    return response
```

## 🔄 Déploiement Continu

### Script de Déploiement
```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Déploiement de DocuSense AI..."

# Variables
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

# Vérification des prérequis
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Fichier $COMPOSE_FILE non trouvé"
    exit 1
fi

# Sauvegarde de la base de données
echo "📦 Sauvegarde de la base de données..."
docker-compose -f $COMPOSE_FILE exec -T postgres pg_dump -U docusense_user docusense > backup/backup_$(date +%Y%m%d_%H%M%S).sql

# Pull des dernières images
echo "⬇️ Téléchargement des dernières images..."
docker-compose -f $COMPOSE_FILE pull

# Arrêt des services
echo "🛑 Arrêt des services..."
docker-compose -f $COMPOSE_FILE down

# Démarrage des services
echo "▶️ Démarrage des services..."
docker-compose -f $COMPOSE_FILE up -d

# Vérification de la santé
echo "🏥 Vérification de la santé des services..."
sleep 30

# Test de l'API
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Déploiement réussi !"
else
    echo "❌ Échec du déploiement"
    exit 1
fi

echo "🎉 DocuSense AI est maintenant en ligne !"
```

### GitHub Actions CI/CD
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push Backend
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        file: ./backend/Dockerfile.prod
        push: true
        tags: yourusername/docusense-backend:latest
    
    - name: Build and push Frontend
      uses: docker/build-push-action@v4
      with:
        context: ./frontend
        file: ./frontend/Dockerfile.prod
        push: true
        tags: yourusername/docusense-frontend:latest
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/docusense
          ./deploy.sh production
```

## 🔧 Maintenance

### Scripts de Maintenance
```bash
#!/bin/bash
# maintenance.sh

# Nettoyage des logs anciens
find /opt/docusense/logs -name "*.log" -mtime +30 -delete

# Optimisation de la base de données
docker-compose exec postgres psql -U docusense_user -d docusense -c "VACUUM ANALYZE;"

# Nettoyage des conteneurs Docker
docker system prune -f

# Vérification de l'espace disque
df -h

# Vérification de la mémoire
free -h

# Vérification des processus
docker-compose ps
```

### Sauvegarde Automatique
```bash
#!/bin/bash
# backup.sh

# Configuration
BACKUP_DIR="/opt/docusense/backup"
DATE=$(date +%Y%m%d_%H%M%S)

# Création du répertoire de sauvegarde
mkdir -p $BACKUP_DIR

# Sauvegarde de la base de données
docker-compose exec -T postgres pg_dump -U docusense_user docusense > $BACKUP_DIR/db_backup_$DATE.sql

# Sauvegarde des fichiers uploadés
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz /opt/docusense/uploads

# Sauvegarde des logs
tar -czf $BACKUP_DIR/logs_backup_$DATE.tar.gz /opt/docusense/logs

# Suppression des sauvegardes anciennes (plus de 7 jours)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Sauvegarde terminée: $DATE"
```

## 🚨 Gestion des Incidents

### Procédures d'Urgence
```bash
#!/bin/bash
# emergency.sh

# Redémarrage d'urgence
docker-compose down
docker-compose up -d

# Vérification des services
docker-compose ps

# Vérification des logs
docker-compose logs --tail=50 backend
docker-compose logs --tail=50 frontend
docker-compose logs --tail=50 postgres
```

### Monitoring des Alertes
```python
# backend/alerts.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_alert(subject, message, recipients):
    # Configuration SMTP
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    sender_email = "alerts@yourdomain.com"
    sender_password = "your_app_password"
    
    # Création du message
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = ", ".join(recipients)
    msg['Subject'] = f"[DocuSense Alert] {subject}"
    
    msg.attach(MIMEText(message, 'plain'))
    
    # Envoi du message
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print(f"Alert sent: {subject}")
    except Exception as e:
        print(f"Failed to send alert: {e}")
```

## 📈 Performance et Scalabilité

### Optimisations de Performance
```python
# backend/optimizations.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn

app = FastAPI()

# Middleware de compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration uvicorn pour la production
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        workers=4,
        loop="uvloop",
        http="httptools"
    )
```

### Configuration de Cache
```python
# backend/cache.py
import redis
from functools import wraps
import json

redis_client = redis.Redis(
    host='redis',
    port=6379,
    password='your_redis_password',
    decode_responses=True
)

def cache_result(expire_time=3600):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Génération de la clé de cache
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Vérification du cache
            cached_result = redis_client.get(cache_key)
            if cached_result:
                return json.loads(cached_result)
            
            # Exécution de la fonction
            result = await func(*args, **kwargs)
            
            # Mise en cache
            redis_client.setex(
                cache_key,
                expire_time,
                json.dumps(result)
            )
            
            return result
        return wrapper
    return decorator
```

---

*Dernière mise à jour : Août 2025 - Déploiement v2.0*
