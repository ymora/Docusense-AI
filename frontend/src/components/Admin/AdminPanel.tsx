import React, { useState, useEffect } from 'react';
import { useColors } from '../../hooks/useColors';
import { useBackendConnection } from '../../hooks/useBackendConnection';
import { useAdminService } from '../../hooks/useAdminService';
import { logService } from '../../services/logService';
import useAuthStore from '../../stores/authStore';

import {
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface SystemMetrics {
  cpu_percent: number;
  memory_percent: number;
  disk_usage_percent: number;
  uptime: number;
  process_count: number;
}

interface HealthData {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  timestamp: string;
  system: SystemMetrics;
  database: {
    status: string;
    url: string;
  };
  features: {
    ocr_enabled: boolean;
    cache_enabled: boolean;
    compression_enabled: boolean;
    rate_limit_enabled: boolean;
  };
}

const AdminPanel: React.FC = () => {
  const { colors } = useColors();
  const { isOnline, errorMessage, responseTime, lastCheck, consecutiveFailures } = useBackendConnection();
  const { isAdmin } = useAuthStore();
  const adminService = useAdminService();
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchHealthData = async () => {
    if (!isOnline) return;
    
    try {
      setLoading(true);
      const response = await adminService.getDetailedHealth();
      if (response.success) {
        setHealthData(response.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      logService.error('Erreur lors de la récupération des données de santé', 'AdminPanel', { error });
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceData = async () => {
    if (!isOnline) return;
    
    try {
      const response = await adminService.getPerformanceMetrics();
      if (response.success) {
        setPerformanceData(response.data);
      }
    } catch (error) {
      logService.error('Erreur lors de la récupération des métriques de performance', 'AdminPanel', { error });
    }
  };

  useEffect(() => {
    if (isOnline) {
      fetchHealthData();
      fetchPerformanceData();
    }
  }, [isOnline]);

  // Actualisation automatique toutes les 30 secondes
  useEffect(() => {
    if (!isOnline) return;
    
    const interval = setInterval(() => {
      fetchHealthData();
      fetchPerformanceData();
    }, 30000);

    return () => clearInterval(interval);
  }, [isOnline]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'online':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
      case 'offline':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'online':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'error':
      case 'offline':
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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




        {/* Métriques système */}
        {healthData && (
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
              Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3">
                <CpuChipIcon className="h-5 w-5" style={{ color: colors.primary }} />
                <div>
                  <div className="font-medium" style={{ color: colors.text }}>
                    CPU
                  </div>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>
                    {healthData.system?.cpu_percent?.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <ServerIcon className="h-5 w-5" style={{ color: colors.primary }} />
                <div>
                  <div className="font-medium" style={{ color: colors.text }}>
                    Mémoire
                  </div>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>
                    {healthData.system?.memory_percent?.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CircleStackIcon className="h-5 w-5" style={{ color: colors.primary }} />
                <div>
                  <div className="font-medium" style={{ color: colors.text }}>
                    Disque
                  </div>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>
                    {healthData.system?.disk_usage_percent?.toFixed(1)}%
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
                    {healthData.system?.uptime ? formatUptime(healthData.system.uptime) : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informations de l'application */}
        {healthData && (
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
              Application
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3" style={{ color: colors.text }}>Général</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: colors.textSecondary }}>Application:</span>
                    <span style={{ color: colors.text }}>{healthData.app_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: colors.textSecondary }}>Version:</span>
                    <span style={{ color: colors.text }}>{healthData.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: colors.textSecondary }}>Environnement:</span>
                    <span style={{ color: colors.text }}>{healthData.environment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: colors.textSecondary }}>Dernière vérification:</span>
                    <span style={{ color: colors.text }}>
                      {new Date(healthData.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-3" style={{ color: colors.text }}>Fonctionnalités</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(healthData.features).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span style={{ color: colors.textSecondary }}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                      </span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(value ? 'healthy' : 'error')}
                        <span style={{ color: getStatusColor(value ? 'healthy' : 'error') }}>
                          {value ? 'Activé' : 'Désactivé'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Base de données */}
        {healthData && (
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
              Base de Données
            </h2>
            <div className="flex items-center space-x-3">
              {getStatusIcon(healthData.database.status)}
              <div>
                <div className="font-medium" style={{ color: colors.text }}>
                  Statut: {healthData.database.status}
                </div>
                <div className="text-sm" style={{ color: colors.textSecondary }}>
                  {healthData.database.url}
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default AdminPanel;
