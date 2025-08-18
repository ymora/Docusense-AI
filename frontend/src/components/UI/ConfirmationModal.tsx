import React from 'react';
import { Modal } from './Modal';
import { useColors } from '../../hooks/useColors';
import { ExclamationTriangleIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'warning',
  icon,
}) => {
  const { colors } = useColors();

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />,
          confirmButton: {
            backgroundColor: '#dc2626',
            color: 'white',
            hoverColor: '#b91c1c'
          }
        };
      case 'warning':
        return {
          icon: <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />,
          confirmButton: {
            backgroundColor: '#f59e0b',
            color: 'white',
            hoverColor: '#d97706'
          }
        };
      case 'info':
        return {
          icon: <CheckIcon className="w-6 h-6 text-blue-400" />,
          confirmButton: {
            backgroundColor: colors.primary,
            color: 'white',
            hoverColor: colors.hover?.primary || colors.primary
          }
        };
      default:
        return {
          icon: <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />,
          confirmButton: {
            backgroundColor: '#f59e0b',
            color: 'white',
            hoverColor: '#d97706'
          }
        };
    }
  };

  const typeStyles = getTypeStyles();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
    >
      <div className="flex flex-col items-center text-center p-6">
        {/* Icône */}
        <div className="mb-4">
          {icon || typeStyles.icon}
        </div>

        {/* Titre */}
        <h3 
          className="text-lg font-semibold mb-2"
          style={{ color: colors.text }}
        >
          {title}
        </h3>

        {/* Message */}
        <p 
          className="text-sm mb-6"
          style={{ color: colors.textSecondary }}
        >
          {message}
        </p>

        {/* Boutons */}
        <div className="flex items-center space-x-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: colors.surface,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              ':hover': {
                backgroundColor: colors.hover?.surface || colors.surface
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.hover?.surface || colors.surface;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.surface;
            }}
          >
            {cancelText}
          </button>
          
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: typeStyles.confirmButton.backgroundColor,
              color: typeStyles.confirmButton.color,
              ':hover': {
                backgroundColor: typeStyles.confirmButton.hoverColor
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = typeStyles.confirmButton.hoverColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = typeStyles.confirmButton.backgroundColor;
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
