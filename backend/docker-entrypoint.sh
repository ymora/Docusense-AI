#!/bin/bash
set -e

echo "🚀 Démarrage de DocuSense AI Backend..."

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente de PostgreSQL..."
while ! pg_isready -h postgres -p 5432 -U docusense_user; do
  sleep 2
done
echo "✅ PostgreSQL prêt!"

# Attendre que Redis soit prêt
echo "⏳ Attente de Redis..."
while ! redis-cli -h redis -p 6379 -a $REDIS_PASSWORD ping; do
  sleep 2
done
echo "✅ Redis prêt!"

# Exécuter les migrations de base de données
echo "🗄️ Exécution des migrations..."
python -c "
from app.core.database import engine
from app.models import Base
Base.metadata.create_all(bind=engine)
print('✅ Migrations terminées')
"

# Créer un utilisateur admin par défaut si nécessaire
echo "👤 Vérification de l'utilisateur admin..."
python -c "
from app.core.database import get_db
from app.services.auth_service import AuthService
from app.models.user import UserRole

db = next(get_db())
auth_service = AuthService(db)

# Vérifier si un admin existe
admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
if not admin:
    auth_service.create_admin_user('admin', 'admin@docusense.ai', 'admin123')
    print('✅ Utilisateur admin créé')
else:
    print('✅ Utilisateur admin existe déjà')
"

# Démarrer l'application
echo "🚀 Démarrage de l'application..."
exec "$@"
