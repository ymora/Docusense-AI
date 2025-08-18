import React, { createContext, useContext, ReactNode } from 'react';
import { useConfirmation, ConfirmationOptions, ConfirmationState } from '../hooks/useConfirmation';

interface ConfirmationContextType {
  confirmation: ConfirmationState | null;
  showConfirmation: (
    options: ConfirmationOptions,
    onConfirm: () => void,
    onCancel?: () => void
  ) => void;
  hideConfirmation: () => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const useConfirmationContext = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmationContext must be used within a ConfirmationProvider');
  }
  return context;
};

interface ConfirmationProviderProps {
  children: ReactNode;
}

export const ConfirmationProvider: React.FC<ConfirmationProviderProps> = ({ children }) => {
  const { confirmation, showConfirmation, hideConfirmation } = useConfirmation();

  return (
    <ConfirmationContext.Provider value={{ confirmation, showConfirmation, hideConfirmation }}>
      {children}
    </ConfirmationContext.Provider>
  );
};
