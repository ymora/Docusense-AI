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
  XMarkIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassPlusIcon,
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

// Composant pour l'affichage intégré des pièces jointes
const InlineAttachmentViewer: React.FC<{
  attachment: any;
  attachmentIndex: number;
  file: any;
  onClose: () => void;
  isModal?: boolean;
}> = ({ attachment, attachmentIndex, file, onClose, isModal = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'video' | 'audio' | 'text' | 'unsupported'>('unsupported');

  useEffect(() => {
    loadAttachment();
  }, [attachment, attachmentIndex]);

  const loadAttachment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Déterminer le type de prévisualisation
      const contentType = attachment.content_type;
      const filename = attachment.filename;
      
      if (contentType.startsWith('image/')) {
        setPreviewType('image');
      } else if (contentType === 'application/pdf') {
        setPreviewType('pdf');
      } else if (contentType.startsWith('video/')) {
        setPreviewType('video');
      } else if (contentType.startsWith('audio/')) {
        setPreviewType('audio');
      } else if (contentType.startsWith('text/') || canPreviewFile(contentType, filename)) {
        setPreviewType('text');
      } else {
        setPreviewType('unsupported');
        setLoading(false);
        return;
      }

      // Récupérer la pièce jointe
      const response = await fetch(`/api/emails/attachment-preview/${encodeURIComponent(file.path)}/${attachmentIndex}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      if (previewType === 'text') {
        const textContent = await response.text();
        setPreviewUrl(textContent);
      } else {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la prévisualisation:', error);
      setError('Erreur lors de la prévisualisation de la pièce jointe');
    } finally {
      setLoading(false);
    }
  };

  // Nettoyer l'URL lors du démontage
  useEffect(() => {
    return () => {
      if (previewUrl && previewType !== 'text') {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, previewType]);

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-slate-400 text-sm">Chargement...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="text-red-500 text-2xl mb-2">❌</div>
            <p className="text-red-400 text-sm">Erreur de chargement</p>
          </div>
        </div>
      );
    }

    if (!previewUrl) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="text-2xl mb-2">📄</div>
            <p className="text-slate-400 text-sm">Aucune prévisualisation</p>
          </div>
        </div>
      );
    }

    switch (previewType) {
             case 'image':
         return (
           <div className="flex items-center justify-center h-full">
             <img 
               src={previewUrl} 
               alt={attachment.filename}
               className={`max-w-full object-contain rounded-lg ${isModal ? 'max-h-full' : 'max-h-64'}`}
             />
           </div>
         );

             case 'pdf':
         return (
           <iframe
             src={previewUrl}
             className={`w-full border-0 rounded-lg ${isModal ? 'h-full' : 'h-64'}`}
             title={attachment.filename}
           />
         );

             case 'video':
         return (
           <div className="flex items-center justify-center h-full">
             {isVideoFormatSupported(attachment.content_type, attachment.filename) ? (
               <video 
                 src={previewUrl}
                 controls
                 preload="metadata"
                 className={`max-w-full rounded-lg ${isModal ? 'max-h-full' : 'max-h-64'}`}
                 title={attachment.filename}
               >
                 <source src={previewUrl} type={attachment.content_type} />
                 <p className="text-slate-400 p-4">
                   Votre navigateur ne supporte pas la lecture de cette vidéo.
                 </p>
               </video>
             ) : (
               <div className="text-center py-4">
                 <div className="text-2xl mb-2">🎬</div>
                 <p className="text-slate-400 text-sm">
                   Format non supporté
                 </p>
               </div>
             )}
           </div>
         );

             case 'audio':
         return (
           <div className="flex items-center justify-center h-full">
             <audio 
               src={previewUrl}
               controls
               className={`w-full ${isModal ? 'max-w-2xl' : 'max-w-md'}`}
               title={attachment.filename}
             >
               Votre navigateur ne supporte pas la lecture audio.
             </audio>
           </div>
         );

             case 'text':
         return (
           <div className={`bg-slate-800 rounded-lg p-3 overflow-auto ${isModal ? 'h-full' : 'h-32'}`}>
             <pre className="text-slate-300 whitespace-pre-wrap font-mono text-xs">
               {previewUrl}
             </pre>
           </div>
         );

      default:
        return (
          <div className="text-center py-4">
            <div className="text-2xl mb-2">📄</div>
            <p className="text-slate-400 text-sm">
              Type non supporté
            </p>
          </div>
        );
    }
  };

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getEmailAttachmentIcon(attachment.content_type, attachment.filename)}
              <div>
                <h2 className="text-lg font-semibold text-slate-200">
                  {attachment.filename}
                </h2>
                <p className="text-sm text-slate-400">
                  {attachment.content_type} • {formatFileSize(attachment.size)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
              title="Fermer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

                     {/* Content */}
           <div className="flex-1 overflow-auto p-6">
             {renderPreview()}
           </div>
        </div>
      </div>
    );
  }

  // Version intégrée (non modale)
  return (
    <div className="bg-slate-900 rounded-lg p-3">
      {renderPreview()}
    </div>
  );
};

const EmailViewer: React.FC<EmailViewerProps> = ({ file, onClose, onPreviewAttachment }) => {
  const { colors } = useColors();
  const [emailData, setEmailData] = useState<EmailContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'text' | 'html'>('text');
  const [showHeaders, setShowHeaders] = useState(false);
  const [inlinePreview, setInlinePreview] = useState<{attachment: any, index: number} | null>(null);

  useEffect(() => {
    loadEmailContent();
  }, [file]);

  const loadEmailContent = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Chargement email:', file.path);

      const response = await fetch(`/api/emails/parse/${encodeURIComponent(file.path)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token') || ''}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur API:', response.status, errorText);
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Email chargé:', data);
      
      // Validation des données
      if (!data || typeof data !== 'object') {
        throw new Error('Données invalides reçues du serveur');
      }
      
      setEmailData(data);
    } catch (err) {
      console.error('❌ Erreur lors du chargement de l\'email:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('fr-FR');
    } catch {
      return dateString;
    }
  };

  const handlePreviewAttachment = async (attachment: any, index: number) => {
    try {
      console.log('🔄 Prévisualisation pièce jointe:', attachment.filename, 'index:', index);
      
      // Vérifier si c'est une pièce jointe qui peut être prévisualisée
      const contentType = attachment.content_type;
      const filename = attachment.filename;
      
      if (contentType.startsWith('image/') || 
          contentType === 'application/pdf' ||
          contentType.startsWith('video/') ||
          contentType.startsWith('audio/') ||
          contentType.startsWith('text/') ||
          canPreviewFile(contentType, filename)) {
        
        // Afficher en modal plein écran
        setInlinePreview({ attachment, index });
      } else if (onPreviewAttachment) {
        // Utiliser le système de prévisualisation externe
        onPreviewAttachment(attachment, index);
      }
    } catch (err) {
      console.error('❌ Erreur lors de la prévisualisation de la pièce jointe:', err);
      setError('Erreur lors de la prévisualisation de la pièce jointe');
    }
  };

  // Fonction pour déterminer si une pièce jointe peut être affichée automatiquement
  const canAutoDisplay = (attachment: any): boolean => {
    const contentType = attachment.content_type;
    const filename = attachment.filename;
    
    return contentType.startsWith('image/') || 
           contentType === 'application/pdf' ||
           (contentType.startsWith('video/') && isVideoFormatSupported(contentType, filename)) ||
           contentType.startsWith('audio/');
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
    <>
             <div className="h-full bg-slate-900 flex flex-col min-h-screen-dynamic">
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
            </div>
          </div>
        </div>

                 {/* Contenu principal */}
         <div className="flex-1 overflow-y-auto p-6" style={{ minHeight: 0 }}>
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

            {/* Pièces jointes - NOUVELLE INTERFACE AVEC AFFICHAGE AUTOMATIQUE */}
            {emailData.has_attachments && (
              <div className="bg-slate-800 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
                  <PaperClipIcon className="h-5 w-5 mr-2" />
                  Pièces jointes ({emailData.attachments.length})
                </h3>
                
                {/* Affichage automatique des pièces jointes visuelles */}
                <div className="mb-6">
                  {emailData.attachments
                    .filter(canAutoDisplay)
                    .map((attachment, index) => (
                      <div key={index} className="mb-4">
                        <div className="bg-slate-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              {getEmailAttachmentIcon(attachment.content_type, attachment.filename)}
                              <div>
                                <p className="text-slate-200 font-medium text-sm">
                                  {attachment.filename}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {attachment.content_type} • {formatFileSize(attachment.size)}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Prévisualisation intégrée avec contrôles au survol */}
                          <div className="relative">
                            <InlineAttachmentViewer
                              attachment={attachment}
                              attachmentIndex={index}
                              file={file}
                              onClose={() => setInlinePreview(null)}
                              isModal={false}
                            />
                            
                            {/* Contrôles au survol */}
                            <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 hover:opacity-100 transition-opacity duration-200 z-10">
                              <button
                                onClick={() => handlePreviewAttachment(attachment, index)}
                                className="p-1.5 bg-black/50 hover:bg-black/70 rounded transition-colors text-white"
                                title="Plein écran"
                              >
                                <MagnifyingGlassPlusIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = `/api/emails/attachment-preview/${encodeURIComponent(file.path)}/${index}`;
                                  link.download = attachment.filename;
                                  link.target = '_blank';
                                  link.rel = 'noopener noreferrer';
                                  link.href += `?t=${Date.now()}`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                className="p-1.5 bg-black/50 hover:bg-black/70 rounded transition-colors text-white"
                                title="Télécharger"
                              >
                                <ArrowDownTrayIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Liste des autres pièces jointes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {emailData.attachments
                    .filter(attachment => !canAutoDisplay(attachment))
                    .map((attachment, index) => (
                      <div key={index} className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors relative group">
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
                        
                        {/* Contrôles au survol */}
                        <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                          {/* Bouton Consulter */}
                          {canPreviewFile(attachment.content_type, attachment.filename) && (
                            <button
                              onClick={() => handlePreviewAttachment(attachment, index)}
                              className="p-1.5 bg-black/50 hover:bg-black/70 rounded transition-colors text-white"
                              title="Consulter"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          )}
                          
                          {/* Bouton Télécharger */}
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = `/api/emails/attachment-preview/${encodeURIComponent(file.path)}/${index}`;
                              link.download = attachment.filename;
                              link.target = '_blank';
                              link.rel = 'noopener noreferrer';
                              link.href += `?t=${Date.now()}`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="p-1.5 bg-black/50 hover:bg-black/70 rounded transition-colors text-white"
                            title="Télécharger"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </button>
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

      {/* Modal de prévisualisation en plein écran */}
      {inlinePreview && (
        <InlineAttachmentViewer
          attachment={inlinePreview.attachment}
          attachmentIndex={inlinePreview.index}
          file={file}
          onClose={() => setInlinePreview(null)}
          isModal={true}
        />
      )}
    </>
  );
};

export default EmailViewer; 