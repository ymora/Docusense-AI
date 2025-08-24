import unifiedApiService from './unifiedApiService';
import { logService } from './logService';
import { SmartCache } from '../utils/cacheUtils';

const DEFAULT_TIMEOUT = 30000; // 30 secondes

// Cache pour les données d'audit (5 minutes)
const auditCache = new SmartCache<any>({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100
});

export interface AuditHealth {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}

export interface AuditInfo {
  name: string;
  version: string;
  environment: string;
  timestamp: string;
  base_path: string;
  backend_path: string;
  frontend_path: string;
  tests_path: string;
  docs_path: string;
  config_files: {
    requirements_txt: boolean;
    package_json: boolean;
    pytest_config: boolean;
    vitest_config: boolean;
    audit_config: boolean;
  };
}

export interface TestStatus {
  timestamp: string;
  backend_tests: {
    unit_tests: boolean;
    performance_tests: boolean;
    priority_tests: boolean;
    test_runner: boolean;
  };
  frontend_tests: {
    component_tests: boolean;
    test_setup: boolean;
    vitest_config: boolean;
  };
  integration_tests: {
    test_audit: boolean;
  };
}

export interface DatabaseStatus {
  timestamp: string;
  connection: boolean;
  database_file: boolean;
  migrations: boolean;
  tables: boolean;
  error?: string;
}

export interface AuditConfig {
  timestamp: string;
  config: any;
  source: string;
  note?: string;
}

export interface FilesStructure {
  timestamp: string;
  base_path: string;
  directories: {
    backend: {
      exists: boolean;
      main_files: string[];
    };
    frontend: {
      exists: boolean;
      main_files: string[];
    };
    tests: {
      exists: boolean;
      structure: string[];
    };
    docs: {
      exists: boolean;
      files: string[];
    };
  };
}

export interface AuditEndpoints {
  timestamp: string;
  audit_endpoints: Record<string, string>;
  main_application_endpoints: Record<string, string>;
  note: string;
}

// Service d'audit
const auditService = {
  // Vérification de santé de l'audit
  async getHealth(): Promise<AuditHealth> {
    const cacheKey = 'audit-health';
    const cached = auditCache.get(cacheKey);
    if (cached) return cached;

    const response = await unifiedApiService.get('/api/audit/health');
    
    logService.info('Santé d\'audit récupérée', 'AuditService', {
      status: response.data?.status,
      timestamp: response.data?.timestamp
    });
    
    const data = response.data;
    auditCache.set(cacheKey, data);
    return data;
  },

  // Informations de base de l'application
  async getInfo(): Promise<AuditInfo> {
    const cacheKey = 'audit-info';
    const cached = auditCache.get(cacheKey);
    if (cached) return cached;

    const response = await unifiedApiService.get('/api/audit/info');
    
    logService.info('Informations d\'audit récupérées', 'AuditService', {
      app_name: response.data?.name,
      version: response.data?.version,
      environment: response.data?.environment
    });
    
    const data = response.data;
    auditCache.set(cacheKey, data);
    return data;
  },

  // Statut des tests
  async getTestsStatus(): Promise<TestStatus> {
    const cacheKey = 'audit-tests-status';
    const cached = auditCache.get(cacheKey);
    if (cached) return cached;

    const response = await unifiedApiService.get('/api/audit/tests/status');
    
    logService.info('Statut des tests récupéré', 'AuditService', {
      backend_tests: Object.keys(response.data?.backend_tests || {}).filter(k => response.data?.backend_tests[k]).length,
      frontend_tests: Object.keys(response.data?.frontend_tests || {}).filter(k => response.data?.frontend_tests[k]).length
    });
    
    const data = response.data;
    auditCache.set(cacheKey, data);
    return data;
  },

  // Statut de la base de données
  async getDatabaseStatus(): Promise<DatabaseStatus> {
    const cacheKey = 'audit-database-status';
    const cached = auditCache.get(cacheKey);
    if (cached) return cached;

    const response = await unifiedApiService.get('/api/audit/database/status');
    
    logService.info('Statut de la base de données récupéré', 'AuditService', {
      connection: response.data?.connection,
      database_file: response.data?.database_file
    });
    
    const data = response.data;
    auditCache.set(cacheKey, data);
    return data;
  },

  // Configuration d'audit
  async getConfig(): Promise<AuditConfig> {
    const cacheKey = 'audit-config';
    const cached = auditCache.get(cacheKey);
    if (cached) return cached;

    const response = await unifiedApiService.get('/api/audit/config');
    
    logService.info('Configuration d\'audit récupérée', 'AuditService', {
      has_config: !!response.data?.config,
      source: response.data?.source
    });
    
    const data = response.data;
    auditCache.set(cacheKey, data);
    return data;
  },

  // Structure des fichiers
  async getFilesStructure(): Promise<FilesStructure> {
    const cacheKey = 'audit-files-structure';
    const cached = auditCache.get(cacheKey);
    if (cached) return cached;

    const response = await unifiedApiService.get('/api/audit/files/structure');
    
    logService.info('Structure des fichiers récupérée', 'AuditService', {
      base_path: response.data?.base_path,
      directories_count: Object.keys(response.data?.directories || {}).length
    });
    
    const data = response.data;
    auditCache.set(cacheKey, data);
    return data;
  },

  // Endpoints disponibles
  async getEndpoints(): Promise<AuditEndpoints> {
    const cacheKey = 'audit-endpoints';
    const cached = auditCache.get(cacheKey);
    if (cached) return cached;

    const response = await unifiedApiService.get('/api/audit/endpoints');
    
    logService.info('Endpoints d\'audit récupérés', 'AuditService', {
      audit_endpoints_count: Object.keys(response.data?.audit_endpoints || {}).length,
      main_endpoints_count: Object.keys(response.data?.main_application_endpoints || {}).length
    });
    
    const data = response.data;
    auditCache.set(cacheKey, data);
    return data;
  },

  // Récupérer toutes les données d'audit en une fois
  async getAllAuditData(): Promise<{
    health: AuditHealth;
    info: AuditInfo;
    tests: TestStatus;
    database: DatabaseStatus;
    config: AuditConfig;
    structure: FilesStructure;
    endpoints: AuditEndpoints;
  }> {
    try {
      const [
        health,
        info,
        tests,
        database,
        config,
        structure,
        endpoints
      ] = await Promise.all([
        this.getHealth(),
        this.getInfo(),
        this.getTestsStatus(),
        this.getDatabaseStatus(),
        this.getConfig(),
        this.getFilesStructure(),
        this.getEndpoints()
      ]);

      logService.info('Toutes les données d\'audit récupérées', 'AuditService', {
        timestamp: new Date().toISOString()
      });

      return {
        health,
        info,
        tests,
        database,
        config,
        structure,
        endpoints
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logService.error('Erreur lors de la récupération des données d\'audit', 'AuditService', {
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la récupération des données d'audit: ${errorMessage}`);
    }
  },

  // Nettoyer le cache
  clearCache(): void {
    auditCache.clear();
    logService.info('Cache d\'audit nettoyé', 'AuditService');
  }
};

export { auditService };
