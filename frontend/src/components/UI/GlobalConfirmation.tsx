import React from 'react';
import { ConfirmationModal } from './ConfirmationModal';
import { useConfirmationContext } from '../../contexts/ConfirmationContext';

export const GlobalConfirmation: React.FC = () => {
  const { confirmation, hideConfirmation } = useConfirmationContext();

  if (!confirmation) return null;

  return (
    <ConfirmationModal
      isOpen={confirmation.isOpen}
      onClose={hideConfirmation}
      onConfirm={confirmation.onConfirm}
      title={confirmation.title}
      message={confirmation.message}
      confirmText={confirmation.confirmText}
      cancelText={confirmation.cancelText}
      type={confirmation.type}
      icon={confirmation.icon}
    />
  );
};
