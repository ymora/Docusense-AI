import { useConfirmDialog } from './useConfirmDialog';

export const useSimpleConfirm = () => {
  const { confirm, confirmDelete, confirmAction } = useConfirmDialog();

  const simpleConfirm = (
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
    // Simplifier le message si nécessaire
    const simpleMessage = message.replace('Êtes-vous sûr de vouloir ', '');
    
    confirm(
      simpleMessage,
      onConfirm,
      onCancel,
      {
        title: options?.title || 'Confirmer',
        type: options?.type || 'warning',
        confirmText: options?.confirmText || 'Oui',
        cancelText: options?.cancelText || 'Non'
      }
    );
  };

  const simpleDelete = (
    itemName: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    confirmDelete(
      itemName,
      onConfirm,
      onCancel
    );
  };

  const simpleAction = (
    action: string,
    itemName: string,
    onConfirm: () => void,
    onCancel?: () => void,
    type: 'danger' | 'warning' | 'info' = 'warning'
  ) => {
    confirmAction(
      action,
      itemName,
      onConfirm,
      onCancel,
      type
    );
  };

  return {
    simpleConfirm,
    simpleDelete,
    simpleAction
  };
};
