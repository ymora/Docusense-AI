import React, { useState, useEffect } from 'react';
import { useColors } from '../../hooks/useColors';
import { useBackendConnection } from '../../hooks/useBackendConnection';
import { useStreamService } from '../../services/streamService';
import { auditService } from '../../services/auditService';
import { logService } from '../../services/logService';
import useAuthStore from '../../stores/authStore';
import {
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  WifiIcon,
  InformationCircleIcon,
  XCircleIcon,
  CogIcon,
  DatabaseIcon,
  FolderIcon,
  CodeBracketIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface SystemData {
  system: {
    cpu_percent: number;
    memory_percent: number;
    disk_usage_percent: number;
    uptime: number;
    process_count: number;
  };
  performance: {
    requests_per_second: number;
    avg_response_time: number;
    active_connections: number;
    cache_hits: number;
    cache_misses: number;
  };
  health: {
    status: string;
    app_name: string;
    version: string;
    environment: string;
  };
}

interface AuditData {
  health: any;
  info: any;
  tests: any;
  database: any;
  config: any;
  structure: any;
  endpoints: any;
}

const SystemPanel: React.FC = () => {
  const { colors } = useColors();
  const { isOnline } = useBackendConnection();
  const { isAdmin } = useAuthStore();
  const { startStream } = useStreamService();
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [lastAuditUpdate, setLastAuditUpdate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'system' | 'audit'>('system');
  const [auditError, setAuditError] = useState<string | null>(null);

  // Charger les données d'audit
  const fetchAuditData = async () => {
    if (!isOnline || !isAdmin) {
      return;
    }

    try {
      setAuditLoading(true);
      setAuditError(null);
      
      const data = await auditService.getAllAuditData();
      setAuditData(data);
      setLastAuditUpdate(new Date());
      
      logService.info('Données d\'audit récupérées avec succès', 'SystemPanel', {
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setAuditError(errorMessage);
      logService.error('Erreur lors de la récupération des données d\'audit', 'SystemPanel', {
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (!isOnline || !isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Démarrer le stream système
    const success = startStream('system', {
      onMessage: (message) => {
        if (message.type === 'system_initial') {
          setSystemData(message.data);
          setLastUpdate(new Date());
          setLoading(false);
          logService.info('Données système initiales reçues via stream', 'SystemPanel');
        } else if (message.type === 'system_update') {
          setSystemData(prev => ({ ...prev, ...message.data }));
          setLastUpdate(new Date());
          logService.debug('Mise à jour système reçue via stream', 'SystemPanel');
        }
      },
      onError: (error) => {
        logService.error('Erreur stream système', 'SystemPanel', { error });
        setLoading(false);
      },
      onOpen: () => {
        logService.info('Stream système connecté', 'SystemPanel');
      }
    });

    if (!success) {
      setLoading(false);
    }

    // Charger les données d'audit au démarrage
    fetchAuditData();

    return () => {
      // stopStream('system');
    };
  }, [isOnline, isAdmin, startStream]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5" style={{ color: colors.success }} />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5" style={{ color: colors.warning }} />;
      case 'error':
        return <XCircleIcon className="h-5 w-5" style={{ color: colors.error }} />;
      default:
        return <InformationCircleIcon className="h-5 w-5" style={{ color: colors.textSecondary }} />;
    }
  };

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value >= threshold) return colors.error;
    if (value >= threshold * 0.8) return colors.warning;
    return colors.success;
  };

  const getTestStatusColor = (hasTests: boolean) => {
    return hasTests ? colors.success : colors.warning;
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 mx-auto mb-4" style={{ color: colors.error }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
            Accès refusé
          </h3>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Vous devez être administrateur pour accéder à ce panneau.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Navigation des onglets */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1 p-1 rounded-lg" style={{ backgroundColor: colors.surface + '50' }}>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'system' 
                ? 'text-white' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            style={{
              backgroundColor: activeTab === 'system' ? colors.primary : 'transparent'
            }}
          >
            <div className="flex items-center space-x-2">
              <ServerIcon className="h-4 w-4" />
              <span>Système</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'audit' 
                ? 'text-white' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            style={{
              backgroundColor: activeTab === 'audit' ? colors.primary : 'transparent'
            }}
          >
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="h-4 w-4" />
              <span>Audit & Qualité</span>
            </div>
          </button>
        </div>
        
        {/* Bouton de rafraîchissement */}
        {activeTab === 'audit' && (
          <button
            onClick={fetchAuditData}
            disabled={auditLoading}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{
              backgroundColor: colors.primary,
              color: colors.surface
            }}
          >
            <ArrowPathIcon className={`h-4 w-4 ${auditLoading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        )}
      </div>

      {/* Contenu de l'onglet Système */}
      {activeTab === 'system' && (
        <>
          {/* Dernière mise à jour */}
          {lastUpdate && (
            <div className="text-xs" style={{ color: colors.textSecondary }}>
              Dernière mise à jour système : {lastUpdate.toLocaleString('fr-FR')}
            </div>
          )}

          {/* Santé générale */}
          {systemData && (
            <>
              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
                    Santé du Système
                  </h2>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(systemData.health.status)}
                    <span 
                      className="text-sm font-medium"
                      style={{ color: getStatusColor(systemData.health.status) }}
                    >
                      {systemData.health.status === 'healthy' ? 'Opérationnel' : 'Attention'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                      {systemData.health.app_name}
                    </div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      Application
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                      {systemData.health.version}
                    </div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      Version
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                      {systemData.health.environment}
                    </div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      Environnement
                    </div>
                  </div>
                </div>
              </div>

              {/* Métriques système */}
              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }}
              >
                <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
                  Performance Système
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="flex items-center space-x-3">
                    <CpuChipIcon className="h-5 w-5" style={{ color: colors.primary }} />
                    <div>
                      <div className="font-medium" style={{ color: colors.text }}>
                        CPU
                      </div>
                      <div 
                        className="text-sm font-semibold"
                        style={{ color: getPerformanceColor(systemData.system.cpu_percent, 90) }}
                      >
                        {systemData.system.cpu_percent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <ServerIcon className="h-5 w-5" style={{ color: colors.primary }} />
                    <div>
                      <div className="font-medium" style={{ color: colors.text }}>
                        Mémoire
                      </div>
                      <div 
                        className="text-sm font-semibold"
                        style={{ color: getPerformanceColor(systemData.system.memory_percent, 90) }}
                      >
                        {systemData.system.memory_percent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CircleStackIcon className="h-5 w-5" style={{ color: colors.primary }} />
                    <div>
                      <div className="font-medium" style={{ color: colors.text }}>
                        Disque
                      </div>
                      <div 
                        className="text-sm font-semibold"
                        style={{ color: getPerformanceColor(systemData.system.disk_usage_percent, 90) }}
                      >
                        {systemData.system.disk_usage_percent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="h-5 w-5" style={{ color: colors.primary }} />
                    <div>
                      <div className="font-medium" style={{ color: colors.text }}>
                        Uptime
                      </div>
                      <div className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                        {Math.floor(systemData.system.uptime / 3600)}h
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <WifiIcon className="h-5 w-5" style={{ color: colors.primary }} />
                    <div>
                      <div className="font-medium" style={{ color: colors.text }}>
                        Connexions
                      </div>
                      <div className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                        {systemData.performance.active_connections}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Métriques de performance */}
              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }}
              >
                <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
                  Métriques de Performance
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                      {systemData.performance.requests_per_second.toFixed(1)}
                    </div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      Req/s
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                      {systemData.performance.avg_response_time.toFixed(0)}ms
                    </div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      Temps de réponse
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: colors.success }}>
                      {systemData.performance.cache_hits}
                    </div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      Cache hits
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: colors.warning }}>
                      {systemData.performance.cache_misses}
                    </div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      Cache misses
                    </div>
                  </div>
                </div>
              </div>

              {/* Indicateur de stream */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs" style={{ color: colors.textSecondary }}>
                    Données en temps réel via SSE
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Message si pas de données */}
          {!systemData && !loading && (
            <div className="text-center py-8">
              <ServerIcon className="h-16 w-16 mx-auto mb-4" style={{ color: colors.textSecondary }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
                Aucune donnée système disponible
              </h3>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Le stream système n'est pas connecté ou le backend n'est pas accessible.
              </p>
            </div>
          )}

          {/* Loading système */}
          {loading && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <ArrowPathIcon className="h-8 w-8 mx-auto mb-4 animate-spin" style={{ color: colors.primary }} />
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Chargement des données système...
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Contenu de l'onglet Audit */}
      {activeTab === 'audit' && (
        <>
          {/* Dernière mise à jour */}
          {lastAuditUpdate && (
            <div className="text-xs" style={{ color: colors.textSecondary }}>
              Dernière mise à jour audit : {lastAuditUpdate.toLocaleString('fr-FR')}
            </div>
          )}

          {/* Loading audit */}
          {auditLoading && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <ArrowPathIcon className="h-8 w-8 mx-auto mb-4 animate-spin" style={{ color: colors.primary }} />
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Chargement des données d'audit...
                </p>
              </div>
            </div>
          )}

          {/* Erreur audit */}
          {auditError && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.error + '20' }}>
              <div className="flex items-center space-x-2">
                <XCircleIcon className="h-5 w-5" style={{ color: colors.error }} />
                <div>
                  <div className="font-medium" style={{ color: colors.error }}>
                    Erreur de chargement
                  </div>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>
                    {auditError}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Données d'audit */}
          {auditData && !auditLoading && !auditError && (
            <div className="space-y-6">
              {/* Santé de l'audit */}
              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center space-x-2" style={{ color: colors.text }}>
                    <CheckCircleIcon className="h-5 w-5" style={{ color: colors.primary }} />
                    <span>Santé de l'Audit</span>
                  </h2>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(auditData.health.status)}
                    <span 
                      className="text-sm font-medium"
                      style={{ color: getStatusColor(auditData.health.status) }}
                    >
                      {auditData.health.status === 'healthy' ? 'Opérationnel' : 'Attention'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                      {auditData.health.service}
                    </div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      Service
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                      {auditData.health.version}
                    </div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      Version
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                      {new Date(auditData.health.timestamp).toLocaleString('fr-FR')}
                    </div>
                    <div className="text-xs" style={{ color: colors.textSecondary }}>
                      Timestamp
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations de l'application */}
              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }}
              >
                <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2" style={{ color: colors.text }}>
                  <InformationCircleIcon className="h-5 w-5" style={{ color: colors.primary }} />
                  <span>Informations de l'Application</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <div className="font-medium" style={{ color: colors.text }}>
                      Nom
                    </div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      {auditData.info.name}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium" style={{ color: colors.text }}>
                      Version
                    </div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      {auditData.info.version}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium" style={{ color: colors.text }}>
                      Environnement
                    </div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      {auditData.info.environment}
                    </div>
                  </div>
                </div>

                {/* Fichiers de configuration */}
                <div className="mt-4">
                  <div className="font-medium mb-2" style={{ color: colors.text }}>
                    Fichiers de Configuration
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {Object.entries(auditData.info.config_files).map(([key, exists]) => (
                      <div key={key} className="flex items-center space-x-2">
                        {exists ? (
                          <CheckCircleIcon className="h-4 w-4" style={{ color: colors.success }} />
                        ) : (
                          <XCircleIcon className="h-4 w-4" style={{ color: colors.error }} />
                        )}
                        <span className="text-xs" style={{ color: colors.textSecondary }}>
                          {key.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Statut des tests */}
              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }}
              >
                <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2" style={{ color: colors.text }}>
                  <CodeBracketIcon className="h-5 w-5" style={{ color: colors.primary }} />
                  <span>Statut des Tests</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Tests Backend */}
                  <div>
                    <h3 className="font-medium mb-3" style={{ color: colors.text }}>
                      Tests Backend
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(auditData.tests.backend_tests).map(([key, exists]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: colors.textSecondary }}>
                            {key.replace(/_/g, ' ')}
                          </span>
                          <div style={{ color: getTestStatusColor(exists) }}>
                            {exists ? (
                              <CheckCircleIcon className="h-4 w-4" />
                            ) : (
                              <XCircleIcon className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tests Frontend */}
                  <div>
                    <h3 className="font-medium mb-3" style={{ color: colors.text }}>
                      Tests Frontend
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(auditData.tests.frontend_tests).map(([key, exists]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: colors.textSecondary }}>
                            {key.replace(/_/g, ' ')}
                          </span>
                          <div style={{ color: getTestStatusColor(exists) }}>
                            {exists ? (
                              <CheckCircleIcon className="h-4 w-4" />
                            ) : (
                              <XCircleIcon className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tests d'Intégration */}
                  <div>
                    <h3 className="font-medium mb-3" style={{ color: colors.text }}>
                      Tests d'Intégration
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(auditData.tests.integration_tests).map(([key, exists]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: colors.textSecondary }}>
                            {key.replace(/_/g, ' ')}
                          </span>
                          <div style={{ color: getTestStatusColor(exists) }}>
                            {exists ? (
                              <CheckCircleIcon className="h-4 w-4" />
                            ) : (
                              <XCircleIcon className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statut de la base de données */}
              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }}
              >
                <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2" style={{ color: colors.text }}>
                  <DatabaseIcon className="h-5 w-5" style={{ color: colors.primary }} />
                  <span>Base de Données</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <div style={{ color: auditData.database.connection ? colors.success : colors.error }}>
                      {auditData.database.connection ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : (
                        <XCircleIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: colors.text }}>
                        Connexion
                      </div>
                      <div className="text-sm" style={{ color: colors.textSecondary }}>
                        {auditData.database.connection ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div style={{ color: auditData.database.database_file ? colors.success : colors.error }}>
                      {auditData.database.database_file ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : (
                        <XCircleIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: colors.text }}>
                        Fichier DB
                      </div>
                      <div className="text-sm" style={{ color: colors.textSecondary }}>
                        {auditData.database.database_file ? 'Présent' : 'Absent'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div style={{ color: auditData.database.migrations ? colors.success : colors.warning }}>
                      <CheckCircleIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: colors.text }}>
                        Migrations
                      </div>
                      <div className="text-sm" style={{ color: colors.textSecondary }}>
                        {auditData.database.migrations ? 'OK' : 'À vérifier'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div style={{ color: auditData.database.tables ? colors.success : colors.warning }}>
                      <CheckCircleIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: colors.text }}>
                        Tables
                      </div>
                      <div className="text-sm" style={{ color: colors.textSecondary }}>
                        {auditData.database.tables ? 'OK' : 'À vérifier'}
                      </div>
                    </div>
                  </div>
                </div>

                {auditData.database.error && (
                  <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: colors.error + '20' }}>
                    <div className="text-sm font-medium" style={{ color: colors.error }}>
                      Erreur : {auditData.database.error}
                    </div>
                  </div>
                )}
              </div>

              {/* Configuration d'audit */}
              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }}
              >
                <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2" style={{ color: colors.text }}>
                  <CogIcon className="h-5 w-5" style={{ color: colors.primary }} />
                  <span>Configuration d'Audit</span>
                </h2>
                
                <div className="flex items-center space-x-2 mb-4">
                  <div style={{ color: auditData.config.config ? colors.success : colors.warning }}>
                    {auditData.config.config ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium" style={{ color: colors.text }}>
                      {auditData.config.config ? 'Configuration présente' : 'Configuration manquante'}
                    </div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      Source : {auditData.config.source}
                    </div>
                  </div>
                </div>

                {auditData.config.note && (
                  <div className="p-3 rounded-lg" style={{ backgroundColor: colors.warning + '20' }}>
                    <div className="text-sm" style={{ color: colors.warning }}>
                      {auditData.config.note}
                    </div>
                  </div>
                )}
              </div>

              {/* Structure des fichiers */}
              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }}
              >
                <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2" style={{ color: colors.text }}>
                  <FolderIcon className="h-5 w-5" style={{ color: colors.primary }} />
                  <span>Structure des Fichiers</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(auditData.structure.directories).map(([key, dir]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div style={{ color: dir.exists ? colors.success : colors.error }}>
                          {dir.exists ? (
                            <CheckCircleIcon className="h-4 w-4" />
                          ) : (
                            <XCircleIcon className="h-4 w-4" />
                          )}
                        </div>
                        <span className="font-medium capitalize" style={{ color: colors.text }}>
                          {key}
                        </span>
                      </div>
                      <div className="text-xs" style={{ color: colors.textSecondary }}>
                        {dir.exists ? 'Présent' : 'Absent'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Endpoints disponibles */}
              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }}
              >
                <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2" style={{ color: colors.text }}>
                  <ChartBarIcon className="h-5 w-5" style={{ color: colors.primary }} />
                  <span>Endpoints Disponibles</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3" style={{ color: colors.text }}>
                      Endpoints d'Audit ({Object.keys(auditData.endpoints.audit_endpoints).length})
                    </h3>
                    <div className="space-y-1">
                      {Object.entries(auditData.endpoints.audit_endpoints).map(([key, endpoint]) => (
                        <div key={key} className="text-sm" style={{ color: colors.textSecondary }}>
                          <span className="font-mono">{endpoint}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3" style={{ color: colors.text }}>
                      Endpoints Principaux ({Object.keys(auditData.endpoints.main_application_endpoints).length})
                    </h3>
                    <div className="space-y-1">
                      {Object.entries(auditData.endpoints.main_application_endpoints).map(([key, endpoint]) => (
                        <div key={key} className="text-sm" style={{ color: colors.textSecondary }}>
                          <span className="font-mono">{endpoint}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: colors.primary + '20' }}>
                  <div className="text-sm" style={{ color: colors.primary }}>
                    {auditData.endpoints.note}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Message si pas de données d'audit */}
          {!auditData && !auditLoading && !auditError && (
            <div className="text-center py-8">
              <ChartBarIcon className="h-16 w-16 mx-auto mb-4" style={{ color: colors.textSecondary }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
                Aucune donnée d'audit disponible
              </h3>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Cliquez sur "Actualiser" pour charger les données d'audit.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SystemPanel;
