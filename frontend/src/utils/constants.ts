/**
 * Constantes centralisées de l'application
 */

// Statuts des fichiers
export const FILE_STATUSES = {
  COMPLETED: 'completed',
  FAILED: 'failed',
  PROCESSING: 'processing',
  PENDING: 'pending',
  UNSUPPORTED: 'unsupported',
} as const;

// Couleurs des statuts
export const STATUS_COLORS = {
  [FILE_STATUSES.COMPLETED]: 'bg-green-500',
  [FILE_STATUSES.FAILED]: 'bg-red-500',
  [FILE_STATUSES.PROCESSING]: 'bg-blue-500',
  [FILE_STATUSES.PENDING]: 'bg-yellow-500',
  [FILE_STATUSES.UNSUPPORTED]: 'bg-gray-500',
} as const;

// Textes des statuts
export const STATUS_TEXTS = {
  [FILE_STATUSES.COMPLETED]: 'Terminé',
  [FILE_STATUSES.FAILED]: 'Échec',
  [FILE_STATUSES.PROCESSING]: 'En cours',
  [FILE_STATUSES.PENDING]: 'En attente',
  [FILE_STATUSES.UNSUPPORTED]: 'Non supporté',
} as const;

// Formats de fichiers supportés
export const SUPPORTED_FORMATS = [
  'pdf', 'docx', 'doc', 'txt', 'eml', 'msg',
  'xlsx', 'xls', 'csv', 'jpg', 'jpeg', 'png', 'html',
] as const;

// Types MIME
export const MIME_TYPES = {
  'pdf': 'application/pdf',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'doc': 'application/msword',
  'txt': 'text/plain',
  'eml': 'message/rfc822',
  'msg': 'application/vnd.ms-outlook',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'xls': 'application/vnd.ms-excel',
  'csv': 'text/csv',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'html': 'text/html',
} as const;

// Catégories de formats
export const FORMAT_CATEGORIES = {
  documents: ['pdf', 'docx', 'doc'],
  text: ['txt', 'html'],
  emails: ['eml', 'msg'],
  spreadsheets: ['xlsx', 'xls', 'csv'],
  images: ['jpg', 'jpeg', 'png'],
} as const;

// Configuration des providers IA
export const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  MISTRAL: 'mistral',
  OLLAMA: 'ollama',
} as const;

// Stratégies de sélection IA
export const AI_STRATEGIES = {
  MANUAL: 'manual',
  ECONOMIC: 'economic',
  QUALITY: 'quality',
  SPEED: 'speed',
} as const;

// Intervalles de synchronisation (en millisecondes)
export const SYNC_INTERVALS = {
  AUTO_SYNC: 30000, // 30 secondes
  CONSISTENCY_CHECK: 120000, // 2 minutes
  QUEUE_UPDATE: 5000, // 5 secondes
} as const;

// Messages d'erreur
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion réseau',
  FILE_NOT_FOUND: 'Fichier non trouvé',
  INVALID_FILE: 'Fichier invalide',
  ANALYSIS_FAILED: 'Échec de l\'analyse',
  UPLOAD_FAILED: 'Échec du téléchargement',
  PERMISSION_DENIED: 'Permission refusée',
} as const;

// Messages de succès
export const SUCCESS_MESSAGES = {
  ANALYSIS_STARTED: 'Analyse lancée avec succès',
  FILE_UPLOADED: 'Fichier téléchargé avec succès',
  SETTINGS_SAVED: 'Paramètres sauvegardés',
  FILE_DELETED: 'Fichier supprimé avec succès',
} as const;

// Configuration des timeouts (en millisecondes)
export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 secondes
  FILE_UPLOAD: 60000, // 1 minute
  ANALYSIS_WAIT: 8000, // 8 secondes
} as const;

// Configuration des limites
export const LIMITS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100 MB
  MAX_FILES_PER_ANALYSIS: 10,
  MAX_QUEUE_SIZE: 100,
} as const;

export const FILE_STATUS_LABELS = {
  [FILE_STATUSES.COMPLETED]: 'Analysé par IA',
  [FILE_STATUSES.FAILED]: 'Échec d\'analyse IA',
  [FILE_STATUSES.PROCESSING]: 'Analyse IA en cours',
  [FILE_STATUSES.PENDING]: 'Non analysé par IA',
  [FILE_STATUSES.PAUSED]: 'Analyse IA en pause',
  [FILE_STATUSES.UNSUPPORTED]: 'Format non supporté',
};