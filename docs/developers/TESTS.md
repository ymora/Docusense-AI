# 🧪 Tests - DocuSense AI

## 📋 Vue d'ensemble

Cette documentation couvre la stratégie de tests pour DocuSense AI, incluant les tests unitaires, d'intégration, de performance et end-to-end.

## 🏗️ Architecture des Tests

### Structure des Tests
```
tests/
├── backend/
│   ├── unit/
│   │   ├── test_models.py
│   │   ├── test_services.py
│   │   └── test_utils.py
│   ├── integration/
│   │   ├── test_api.py
│   │   ├── test_database.py
│   │   └── test_auth.py
│   ├── performance/
│   │   ├── test_load.py
│   │   └── test_stress.py
│   └── fixtures/
│       ├── test_data.py
│       └── mock_services.py
├── frontend/
│   ├── unit/
│   │   ├── components/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/
│   │   └── api/
│   └── e2e/
│       └── cypress/
└── shared/
    ├── test_helpers.py
    └── test_config.py
```

## 🔧 Configuration des Tests

### Configuration Backend (pytest)
```python
# tests/conftest.py
import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import get_db, Base

# Base de données de test
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with a fresh database."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_user():
    """Create a test user."""
    return {
        "username": "testuser@example.com",
        "password": "testpassword123",
        "role": "user"
    }

@pytest.fixture
def auth_headers(client, test_user):
    """Get authentication headers for a test user."""
    # Créer l'utilisateur
    response = client.post("/api/auth/register", json=test_user)
    assert response.status_code == 201
    
    # Se connecter
    login_response = client.post("/api/auth/login", json={
        "username": test_user["username"],
        "password": test_user["password"]
    })
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

### Configuration Frontend (Jest + Testing Library)
```javascript
// frontend/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
  ],
};

// frontend/src/setupTests.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock des APIs
jest.mock('./services/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));
```

## 🧪 Tests Unitaires

### Tests Backend

#### Test des Modèles
```python
# tests/backend/unit/test_models.py
import pytest
from app.models.user import User
from app.models.analysis import Analysis
from app.models.file import File

class TestUser:
    def test_user_creation(self):
        """Test de création d'un utilisateur."""
        user = User(
            username="test@example.com",
            email="test@example.com",
            hashed_password="hashed_password",
            role="user"
        )
        
        assert user.username == "test@example.com"
        assert user.email == "test@example.com"
        assert user.role == "user"
        assert user.is_active is True
    
    def test_user_role_validation(self):
        """Test de validation du rôle utilisateur."""
        with pytest.raises(ValueError):
            User(
                username="test@example.com",
                email="test@example.com",
                hashed_password="hashed_password",
                role="invalid_role"
            )

class TestAnalysis:
    def test_analysis_creation(self):
        """Test de création d'une analyse."""
        analysis = Analysis(
            file_id=1,
            user_id=1,
            prompt_type="general",
            provider="openai",
            status="pending"
        )
        
        assert analysis.prompt_type == "general"
        assert analysis.provider == "openai"
        assert analysis.status == "pending"
        assert analysis.progress == 0
    
    def test_analysis_status_validation(self):
        """Test de validation du statut d'analyse."""
        with pytest.raises(ValueError):
            Analysis(
                file_id=1,
                user_id=1,
                prompt_type="general",
                provider="openai",
                status="invalid_status"
            )
```

#### Test des Services
```python
# tests/backend/unit/test_services.py
import pytest
from unittest.mock import Mock, patch
from app.services.auth_service import AuthService
from app.services.analysis_service import AnalysisService
from app.services.file_service import FileService

class TestAuthService:
    def test_password_hashing(self):
        """Test du hachage des mots de passe."""
        service = AuthService()
        password = "testpassword123"
        
        hashed = service.hash_password(password)
        assert hashed != password
        assert service.verify_password(password, hashed) is True
        assert service.verify_password("wrongpassword", hashed) is False
    
    def test_token_generation(self):
        """Test de génération de tokens JWT."""
        service = AuthService()
        user_data = {"user_id": 1, "username": "test@example.com"}
        
        token = service.create_access_token(user_data)
        assert token is not None
        
        decoded = service.decode_token(token)
        assert decoded["user_id"] == 1
        assert decoded["username"] == "test@example.com"

class TestAnalysisService:
    @patch('app.services.analysis_service.AIProvider')
    def test_create_analysis(self, mock_ai_provider):
        """Test de création d'une analyse."""
        service = AnalysisService()
        mock_ai_provider.return_value.analyze.return_value = "Analyse result"
        
        result = service.create_analysis(
            file_id=1,
            user_id=1,
            prompt_type="general",
            provider="openai"
        )
        
        assert result["status"] == "completed"
        assert result["result"] == "Analyse result"
        mock_ai_provider.return_value.analyze.assert_called_once()

class TestFileService:
    def test_file_validation(self):
        """Test de validation des fichiers."""
        service = FileService()
        
        # Test fichier valide
        assert service.is_valid_file("document.pdf") is True
        assert service.is_valid_file("image.jpg") is True
        
        # Test fichier invalide
        assert service.is_valid_file("document.exe") is False
        assert service.is_valid_file("script.bat") is False
    
    def test_file_metadata_extraction(self):
        """Test d'extraction des métadonnées."""
        service = FileService()
        
        with patch('os.path.getsize') as mock_size:
            mock_size.return_value = 1024000
            
            metadata = service.extract_metadata("test.pdf")
            assert metadata["size"] == 1024000
            assert metadata["extension"] == ".pdf"
```

### Tests Frontend

#### Test des Composants
```typescript
// tests/frontend/unit/components/FileList.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileList } from '@/components/FileList';

const mockFiles = [
  {
    id: 1,
    name: 'document.pdf',
    size: 1024000,
    type: 'application/pdf',
    extension: '.pdf',
  },
  {
    id: 2,
    name: 'image.jpg',
    size: 512000,
    type: 'image/jpeg',
    extension: '.jpg',
  },
];

const mockOnFileSelect = jest.fn();

describe('FileList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders file list correctly', () => {
    render(
      <FileList 
        files={mockFiles} 
        onFileSelect={mockOnFileSelect} 
      />
    );

    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('image.jpg')).toBeInTheDocument();
  });

  it('calls onFileSelect when file is clicked', () => {
    render(
      <FileList 
        files={mockFiles} 
        onFileSelect={mockOnFileSelect} 
      />
    );

    fireEvent.click(screen.getByText('document.pdf'));
    expect(mockOnFileSelect).toHaveBeenCalledWith(mockFiles[0]);
  });

  it('displays file size in human readable format', () => {
    render(
      <FileList 
        files={mockFiles} 
        onFileSelect={mockOnFileSelect} 
      />
    );

    expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    expect(screen.getByText('512.0 KB')).toBeInTheDocument();
  });
});
```

#### Test des Services
```typescript
// tests/frontend/unit/services/api.test.ts
import { apiClient } from '@/services/api';
import { mockApiResponse } from '@/tests/mocks/api';

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('makes GET request successfully', async () => {
    const mockResponse = { data: 'test' };
    (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

    const result = await apiClient.get('/test');
    
    expect(apiClient.get).toHaveBeenCalledWith('/test');
    expect(result).toEqual(mockResponse);
  });

  it('handles API errors correctly', async () => {
    const mockError = new Error('API Error');
    (apiClient.get as jest.Mock).mockRejectedValue(mockError);

    await expect(apiClient.get('/test')).rejects.toThrow('API Error');
  });

  it('includes auth headers when token is available', async () => {
    const mockResponse = { data: 'test' };
    (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);
    
    // Simuler un token d'authentification
    localStorage.setItem('token', 'test-token');

    await apiClient.get('/test');
    
    expect(apiClient.get).toHaveBeenCalledWith('/test', {
      headers: {
        Authorization: 'Bearer test-token',
      },
    });
  });
});
```

## 🔗 Tests d'Intégration

### Tests API Backend
```python
# tests/backend/integration/test_api.py
import pytest
from fastapi.testclient import TestClient

class TestAuthAPI:
    def test_user_registration(self, client):
        """Test d'enregistrement d'utilisateur."""
        user_data = {
            "username": "newuser@example.com",
            "password": "password123",
            "role": "user"
        }
        
        response = client.post("/api/auth/register", json=user_data)
        assert response.status_code == 201
        
        data = response.json()
        assert data["username"] == user_data["username"]
        assert "id" in data
    
    def test_user_login(self, client, test_user):
        """Test de connexion utilisateur."""
        response = client.post("/api/auth/login", json={
            "username": test_user["username"],
            "password": test_user["password"]
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_protected_endpoint_with_auth(self, client, auth_headers):
        """Test d'accès à un endpoint protégé."""
        response = client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
    
    def test_protected_endpoint_without_auth(self, client):
        """Test d'accès à un endpoint protégé sans authentification."""
        response = client.get("/api/auth/me")
        assert response.status_code == 401

class TestFileAPI:
    def test_list_files(self, client, auth_headers):
        """Test de listage des fichiers."""
        response = client.get("/api/files/list/C:/", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "files" in data
        assert "directories" in data
    
    def test_file_info(self, client, auth_headers):
        """Test d'obtention d'informations sur un fichier."""
        # Créer un fichier de test
        file_data = {
            "name": "test.pdf",
            "path": "C:/test.pdf",
            "size": 1024000
        }
        
        response = client.post("/api/files/", json=file_data, headers=auth_headers)
        file_id = response.json()["id"]
        
        # Obtenir les informations du fichier
        response = client.get(f"/api/files/info/{file_id}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "test.pdf"
        assert data["size"] == 1024000

class TestAnalysisAPI:
    def test_create_analysis(self, client, auth_headers):
        """Test de création d'une analyse."""
        analysis_data = {
            "file_id": 1,
            "prompt_type": "general",
            "provider": "openai"
        }
        
        response = client.post("/api/analysis/create", json=analysis_data, headers=auth_headers)
        assert response.status_code == 201
        
        data = response.json()
        assert "analysis_id" in data
        assert data["status"] == "pending"
    
    def test_get_analysis_status(self, client, auth_headers):
        """Test d'obtention du statut d'une analyse."""
        # Créer une analyse
        analysis_data = {
            "file_id": 1,
            "prompt_type": "general",
            "provider": "openai"
        }
        
        create_response = client.post("/api/analysis/create", json=analysis_data, headers=auth_headers)
        analysis_id = create_response.json()["analysis_id"]
        
        # Obtenir le statut
        response = client.get(f"/api/analysis/status/{analysis_id}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert "progress" in data
```

### Tests d'Intégration Frontend
```typescript
// tests/frontend/integration/api/FileService.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { FileService } from '@/services/FileService';
import { FileList } from '@/components/FileList';

// Mock du service API
jest.mock('@/services/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('FileService Integration', () => {
  it('loads and displays files from API', async () => {
    const mockFiles = [
      { id: 1, name: 'document.pdf', size: 1024000 },
      { id: 2, name: 'image.jpg', size: 512000 },
    ];

    // Mock de la réponse API
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { files: mockFiles, directories: [] }
    });

    render(<FileList />);

    // Attendre que les fichiers soient chargés
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('image.jpg')).toBeInTheDocument();
    });

    expect(apiClient.get).toHaveBeenCalledWith('/api/files/list/');
  });

  it('handles API errors gracefully', async () => {
    // Mock d'une erreur API
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<FileList />);

    await waitFor(() => {
      expect(screen.getByText('Erreur de chargement')).toBeInTheDocument();
    });
  });
});
```

## ⚡ Tests de Performance

### Tests de Charge Backend
```python
# tests/backend/performance/test_load.py
import pytest
import asyncio
import aiohttp
import time
from concurrent.futures import ThreadPoolExecutor

class TestLoadPerformance:
    @pytest.mark.asyncio
    async def test_concurrent_requests(self):
        """Test de performance avec requêtes concurrentes."""
        base_url = "http://localhost:8000"
        
        async def make_request(session, endpoint):
            async with session.get(f"{base_url}{endpoint}") as response:
                return await response.json()
        
        async with aiohttp.ClientSession() as session:
            # 100 requêtes concurrentes
            tasks = [
                make_request(session, "/api/health") 
                for _ in range(100)
            ]
            
            start_time = time.time()
            results = await asyncio.gather(*tasks)
            end_time = time.time()
            
            # Vérifications
            assert len(results) == 100
            assert all(result["status"] == "healthy" for result in results)
            
            # Performance: moins de 5 secondes pour 100 requêtes
            duration = end_time - start_time
            assert duration < 5.0
    
    def test_database_performance(self, db_session):
        """Test de performance de la base de données."""
        from app.models.analysis import Analysis
        from app.models.user import User
        
        # Créer des données de test
        user = User(username="test@example.com", email="test@example.com", hashed_password="hash")
        db_session.add(user)
        db_session.commit()
        
        # Créer 1000 analyses
        analyses = []
        for i in range(1000):
            analysis = Analysis(
                file_id=i,
                user_id=user.id,
                prompt_type="general",
                provider="openai",
                status="completed"
            )
            analyses.append(analysis)
        
        start_time = time.time()
        db_session.add_all(analyses)
        db_session.commit()
        end_time = time.time()
        
        # Performance: moins de 2 secondes pour 1000 insertions
        duration = end_time - start_time
        assert duration < 2.0
        
        # Test de requête avec index
        start_time = time.time()
        user_analyses = db_session.query(Analysis).filter(
            Analysis.user_id == user.id
        ).all()
        end_time = time.time()
        
        # Performance: moins de 100ms pour la requête
        duration = end_time - start_time
        assert duration < 0.1
        assert len(user_analyses) == 1000

class TestMemoryUsage:
    def test_memory_leaks(self, client):
        """Test de fuites mémoire."""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        # Effectuer 1000 requêtes
        for _ in range(1000):
            response = client.get("/api/health")
            assert response.status_code == 200
        
        # Vérifier que la mémoire n'a pas augmenté de plus de 50MB
        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory
        
        assert memory_increase < 50 * 1024 * 1024  # 50MB
```

### Tests de Performance Frontend
```typescript
// tests/frontend/performance/FileList.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FileList } from '@/components/FileList';

describe('FileList Performance', () => {
  it('renders large file list efficiently', () => {
    // Créer une liste de 1000 fichiers
    const largeFileList = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `file${i}.pdf`,
      size: 1024000,
      type: 'application/pdf',
      extension: '.pdf',
    }));

    const startTime = performance.now();
    
    render(<FileList files={largeFileList} onFileSelect={jest.fn()} />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Le rendu doit prendre moins de 100ms
    expect(renderTime).toBeLessThan(100);

    // Vérifier que les premiers fichiers sont visibles
    expect(screen.getByText('file0.pdf')).toBeInTheDocument();
    expect(screen.getByText('file1.pdf')).toBeInTheDocument();
  });

  it('handles file selection efficiently', () => {
    const fileList = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `file${i}.pdf`,
      size: 1024000,
      type: 'application/pdf',
      extension: '.pdf',
    }));

    const onFileSelect = jest.fn();
    render(<FileList files={fileList} onFileSelect={onFileSelect} />);

    const startTime = performance.now();
    
    // Cliquer sur plusieurs fichiers
    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByText(`file${i}.pdf`));
    }
    
    const endTime = performance.now();
    const clickTime = endTime - startTime;

    // Les clics doivent être traités en moins de 50ms
    expect(clickTime).toBeLessThan(50);
    expect(onFileSelect).toHaveBeenCalledTimes(10);
  });
});
```

## 🎯 Tests End-to-End

### Tests Cypress
```typescript
// tests/frontend/e2e/cypress/integration/file-management.spec.ts
describe('File Management', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
    cy.login('testuser@example.com', 'password123');
  });

  it('should navigate through file system', () => {
    // Vérifier que le sélecteur de disque est visible
    cy.get('[data-testid="disk-selector"]').should('be.visible');
    
    // Sélectionner le disque C:
    cy.get('[data-testid="disk-selector"]').click();
    cy.get('[data-testid="disk-C"]').click();
    
    // Vérifier que la liste des fichiers se charge
    cy.get('[data-testid="file-list"]').should('be.visible');
    
    // Cliquer sur un dossier
    cy.get('[data-testid="directory-Documents"]').click();
    
    // Vérifier la navigation
    cy.get('[data-testid="current-path"]').should('contain', 'Documents');
  });

  it('should display file content', () => {
    // Naviguer vers un fichier
    cy.get('[data-testid="file-document.pdf"]').click();
    
    // Vérifier que le contenu s'affiche
    cy.get('[data-testid="file-viewer"]').should('be.visible');
    cy.get('[data-testid="file-name"]').should('contain', 'document.pdf');
  });

  it('should create analysis', () => {
    // Sélectionner un fichier
    cy.get('[data-testid="file-document.pdf"]').click();
    
    // Cliquer sur analyser
    cy.get('[data-testid="analyze-button"]').click();
    
    // Sélectionner un prompt
    cy.get('[data-testid="prompt-selector"]').click();
    cy.get('[data-testid="prompt-general"]').click();
    
    // Lancer l'analyse
    cy.get('[data-testid="start-analysis"]').click();
    
    // Vérifier que l'analyse est en cours
    cy.get('[data-testid="analysis-status"]').should('contain', 'En cours');
    
    // Attendre la fin de l'analyse
    cy.get('[data-testid="analysis-status"]', { timeout: 30000 }).should('contain', 'Terminée');
    
    // Vérifier le résultat
    cy.get('[data-testid="analysis-result"]').should('be.visible');
  });

  it('should handle authentication', () => {
    // Se déconnecter
    cy.get('[data-testid="logout-button"]').click();
    
    // Vérifier la redirection vers la page de connexion
    cy.url().should('include', '/login');
    
    // Se reconnecter
    cy.get('[data-testid="email-input"]').type('testuser@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    
    // Vérifier la redirection vers l'accueil
    cy.url().should('include', '/');
  });
});
```

## 📊 Couverture de Code

### Configuration de Couverture Backend
```python
# pytest.ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --cov=app
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=80
    --cov-branch
```

### Configuration de Couverture Frontend
```json
// package.json
{
  "scripts": {
    "test:coverage": "jest --coverage --coverageReporters=text --coverageReporters=html",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --watchAll=false"
  },
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts",
      "!src/main.tsx",
      "!src/vite-env.d.ts"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

## 🚀 Exécution des Tests

### Scripts de Test
```bash
#!/bin/bash
# run-tests.sh

echo "🧪 Exécution des tests DocuSense AI..."

# Tests Backend
echo "📦 Tests Backend..."
cd backend
python -m pytest tests/ -v --cov=app --cov-report=html
BACKEND_EXIT_CODE=$?

# Tests Frontend
echo "🎨 Tests Frontend..."
cd ../frontend
npm run test:coverage
FRONTEND_EXIT_CODE=$?

# Tests E2E (si Cypress est installé)
echo "🌐 Tests End-to-End..."
if command -v cypress &> /dev/null; then
    npm run cypress:run
    E2E_EXIT_CODE=$?
else
    echo "⚠️ Cypress non installé, tests E2E ignorés"
    E2E_EXIT_CODE=0
fi

# Résumé
echo "📊 Résumé des tests:"
echo "Backend: $([ $BACKEND_EXIT_CODE -eq 0 ] && echo "✅" || echo "❌")"
echo "Frontend: $([ $FRONTEND_EXIT_CODE -eq 0 ] && echo "✅" || echo "❌")"
echo "E2E: $([ $E2E_EXIT_CODE -eq 0 ] && echo "✅" || echo "❌")"

# Code de sortie global
if [ $BACKEND_EXIT_CODE -eq 0 ] && [ $FRONTEND_EXIT_CODE -eq 0 ] && [ $E2E_EXIT_CODE -eq 0 ]; then
    echo "🎉 Tous les tests sont passés !"
    exit 0
else
    echo "❌ Certains tests ont échoué"
    exit 1
fi
```

### Intégration Continue
```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Run tests
      run: |
        cd backend
        python -m pytest tests/ -v --cov=app --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.xml

  test-frontend:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run tests
      run: |
        cd frontend
        npm run test:ci
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./frontend/coverage/lcov.info
```

## 🔧 Mocks et Fixtures

### Mocks Backend
```python
# tests/backend/fixtures/mock_services.py
from unittest.mock import Mock, patch
import pytest

@pytest.fixture
def mock_ai_provider():
    """Mock du service IA."""
    with patch('app.services.ai_service.AIProvider') as mock:
        mock_instance = Mock()
        mock_instance.analyze.return_value = "Mock analysis result"
        mock.return_value = mock_instance
        yield mock_instance

@pytest.fixture
def mock_file_service():
    """Mock du service de fichiers."""
    with patch('app.services.file_service.FileService') as mock:
        mock_instance = Mock()
        mock_instance.is_valid_file.return_value = True
        mock_instance.extract_metadata.return_value = {
            "size": 1024000,
            "extension": ".pdf"
        }
        mock.return_value = mock_instance
        yield mock_instance

@pytest.fixture
def mock_email_service():
    """Mock du service d'emails."""
    with patch('app.services.email_service.EmailService') as mock:
        mock_instance = Mock()
        mock_instance.parse_email.return_value = {
            "subject": "Test Email",
            "from": "test@example.com",
            "attachments": []
        }
        mock.return_value = mock_instance
        yield mock_instance
```

### Mocks Frontend
```typescript
// tests/frontend/mocks/api.ts
import { rest } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  rest.get('/api/files/list/:path', (req, res, ctx) => {
    return res(
      ctx.json({
        files: [
          { id: 1, name: 'document.pdf', size: 1024000 },
          { id: 2, name: 'image.jpg', size: 512000 },
        ],
        directories: [
          { name: 'Documents', path: 'C:/Documents' },
        ],
      })
    );
  }),

  rest.post('/api/analysis/create', (req, res, ctx) => {
    return res(
      ctx.json({
        analysis_id: 'analysis123',
        status: 'pending',
        created_at: new Date().toISOString(),
      })
    );
  }),

  rest.get('/api/analysis/status/:id', (req, res, ctx) => {
    return res(
      ctx.json({
        id: req.params.id,
        status: 'completed',
        progress: 100,
        result: 'Mock analysis result',
      })
    );
  }),
];

export const server = setupServer(...handlers);
```

---

*Dernière mise à jour : Août 2025 - Tests v2.0*
