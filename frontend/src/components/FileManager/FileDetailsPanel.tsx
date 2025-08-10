import React, { useState, useEffect } from 'react';
import { useColors } from '../../hooks/useColors';
import {
  XMarkIcon,
  DocumentIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import { formatFileSize, getFileIcon, formatDate } from '../../utils/fileUtils';
import { getStatusColor } from '../../utils/statusUtils.tsx';

interface FileDetailsPanelProps {
  file: {
    id: number;
    name: string;
    path: string;
    size: number;
    mime_type: string;
    status: string;
    created_at: string;
    updated_at: string;
    extracted_text?: string;
    analysis_result?: string;
    analysis_metadata?: Record<string, unknown>;
    analysis_count?: number;
    type?: string;
    is_directory?: boolean;
  } | null;
  onClose: () => void;
  showDetails?: boolean;
}

const FileDetailsPanel: React.FC<FileDetailsPanelProps> = ({
  file,
  onClose,
  showDetails = false,
}) => {
  const { colors, colorMode } = useColors();

  const handleClose = (): void => {
    onClose();
  };

  // Utilisation de la fonction centralisée formatFileSize

  // Utilisation de la fonction centralisée formatDate

  // Utilisation de la fonction centralisée getFileIcon

  // Utilisation des fonctions centralisées getStatusColor et getStatusText

  if (!file || !showDetails) {
    return null;
  }

  return (
    <div
      className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-700 overflow-y-auto z-50"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 p-4 border-b flex items-center justify-between"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center gap-3">
          <div>
            <h3
              className="font-semibold text-lg truncate"
              style={{ color: colors.text }}
            >
            Détails du fichier
            </h3>
            <p
              className="text-sm truncate"
              style={{ color: colors.textSecondary }}
            >
              {file.name}
            </p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          style={{ color: colors.textSecondary }}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h4
            className="font-medium text-lg"
            style={{ color: colors.text }}
          >
            Informations générales
          </h4>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <DocumentIcon className="h-5 w-5" style={{ color: colors.textSecondary }} />
              <div className="flex-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: colors.text }}
                >
                  Nom du fichier
                </p>
                <p
                  className="text-sm break-all"
                  style={{ color: colors.textSecondary }}
                >
                  {file.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DocumentTextIcon className="h-5 w-5" style={{ color: colors.textSecondary }} />
              <div className="flex-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: colors.text }}
                >
                  Type MIME
                </p>
                <p
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  {file.mime_type}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ArchiveBoxIcon className="h-5 w-5" style={{ color: colors.textSecondary }} />
              <div className="flex-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: colors.text }}
                >
                  Taille
                </p>
                <p
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-5 w-5 flex items-center justify-center">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(file.status as any)}`}></div>
              </div>
              <div className="flex-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: colors.text }}
                >
                  Statut
                </p>
                <p
                  className={`text-sm capitalize ${getStatusColor(file.status as any)}`}
                >
                  {file.status}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="space-y-4">
          <h4
            className="font-medium text-lg"
            style={{ color: colors.text }}
          >
            Horodatage
          </h4>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5" style={{ color: colors.textSecondary }} />
              <div className="flex-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: colors.text }}
                >
                  Créé le
                </p>
                <p
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  {formatDate(file.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5" style={{ color: colors.textSecondary }} />
              <div className="flex-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: colors.text }}
                >
                  Modifié le
                </p>
                <p
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  {formatDate(file.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Path */}
        <div className="space-y-4">
          <h4
            className="font-medium text-lg"
            style={{ color: colors.text }}
          >
            Chemin du fichier
          </h4>

          <div
            className="p-3 rounded-md text-sm break-all font-mono"
            style={{
              backgroundColor: colorMode === 'dark' ? '#475569' : '#e2e8f0',
              color: colors.textSecondary,
            }}
          >
            {file.path}
          </div>
        </div>

        {/* Extracted Text */}
        {file.extracted_text && (
          <div className="space-y-4">
            <h4
              className="font-medium text-lg"
              style={{ color: colors.text }}
            >
            Texte extrait
            </h4>

            <div
              className="p-3 rounded-md text-sm max-h-40 overflow-y-auto"
              style={{
                backgroundColor: colorMode === 'dark' ? '#475569' : '#e2e8f0',
                color: colors.textSecondary,
              }}
            >
              {file.extracted_text.length > 500
                ? `${file.extracted_text.substring(0, 500)}...`
                : file.extracted_text
              }
            </div>
          </div>
        )}

        {/* Analysis Result */}
        {file.analysis_result && (
          <div className="space-y-4">
            <h4
              className="font-medium text-lg"
              style={{ color: colors.text }}
            >
            Résultat d'analyse
            </h4>

            <div
              className="p-3 rounded-md text-sm max-h-40 overflow-y-auto"
              style={{
                backgroundColor: colorMode === 'dark' ? '#475569' : '#e2e8f0',
                color: colors.textSecondary,
              }}
            >
              {file.analysis_result.length > 500
                ? `${file.analysis_result.substring(0, 500)}...`
                : file.analysis_result
              }
            </div>
          </div>
        )}

        {/* Analysis Metadata */}
        {file.analysis_metadata && Object.keys(file.analysis_metadata).length > 0 && (
          <div className="space-y-4">
            <h4
              className="font-medium text-lg"
              style={{ color: colors.text }}
            >
              Métadonnées d'analyse
            </h4>

            <div
              className="p-3 rounded-md text-sm max-h-40 overflow-y-auto"
              style={{
                backgroundColor: colorMode === 'dark' ? '#475569' : '#e2e8f0',
                color: colors.textSecondary,
              }}
            >
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(file.analysis_metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileDetailsPanel;