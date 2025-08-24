#!/bin/bash

# ==========================
# SCRIPT DE DÉPLOIEMENT PRODUCTION
# DocuSense AI
# ==========================

set -e  # Arrêt en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    # Vérifier Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    # Vérifier le fichier .env
    if [ ! -f ".env" ]; then
        log_warning "Fichier .env non trouvé, copie depuis env.production.example"
        if [ -f "env.production.example" ]; then
            cp env.production.example .env
            log_warning "Veuillez configurer le fichier .env avant de continuer"
            exit 1
        else
            log_error "Fichier env.production.example non trouvé"
            exit 1
        fi
    fi
    
    log_success "Prérequis vérifiés"
}

# Sauvegarde de la base de données
backup_database() {
    log_info "Sauvegarde de la base de données..."
    
    # Créer le répertoire de backup s'il n'existe pas
    mkdir -p backup
    
    # Sauvegarde avec timestamp
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="backup/db_backup_${TIMESTAMP}.sql"
    
    if docker-compose exec -T postgres pg_dump -U docusense_user docusense > "$BACKUP_FILE" 2>/dev/null; then
        log_success "Sauvegarde créée: $BACKUP_FILE"
    else
        log_warning "Impossible de créer la sauvegarde (base de données peut-être arrêtée)"
    fi
}

# Pull des dernières images
pull_images() {
    log_info "Téléchargement des dernières images..."
    docker-compose pull
    log_success "Images téléchargées"
}

# Arrêt des services
stop_services() {
    log_info "Arrêt des services..."
    docker-compose down
    log_success "Services arrêtés"
}

# Démarrage des services
start_services() {
    log_info "Démarrage des services..."
    docker-compose up -d
    log_success "Services démarrés"
}

# Vérification de la santé des services
check_health() {
    log_info "Vérification de la santé des services..."
    
    # Attendre que les services démarrent
    sleep 30
    
    # Vérifier chaque service
    SERVICES=("postgres" "redis" "backend" "frontend" "nginx")
    
    for service in "${SERVICES[@]}"; do
        if docker-compose ps | grep -q "$service.*Up"; then
            log_success "Service $service: OK"
        else
            log_error "Service $service: ÉCHEC"
            return 1
        fi
    done
    
    # Test de l'API
    log_info "Test de l'API..."
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log_success "API: OK"
    else
        log_warning "API: Non accessible (peut-être encore en démarrage)"
    fi
    
    # Test du frontend
    log_info "Test du frontend..."
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend: OK"
    else
        log_warning "Frontend: Non accessible (peut-être encore en démarrage)"
    fi
    
    log_success "Vérification de santé terminée"
}

# Nettoyage des anciennes images
cleanup_images() {
    log_info "Nettoyage des anciennes images..."
    docker image prune -f
    log_success "Nettoyage terminé"
}

# Affichage des informations de déploiement
show_deployment_info() {
    log_info "Informations de déploiement:"
    echo "  - Backend API: http://localhost:8000"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Nginx: http://localhost:80"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Grafana: http://localhost:3001"
    echo ""
    log_info "Logs des services:"
    echo "  - docker-compose logs -f backend"
    echo "  - docker-compose logs -f frontend"
    echo "  - docker-compose logs -f postgres"
    echo "  - docker-compose logs -f redis"
}

# Fonction principale
main() {
    log_info "🚀 Déploiement de DocuSense AI en production..."
    
    # Vérifier les prérequis
    check_prerequisites
    
    # Sauvegarde
    backup_database
    
    # Pull des images
    pull_images
    
    # Arrêt des services
    stop_services
    
    # Démarrage des services
    start_services
    
    # Vérification de la santé
    check_health
    
    # Nettoyage
    cleanup_images
    
    # Informations finales
    show_deployment_info
    
    log_success "🎉 Déploiement terminé avec succès !"
}

# Gestion des arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "backup")
        backup_database
        ;;
    "health")
        check_health
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "stop")
        stop_services
        ;;
    "start")
        start_services
        ;;
    "restart")
        stop_services
        start_services
        check_health
        ;;
    "cleanup")
        cleanup_images
        ;;
    *)
        echo "Usage: $0 {deploy|backup|health|logs|stop|start|restart|cleanup}"
        echo "  deploy   - Déploiement complet (défaut)"
        echo "  backup   - Sauvegarde de la base de données"
        echo "  health   - Vérification de la santé des services"
        echo "  logs     - Affichage des logs en temps réel"
        echo "  stop     - Arrêt des services"
        echo "  start    - Démarrage des services"
        echo "  restart  - Redémarrage des services"
        echo "  cleanup  - Nettoyage des anciennes images"
        exit 1
        ;;
esac
