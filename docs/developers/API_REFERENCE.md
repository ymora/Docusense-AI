# 🔌 API Reference - DocuSense AI

## 📋 Vue d'ensemble

L'API DocuSense AI est une API REST sécurisée basée sur FastAPI. Tous les endpoints sont documentés et accessibles via Swagger UI à l'adresse `/docs`.

## 🔐 Authentification

### JWT Token
```bash
# Login
POST /api/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}

# Response
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### Headers d'authentification
```bash
Authorization: Bearer <access_token>
Content-Type: application/json
```

## 📁 Endpoints Fichiers

### Liste des disques
```bash
GET /api/files/drives
Authorization: Bearer <token>

# Response
{
  "drives": [
    {
      "name": "C:",
      "path": "C:\\",
      "type": "fixed",
      "free_space": 107374182400
    }
  ]
}
```

### Liste des fichiers
```bash
GET /api/files/list/{path:path}
Authorization: Bearer <token>

# Response
{
  "files": [
    {
      "name": "document.pdf",
      "path": "C:\\Documents\\document.pdf",
      "size": 1024000,
      "type": "file",
      "extension": ".pdf",
      "modified": "2025-08-24T10:30:00Z"
    }
  ],
  "directories": [
    {
      "name": "Documents",
      "path": "C:\\Documents",
      "type": "directory"
    }
  ]
}
```

### Informations fichier
```bash
GET /api/files/info/{file_id}
Authorization: Bearer <token>

# Response
{
  "id": "file123",
  "name": "document.pdf",
  "path": "C:\\Documents\\document.pdf",
  "size": 1024000,
  "type": "application/pdf",
  "extension": ".pdf",
  "modified": "2025-08-24T10:30:00Z",
  "metadata": {
    "pages": 10,
    "author": "John Doe",
    "title": "Sample Document"
  }
}
```

### Streaming fichier
```bash
GET /api/files/stream/{file_id}
Authorization: Bearer <token>

# Response: Binary stream
Content-Type: application/pdf
Content-Length: 1024000
```

### Téléchargement fichier
```bash
GET /api/files/download/{file_id}
Authorization: Bearer <token>

# Response: File download
Content-Disposition: attachment; filename="document.pdf"
```

## 🤖 Endpoints Analyse IA

### Créer une analyse
```bash
POST /api/analysis/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "file_id": "file123",
  "prompt_type": "general",
  "provider": "openai",
  "model": "gpt-4"
}

# Response
{
  "analysis_id": "analysis456",
  "status": "pending",
  "created_at": "2025-08-24T10:30:00Z"
}
```

### Liste des analyses
```bash
GET /api/analysis/list
Authorization: Bearer <token>

# Query Parameters
?status=pending&prompt_type=general&limit=10&offset=0

# Response
{
  "analyses": [
    {
      "id": "analysis456",
      "file_id": "file123",
      "file_name": "document.pdf",
      "prompt_type": "general",
      "provider": "openai",
      "status": "completed",
      "created_at": "2025-08-24T10:30:00Z",
      "completed_at": "2025-08-24T10:32:00Z",
      "result": "Analyse du document..."
    }
  ],
  "total": 100,
  "limit": 10,
  "offset": 0
}
```

### Statut d'une analyse
```bash
GET /api/analysis/status/{analysis_id}
Authorization: Bearer <token>

# Response
{
  "id": "analysis456",
  "status": "completed",
  "progress": 100,
  "result": "Analyse du document...",
  "error": null
}
```

### Supprimer une analyse
```bash
DELETE /api/analysis/{analysis_id}
Authorization: Bearer <token>

# Response
{
  "message": "Analysis deleted successfully"
}
```

### Queue d'analyses
```bash
GET /api/analysis/queue
Authorization: Bearer <token>

# Response
{
  "pending": 5,
  "running": 2,
  "completed": 150,
  "failed": 3,
  "queue": [
    {
      "id": "analysis789",
      "file_name": "document.pdf",
      "prompt_type": "summary",
      "status": "pending",
      "position": 1
    }
  ]
}
```

## ⚙️ Endpoints Configuration

### Liste des providers
```bash
GET /api/config/providers
Authorization: Bearer <token>

# Response
{
  "providers": [
    {
      "name": "openai",
      "display_name": "OpenAI",
      "is_configured": true,
      "is_active": true,
      "priority": 1,
      "models": ["gpt-4", "gpt-3.5-turbo"]
    },
    {
      "name": "claude",
      "display_name": "Claude",
      "is_configured": false,
      "is_active": false,
      "priority": 2,
      "models": ["claude-3-opus", "claude-3-sonnet"]
    }
  ]
}
```

### Tester un provider
```bash
POST /api/config/test
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider": "openai",
  "api_key": "sk-..."
}

# Response
{
  "success": true,
  "message": "Provider test successful",
  "models": ["gpt-4", "gpt-3.5-turbo"]
}
```

### Sauvegarder configuration
```bash
POST /api/config/save
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider": "openai",
  "api_key": "sk-...",
  "is_active": true,
  "priority": 1
}

# Response
{
  "success": true,
  "message": "Configuration saved successfully"
}
```

## 👥 Endpoints Utilisateurs

### Informations utilisateur
```bash
GET /api/auth/me
Authorization: Bearer <token>

# Response
{
  "id": "user123",
  "username": "user@example.com",
  "role": "user",
  "created_at": "2025-08-01T00:00:00Z",
  "last_login": "2025-08-24T10:30:00Z"
}
```

### Liste des utilisateurs (Admin)
```bash
GET /api/users/list
Authorization: Bearer <token>

# Response
{
  "users": [
    {
      "id": "user123",
      "username": "user@example.com",
      "role": "user",
      "created_at": "2025-08-01T00:00:00Z",
      "last_login": "2025-08-24T10:30:00Z",
      "is_active": true
    }
  ]
}
```

### Créer un utilisateur (Admin)
```bash
POST /api/users/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser@example.com",
  "password": "password123",
  "role": "user"
}

# Response
{
  "id": "user456",
  "username": "newuser@example.com",
  "role": "user",
  "created_at": "2025-08-24T10:30:00Z"
}
```

### Supprimer un utilisateur (Admin)
```bash
DELETE /api/users/{user_id}
Authorization: Bearer <token>

# Response
{
  "message": "User deleted successfully"
}
```

## 📊 Endpoints Monitoring

### Statut du système
```bash
GET /api/health
Authorization: Bearer <token>

# Response
{
  "status": "healthy",
  "timestamp": "2025-08-24T10:30:00Z",
  "version": "2.0.0",
  "uptime": 3600,
  "services": {
    "database": "healthy",
    "ai_providers": "healthy",
    "file_system": "healthy"
  }
}
```

### Statistiques système
```bash
GET /api/monitoring/stats
Authorization: Bearer <token>

# Response
{
  "total_files": 1500,
  "total_analyses": 5000,
  "active_users": 25,
  "system_load": {
    "cpu_percent": 45.2,
    "memory_percent": 67.8,
    "disk_percent": 23.4
  },
  "ai_usage": {
    "openai_requests": 1200,
    "claude_requests": 800,
    "total_tokens": 1500000
  }
}
```

### Logs système
```bash
GET /api/monitoring/logs
Authorization: Bearer <token>

# Query Parameters
?level=ERROR&limit=50&offset=0

# Response
{
  "logs": [
    {
      "timestamp": "2025-08-24T10:30:00Z",
      "level": "ERROR",
      "message": "AI provider connection failed",
      "user_id": "user123",
      "action": "create_analysis"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

## 🔄 Streams SSE (Server-Sent Events)

### Stream analyses
```bash
GET /api/streams/analyses
Authorization: Bearer <token>

# Response: Event stream
data: {"type": "analysis_update", "analysis_id": "analysis456", "status": "completed"}

data: {"type": "analysis_update", "analysis_id": "analysis789", "status": "running", "progress": 75}
```

### Stream configuration
```bash
GET /api/streams/config
Authorization: Bearer <token>

# Response: Event stream
data: {"type": "provider_update", "provider": "openai", "status": "active"}

data: {"type": "config_change", "key": "priority", "value": 1}
```

### Stream utilisateurs
```bash
GET /api/streams/users
Authorization: Bearer <token>

# Response: Event stream
data: {"type": "user_login", "user_id": "user123", "timestamp": "2025-08-24T10:30:00Z"}

data: {"type": "user_logout", "user_id": "user456", "timestamp": "2025-08-24T10:35:00Z"}
```

## 📄 Endpoints PDF

### Générer PDF d'analyse
```bash
POST /api/pdf-files/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "analysis_id": "analysis456",
  "template": "default"
}

# Response
{
  "pdf_id": "pdf789",
  "url": "/api/pdf-files/download/pdf789",
  "created_at": "2025-08-24T10:30:00Z"
}
```

### Télécharger PDF
```bash
GET /api/pdf-files/download/{pdf_id}
Authorization: Bearer <token>

# Response: PDF file download
Content-Type: application/pdf
Content-Disposition: attachment; filename="analysis_456.pdf"
```

## 🚨 Codes d'Erreur

### Erreurs HTTP
- `400 Bad Request` - Données invalides
- `401 Unauthorized` - Token manquant ou invalide
- `403 Forbidden` - Permissions insuffisantes
- `404 Not Found` - Ressource introuvable
- `429 Too Many Requests` - Rate limit dépassé
- `500 Internal Server Error` - Erreur serveur

### Erreurs Métier
```json
{
  "error": "INVALID_FILE_TYPE",
  "message": "File type not supported",
  "details": {
    "supported_types": [".pdf", ".docx", ".txt"]
  }
}
```

```json
{
  "error": "AI_PROVIDER_ERROR",
  "message": "AI provider connection failed",
  "details": {
    "provider": "openai",
    "error_code": "rate_limit_exceeded"
  }
}
```

```json
{
  "error": "INSUFFICIENT_PERMISSIONS",
  "message": "User does not have required permissions",
  "details": {
    "required_role": "admin",
    "user_role": "user"
  }
}
```

## 📝 Exemples d'Utilisation

### Client JavaScript
```javascript
// Configuration
const API_BASE = 'http://localhost:8000/api';
const token = 'your-jwt-token';

// Headers par défaut
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

// Exemple: Créer une analyse
async function createAnalysis(fileId, promptType) {
  const response = await fetch(`${API_BASE}/analysis/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      file_id: fileId,
      prompt_type: promptType,
      provider: 'openai'
    })
  });
  
  return await response.json();
}

// Exemple: Stream SSE
function connectToAnalysisStream() {
  const eventSource = new EventSource(`${API_BASE}/streams/analyses`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Analysis update:', data);
  };
}
```

### Client Python
```python
import requests

# Configuration
API_BASE = 'http://localhost:8000/api'
token = 'your-jwt-token'

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# Exemple: Lister les fichiers
def list_files(path):
    response = requests.get(
        f'{API_BASE}/files/list/{path}',
        headers=headers
    )
    return response.json()

# Exemple: Créer une analyse
def create_analysis(file_id, prompt_type):
    data = {
        'file_id': file_id,
        'prompt_type': prompt_type,
        'provider': 'openai'
    }
    
    response = requests.post(
        f'{API_BASE}/analysis/create',
        headers=headers,
        json=data
    )
    return response.json()
```

## 🔗 Liens Utiles

- **Documentation Swagger** : http://localhost:8000/docs
- **Documentation ReDoc** : http://localhost:8000/redoc
- **OpenAPI Schema** : http://localhost:8000/openapi.json

---

*Dernière mise à jour : Août 2025 - API Reference v2.0*
