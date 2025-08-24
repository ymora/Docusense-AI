import { apiRequest, handleApiError } from '../utils/apiUtils';
import { logService } from './logService';
import { cachedRequest } from '../utils/cacheUtils';

const DEFAULT_TIMEOUT = 30000; // 30 secondes

// Cache pour les données d'audit (5 minutes)
const auditCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

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
    return cachedRequest(
      auditCache,
      'audit-health',
      async () => {
        const response = await apiRequest('/api/audit/health', {}, DEFAULT_TIMEOUT);
        
        logService.info('Santé d\'audit récupérée', 'AuditService', {
          status: response.status,
          timestamp: response.timestamp
        });
        
        return response;
      },
      1 * 60 * 1000 // Cache pendant 1 minute
    );
  },

  // Informations de base de l'application
  async getInfo(): Promise<AuditInfo> {
    return cachedRequest(
      auditCache,
      'audit-info',
      async () => {
        const response = await apiRequest('/api/audit/info', {}, DEFAULT_TIMEOUT);
        
        logService.info('Informations d\'audit récupérées', 'AuditService', {
          app_name: response.name,
          version: response.version,
          environment: response.environment
        });
        
        return response;
      },
      5 * 60 * 1000 // Cache pendant 5 minutes
    );
  },

  // Statut des tests
  async getTestsStatus(): Promise<TestStatus> {
    return cachedRequest(
      auditCache,
      'audit-tests-status',
      async () => {
        const response = await apiRequest('/api/audit/tests/status', {}, DEFAULT_TIMEOUT);
        
        logService.info('Statut des tests récupéré', 'AuditService', {
          backend_tests: Object.keys(response.backend_tests).filter(k => response.backend_tests[k]).length,
          frontend_tests: Object.keys(response.frontend_tests).filter(k => response.frontend_tests[k]).length
        });
        
        return response;
      },
      2 * 60 * 1000 // Cache pendant 2 minutes
    );
  },

  // Statut de la base de données
  async getDatabaseStatus(): Promise<DatabaseStatus> {
    return cachedRequest(
      auditCache,
      'audit-database-status',
      async () => {
        const response = await apiRequest('/api/audit/database/status', {}, DEFAULT_TIMEOUT);
        
        logService.info('Statut de la base de données récupéré', 'AuditService', {
          connection: response.connection,
          database_file: response.database_file
        });
        
        return response;
      },
      1 * 60 * 1000 // Cache pendant 1 minute
    );
  },

  // Configuration d'audit
  async getConfig(): Promise<AuditConfig> {
    return cachedRequest(
      auditCache,
      'audit-config',
      async () => {
        const response = await apiRequest('/api/audit/config', {}, DEFAULT_TIMEOUT);
        
        logService.info('Configuration d\'audit récupérée', 'AuditService', {
          has_config: !!response.config,
          source: response.source
        });
        
        return response;
      },
      10 * 60 * 1000 // Cache pendant 10 minutes
    );
  },

  // Structure des fichiers
  async getFilesStructure(): Promise<FilesStructure> {
    return cachedRequest(
      auditCache,
      'audit-files-structure',
      async () => {
        const response = await apiRequest('/api/audit/files/structure', {}, DEFAULT_TIMEOUT);
        
        logService.info('Structure des fichiers récupérée', 'AuditService', {
          base_path: response.base_path,
          directories_count: Object.keys(response.directories).length
        });
        
        return response;
      },
      15 * 60 * 1000 // Cache pendant 15 minutes
    );
  },

  // Endpoints disponibles
  async getEndpoints(): Promise<AuditEndpoints> {
    return cachedRequest(
      auditCache,
      'audit-endpoints',
      async () => {
        const response = await apiRequest('/api/audit/endpoints', {}, DEFAULT_TIMEOUT);
        
        logService.info('Endpoints d\'audit récupérés', 'AuditService', {
          audit_endpoints_count: Object.keys(response.audit_endpoints).length,
          main_endpoints_count: Object.keys(response.main_application_endpoints).length
        });
        
        return response;
      },
      30 * 60 * 1000 // Cache pendant 30 minutes
    );
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
      logService.error('Erreur lors de la récupération des données d\'audit', 'AuditService', {
        error: handleApiError(error),
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la récupération des données d'audit: ${handleApiError(error)}`);
    }
  },

  // Nettoyer le cache
  clearCache(): void {
    auditCache.clear();
    logService.info('Cache d\'audit nettoyé', 'AuditService');
  }
};

export { auditService };
