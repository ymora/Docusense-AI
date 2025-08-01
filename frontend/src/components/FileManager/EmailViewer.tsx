import React, { useState, useEffect } from 'react';
import {
  PaperClipIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  ArchiveBoxIcon,
  TableCellsIcon,
  PresentationChartLineIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';
import { formatFileSize, getEmailAttachmentIcon, canPreviewFile, isVideoFormatSupported, getVideoErrorMessage } from '../../utils/fileUtils';

interface EmailViewerProps {
  file: any;
  onClose?: () => void;
  onPreviewAttachment?: (attachment: any, index: number) => void;
}

interface EmailContent {
  subject: string;
  from_address: string;
  to_address: string;
  cc: string;
  bcc: string;
  date: string;
  text_content: string;
  html_content: string;
  attachments: Array<{
    filename: string;
    content_type: string;
    size: number;
    content_disposition: string;
  }>;
  has_attachments: boolean;
  is_html: boolean;
  is_text: boolean;
}



const EmailViewer: React.FC<EmailViewerProps> = ({ file, onClose, onPreviewAttachment }) => {
  const { colors } = useColors();
  const [emailData, setEmailData] = useState<EmailContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'text' | 'html'>('text');
  const [showHeaders, setShowHeaders] = useState(false);

  useEffect(() => {
    loadEmailContent();
  }, [file]);

  const loadEmailContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/emails/parse/${encodeURIComponent(file.path)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      setEmailData(data);
    } catch (err) {
      console.error('❌ Erreur lors du chargement de l\'email:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  // Fonction de téléchargement supprimée - gérée par UnifiedFileViewer

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('fr-FR');
    } catch {
      return dateString;
    }
  };

  // Fonction de téléchargement de pièce jointe supprimée - gérée par UnifiedFileViewer

  const handlePreviewAttachment = async (attachment: any, index: number) => {
    if (onPreviewAttachment) {
      onPreviewAttachment(attachment, index);
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement de l'email...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <p className="text-red-400 mb-2 font-medium">Erreur de chargement</p>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button
            onClick={loadEmailContent}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!emailData) {
    return (
      <div className="h-full bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📧</div>
          <p className="text-slate-400">Aucune donnée email disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-900 flex flex-col" style={{ height: '100%', minHeight: 'calc(100vh - 120px)' }}>
      {/* Barre d'outils */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl">📧</div>
            <div>
              <h2 className="text-lg font-semibold text-slate-200">{emailData.subject}</h2>
              <p className="text-sm text-slate-400">Email parsé - {file.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Mode d'affichage */}
            <div className="flex items-center space-x-1 bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('text')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === 'text' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Vue texte"
              >
                <DocumentTextIcon className="h-4 w-4" />
              </button>
              {emailData.is_html && (
                <button
                  onClick={() => setViewMode('html')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'html' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Vue HTML"
                >
                  <CodeBracketIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Afficher/masquer les headers */}
            <button
              onClick={() => setShowHeaders(!showHeaders)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
              title={showHeaders ? 'Masquer les headers' : 'Afficher les headers'}
            >
              {showHeaders ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>

            {/* Bouton de téléchargement supprimé - géré par UnifiedFileViewer */}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Informations de base */}
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-400">De :</label>
                <p className="text-slate-200">{emailData.from_address}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">À :</label>
                <p className="text-slate-200">{emailData.to_address}</p>
              </div>
              {emailData.cc && (
                <div>
                  <label className="text-sm font-medium text-slate-400">CC :</label>
                  <p className="text-slate-200">{emailData.cc}</p>
                </div>
              )}
              {emailData.bcc && (
                <div>
                  <label className="text-sm font-medium text-slate-400">BCC :</label>
                  <p className="text-slate-200">{emailData.bcc}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-400">Date :</label>
                <p className="text-slate-200">{formatDate(emailData.date)}</p>
              </div>
            </div>
          </div>

          {/* Headers techniques (optionnel) */}
          {showHeaders && (
            <div className="bg-slate-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Headers techniques</h3>
              <div className="bg-slate-900 rounded p-4">
                <pre className="text-xs text-slate-300 overflow-auto">
                  {JSON.stringify(emailData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Pièces jointes - NOUVELLE INTERFACE */}
          {emailData.has_attachments && (
            <div className="bg-slate-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
                <PaperClipIcon className="h-5 w-5 mr-2" />
                Pièces jointes ({emailData.attachments.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {emailData.attachments.map((attachment, index) => (
                  <div key={index} className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getEmailAttachmentIcon(attachment.content_type, attachment.filename)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 font-medium text-sm truncate" title={attachment.filename}>
                          {attachment.filename}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {attachment.content_type} • {formatFileSize(attachment.size)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t border-slate-600">
                      {/* Bouton Consulter */}
                      {canPreviewFile(attachment.content_type, attachment.filename) && (
                        <button
                          onClick={() => handlePreviewAttachment(attachment, index)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                          title="Consulter"
                        >
                          <EyeIcon className="h-3 w-3" />
                          <span>Consulter</span>
                        </button>
                      )}
                      
                      {/* Bouton Télécharger supprimé - géré par UnifiedFileViewer */}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contenu de l'email */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Contenu</h3>
            
            {viewMode === 'text' && emailData.is_text && (
              <div className="bg-slate-900 rounded p-4">
                <pre className="text-slate-300 whitespace-pre-wrap font-mono text-sm">
                  {emailData.text_content}
                </pre>
              </div>
            )}

            {viewMode === 'html' && emailData.is_html && (
              <div className="bg-slate-900 rounded p-4">
                <div 
                  className="text-slate-300 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: emailData.html_content }}
                />
              </div>
            )}

            {!emailData.is_text && !emailData.is_html && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📄</div>
                <p className="text-slate-400">Aucun contenu texte ou HTML disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailViewer; 