/**
 * Composant Button réutilisable
 */

import React from 'react';
import { useColors } from '../../hooks/useColors';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  className = '',
  title,
  type = 'button',
  fullWidth = false,
  loading = false
}) => {
  const { colors } = useColors();

  // Couleurs par variant
  const getVariantColors = () => {
    const isLightMode = document.body.getAttribute('data-theme') === 'light';
    
    switch (variant) {
      case 'primary':
        return {
          border: '#3b82f6', // blue-500
          hover: '#1d4ed8', // blue-700
          text: isLightMode ? '#1e40af' : '#ffffff' // blue-700 en mode clair, blanc en mode sombre
        };
      case 'secondary':
        return {
          border: '#6b7280', // gray-500
          hover: '#4b5563', // gray-600
          text: isLightMode ? '#374151' : '#ffffff' // gray-700 en mode clair, blanc en mode sombre
        };
      case 'success':
        return {
          border: '#10b981', // green-500
          hover: '#059669', // green-600
          text: isLightMode ? '#047857' : '#ffffff' // green-700 en mode clair, blanc en mode sombre
        };
      case 'warning':
        return {
          border: '#f59e0b', // amber-500
          hover: '#d97706', // amber-600
          text: isLightMode ? '#b45309' : '#ffffff' // amber-700 en mode clair, blanc en mode sombre
        };
      case 'danger':
        return {
          border: '#ef4444', // red-500
          hover: '#dc2626', // red-600
          text: isLightMode ? '#b91c1c' : '#ffffff' // red-700 en mode clair, blanc en mode sombre
        };
      case 'info':
        return {
          border: '#8b5cf6', // purple-500
          hover: '#7c3aed', // purple-600
          text: isLightMode ? '#6d28d9' : '#ffffff' // purple-700 en mode clair, blanc en mode sombre
        };
      default:
        return {
          border: '#3b82f6',
          hover: '#1d4ed8',
          text: isLightMode ? '#1e40af' : '#ffffff'
        };
    }
  };

  // Tailles par défaut
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'px-2 py-1 text-xs';
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2 text-sm';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const variantColors = getVariantColors();
  const sizeClasses = getSizeClasses();

  const baseClasses = `
    inline-flex items-center justify-center gap-2
    border rounded-lg font-medium
    transition-all duration-300 ease-in-out
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = `
    bg-transparent
    border
    text-white
    hover:shadow-lg hover:scale-105
    active:scale-95
  `;

  // Classes pour les icônes avec animations
  const iconClasses = `transition-transform duration-200 ${
    iconPosition === 'left' ? 'mr-2' : 'ml-2'
  }`;

  // Classes pour les icônes avec animations spécifiques selon le variant
  const getIconAnimationClasses = () => {
    // Suppression des rotations pour un rendu plus professionnel
    return '';
  };

  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses}
    ${variantClasses}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
      style={{ 
        borderColor: variantColors.border, 
        color: variantColors.text, 
        backgroundColor: 'transparent' 
      }}
      title={title}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <div className={`${iconClasses} ${getIconAnimationClasses()}`}>
          {icon}
        </div>
      )}
      
      <div className="transition-transform duration-200">
        {children}
      </div>
      
      {icon && iconPosition === 'right' && !loading && (
        <div className={`${iconClasses} ${getIconAnimationClasses()}`}>
          {icon}
        </div>
      )}
    </button>
  );
};

// Composant spécialisé pour les actions d'icônes (comme dans UtilityActions)
export const IconButton: React.FC<Omit<ButtonProps, 'children'> & {
  icon: React.ReactNode;
  tooltip?: string;
}> = ({ icon, tooltip, variant = 'primary', size = 'md', className = '', ...props }) => {
  const { colors } = useColors();

  // Couleurs par variant pour les icônes
  const getIconVariantColors = () => {
    const isLightMode = document.body.getAttribute('data-theme') === 'light';
    
    switch (variant) {
      case 'primary':
        return {
          border: '#3b82f6', // blue-500
          hover: '#1d4ed8', // blue-700
          text: isLightMode ? '#1e40af' : '#ffffff' // blue-700 en mode clair, blanc en mode sombre
        };
      case 'secondary':
        return {
          border: '#6b7280', // gray-500
          hover: '#4b5563', // gray-600
          text: isLightMode ? '#374151' : '#ffffff' // gray-700 en mode clair, blanc en mode sombre
        };
      case 'success':
        return {
          border: '#10b981', // green-500
          hover: '#059669', // green-600
          text: isLightMode ? '#047857' : '#ffffff' // green-700 en mode clair, blanc en mode sombre
        };
      case 'warning':
        return {
          border: '#f59e0b', // amber-500
          hover: '#d97706', // amber-600
          text: isLightMode ? '#b45309' : '#ffffff' // amber-700 en mode clair, blanc en mode sombre
        };
      case 'danger':
        return {
          border: '#ef4444', // red-500
          hover: '#dc2626', // red-600
          text: isLightMode ? '#b91c1c' : '#ffffff' // red-700 en mode clair, blanc en mode sombre
        };
      case 'info':
        return {
          border: '#8b5cf6', // purple-500
          hover: '#7c3aed', // purple-600
          text: isLightMode ? '#6d28d9' : '#ffffff' // purple-700 en mode clair, blanc en mode sombre
        };
      default:
        return {
          border: '#3b82f6',
          hover: '#1d4ed8',
          text: isLightMode ? '#1e40af' : '#ffffff'
        };
    }
  };

  // Classes de base pour les boutons d'icône
  const iconBaseClasses = `
    inline-flex items-center justify-center
    border-2 rounded-lg font-medium
    transition-all duration-300 ease-in-out
    disabled:opacity-50 disabled:cursor-not-allowed
    hover:shadow-lg
    active:scale-95
  `;

  // Tailles pour les boutons d'icône
  const sizeClasses = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  // Tailles d'icônes
  const iconSizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // Classes de variant pour les boutons d'icône
  const variantClasses = `
    bg-transparent text-white
    hover:shadow-lg
    active:scale-95
  `;

  // Classes pour les icônes avec animations
  const iconClasses = `transition-transform duration-200`;

  // Classes pour les icônes avec animations spécifiques selon le variant
  const getIconAnimationClasses = () => {
    // Suppression des rotations pour un rendu plus professionnel
    return '';
  };

  const variantColors = getIconVariantColors();
  const buttonClasses = `
    ${iconBaseClasses}
    ${sizeClasses[size]}
    ${variantClasses}
    ${className}
  `.trim();

  return (
    <button
      {...props}
      className={buttonClasses}
      style={{ 
        borderColor: variantColors.border, 
        color: variantColors.text, 
        backgroundColor: 'transparent' 
      }}
      title={tooltip}
    >
      <div className={`${iconClasses} ${iconSizeClasses[size]} ${getIconAnimationClasses()}`}>
        {icon}
      </div>
    </button>
  );
};

export default Button;