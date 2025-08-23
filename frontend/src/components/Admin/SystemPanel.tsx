import React, { useState, useEffect } from 'react';
import { useColors } from '../../hooks/useColors';
import { useBackendConnection } from '../../hooks/useBackendConnection';
import { useStreamService } from '../../hooks/useStreamService';
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
  DatabaseIcon
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

const SystemPanel: React.FC = () => {
  const { colors } = useColors();
  const { isOnline } = useBackendConnection();
  const { isAdmin } = useAuthStore();
  const { startStream, stopStream } = useStreamService();
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

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

    return () => {
      stopStream('system');
    };
  }, [isOnline, isAdmin, startStream, stopStream]);

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
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}j ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value <= threshold * 0.7) return colors.success;
    if (value <= threshold * 0.9) return colors.warning;
    return colors.error;
  };

  // Vérification des droits d'administration
  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center p-6" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4" style={{ color: colors.warning }} />
          <h2 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
            Accès refusé
          </h2>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Vous devez être administrateur pour accéder à ce panneau.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6" style={{ backgroundColor: colors.background }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
              Administration Système
            </h1>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Monitoring et santé du backend DocuSense AI
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: isOnline ? colors.success : colors.error }}
              ></div>
              <span className="text-sm" style={{ color: colors.textSecondary }}>
                {isOnline ? 'Connecté' : 'Déconnecté'}
              </span>
            </div>
            {lastUpdate && (
              <div className="text-sm" style={{ color: colors.textSecondary }}>
                Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Indicateur de chargement */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: colors.primary }}></div>
            <p className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
              Connexion au stream système...
            </p>
          </div>
        )}

        {/* Métriques système */}
        {systemData && (
          <>
            {/* Santé générale */}
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
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      {formatUptime(systemData.system.uptime)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <DatabaseIcon className="h-5 w-5" style={{ color: colors.primary }} />
                  <div>
                    <div className="font-medium" style={{ color: colors.text }}>
                      Processus
                    </div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      {systemData.system.process_count}
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
                Performance Réseau
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                    {systemData.performance.requests_per_second.toFixed(1)}
                  </div>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>
                    Requêtes/sec
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
                  <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                    {systemData.performance.active_connections}
                  </div>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>
                    Connexions actives
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
      </div>
    </div>
  );
};

export default SystemPanel;
