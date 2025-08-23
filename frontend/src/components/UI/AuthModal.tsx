import React, { useState } from 'react';
import { XMarkIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { logService } from '../../services/logService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AuthCredentials {
  username: string;
  password: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useUnifiedAuth();
  const [credentials, setCredentials] = useState<AuthCredentials>({
    username: 'invite',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    logService.info('Tentative d\'authentification', 'AuthModal', {
      username: credentials.username,
      timestamp: new Date().toISOString()
    });

    try {
      const response = await login(credentials.username, credentials.password);

      if (response.success) {
        logService.info('Authentification réussie', 'AuthModal', {
          username: credentials.username,
          timestamp: new Date().toISOString()
        });
        onSuccess();
        onClose();
      } else {
        logService.warning('Échec de l\'authentification', 'AuthModal', {
          username: credentials.username,
          error: response.error,
          timestamp: new Date().toISOString()
        });
        setError(response.error || 'Échec de l\'authentification');
      }
    } catch (error) {
      logService.error('Erreur de connexion lors de l\'authentification', 'AuthModal', {
        username: credentials.username,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString()
      });
      setError(error instanceof Error ? error.message : 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof AuthCredentials, value: string) => {
    setCredentials(prev => {
      const newCredentials = {
        ...prev,
        [field]: value,
      };
      
      // Si l'utilisateur tape "invite", vider automatiquement le mot de passe
      if (field === 'username' && value.toLowerCase() === 'invite') {
        newCredentials.password = '';
      }
      
      return newCredentials;
    });
  };

  if (!isOpen) {return null;}

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-600 max-w-md w-full">
        {/* Header */}
        <div className="bg-slate-700 px-4 py-3 border-b border-slate-600 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <LockClosedIcon className="h-6 w-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-slate-200">
              Authentification Requise
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-600 rounded transition-colors text-slate-300"
            title="Fermer"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔐</div>
            <h4 className="text-lg font-medium text-slate-200 mb-2">
              Accès Distant Sécurisé
            </h4>
            <p className="text-sm text-slate-400">
              Veuillez vous authentifier pour accéder aux fonctionnalités de téléchargement
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom d'utilisateur */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                id="username"
                value={credentials.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400"
                placeholder="Nom d'utilisateur"
                autoComplete="username"
                required
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Mot de passe {credentials.username.toLowerCase() === 'invite' && <span className="text-slate-500">(optionnel)</span>}
              </label>
              <input
                type="password"
                id="password"
                value={credentials.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400"
                placeholder={credentials.username.toLowerCase() === 'invite' ? "Laissez vide pour invité" : "Mot de passe"}
                autoComplete="current-password"
                required={credentials.username.toLowerCase() !== 'invite'}
              />
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-900/50 border border-red-600 rounded-lg p-3">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Informations d'aide */}
            <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-3">
              <p className="text-sm text-blue-300">
                <strong>Identifiants disponibles :</strong><br />
                • <strong>Invité</strong> : <code className="bg-slate-700 px-1 rounded">invite</code> (sans mot de passe)<br />
                • <strong>Yannick</strong> : <code className="bg-slate-700 px-1 rounded">yannick</code> / <code className="bg-slate-700 px-1 rounded">yannick123</code><br />
                • <strong>Admin</strong> : <code className="bg-slate-700 px-1 rounded">admin</code> / <code className="bg-slate-700 px-1 rounded">admin123</code>
              </p>
            </div>

            {/* Boutons */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-lg transition-colors"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connexion...
                  </div>
                ) : (
                  'Se connecter'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;