import { useConfirmationContext } from '../contexts/ConfirmationContext';

export const useConfirmDialog = () => {
  const { showConfirmation } = useConfirmationContext();

  const confirm = (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    options?: {
      title?: string;
      type?: 'danger' | 'warning' | 'info';
      confirmText?: string;
      cancelText?: string;
    }
  ) => {
    showConfirmation(
      {
        title: options?.title || 'Confirmer',
        message,
        type: options?.type || 'warning',
        confirmText: options?.confirmText || 'Confirmer',
        cancelText: options?.cancelText || 'Annuler',
      },
      onConfirm,
      onCancel
    );
  };

  const confirmDelete = (
    itemName: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    confirm(
      `Supprimer ${itemName} ?`,
      onConfirm,
      onCancel,
      {
        title: 'Supprimer',
        type: 'danger',
        confirmText: 'Oui',
        cancelText: 'Non'
      }
    );
  };

  const confirmAction = (
    action: string,
    itemName: string,
    onConfirm: () => void,
    onCancel?: () => void,
    type: 'danger' | 'warning' | 'info' = 'warning'
  ) => {
    confirm(
      `${action.charAt(0).toUpperCase() + action.slice(1)} ${itemName} ?`,
      onConfirm,
      onCancel,
      {
        title: action.charAt(0).toUpperCase() + action.slice(1),
        type,
        confirmText: 'Oui',
        cancelText: 'Non'
      }
    );
  };

  return {
    confirm,
    confirmDelete,
    confirmAction
  };
};
