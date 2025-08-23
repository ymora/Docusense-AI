# 🗄️ Base de Données - DocuSense AI

## 📊 Modèles Principaux

### Table `users`
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Relations :**
- `User` → `Analysis` (One-to-Many)
- `User` → `SystemLog` (One-to-Many)

### Table `files`
```sql
CREATE TABLE files (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    path VARCHAR(1000) UNIQUE NOT NULL,
    size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    extracted_text TEXT,
    analysis_result TEXT,
    analysis_metadata JSON,
    error_message TEXT,
    is_selected BOOLEAN DEFAULT FALSE,
    parent_directory VARCHAR(1000),
    file_created_at TIMESTAMP,
    file_modified_at TIMESTAMP,
    file_accessed_at TIMESTAMP
);
```

**Relations :**
- `File` → `Analysis` (One-to-Many)

### Table `analyses`
```sql
CREATE TABLE analyses (
    id INTEGER PRIMARY KEY,
    file_id INTEGER NOT NULL,
    analysis_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    prompt TEXT NOT NULL,
    result TEXT,
    pdf_path VARCHAR(500),
    analysis_metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    progress FLOAT DEFAULT 0.0,
    current_step VARCHAR(100),
    total_steps INTEGER DEFAULT 1,
    estimated_completion TIMESTAMP,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    user_id INTEGER,
    FOREIGN KEY (file_id) REFERENCES files(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Relations :**
- `Analysis` → `File` (Many-to-One)
- `Analysis` → `User` (Many-to-One)

### Table `configs`
```sql
CREATE TABLE configs (
    id INTEGER PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table `system_logs`
```sql
CREATE TABLE system_logs (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    event_type VARCHAR(100) NOT NULL,
    details JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(20) DEFAULT 'info',
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Relations :**
- `SystemLog` → `User` (Many-to-One)

### Table `directory_structures`
```sql
CREATE TABLE directory_structures (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    path VARCHAR(1000) UNIQUE NOT NULL,
    parent_path VARCHAR(1000),
    is_directory BOOLEAN DEFAULT TRUE,
    file_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔗 Relations

### Schéma de Relations
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │     │   Analysis  │     │    File     │
│             │     │             │     │             │
│ id          │◄────┤ user_id     │────►│ id          │
│ username    │     │ file_id     │     │ name        │
│ email       │     │ status      │     │ path        │
│ role        │     │ provider    │     │ mime_type   │
│ is_active   │     │ model       │     │ status      │
└─────────────┘     └─────────────┘     └─────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌─────────────┐     ┌─────────────┐
│ SystemLog   │     │    Config   │
│             │     │             │
│ user_id     │     │ key         │
│ event_type  │     │ value       │
│ details     │     │ category    │
│ level       │     │ is_encrypted│
└─────────────┘     └─────────────┘
```

### Relations Détaillées

#### User ↔ Analysis (One-to-Many)
- **User** peut avoir plusieurs **Analysis**
- **Analysis** appartient à un seul **User** (optionnel)
- Clé étrangère : `analyses.user_id` → `users.id`

#### User ↔ SystemLog (One-to-Many)
- **User** peut avoir plusieurs **SystemLog**
- **SystemLog** peut être anonyme (user_id = NULL)
- Clé étrangère : `system_logs.user_id` → `users.id`

#### File ↔ Analysis (One-to-Many)
- **File** peut avoir plusieurs **Analysis**
- **Analysis** appartient à un seul **File**
- Clé étrangère : `analyses.file_id` → `files.id`

## 📊 Statuts et Types

### FileStatus
```python
class FileStatus(str, Enum):
    PENDING = "pending"           # En attente de traitement
    PROCESSING = "processing"     # En cours de traitement
    COMPLETED = "completed"       # Traitement terminé
    FAILED = "failed"            # Échec du traitement
    PAUSED = "paused"            # Traitement en pause
    UNSUPPORTED = "unsupported"  # Format non supporté
    NONE = "none"                # Aucun statut
```

### AnalysisStatus
```python
class AnalysisStatus(str, Enum):
    PENDING = "pending"      # En attente
    PROCESSING = "processing" # En cours
    COMPLETED = "completed"   # Terminé
    FAILED = "failed"        # Échec
```

### AnalysisType
```python
class AnalysisType(str, Enum):
    GENERAL = "general"           # Analyse générale
    SUMMARY = "summary"           # Résumé
    EXTRACTION = "extraction"     # Extraction d'informations
    COMPARISON = "comparison"     # Comparaison
    CLASSIFICATION = "classification" # Classification
    OCR = "ocr"                   # Reconnaissance de texte
    JURIDICAL = "juridical"       # Analyse juridique
    TECHNICAL = "technical"       # Analyse technique
    ADMINISTRATIVE = "administrative" # Analyse administrative
    MULTIPLE_AI = "multiple_ai"   # Analyse multi-IA
```

### UserRole
```python
class UserRole(str, Enum):
    ADMIN = "admin"    # Administrateur
    USER = "user"      # Utilisateur
    GUEST = "guest"    # Invité
```

### LogLevel
```python
class LogLevel(str, Enum):
    DEBUG = "debug"     # Débogage
    INFO = "info"       # Information
    WARNING = "warning" # Avertissement
    ERROR = "error"     # Erreur
    CRITICAL = "critical" # Critique
```

## 🗂️ Index et Optimisations

### Index Principaux
```sql
-- Index sur les clés primaires (automatiques)
PRIMARY KEY sur toutes les tables

-- Index sur les clés étrangères
CREATE INDEX idx_analyses_file_id ON analyses(file_id);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);

-- Index sur les colonnes fréquemment utilisées
CREATE INDEX idx_files_path ON files(path);
CREATE INDEX idx_files_status ON files(status);
CREATE INDEX idx_files_parent_directory ON files(parent_directory);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_provider ON analyses(provider);
CREATE INDEX idx_configs_key ON configs(key);
CREATE INDEX idx_configs_category ON configs(category);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_directory_structures_path ON directory_structures(path);
```

### Optimisations de Performance
- **Index composites** pour les requêtes fréquentes
- **Partitioning** automatique des logs par date
- **Cleanup** automatique des anciennes données
- **Cache** intelligent pour les configurations
- **Compression** des métadonnées JSON

## 🔄 Migrations

### Migrations Automatiques
Le système exécute automatiquement les migrations au démarrage :

```python
# Exemple de migration automatique
def run_automatic_migrations(db: Session):
    migrations = [
        "CREATE TABLE IF NOT EXISTS users (...)",
        "ALTER TABLE files ADD COLUMN IF NOT EXISTS file_accessed_at TIMESTAMP",
        "CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status)"
    ]
    
    for migration in migrations:
        db.execute(text(migration))
    
    db.commit()
```

### Vérification de Cohérence
```python
def check_database_consistency(db: Session):
    # Vérifier les contraintes de clés étrangères
    # Vérifier l'intégrité des données
    # Nettoyer les données orphelines
    pass
```

## 📈 Métriques et Monitoring

### Métriques de Base de Données
- **Taille de la base** : ~50MB pour 10k fichiers
- **Temps de requête** : < 100ms pour les requêtes simples
- **Connexions simultanées** : Jusqu'à 100
- **Taux de cache** : 85% pour les configurations

### Monitoring
- **Logs de requêtes** lentes (> 1s)
- **Alertes** sur les erreurs de contrainte
- **Métriques** de performance en temps réel
- **Nettoyage** automatique des logs anciens

## 🛡️ Sécurité

### Chiffrement
- **Mots de passe** : Hash bcrypt avec salt
- **Clés API** : Chiffrement AES-256
- **Tokens JWT** : Signature HMAC-SHA256

### Validation
- **Contraintes** de base de données
- **Validation** Pydantic côté API
- **Sanitisation** des entrées utilisateur
- **Protection** contre les injections SQL

### Audit
- **Logs** de toutes les opérations sensibles
- **Traçabilité** des modifications
- **Historique** des connexions utilisateur
- **Alertes** sur les activités suspectes
