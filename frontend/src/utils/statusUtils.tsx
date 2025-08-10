/**
 * Utilitaires centralisés pour la gestion des statuts de fichiers
 */
import React from 'react';
import { STATUS_COLORS } from './constants';

export type FileStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'paused' | 'unsupported' | 'none';

/**
 * Obtient la couleur CSS pour un statut de fichier
 */
export const getStatusColor = (status: FileStatus): string => {
  switch (status) {
    case 'pending':
      return STATUS_COLORS.pending; // Jaune pour en attente
    case 'processing':
      return STATUS_COLORS.processing; // Bleu pour en cours
    case 'paused':
      return STATUS_COLORS.pending; // Jaune pour en pause
    case 'completed':
      return STATUS_COLORS.completed; // Vert pour terminé
    case 'failed':
      return STATUS_COLORS.failed; // Rouge pour échec
    case 'unsupported':
      return STATUS_COLORS.unsupported; // Gris pour non supporté
    case 'none':
      return STATUS_COLORS.pending; // Jaune pour non analysé
    default:
      return STATUS_COLORS.unsupported;
  }
};

/**
 * Obtient le texte descriptif pour un statut de fichier
 */
export const getStatusText = (status: FileStatus): string => {
  switch (status) {
    case 'pending':
      return 'En attente';
    case 'processing':
      return 'En cours';
    case 'paused':
      return 'En pause';
    case 'completed':
      return 'Terminé';
    case 'failed':
      return 'Échec';
    case 'unsupported':
      return 'Format non supporté';
    case 'none':
      return 'Prêt à analyser';
    default:
      return 'Inconnu';
  }
};

/**
 * Obtient l'icône SVG pour un statut de fichier
 */
export const getStatusIcon = (status: FileStatus): JSX.Element => {
  switch (status) {
    case 'pending':
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      );
    case 'processing':
      return (
        <svg className="w-4 h-4 animate-spin-smooth" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
      );
    case 'completed':
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    case 'failed':
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      );
    case 'paused':
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
    case 'unsupported':
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      );
    case 'none':
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
  }
};

/**
 * Obtient un bouton de statut cliquable avec icône et animation
 */
export const getStatusButton = (
  status: FileStatus, 
  onClick?: () => void, 
  className?: string
): JSX.Element => {
  const statusColor = getStatusColor(status);
  const statusText = getStatusText(status);
  const statusIcon = getStatusIcon(status);
  
  // Classes d'animation selon le statut
  let animationClass = '';
  switch (status) {
    case 'processing':
      animationClass = 'status-button-processing';
      break;
    case 'pending':
      animationClass = 'status-button-pending';
      break;
    case 'failed':
      animationClass = 'status-button-failed';
      break;
    default:
      break;
  }
  
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95 ${animationClass} ${className || ''}`}
      style={{
        color: statusColor,
        borderColor: statusColor,
        backgroundColor: 'transparent'
      }}
      title={onClick ? `Cliquer pour ${statusText.toLowerCase()}` : statusText}
    >
      {statusIcon}
      <span className="text-sm font-medium">{statusText}</span>
    </button>
  );
};

/**
 * Vérifie si un statut indique que le fichier est en cours de traitement
 */
export const isProcessingStatus = (status: FileStatus): boolean => {
  return status === 'processing' || status === 'paused';
};

/**
 * Vérifie si un statut indique que le fichier est terminé (succès ou échec)
 */
export const isCompletedStatus = (status: FileStatus): boolean => {
  return status === 'completed' || status === 'failed';
};

/**
 * Vérifie si un statut indique que le fichier peut être analysé
 */
export const isAnalyzableStatus = (status: FileStatus): boolean => {
  return status === 'pending' || status === 'failed' || status === 'none';
};

/**
 * Obtient les informations complètes de statut d'un fichier
 */
export const getStatusInfo = (status: FileStatus) => {
  return {
    status,
    color: getStatusColor(status),
    text: getStatusText(status),
    icon: getStatusIcon(status),
    isProcessing: isProcessingStatus(status),
    isCompleted: isCompletedStatus(status),
    isAnalyzable: isAnalyzableStatus(status),
  };
};