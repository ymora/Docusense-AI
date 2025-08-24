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
GET /api/files/list/{directory:path}
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
GET /api/files/{file_id}
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

### Upload de fichier
```bash
POST /api/files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

# Response
{
  "file_id": "file123",
  "name": "document.pdf",
  "size": 1024000,
  "status": "uploaded"
}
```

### Sélection de fichiers
```bash
POST /api/files/select-all
POST /api/files/deselect-all
GET /api/files/selected
```

### Téléchargement
```bash
POST /api/files/download-selected
POST /api/files/download-multiple
GET /api/files/download-by-path/{file_path:path}
```

### Analyse de répertoire
```bash
POST /api/files/analyze-directory
POST /api/files/analyze-directory-supported
```

## 🤖 Endpoints Analyse

### Création d'analyses
```bash
# Comparaison de documents
POST /api/analysis/compare
{
  "file_ids": ["file1", "file2"],
  "prompt_id": "general_comparison",
  "analysis_type": "comparison"
}

# Analyse par lot
POST /api/analysis/batch
{
  "file_ids": ["file1", "file2", "file3"],
  "prompt_id": "general_summary",
  "analysis_type": "batch"
}
```

### Gestion des analyses
```bash
# Relancer une analyse
POST /api/analysis/{analysis_id}/retry

# Démarrer une analyse
POST /api/analysis/{analysis_id}/start
```

### Stream des analyses
```bash
GET /api/streams/analyses
# Server-Sent Events pour les mises à jour temps réel
```

## 🔧 Endpoints Configuration

### Providers IA
```bash
GET /api/config/providers
POST /api/config/save
POST /api/config/test
GET /api/config/system
```

### Prompts
```bash
GET /api/prompts/
GET /api/prompts/summary
GET /api/prompts/universal
GET /api/prompts/universal/{prompt_id}
GET /api/prompts/recommendations
GET /api/prompts/use-case/{use_case}
GET /api/prompts/format/{prompt_id}
GET /api/prompts/default
GET /api/prompts/default/{analysis_type}
GET /api/prompts/specialized
GET /api/prompts/specialized/{prompt_id}
POST /api/prompts/reload
```

## 📊 Endpoints Monitoring

### Santé système
```bash
GET /api/health/
GET /api/health/health
GET /api/health/detailed
GET /api/health/config
```

### Performance
```bash
GET /api/monitoring/performance
GET /api/monitoring/health/detailed
POST /api/monitoring/cache/clear
POST /api/monitoring/cleanup/temp-files
```

### Audit
```bash
GET /api/audit/health
GET /api/audit/info
GET /api/audit/tests/status
GET /api/audit/config
GET /api/audit/database/status
GET /api/audit/files/structure
GET /api/audit/endpoints
POST /api/audit/tests/run
```

## 🗄️ Endpoints Base de Données

### Statut
```bash
GET /api/database/status
```

### Nettoyage
```bash
POST /api/database/cleanup/orphaned-files
POST /api/database/cleanup/failed-analyses
POST /api/database/cleanup/temp-files
POST /api/database/fix-invalid-statuses
POST /api/database/full-cleanup
```

### Sauvegarde
```bash
GET /api/database/backup/list
POST /api/database/backup/create
POST /api/database/backup/restore
```

### Données
```bash
GET /api/database/files
GET /api/database/analyses
GET /api/database/files/{file_id}/analyses
POST /api/database/analyses/{analysis_id}/retry
POST /api/database/analyses/bulk-delete
```

## 📝 Endpoints Logs

### Logs système
```bash
GET /api/logs/backend/stream
GET /api/logs/list
GET /api/logs/categories
GET /api/logs/download/{category}
POST /api/logs/cleanup
POST /api/logs/archive
```

### Logs système avancés
```bash
GET /api/system-logs/
GET /api/system-logs/security-summary
GET /api/system-logs/ip-activity
GET /api/system-logs/failed-logins
GET /api/system-logs/sources
POST /api/system-logs/manual-event
```

## 🔐 Endpoints Sécurité

### Authentification
```bash
POST /api/auth/login
POST /api/auth/register
POST /api/auth/guest
POST /api/auth/guest-login
POST /api/auth/refresh
POST /api/auth/logout
GET /api/auth/check-username/{username}
GET /api/auth/me
GET /api/auth/guest-usage
GET /api/auth/test-auth
```

### Streaming sécurisé
```bash
GET /api/secure-streaming/file-info/{file_path:path}
GET /api/secure-streaming/view/{file_path:path}
GET /api/secure-streaming/download/{file_path:path}
GET /api/secure-streaming/temp-access/{temp_token}
GET /api/secure-streaming/stats
POST /api/secure-streaming/create-temp-token
```

## 📧 Endpoints Emails

```bash
GET /api/emails/parse/{file_path:path}
GET /api/emails/preview/{file_path:path}
GET /api/emails/attachment/{file_path:path}/{attachment_index}
GET /api/emails/attachment-preview/{file_path:path}/{attachment_index}
```

## 🎬 Endpoints Multimédia

```bash
GET /api/multimedia/analyze/{file_path:path}
GET /api/multimedia/thumbnail/{file_path:path}
GET /api/multimedia/supported-formats
GET /api/multimedia/file-type/{file_path:path}
GET /api/multimedia/stream-optimized/{file_id}
GET /api/multimedia/optimization-info/{file_id}
GET /api/multimedia/ffmpeg-status
POST /api/multimedia/optimize/{file_id}
```

## 🎥 Endpoints Vidéo

```bash
POST /api/video-converter/start-conversion/{file_path:path}
```

## 📄 Endpoints PDF

```bash
POST /api/pdf-files/generate/{analysis_id}
POST /api/pdf-files/generate-all-completed
GET /api/pdf-files/download/{analysis_id}
GET /api/pdf-files/list
```

## 📚 Endpoints Documents de Référence

```bash
GET /api/reference-documents/
GET /api/reference-documents/categories
GET /api/reference-documents/category/{category}
GET /api/reference-documents/search
GET /api/reference-documents/document/{doc_id}
GET /api/reference-documents/document/{doc_id}/content
GET /api/reference-documents/relevant/{analysis_type}
POST /api/reference-documents/add
```

## 📥 Endpoints Téléchargement

```bash
GET /api/download/file/{file_path:path}
GET /api/download/directory/{directory_path:path}
GET /api/download/info/{file_path:path}
GET /api/download/stats
GET /api/download/browse/{directory_path:path}
POST /api/download/multiple
POST /api/download/cleanup
```

## 👨‍💼 Endpoints Administration

```bash
GET /api/admin/users
POST /api/admin/users
GET /api/admin/system/health
GET /api/admin/system/performance
GET /api/admin/system/info
GET /api/admin/system/logs
```

## 🔄 Endpoints Streams

```bash
GET /api/streams/analyses
GET /api/streams/config
GET /api/streams/users
GET /api/streams/files
GET /api/streams/admin
GET /api/streams/system
```

## 🧹 Endpoints Nettoyage Unifié

```bash
GET /api/unified-cleanup/stats
POST /api/unified-cleanup/orphaned-files
POST /api/unified-cleanup/failed-analyses
POST /api/unified-cleanup/old-analyses
POST /api/unified-cleanup/temp-files
POST /api/unified-cleanup/logs
POST /api/unified-cleanup/cache
POST /api/unified-cleanup/conversions
POST /api/unified-cleanup/invalid-statuses
POST /api/unified-cleanup/full
```

## 🔄 Endpoints Migrations

```bash
GET /api/migrations/check-consistency
GET /api/migrations/status
POST /api/migrations/run
```

## 📊 Codes de Réponse

### Succès
- **200 OK** - Requête réussie
- **201 Created** - Ressource créée
- **204 No Content** - Requête réussie sans contenu

### Erreurs Client
- **400 Bad Request** - Requête malformée
- **401 Unauthorized** - Authentification requise
- **403 Forbidden** - Accès refusé
- **404 Not Found** - Ressource non trouvée
- **409 Conflict** - Conflit de données
- **422 Unprocessable Entity** - Données invalides

### Erreurs Serveur
- **500 Internal Server Error** - Erreur serveur
- **502 Bad Gateway** - Erreur de passerelle
- **503 Service Unavailable** - Service indisponible

## 🔒 Sécurité

### Rate Limiting
- **Limite par défaut** : 100 requêtes par minute
- **Limite par utilisateur** : Configurable par rôle
- **Headers de réponse** :
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1640995200
  ```

### CORS
```javascript
// Configuration CORS
{
  "origins": [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ],
  "allow_credentials": true,
  "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "allow_headers": ["*"]
}
```

### Validation des Données
- **Pydantic** pour la validation automatique
- **Types stricts** pour tous les paramètres
- **Validation des fichiers** (taille, type, extension)

## 📝 Exemples d'Utilisation

### Créer une analyse complète
```python
import requests

# 1. Authentification
auth_response = requests.post("http://localhost:8000/api/auth/login", json={
    "username": "user@example.com",
    "password": "password123"
})
token = auth_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Upload d'un fichier
with open("document.pdf", "rb") as f:
    files = {"file": f}
    upload_response = requests.post(
        "http://localhost:8000/api/files/upload",
        files=files,
        headers=headers
    )
file_id = upload_response.json()["file_id"]

# 3. Créer une analyse
analysis_response = requests.post(
    "http://localhost:8000/api/analysis/compare",
    json={
        "file_ids": [file_id],
        "prompt_id": "general_summary",
        "analysis_type": "summary"
    },
    headers=headers
)
analysis_id = analysis_response.json()["analysis_id"]

# 4. Suivre le progrès via SSE
import sseclient
sse_url = f"http://localhost:8000/api/streams/analyses"
client = sseclient.SSEClient(sse_url, headers=headers)
for event in client.events():
    if event.event == "analysis_update":
        data = json.loads(event.data)
        if data["analysis_id"] == analysis_id:
            print(f"Status: {data['status']}")
            if data["status"] == "completed":
                break
```

### Gestion des erreurs
```python
try:
    response = requests.get("http://localhost:8000/api/files/drives", headers=headers)
    response.raise_for_status()
    drives = response.json()["drives"]
except requests.exceptions.HTTPError as e:
    if e.response.status_code == 401:
        print("Token expiré, reconnectez-vous")
    elif e.response.status_code == 403:
        print("Permissions insuffisantes")
    else:
        print(f"Erreur HTTP: {e.response.status_code}")
except requests.exceptions.RequestException as e:
    print(f"Erreur de connexion: {e}")
```

## 🔗 Liens Utiles

- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc
- **OpenAPI JSON** : http://localhost:8000/openapi.json

---

*Dernière mise à jour : Août 2025 - API Reference v2.0 - Endpoints complets*
