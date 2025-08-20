import React from 'react';
import { Database, FileText, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface StatusCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatusCard: React.FC<StatusCardProps> = ({ title, value, icon, color, subtitle }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="text-gray-400 dark:text-gray-500">
          {icon}
        </div>
      </div>
    </div>
  );
};

interface StatusOverviewProps {
  status: {
    total_files: number;
    total_analyses: number;
    total_queue_items: number;
    consistency_report: {
      valid_files: number;
      invalid_statuses: number;
      orphaned_files: number;
      missing_mime_types: number;
    };
  };
}

export const StatusOverview: React.FC<StatusOverviewProps> = ({ status }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatusCard
        title="Fichiers"
        value={status.total_files}
        icon={<Database size={24} />}
        color="border-blue-500"
        subtitle={`${status.consistency_report.valid_files} valides`}
      />
      
      <StatusCard
        title="Analyses"
        value={status.total_analyses}
        icon={<FileText size={24} />}
        color="border-green-500"
      />
      
      <StatusCard
        title="Tâches de Queue"
        value={status.total_queue_items}
        icon={<Clock size={24} />}
        color="border-yellow-500"
      />
      
      <StatusCard
        title="Problèmes"
        value={status.consistency_report.invalid_statuses + status.consistency_report.orphaned_files}
        icon={<AlertTriangle size={24} />}
        color="border-red-500"
        subtitle={`${status.consistency_report.orphaned_files} orphelins`}
      />
    </div>
  );
};

export default StatusCard;
