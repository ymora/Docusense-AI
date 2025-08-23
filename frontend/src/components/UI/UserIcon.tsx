import React, { useState, useEffect } from 'react';
import { useColors } from '../../hooks/useColors';
import useAuthStore from '../../stores/authStore';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { 
  UserCircleIcon, 
  ShieldCheckIcon, 
  UserIcon as UserIconHero, 
  EyeIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CpuChipIcon,
  CloudIcon,
  BeakerIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface UserIconProps {
  className?: string;
}

export const UserIcon: React.FC<UserIconProps> = ({ className = '' }) => {
  const { colors } = useColors();
  const { user, isAuthenticated, isGuest, isUser, isAdmin, setUser, setTokens, setAuthenticated } = useAuthStore();
  const { login, register, logout } = useUnifiedAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Écouter les événements pour ouvrir les modales depuis l'overlay
  useEffect(() => {
    const handleOpenLoginModal = () => setShowLoginModal(true);
    const handleOpenRegisterModal = () => setShowRegisterModal(true);

    window.addEventListener('openLoginModal', handleOpenLoginModal);
    window.addEventListener('openRegisterModal', handleOpenRegisterModal);

    return () => {
      window.removeEventListener('openLoginModal', handleOpenLoginModal);
      window.removeEventListener('openRegisterModal', handleOpenRegisterModal);
    };
  }, []);

  // État pour les formulaires
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  
  // État pour les erreurs
  const [loginErrors, setLoginErrors] = useState({ username: '', password: '' });
  const [registerErrors, setRegisterErrors] = useState({ username: '', email: '', password: '', confirmPassword: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Réinitialiser les erreurs
    setLoginErrors({ username: '', password: '' });
    
    // Validation côté client renforcée
    const newErrors = { username: '', password: '' };
    let hasErrors = false;
    
    // Validation du nom d'utilisateur
    if (!loginForm.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis';
      hasErrors = true;
    } else if (loginForm.username.trim().length < 3) {
      newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
      hasErrors = true;
    } else if (!/^[a-zA-Z0-9_]+$/.test(loginForm.username.trim())) {
      newErrors.username = 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores';
      hasErrors = true;
    }
    
    // Validation du mot de passe
    if (!loginForm.password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
      hasErrors = true;
    } else if (loginForm.password.trim().length < 1) {
      newErrors.password = 'Le mot de passe ne peut pas être vide';
      hasErrors = true;
    }
    
    if (hasErrors) {
      setLoginErrors(newErrors);
      return;
    }
    
    // Protection contre les attaques par injection
    const sanitizedUsername = loginForm.username.trim().toLowerCase();
    const sanitizedPassword = loginForm.password;
    
    // Tentative de connexion au backend
    try {
      const authResponse = await login(sanitizedUsername, sanitizedPassword);
      
      // Validation de la réponse
      if (!authResponse || !authResponse.user || !authResponse.access_token) {
        throw new Error('Réponse d\'authentification invalide');
      }
      
      // Mettre à jour le store avec les données d'authentification
      setUser(authResponse.user);
      setTokens(authResponse.access_token, authResponse.refresh_token);
      setAuthenticated(true);
      
      // Fermer la modal et nettoyer le formulaire
      setShowLoginModal(false);
      setLoginForm({ username: '', password: '' });
      setLoginErrors({ username: '', password: '' });
      
      // Log de succès
      console.log('Connexion réussie:', authResponse.user.username);
    } catch (error) {
      console.error('Erreur de connexion:', error);
      
      // Gestion spécifique des erreurs
      let errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect';
      
      if (error instanceof Error) {
        if (error.message.includes('429')) {
          errorMessage = 'Trop de tentatives de connexion. Réessayez dans quelques minutes.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Données de connexion invalides';
        } else if (error.message.includes('500')) {
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Impossible de se connecter au serveur';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Afficher l'erreur après la réponse du backend
      setLoginErrors({ username: '', password: errorMessage });
    }
  };

  // Fonction utilitaire pour valider l'email
  const isValidEmail = (email: string): boolean => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Réinitialiser les erreurs
    setRegisterErrors({ username: '', email: '', password: '', confirmPassword: '' });
    
    // Validation complète avec vérification de sécurité du mot de passe
    const newErrors = { username: '', email: '', password: '', confirmPassword: '' };
    let hasErrors = false;
    
    // Validation nom d'utilisateur
    if (!registerForm.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis';
      hasErrors = true;
    } else if (registerForm.username.length < 3 || registerForm.username.length > 20) {
      newErrors.username = 'Le nom d\'utilisateur doit contenir entre 3 et 20 caractères';
      hasErrors = true;
    } else if (!/^[a-zA-Z0-9_]+$/.test(registerForm.username)) {
      newErrors.username = 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores';
      hasErrors = true;
    }
    
    // Validation email (format RFC complet)
    if (!registerForm.email.trim()) {
      newErrors.email = 'L\'email est requis';
      hasErrors = true;
    } else if (!isValidEmail(registerForm.email)) {
      newErrors.email = 'Format d\'email invalide (exemple: nom@domaine.com)';
      hasErrors = true;
    }
    
    // Validation mot de passe sécurisé
    if (!registerForm.password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
      hasErrors = true;
    } else {
      const password = registerForm.password;
      const passwordErrors = [];
      
      if (password.length < 8) {
        passwordErrors.push('8 caractères minimum');
      }
      if (!/[A-Z]/.test(password)) {
        passwordErrors.push('1 majuscule');
      }
      if (!/[a-z]/.test(password)) {
        passwordErrors.push('1 minuscule');
      }
      if (!/\d/.test(password)) {
        passwordErrors.push('1 chiffre');
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        passwordErrors.push('1 caractère spécial');
      }
      
      if (passwordErrors.length > 0) {
        newErrors.password = `Mot de passe manque: ${passwordErrors.join(', ')}`;
        hasErrors = true;
      }
    }
    
    // Validation confirmation mot de passe
    if (!registerForm.confirmPassword.trim()) {
      newErrors.confirmPassword = 'La confirmation du mot de passe est requise';
      hasErrors = true;
    } else if (registerForm.password !== registerForm.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      hasErrors = true;
    }
    
    if (hasErrors) {
      setRegisterErrors(newErrors);
      return;
    }
    
    try {
      const authResponse = await register(registerForm.username, registerForm.email, registerForm.password);
      // Mettre à jour le store avec les données d'authentification
      setUser(authResponse.user);
      setTokens(authResponse.access_token, authResponse.refresh_token);
      setAuthenticated(true);
      
      // Fermer la modal et nettoyer le formulaire
      setShowRegisterModal(false);
      setRegisterForm({ username: '', email: '', password: '', confirmPassword: '' });
      setRegisterErrors({ username: '', email: '', password: '', confirmPassword: '' });
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      // Afficher l'erreur du backend
      if (error.message.includes('déjà')) {
        setRegisterErrors({ username: 'Ce nom d\'utilisateur existe déjà', email: '', password: '', confirmPassword: '' });
      } else {
        setRegisterErrors({ username: 'Erreur lors de l\'inscription', email: '', password: '', confirmPassword: '' });
      }
    }
  };



  const handleLogout = () => {
    logout();
    setShowMenu(false);
  };

  // Icône selon le rôle - TOUS en vert quand connecté
  const getRoleIcon = () => {
    if (isAdmin()) return <ShieldCheckIcon className="w-5 h-5" style={{ color: '#22c55e' }} />;
    if (isUser()) return <UserIconHero className="w-5 h-5" style={{ color: '#22c55e' }} />;
    if (isGuest()) return <EyeIcon className="w-5 h-5" style={{ color: '#22c55e' }} />;
    return <UserCircleIcon className="w-5 h-5" style={{ color: colors.textSecondary }} />;
  };

  // Couleur de fond selon le rôle - Transparent pour tous les utilisateurs connectés
  const getRoleColor = () => {
    if (isAdmin()) return 'transparent';
    if (isUser()) return 'transparent';
    if (isGuest()) return 'transparent';
    return colors.surface;
  };

  // Texte du rôle
  const getRoleText = () => {
    if (isAdmin()) return 'Admin';
    if (isUser()) return 'Utilisateur';
    if (isGuest()) return 'Invité';
    return 'Non connecté';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Icône utilisateur */}
      <button
        onClick={() => {
          if (isAuthenticated) {
            setShowMenu(!showMenu);
          } else {
            setShowLoginModal(true);
          }
        }}
        className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 ${
          isAuthenticated ? 'hover:bg-opacity-80 cursor-pointer' : 'cursor-pointer hover:bg-opacity-80'
        }`}
        style={{
          backgroundColor: getRoleColor(),
          border: `1px solid ${colors.border}`,
        }}
        title={isAuthenticated ? 'Menu utilisateur' : 'Se connecter'}
      >
        {getRoleIcon()}
        <span className="text-sm font-medium" style={{ color: colors.text }}>
          {user?.username || 'Connexion'}
        </span>
      </button>

      {/* Menu déroulant - seulement quand connecté */}
      {showMenu && isAuthenticated && (
        <div
          className="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg border z-50"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <div className="p-4">
            {/* En-tête utilisateur */}
            <div className="mb-4 pb-4 border-b" style={{ borderColor: colors.border }}>
              <div className="flex items-center space-x-3">
                {getRoleIcon()}
                <div>
                  <div className="font-medium" style={{ color: colors.text }}>
                    {user?.username}
                  </div>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>
                    {getRoleText()}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {/* Actions pour les utilisateurs authentifiés (pas les invités) */}
              {/* La configuration IA a été déplacée dans l'onglet Admin */}

              {/* Déconnexion */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded hover:bg-opacity-80 transition-colors"
                style={{ backgroundColor: colors.background }}
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" style={{ color: '#ef4444' }} />
                <span style={{ color: '#ef4444' }}>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de connexion professionnelle */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div
            className="w-96 p-8 rounded-xl shadow-2xl"
            style={{ 
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25)`,
            }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-3 flex justify-center">
                <UserIconHero className="w-8 h-8" style={{ color: colors.primary }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>
                Connexion
              </h3>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Accédez à votre compte DocuSense AI
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  placeholder="Entrez votre nom d'utilisateur"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: loginErrors.username ? '#ef4444' : colors.border,
                    color: colors.text,
                    boxShadow: loginErrors.username ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : 'none',
                  }}
                  autoComplete="username"
                  required
                />
                {loginErrors.username && (
                  <p className="text-xs mt-2 flex items-center" style={{ color: '#ef4444' }}>
                    <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                    {loginErrors.username}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Mot de passe
                </label>
                <input
                  type="password"
                  placeholder="Entrez votre mot de passe"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: loginErrors.password ? '#ef4444' : colors.border,
                    color: colors.text,
                    boxShadow: loginErrors.password ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : 'none',
                  }}
                  autoComplete="current-password"
                  required
                />
                {loginErrors.password && (
                  <p className="text-xs mt-2 flex items-center" style={{ color: '#ef4444' }}>
                    <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                    {loginErrors.password}
                  </p>
                )}
              </div>

                             <div className="space-y-3">
                 <button
                   type="submit"
                   className="w-full px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                   style={{ 
                     backgroundColor: colors.primary,
                     boxShadow: `0 4px 14px 0 ${colors.primary}40`,
                   }}
                 >
                   Se connecter
                 </button>
                 
                 <button
                   type="button"
                   onClick={() => {
                     setShowLoginModal(false);
                     setLoginForm({ username: '', password: '' });
                     setLoginErrors({ username: '', password: '' });
                   }}
                   className="w-full px-6 py-3 rounded-lg border font-medium transition-all duration-200 hover:bg-opacity-80"
                   style={{
                     backgroundColor: 'transparent',
                     borderColor: colors.border,
                     color: colors.textSecondary,
                   }}
                 >
                   Annuler
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'inscription professionnelle */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div
            className="w-96 p-8 rounded-xl shadow-2xl"
            style={{ 
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25)`,
            }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-3 flex justify-center">
                <PlusIcon className="w-8 h-8" style={{ color: colors.primary }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>
                Créer un compte
              </h3>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Rejoignez DocuSense AI
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  placeholder="Choisissez un nom d'utilisateur"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: registerErrors.username ? '#ef4444' : colors.border,
                    color: colors.text,
                    boxShadow: registerErrors.username ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : 'none',
                  }}
                  autoComplete="username"
                  required
                />
                {registerErrors.username && (
                  <p className="text-xs mt-2 flex items-center" style={{ color: '#ef4444' }}>
                    <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                    {registerErrors.username}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: registerErrors.email ? '#ef4444' : colors.border,
                    color: colors.text,
                    boxShadow: registerErrors.email ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : 'none',
                  }}
                  autoComplete="email"
                  required
                />
                {/* Indicateur de validité de l'email */}
                {registerForm.email && (
                  <div className="mt-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <span style={{ color: isValidEmail(registerForm.email) ? '#22c55e' : '#ef4444' }}>
                        {isValidEmail(registerForm.email) ? '✓' : '✗'} Format email valide
                      </span>
                    </div>
                  </div>
                )}
                {registerErrors.email && (
                  <p className="text-xs mt-2 flex items-center" style={{ color: '#ef4444' }}>
                    <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                    {registerErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Mot de passe
                </label>
                <input
                  type="password"
                  placeholder="Créez un mot de passe sécurisé"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: registerErrors.password ? '#ef4444' : colors.border,
                    color: colors.text,
                    boxShadow: registerErrors.password ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : 'none',
                  }}
                  autoComplete="new-password"
                  required
                />
                {/* Indicateur de sécurité du mot de passe */}
                {registerForm.password && (
                  <div className="mt-2 text-xs space-y-1">
                    <div className="flex items-center space-x-2">
                      <span style={{ color: registerForm.password.length >= 8 ? '#22c55e' : '#ef4444' }}>
                        {registerForm.password.length >= 8 ? '✓' : '✗'} 8 caractères minimum
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span style={{ color: /[A-Z]/.test(registerForm.password) ? '#22c55e' : '#ef4444' }}>
                        {/[A-Z]/.test(registerForm.password) ? '✓' : '✗'} 1 majuscule
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span style={{ color: /[a-z]/.test(registerForm.password) ? '#22c55e' : '#ef4444' }}>
                        {/[a-z]/.test(registerForm.password) ? '✓' : '✗'} 1 minuscule
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span style={{ color: /\d/.test(registerForm.password) ? '#22c55e' : '#ef4444' }}>
                        {/\d/.test(registerForm.password) ? '✓' : '✗'} 1 chiffre
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span style={{ color: /[!@#$%^&*(),.?":{}|<>]/.test(registerForm.password) ? '#22c55e' : '#ef4444' }}>
                        {/[!@#$%^&*(),.?":{}|<>]/.test(registerForm.password) ? '✓' : '✗'} 1 caractère spécial
                      </span>
                    </div>
                  </div>
                )}
                {registerErrors.password && (
                  <p className="text-xs mt-2 flex items-center" style={{ color: '#ef4444' }}>
                    <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                    {registerErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  placeholder="Confirmez votre mot de passe"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: registerErrors.confirmPassword ? '#ef4444' : colors.border,
                    color: colors.text,
                    boxShadow: registerErrors.confirmPassword ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : 'none',
                  }}
                  autoComplete="new-password"
                  required
                />
                {registerErrors.confirmPassword && (
                  <p className="text-xs mt-2 flex items-center" style={{ color: '#ef4444' }}>
                    <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                    {registerErrors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  className="w-full px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ 
                    backgroundColor: colors.primary,
                    boxShadow: `0 4px 14px 0 ${colors.primary}40`,
                  }}
                >
                  Créer mon compte
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowRegisterModal(false);
                    setShowLoginModal(true);
                  }}
                  className="w-full px-6 py-3 rounded-lg border font-medium transition-all duration-200 hover:bg-opacity-80"
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: colors.border,
                    color: colors.textSecondary,
                  }}
                >
                  Déjà un compte ? Se connecter
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowRegisterModal(false);
                    setRegisterForm({ username: '', email: '', password: '', confirmPassword: '' });
                    setRegisterErrors({ username: '', email: '', password: '', confirmPassword: '' });
                  }}
                  className="w-full px-6 py-3 rounded-lg border font-medium transition-all duration-200 hover:bg-opacity-80"
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: colors.border,
                    color: colors.textSecondary,
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Overlay pour fermer le menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* La configuration IA a été déplacée dans l'onglet Admin */}
    </div>
  );
};
