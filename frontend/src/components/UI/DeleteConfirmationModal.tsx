import React from 'react';
import { TrashIcon, ExclamationTriangleIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { Modal } from './Modal';
import { Button } from './Button';
import { useColors } from '../../hooks/useColors';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  items: Array<{
    id: number;
    name: string;
    type: string;
    hasPDF?: boolean;
  }>;
  isLoading?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  items,
  isLoading = false
}) => {
  const { colors } = useColors();
  const isMultiple = items.length > 1;

  const getTitle = () => {
    if (isMultiple) {
      return `Supprimer ${items.length} analyse${items.length > 1 ? 's' : ''}`;
    }
    return 'Supprimer l\'analyse';
  };

  const getDescription = () => {
    if (isMultiple) {
      return `Êtes-vous sûr de vouloir supprimer ${items.length} analyse${items.length > 1 ? 's' : ''} ?`;
    }
    return 'Êtes-vous sûr de vouloir supprimer cette analyse ?';
  };

  const getWarningText = () => {
    const pdfCount = items.filter(item => item.hasPDF).length;
    const hasPDFs = pdfCount > 0;
    
    if (isMultiple) {
      if (hasPDFs) {
        return `Cette action supprimera définitivement ${items.length} analyse${items.length > 1 ? 's' : ''} de la base de données et ${pdfCount} rapport${pdfCount > 1 ? 's' : ''} PDF associé${pdfCount > 1 ? 's' : ''}. Les fichiers sources ne seront pas affectés.`;
      }
      return `Cette action supprimera définitivement ${items.length} analyse${items.length > 1 ? 's' : ''} de la base de données et tous les rapports PDF associés. Les fichiers sources ne seront pas affectés.`;
    } else {
      if (hasPDFs) {
        return 'Cette action supprimera définitivement l\'analyse de la base de données et le rapport PDF associé. Le fichier source ne sera pas affecté.';
      }
      return 'Cette action supprimera définitivement l\'analyse de la base de données et tous les rapports PDF associés. Le fichier source ne sera pas affecté.';
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      size="md"
      showCloseButton={true}
    >
      <div className="space-y-4">
        {/* Icône d'avertissement */}
        <div className="flex justify-center">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.error + '20' }}
          >
            <ExclamationTriangleIcon 
              className="w-8 h-8" 
              style={{ color: colors.error }}
            />
          </div>
        </div>

        {/* Description */}
        <div className="text-center">
          <p className="text-sm" style={{ color: colors.text }}>
            {getDescription()}
          </p>
        </div>

        {/* Avertissement détaillé */}
        <div 
          className="p-3 rounded-lg border-l-4"
          style={{ 
            backgroundColor: colors.error + '10',
            borderLeftColor: colors.error
          }}
        >
          <p className="text-sm" style={{ color: colors.text }}>
            {getWarningText()}
          </p>
        </div>

        {/* Liste des éléments à supprimer (si multiple) */}
        {isMultiple && (
          <div className="max-h-32 overflow-y-auto">
            <p className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
              Analyses à supprimer :
            </p>
            <div className="space-y-1">
              {items.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded text-xs"
                  style={{ backgroundColor: colors.hover.surface }}
                >
                  <DocumentIcon className="w-3 h-3" style={{ color: colors.textSecondary }} />
                  <span style={{ color: colors.text }}>
                    {item.name || `Analyse #${item.id}`}
                  </span>
                  {item.hasPDF && (
                    <span 
                      className="px-1 py-0.5 rounded text-xs"
                      style={{ 
                        backgroundColor: colors.error + '20',
                        color: colors.error
                      }}
                    >
                      PDF
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: colors.border }}>
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            variant="danger"
            icon={<TrashIcon className="w-4 h-4" />}
            loading={isLoading}
          >
            {isLoading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
