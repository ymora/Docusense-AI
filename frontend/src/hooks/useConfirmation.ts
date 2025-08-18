import { useState, useCallback } from 'react';

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
}

export interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const useConfirmation = () => {
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);

  const showConfirmation = useCallback((
    options: ConfirmationOptions,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    setConfirmation({
      ...options,
      isOpen: true,
      onConfirm: () => {
        onConfirm();
        setConfirmation(null);
      },
      onCancel: () => {
        if (onCancel) onCancel();
        setConfirmation(null);
      }
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmation(null);
  }, []);

  return {
    confirmation,
    showConfirmation,
    hideConfirmation
  };
};
