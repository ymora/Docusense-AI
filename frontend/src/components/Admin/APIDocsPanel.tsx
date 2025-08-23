import React from 'react';
import { useColors } from '../../hooks/useColors';
import useAuthStore from '../../stores/authStore';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const APIDocsPanel: React.FC = () => {
  const { colors } = useColors();
  const { isAdmin } = useAuthStore();

  // Vérification des droits d'administration
  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center p-6" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4" style={{ color: colors.warning }} />
          <h2 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
            Accès refusé
          </h2>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Vous devez être administrateur pour accéder à ce panneau.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>

      
      {/* En-tête */}
      <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: colors.border }}>
        <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
          Documentation API
        </h1>
        <span className="text-xs" style={{ color: colors.textSecondary }}>
          Documentation interactive de l'API DocuSense AI
        </span>
      </div>

      {/* Contenu de la documentation */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src="http://localhost:8000/docs"
          title="Documentation API DocuSense AI"
          className="w-full h-full border-0"
          style={{ backgroundColor: colors.background }}
        />
      </div>
    </div>
  );
};

export default APIDocsPanel;
