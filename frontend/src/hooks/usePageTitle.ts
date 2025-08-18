import { useEffect } from 'react';

export const usePageTitle = (title?: string) => {
  useEffect(() => {
    const baseTitle = 'DocuSense AI';
    const newTitle = title ? `${title} - ${baseTitle}` : baseTitle;
    
    // Sauvegarder l'ancien titre
    const previousTitle = document.title;
    
    // Définir le nouveau titre
    document.title = newTitle;
    
    // Restaurer l'ancien titre quand le composant se démonte
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};
