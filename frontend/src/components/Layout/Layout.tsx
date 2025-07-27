import React, { useState, useEffect } from 'react';
import LeftPanel from './LeftPanel';
import MainPanel from './MainPanel';
import SelectionIndicator from '../UI/SelectionIndicator';
import { useUIStore } from '../../stores/uiStore';
import { useQueueStore } from '../../stores/queueStore';
import { useFileStore } from '../../stores/fileStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const {
    sidebarWidth,
    setSidebarWidth,
  } = useUIStore();
  const { queueStatus, loadQueueStatus } = useQueueStore();
  const { files, getAnalysisStats } = useFileStore();
  const [isResizing, setIsResizing] = useState(false);
  const [activePanel, setActivePanel] = useState<'main' | 'config' | 'queue' | 'analyses'>('main');

  // Charger le statut de la queue au montage et toutes les 5 secondes
  useEffect(() => {
    loadQueueStatus();
    const interval = setInterval(loadQueueStatus, 5000);
    return () => clearInterval(interval);
  }, [loadQueueStatus]);

  // Obtenir les statistiques des analyses en temps réel
  const analysisStats = getAnalysisStats();

  // Surveiller les changements de statut des analyses
  useEffect(() => {
    // Les statistiques se mettent à jour automatiquement grâce à getAnalysisStats()
    // qui est appelé à chaque rendu et utilise les données en temps réel
  }, [files, queueStatus]); // Se déclenche quand les fichiers ou le statut de la queue changent

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleResize = (e: MouseEvent) => {
    if (!isResizing) {return;}

    const newWidth = e.clientX;
    const minWidth = 250;
    const maxWidth = 800;

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth);
    }
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  // Fonction pour calculer la largeur nécessaire pour le nom le plus long
  const calculateOptimalWidth = () => {
    try {
      // Créer un élément temporaire pour mesurer le texte
      const tempElement = document.createElement('span');
      tempElement.style.visibility = 'hidden';
      tempElement.style.position = 'absolute';
      tempElement.style.whiteSpace = 'nowrap';
      tempElement.style.fontSize = '14px'; // Taille de police approximative
      tempElement.style.fontFamily = 'Inter, sans-serif';
      document.body.appendChild(tempElement);

      let maxWidth = 0;

      // Mesurer les noms de fichiers
      if (files && files.length > 0) {
        files.forEach(file => {
          tempElement.textContent = file.name;
          const width = tempElement.offsetWidth;
          maxWidth = Math.max(maxWidth, width);
        });
      }

      // Mesurer les noms de dossiers (si disponibles via le DOM)
      const folderElements = document.querySelectorAll('.left-panel-container .text-sm.truncate');
      folderElements.forEach(element => {
        const text = element.textContent;
        if (text) {
          tempElement.textContent = text;
          const width = tempElement.offsetWidth;
          maxWidth = Math.max(maxWidth, width);
        }
      });

      // Ajouter de l'espace pour les icônes, padding, etc.
      const padding = 100; // Espace pour icônes, padding, scrollbar, etc.
      const optimalWidth = maxWidth + padding;

      // Nettoyer l'élément temporaire
      document.body.removeChild(tempElement);

      // Limiter la largeur entre min et max
      const minWidth = 250;
      const maxWidthLimit = 800;
      return Math.max(minWidth, Math.min(maxWidthLimit, optimalWidth));
    } catch (error) {
      console.warn('Erreur lors du calcul de la largeur optimale:', error);
      // Retourner une largeur par défaut en cas d'erreur
      return 400;
    }
  };

  // Fonction pour redimensionner automatiquement
  const handleAutoResize = () => {
    const optimalWidth = calculateOptimalWidth();
    setSidebarWidth(optimalWidth);
  };

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);

      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing]);

  // Gestion des boutons (maintenant gérés via événements depuis LeftPanel)
  const handleAnalysesButtonClick = () => {
    setActivePanel(activePanel === 'analyses' ? 'main' : 'analyses');
  };

  // Écouter les événements personnalisés depuis le LeftPanel
  useEffect(() => {
    const handleConfigButtonClick = () => {
      const newPanel = activePanel === 'config' ? 'main' : 'config';
      setActivePanel(newPanel);
      // Émettre l'événement de changement d'état
      window.dispatchEvent(new CustomEvent('panelStateChange', { detail: { panel: newPanel } }));
    };

    const handleQueueButtonClick = () => {
      const newPanel = activePanel === 'queue' ? 'main' : 'queue';
      setActivePanel(newPanel);
      // Émettre l'événement de changement d'état
      window.dispatchEvent(new CustomEvent('panelStateChange', { detail: { panel: newPanel } }));
    };

    const handleAnalysesButtonClick = () => {
      const newPanel = activePanel === 'analyses' ? 'main' : 'analyses';
      setActivePanel(newPanel);
      // Émettre l'événement de changement d'état
      window.dispatchEvent(new CustomEvent('panelStateChange', { detail: { panel: newPanel } }));
    };

    window.addEventListener('configButtonClick', handleConfigButtonClick);
    window.addEventListener('queueButtonClick', handleQueueButtonClick);
    window.addEventListener('analysesButtonClick', handleAnalysesButtonClick);

    return () => {
      window.removeEventListener('configButtonClick', handleConfigButtonClick);
      window.removeEventListener('queueButtonClick', handleQueueButtonClick);
      window.removeEventListener('analysesButtonClick', handleAnalysesButtonClick);
    };
  }, [activePanel]);

  return (
    <div
      className="flex h-screen layout-container"
      style={{
        '--sidebar-width': `${sidebarWidth}px`,
        backgroundColor: 'var(--background-color)',
        color: 'var(--text-color)',
      } as React.CSSProperties}
    >
      {/* Indicateur de fichiers sélectionnés */}
      <SelectionIndicator />

      {/* Panneau de gauche redimensionnable - monte jusqu'en haut */}
      <div
        className="flex-shrink-0 border-r left-panel-container"
        style={{
          width: `${sidebarWidth}px`,
          backgroundColor: 'var(--surface-color)',
          borderColor: 'var(--border-color)',
        }}
      >
        <LeftPanel />
      </div>

      {/* Poignée de redimensionnement */}
      <div
        className="w-1 bg-slate-700 cursor-col-resize hover:bg-blue-500 transition-colors"
        onMouseDown={handleResizeStart}
        onDoubleClick={handleAutoResize}
        title="Double-clic pour ajuster automatiquement la largeur"
      />

      {/* Zone principale sans header */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Zone principale */}
        <div className="flex-1 overflow-hidden">
          <MainPanel activePanel={activePanel} setActivePanel={setActivePanel}>
            {children}
          </MainPanel>
        </div>
      </div>
    </div>
  );
};

export default Layout;