import React, { useState } from 'react';
import { useColors } from '../../hooks/useColors';
import useAuthStore from '../../stores/authStore';
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
  BeakerIcon
} from '@heroicons/react/24/outline';

interface UserIconProps {
  className?: string;
}

export const UserIcon: React.FC<UserIconProps> = ({ className = '' }) => {
  const { colors } = useColors();
  const { user, isAuthenticated, isGuest, isUser, isAdmin, logout, loginAsGuest } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // État pour les formulaires
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await useAuthStore.getState().login(loginForm.username, loginForm.password);
      setShowLoginModal(false);
      setLoginForm({ username: '', password: '' });
    } catch (error) {
      console.error('Erreur de connexion:', error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      await useAuthStore.getState().register(registerForm.username, registerForm.email, registerForm.password);
      setShowRegisterModal(false);
      setRegisterForm({ username: '', email: '', password: '', confirmPassword: '' });
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
    }
  };

  const handleGuestLogin = async () => {
    try {
      await loginAsGuest();
      setShowMenu(false);
    } catch (error) {
      console.error('Erreur de connexion invité:', error);
    }
  };

  const handleLogout = () => {
    logout();
    setShowMenu(false);
  };

  // Icône selon le rôle
  const getRoleIcon = () => {
    if (isAdmin()) return <ShieldCheckIcon className="w-5 h-5" style={{ color: '#10b981' }} />;
    if (isUser()) return <UserIconHero className="w-5 h-5" style={{ color: '#3b82f6' }} />;
    if (isGuest()) return <EyeIcon className="w-5 h-5" style={{ color: '#22c55e' }} />;
    return <UserCircleIcon className="w-5 h-5" style={{ color: colors.textSecondary }} />;
  };

  // Couleur de fond selon le rôle
  const getRoleColor = () => {
    if (isAdmin()) return '#10b98120';
    if (isUser()) return '#3b82f620';
    if (isGuest()) return '#6b728020';
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
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-opacity-80 transition-all duration-200"
        style={{
          backgroundColor: getRoleColor(),
          border: `1px solid ${colors.border}`,
        }}
      >
        {getRoleIcon()}
        <span className="text-sm font-medium" style={{ color: colors.text }}>
          {user?.username || 'Connexion'}
        </span>
      </button>

      {/* Menu déroulant */}
      {showMenu && (
        <div
          className="absolute right-0 top-full mt-2 w-64 rounded-lg shadow-lg border z-50"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <div className="p-4">
            {/* En-tête utilisateur */}
            {isAuthenticated ? (
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
            ) : (
              <div className="mb-4 pb-4 border-b" style={{ borderColor: colors.border }}>
                <div className="text-sm" style={{ color: colors.textSecondary }}>
                  Non connecté
                </div>
              </div>
            )}

            {/* Actions selon l'état de connexion */}
            {isAuthenticated ? (
              <div className="space-y-2">
                {/* Actions pour les utilisateurs authentifiés (pas les invités) */}
                {!isGuest() && (
                  <button
                    onClick={() => setShowMenu(false)}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded hover:bg-opacity-80 transition-colors"
                    style={{ backgroundColor: colors.background }}
                  >
                    <Cog6ToothIcon className="w-4 h-4" style={{ color: colors.textSecondary }} />
                    <span style={{ color: colors.text }}>Paramètres</span>
                  </button>
                )}

                                 {/* Actions spécifiques au rôle */}
                 {isAdmin() && (
                   <button
                     onClick={() => setShowMenu(false)}
                     className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded hover:bg-opacity-80 transition-colors"
                     style={{ backgroundColor: colors.background }}
                   >
                     <ShieldCheckIcon className="w-4 h-4" style={{ color: '#10b981' }} />
                     <span style={{ color: colors.text }}>Administration</span>
                   </button>
                 )}

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
            ) : (
              <div className="space-y-2">
                                 {/* Connexion invité */}
                 <button
                   onClick={handleGuestLogin}
                   className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded hover:bg-opacity-80 transition-colors"
                   style={{ backgroundColor: colors.background }}
                 >
                   <EyeIcon className="w-4 h-4" style={{ color: colors.textSecondary }} />
                   <span style={{ color: colors.text }}>Invité</span>
                 </button>

                {/* Connexion */}
                                 <button
                   onClick={() => setShowLoginModal(true)}
                   className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded hover:bg-opacity-80 transition-colors"
                   style={{ backgroundColor: colors.background }}
                 >
                   <UserIconHero className="w-4 h-4" style={{ color: colors.textSecondary }} />
                   <span style={{ color: colors.text }}>Se connecter</span>
                 </button>

                {/* Inscription */}
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded hover:bg-opacity-80 transition-colors"
                  style={{ backgroundColor: colors.background }}
                >
                  <PlusIcon className="w-4 h-4" style={{ color: colors.textSecondary }} />
                  <span style={{ color: colors.text }}>S'inscrire</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de connexion */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="w-96 p-6 rounded-lg"
            style={{ backgroundColor: colors.surface }}
          >
            <h3 className="text-lg font-medium mb-4" style={{ color: colors.text }}>
              Connexion
            </h3>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                placeholder="Nom d'utilisateur"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-3 py-2 rounded border"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                }}
                required
              />
              <input
                type="password"
                placeholder="Mot de passe"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-3 py-2 rounded border"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                }}
                required
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded text-white"
                  style={{ backgroundColor: colors.primary }}
                >
                  Se connecter
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="px-4 py-2 rounded border"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'inscription */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="w-96 p-6 rounded-lg"
            style={{ backgroundColor: colors.surface }}
          >
            <h3 className="text-lg font-medium mb-4" style={{ color: colors.text }}>
              Inscription
            </h3>
            <form onSubmit={handleRegister} className="space-y-4">
              <input
                type="text"
                placeholder="Nom d'utilisateur"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                className="w-full px-3 py-2 rounded border"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                }}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                className="w-full px-3 py-2 rounded border"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                }}
                required
              />
              <input
                type="password"
                placeholder="Mot de passe"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                className="w-full px-3 py-2 rounded border"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                }}
                required
              />
              <input
                type="password"
                placeholder="Confirmer le mot de passe"
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 rounded border"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                }}
                required
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded text-white"
                  style={{ backgroundColor: colors.primary }}
                >
                  S'inscrire
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded border"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
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
    </div>
  );
};
