import { useEffect, useState } from 'react';

/**
 * Hook personnalisé pour gérer la hauteur de l'écran de manière professionnelle
 * Gère les barres d'adresse mobiles, les barres de navigation, etc.
 */
export const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState('100vh');

  useEffect(() => {
    const updateHeight = () => {
      // Obtenir la hauteur réelle de l'écran
      const vh = window.innerHeight * 0.01;
      
      // Calculer une hauteur ajustée pour la barre des tâches Windows (environ 40px)
      const adjustedHeight = window.innerHeight - 40;
      const adjustedVh = adjustedHeight * 0.01;
      
      // Définir la variable CSS personnalisée
      document.documentElement.style.setProperty('--vh', `${adjustedVh}px`);
      document.documentElement.style.setProperty('--app-height', `${adjustedHeight}px`);
      
      // Mettre à jour l'état
      setViewportHeight(`${adjustedHeight}px`);
    };

    // Mise à jour initiale
    updateHeight();

    // Écouter les changements de taille d'écran
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);

    // Écouter les changements de visibilité (pour les barres d'adresse mobiles)
    document.addEventListener('visibilitychange', updateHeight);

    // Nettoyage
    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
      document.removeEventListener('visibilitychange', updateHeight);
    };
  }, []);

  return viewportHeight;
};

/**
 * Hook pour obtenir la hauteur disponible (en excluant les barres de navigation)
 */
export const useAvailableHeight = (offset = 0) => {
  const [availableHeight, setAvailableHeight] = useState('100vh');

  useEffect(() => {
    const updateAvailableHeight = () => {
      const height = window.innerHeight - offset;
      setAvailableHeight(`${height}px`);
    };

    updateAvailableHeight();
    window.addEventListener('resize', updateAvailableHeight);
    window.addEventListener('orientationchange', updateAvailableHeight);

    return () => {
      window.removeEventListener('resize', updateAvailableHeight);
      window.removeEventListener('orientationchange', updateAvailableHeight);
    };
  }, [offset]);

  return availableHeight;
}; 