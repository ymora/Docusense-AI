/**
 * Composant Modal réutilisable
 */

import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useColors } from '../../hooks/useColors';
import { IconButton } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className,
}) => {
  const { colors } = useColors();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {return null;}

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 transition-opacity"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={clsx(
            'relative rounded-lg shadow-xl w-full border transition-all duration-300 ease-in-out',
            sizeClasses[size],
            className,
          )}
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div 
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: colors.border }}
            >
              {title && (
                <h3 
                  className="text-lg font-semibold"
                  style={{ color: colors.text }}
                >
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <IconButton
                  icon={<XMarkIcon />}
                  onClick={onClose}
                  variant="secondary"
                  size="sm"
                  tooltip="Fermer"
                  className="transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-lg active:scale-95"
                />
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};