# 🗄️ Base de Données - DocuSense AI

## 📋 Vue d'ensemble

DocuSense AI utilise SQLite en développement et PostgreSQL en production. La base de données est conçue pour une performance optimale avec des index appropriés et une structure normalisée.

## 🏗️ Schéma de Base de Données

### Table `users`
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('guest', 'user', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP
);

-- Index pour performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
```

### Table `files`
```sql
CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    path TEXT NOT NULL,
    size BIGINT NOT NULL,
    file_type VARCHAR(100),
    extension VARCHAR(20),
    metadata TEXT, -- JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour performance
CREATE INDEX idx_files_path ON files(path);
CREATE INDEX idx_files_type ON files(file_type);
CREATE INDEX idx_files_user ON files(user_id);
CREATE INDEX idx_files_modified ON files(modified_at);
```

### Table `analyses`
```sql
CREATE TABLE analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    prompt_type VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    result TEXT,
    error_message TEXT,
    progress INTEGER DEFAULT 0,
    tokens_used INTEGER,
    cost DECIMAL(10,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour performance
CREATE INDEX idx_analyses_file ON analyses(file_id);
CREATE INDEX idx_analyses_user ON analyses(user_id);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_created ON analyses(created_at);
CREATE INDEX idx_analyses_provider ON analyses(provider);
CREATE INDEX idx_analyses_prompt_type ON analyses(prompt_type);
```

### Table `system_logs`
```sql
CREATE TABLE system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(20) NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    service VARCHAR(100),
    user_id INTEGER,
    action VARCHAR(100),
    message TEXT NOT NULL,
    details TEXT, -- JSON
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Index pour performance
CREATE INDEX idx_system_logs_timestamp ON system_logs(timestamp);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_user ON system_logs(user_id);
CREATE INDEX idx_system_logs_action ON system_logs(action);
CREATE INDEX idx_system_logs_service ON system_logs(service);
```

### Table `ai_providers_config`
```sql
CREATE TABLE ai_providers_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_name VARCHAR(50) UNIQUE NOT NULL,
    api_key TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 0,
    models TEXT, -- JSON array
    rate_limit INTEGER,
    cost_per_token DECIMAL(10,6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performance
CREATE INDEX idx_ai_providers_active ON ai_providers_config(is_active);
CREATE INDEX idx_ai_providers_priority ON ai_providers_config(priority);
```

### Table `pdf_files`
```sql
CREATE TABLE pdf_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    template_used VARCHAR(100),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
);

-- Index pour performance
CREATE INDEX idx_pdf_files_analysis ON pdf_files(analysis_id);
CREATE INDEX idx_pdf_files_generated ON pdf_files(generated_at);
```

## 🔍 Requêtes Optimisées

### Requêtes Fréquentes

#### 1. Analyses récentes d'un utilisateur
```sql
-- Optimisée avec index composite
SELECT 
    a.id,
    a.prompt_type,
    a.status,
    a.created_at,
    f.name as file_name,
    f.extension
FROM analyses a
JOIN files f ON a.file_id = f.id
WHERE a.user_id = ?
ORDER BY a.created_at DESC
LIMIT 20;
```

#### 2. Statistiques par provider
```sql
-- Optimisée avec index sur provider et status
SELECT 
    provider,
    COUNT(*) as total_analyses,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    AVG(CASE WHEN status = 'completed' THEN tokens_used END) as avg_tokens
FROM analyses
WHERE created_at >= date('now', '-30 days')
GROUP BY provider;
```

#### 3. Logs d'erreur récents
```sql
-- Optimisée avec index sur level et timestamp
SELECT 
    timestamp,
    service,
    action,
    message,
    user_id
FROM system_logs
WHERE level = 'ERROR'
    AND timestamp >= datetime('now', '-24 hours')
ORDER BY timestamp DESC
LIMIT 100;
```

#### 4. Fichiers les plus analysés
```sql
-- Optimisée avec index sur file_id
SELECT 
    f.name,
    f.extension,
    COUNT(a.id) as analysis_count,
    AVG(a.tokens_used) as avg_tokens
FROM files f
JOIN analyses a ON f.id = a.file_id
WHERE a.status = 'completed'
GROUP BY f.id, f.name, f.extension
ORDER BY analysis_count DESC
LIMIT 10;
```

## 🚀 Optimisations de Performance

### Index Stratégiques

#### Index Composite pour les Analyses
```sql
-- Index composite pour les requêtes de filtrage
CREATE INDEX idx_analyses_user_status_date ON analyses(user_id, status, created_at);
CREATE INDEX idx_analyses_provider_status ON analyses(provider, status);
CREATE INDEX idx_analyses_prompt_status ON analyses(prompt_type, status);
```

#### Index pour les Logs
```sql
-- Index composite pour les requêtes de monitoring
CREATE INDEX idx_logs_level_timestamp ON system_logs(level, timestamp);
CREATE INDEX idx_logs_user_action ON system_logs(user_id, action);
CREATE INDEX idx_logs_service_level ON system_logs(service, level);
```

### Optimisations de Requêtes

#### 1. Pagination Efficace
```sql
-- Utilisation de LIMIT/OFFSET avec index
SELECT * FROM analyses 
WHERE user_id = ? 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 40;

-- Alternative avec curseur pour de grandes tables
SELECT * FROM analyses 
WHERE user_id = ? AND created_at < ? 
ORDER BY created_at DESC 
LIMIT 20;
```

#### 2. Agrégations Optimisées
```sql
-- Utilisation de vues matérialisées pour les statistiques
CREATE VIEW analysis_stats AS
SELECT 
    DATE(created_at) as date,
    provider,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    AVG(CASE WHEN status = 'completed' THEN tokens_used END) as avg_tokens
FROM analyses
GROUP BY DATE(created_at), provider;
```

#### 3. Requêtes de Recherche
```sql
-- Recherche full-text pour les résultats d'analyse
CREATE VIRTUAL TABLE analysis_results_fts USING fts5(
    analysis_id,
    result,
    content='analyses',
    content_rowid='id'
);

-- Index pour la recherche
CREATE TRIGGER analyses_ai AFTER INSERT ON analyses BEGIN
    INSERT INTO analysis_results_fts(analysis_id, result) VALUES (new.id, new.result);
END;
```

## 🔧 Maintenance et Optimisation

### Scripts de Maintenance

#### 1. Nettoyage des Logs Anciens
```sql
-- Supprimer les logs de plus de 90 jours
DELETE FROM system_logs 
WHERE timestamp < datetime('now', '-90 days');

-- VACUUM pour récupérer l'espace
VACUUM;
```

#### 2. Optimisation des Index
```sql
-- Analyser les index
ANALYZE;

-- Reconstruire les index
REINDEX;
```

#### 3. Statistiques de Performance
```sql
-- Vérifier la taille des tables
SELECT 
    name,
    sqlite_compileoption_used('ENABLE_DBSTAT_VTAB') as dbstat_enabled,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table') as table_count
FROM sqlite_master 
WHERE type='table';

-- Vérifier l'utilisation des index
SELECT 
    name,
    sql
FROM sqlite_master 
WHERE type='index';
```

### Monitoring de Performance

#### Métriques à Surveiller
```sql
-- Taille de la base de données
SELECT 
    page_count * page_size as size_bytes,
    page_count * page_size / 1024 / 1024 as size_mb
FROM pragma_page_count(), pragma_page_size();

-- Nombre de lignes par table
SELECT 
    name,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=t.name) as row_count
FROM sqlite_master t
WHERE type='table';

-- Performance des requêtes
EXPLAIN QUERY PLAN 
SELECT * FROM analyses WHERE user_id = 1 ORDER BY created_at DESC LIMIT 20;
```

## 🔒 Sécurité et Intégrité

### Contraintes de Sécurité
```sql
-- Contraintes de validation
ALTER TABLE users ADD CONSTRAINT chk_email_format 
CHECK (email LIKE '%_@__%.__%');

ALTER TABLE analyses ADD CONSTRAINT chk_progress_range 
CHECK (progress >= 0 AND progress <= 100);

ALTER TABLE system_logs ADD CONSTRAINT chk_level_valid 
CHECK (level IN ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'));
```

### Chiffrement des Données Sensibles
```sql
-- API keys chiffrées (implémentation côté application)
-- Les clés API ne sont jamais stockées en clair
UPDATE ai_providers_config 
SET api_key = encrypt(api_key, 'master_key') 
WHERE api_key IS NOT NULL;
```

### Audit Trail
```sql
-- Table d'audit pour les modifications sensibles
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    user_id INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45)
);

-- Triggers pour l'audit automatique
CREATE TRIGGER audit_users_update
AFTER UPDATE ON users
BEGIN
    INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_id)
    VALUES ('users', NEW.id, 'UPDATE', json_object('username', OLD.username, 'role', OLD.role), 
            json_object('username', NEW.username, 'role', NEW.role), NEW.id);
END;
```

## 📊 Migration et Évolution

### Scripts de Migration
```sql
-- Migration vers PostgreSQL (production)
-- 1. Créer les tables avec les types appropriés
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('guest', 'user', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP
);

-- 2. Index spécifiques PostgreSQL
CREATE INDEX CONCURRENTLY idx_users_username ON users(username);
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_role_active ON users(role, is_active);

-- 3. Partitioning pour les grandes tables
CREATE TABLE analyses_partitioned (
    LIKE analyses INCLUDING ALL
) PARTITION BY RANGE (created_at);

CREATE TABLE analyses_2025_01 PARTITION OF analyses_partitioned
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### Optimisations PostgreSQL
```sql
-- Configuration PostgreSQL pour performance
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Reload configuration
SELECT pg_reload_conf();
```

## 🔍 Monitoring et Alertes

### Requêtes de Monitoring
```sql
-- Vérification de l'intégrité
PRAGMA integrity_check;

-- Vérification des index
PRAGMA index_info('analyses');

-- Statistiques de performance
SELECT 
    name,
    sql
FROM sqlite_master 
WHERE type='index' AND name LIKE 'idx_%';

-- Alertes sur les tables volumineuses
SELECT 
    name,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=t.name) as row_count
FROM sqlite_master t
WHERE type='table' 
    AND (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=t.name) > 10000;
```

---

*Dernière mise à jour : Août 2025 - Base de Données v2.0*
