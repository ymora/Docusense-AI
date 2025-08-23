import React from 'react';
import { useColors } from '../../hooks/useColors';
import { 
  DocumentTextIcon,
  ChartBarIcon,
  CpuChipIcon,
  CloudIcon,
  BeakerIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  EyeIcon,
  UserIcon,
  DocumentMagnifyingGlassIcon,
  QueueListIcon,
  SparklesIcon,
  // BrainIcon n'existe pas dans @heroicons/react/24/outline
  DocumentChartBarIcon,
  ArchiveBoxIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

interface IconProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

// Icônes principales de l'application
export const AppIcons = {
  // Analyse de documents
  DocumentAnalysis: ({ className = '', size = 'md', color }: IconProps) => {
    const { colors } = useColors();
    const sizeClasses = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8'
    };
    
    return (
      <DocumentMagnifyingGlassIcon 
        className={`${sizeClasses[size]} ${className}`}
        style={{ color: color || colors.primary }}
      />
    );
  },

  // IA et Intelligence
  AI: ({ className = '', size = 'md', color }: IconProps) => {
    const { colors } = useColors();
    const sizeClasses = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8'
    };
    
    return (
             <CpuChipIcon 
        className={`${sizeClasses[size]} ${className}`}
        style={{ color: color || '#8b5cf6' }}
      />
    );
  },

  // Queue et traitement
  Queue: ({ className = '', size = 'md', color }: IconProps) => {
    const { colors } = useColors();
    const sizeClasses = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8'
    };
    
    return (
      <QueueListIcon 
        className={`${sizeClasses[size]} ${className}`}
        style={{ color: color || colors.primary }}
      />
    );
  },

  // Statistiques et analyses
  Analytics: ({ className = '', size = 'md', color }: IconProps) => {
    const { colors } = useColors();
    const sizeClasses = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8'
    };
    
    return (
      <ChartBarIcon 
        className={`${sizeClasses[size]} ${className}`}
        style={{ color: color || '#10b981' }}
      />
    );
  },

  // Documents
  Document: ({ className = '', size = 'md', color }: IconProps) => {
    const { colors } = useColors();
    const sizeClasses = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8'
    };
    
    return (
      <DocumentTextIcon 
        className={`${sizeClasses[size]} ${className}`}
        style={{ color: color || colors.text }}
      />
    );
  },

  // Recherche
  Search: ({ className = '', size = 'md', color }: IconProps) => {
    const { colors } = useColors();
    const sizeClasses = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8'
    };
    
    return (
      <MagnifyingGlassIcon 
        className={`${sizeClasses[size]} ${className}`}
        style={{ color: color || colors.textSecondary }}
      />
    );
  },

  // Dossier
  Folder: ({ className = '', size = 'md', color }: IconProps) => {
    const { colors } = useColors();
    const sizeClasses = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8'
    };
    
    return (
      <FolderIcon 
        className={`${sizeClasses[size]} ${className}`}
        style={{ color: color || '#f59e0b' }}
      />
    );
  },

  // Paramètres
  Settings: ({ className = '', size = 'md', color }: IconProps) => {
    const { colors } = useColors();
    const sizeClasses = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8'
    };
    
    return (
      <Cog6ToothIcon 
        className={`${sizeClasses[size]} ${className}`}
        style={{ color: color || colors.textSecondary }}
      />
    );
  },

  // Utilisateurs
  Users: ({ className = '', size = 'md', color }: IconProps) => {
    const { colors } = useColors();
    const sizeClasses = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8'
    };
    
    return (
      <UserGroupIcon 
        className={`${sizeClasses[size]} ${className}`}
        style={{ color: color || colors.primary }}
      />
    );
  },

  // Rôles utilisateurs
  RoleIcons: {
    Admin: ({ className = '', size = 'md' }: IconProps) => {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
      };
      
      return (
        <ShieldCheckIcon 
          className={`${sizeClasses[size]} ${className}`}
          style={{ color: '#10b981' }}
        />
      );
    },

    User: ({ className = '', size = 'md' }: IconProps) => {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
      };
      
      return (
        <UserIcon 
          className={`${sizeClasses[size]} ${className}`}
          style={{ color: '#3b82f6' }}
        />
      );
    },

    Guest: ({ className = '', size = 'md' }: IconProps) => {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
      };
      
      return (
        <EyeIcon 
          className={`${sizeClasses[size]} ${className}`}
          style={{ color: '#6b7280' }}
        />
      );
    }
  },

  // États et statuts
  Status: {
    Success: ({ className = '', size = 'md' }: IconProps) => {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
      };
      
      return (
        <CheckCircleIcon 
          className={`${sizeClasses[size]} ${className}`}
          style={{ color: '#10b981' }}
        />
      );
    },

    Warning: ({ className = '', size = 'md' }: IconProps) => {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
      };
      
      return (
        <ExclamationTriangleIcon 
          className={`${sizeClasses[size]} ${className}`}
          style={{ color: '#f59e0b' }}
        />
      );
    },

    Error: ({ className = '', size = 'md' }: IconProps) => {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
      };
      
      return (
        <XCircleIcon 
          className={`${sizeClasses[size]} ${className}`}
          style={{ color: '#ef4444' }}
        />
      );
    },

    Info: ({ className = '', size = 'md' }: IconProps) => {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
      };
      
      return (
        <InformationCircleIcon 
          className={`${sizeClasses[size]} ${className}`}
          style={{ color: '#3b82f6' }}
        />
      );
    },

    Question: ({ className = '', size = 'md' }: IconProps) => {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
      };
      
      return (
        <QuestionMarkCircleIcon 
          className={`${sizeClasses[size]} ${className}`}
          style={{ color: '#6b7280' }}
        />
      );
    }
  },

  // Actions
  Actions: {
    Play: ({ className = '', size = 'md' }: IconProps) => {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
      };
      
      return (
        <PlayIcon 
          className={`${sizeClasses[size]} ${className}`}
          style={{ color: '#10b981' }}
        />
      );
    },

    Pause: ({ className = '', size = 'md' }: IconProps) => {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
      };
      
      return (
        <PauseIcon 
          className={`${sizeClasses[size]} ${className}`}
          style={{ color: '#f59e0b' }}
        />
      );
    },

    Stop: ({ className = '', size = 'md' }: IconProps) => {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
      };
      
      return (
        <StopIcon 
          className={`${sizeClasses[size]} ${className}`}
          style={{ color: '#ef4444' }}
        />
      );
    },

    Refresh: ({ className = '', size = 'md' }: IconProps) => {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
      };
      
      return (
        <ArrowPathIcon 
          className={`${sizeClasses[size]} ${className}`}
          style={{ color: '#3b82f6' }}
        />
      );
    },

    Delete: ({ className = '', size = 'md' }: IconProps) => {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
      };
      
      return (
        <TrashIcon 
          className={`${sizeClasses[size]} ${className}`}
          style={{ color: '#ef4444' }}
        />
      );
    },

    Add: ({ className = '', size = 'md' }: IconProps) => {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
      };
      
      return (
        <PlusIcon 
          className={`${sizeClasses[size]} ${className}`}
          style={{ color: '#10b981' }}
        />
      );
    },

    Remove: ({ className = '', size = 'md' }: IconProps) => {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
      };
      
      return (
        <MinusIcon 
          className={`${sizeClasses[size]} ${className}`}
          style={{ color: '#ef4444' }}
        />
      );
    }
  },

  // Navigation
  Navigation: {
    ChevronDown: ({ className = '', size = 'md' }: IconProps) => {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
      };
      
      return (
        <ChevronDownIcon 
          className={`${sizeClasses[size]} ${className}`}
          style={{ color: '#6b7280' }}
        />
      );
    },

    ChevronUp: ({ className = '', size = 'md' }: IconProps) => {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
      };
      
      return (
        <ChevronUpIcon 
          className={`${sizeClasses[size]} ${className}`}
          style={{ color: '#6b7280' }}
        />
      );
    },

    ChevronLeft: ({ className = '', size = 'md' }: IconProps) => {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
      };
      
      return (
        <ChevronLeftIcon 
          className={`${sizeClasses[size]} ${className}`}
          style={{ color: '#6b7280' }}
        />
      );
    },

    ChevronRight: ({ className = '', size = 'md' }: IconProps) => {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
      };
      
      return (
        <ChevronRightIcon 
          className={`${sizeClasses[size]} ${className}`}
          style={{ color: '#6b7280' }}
        />
      );
    }
  }
};

export default AppIcons;
