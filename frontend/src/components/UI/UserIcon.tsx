import React, { useState, useEffect } from 'react';
import { useColors } from '../../hooks/useColors';
import useAuthStore from '../../stores/authStore';
import ConfigWindow from '../Config/ConfigWindow';
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
  const [showConfigWindow, setShowConfigWindow] = useState(false);

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
    
    // Validation minimale - seulement vérifier que les champs ne sont pas vides
    const newErrors = { username: '', password: '' };
    let hasErrors = false;
    
    if (!loginForm.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis';
      hasErrors = true;
    }
    
    if (!loginForm.password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
      hasErrors = true;
    }
    
    if (hasErrors) {
      setLoginErrors(newErrors);
      return;
    }
    
    // Tentative de connexion au backend
    try {
      await useAuthStore.getState().login(loginForm.username, loginForm.password);
      setShowLoginModal(false);
      setLoginForm({ username: '', password: '' });
      setLoginErrors({ username: '', password: '' });
    } catch (error) {
      console.error('Erreur de connexion:', error);
      // Afficher l'erreur après la réponse du backend
      setLoginErrors({ username: '', password: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Réinitialiser les erreurs
    setRegisterErrors({ username: '', email: '', password: '', confirmPassword: '' });
    
    // Validation minimale - seulement vérifier les champs vides et formats de base
    const newErrors = { username: '', email: '', password: '', confirmPassword: '' };
    let hasErrors = false;
    
    if (!registerForm.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis';
      hasErrors = true;
    }
    
    if (!registerForm.email.trim()) {
      newErrors.email = 'L\'email est requis';
      hasErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
      newErrors.email = 'Format d\'email invalide';
      hasErrors = true;
    }
    
    if (!registerForm.password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
      hasErrors = true;
    }
    
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
      await useAuthStore.getState().register(registerForm.username, registerForm.email, registerForm.password);
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
         onClick={() => isAuthenticated && setShowMenu(!showMenu)}
         className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 ${
           isAuthenticated ? 'hover:bg-opacity-80 cursor-pointer' : 'cursor-default opacity-50'
         }`}
         style={{
           backgroundColor: getRoleColor(),
           border: `1px solid ${colors.border}`,
         }}
         title={isAuthenticated ? 'Menu utilisateur' : 'Connectez-vous pour accéder au menu'}
       >
         {getRoleIcon()}
         <span className="text-sm font-medium" style={{ color: colors.text }}>
           {user?.username || 'Connexion'}
         </span>
       </button>

             {/* Menu déroulant simplifié - seulement quand connecté */}
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
               {!isGuest() && (
                 <button
                   onClick={() => {
                     setShowMenu(false);
                     setShowConfigWindow(true);
                   }}
                   className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded hover:bg-opacity-80 transition-colors"
                   style={{ backgroundColor: colors.background }}
                 >
                   <Cog6ToothIcon className="w-4 h-4" style={{ color: colors.textSecondary }} />
                   <span style={{ color: colors.text }}>Paramètres</span>
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
               <div className="text-2xl mb-3" style={{ color: colors.primary }}>
                 👤
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
                     <span className="mr-1">⚠️</span>
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
                     <span className="mr-1">⚠️</span>
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
               <div className="text-2xl mb-3" style={{ color: colors.primary }}>
                 ➕
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
                     <span className="mr-1">⚠️</span>
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
                 {registerErrors.email && (
                   <p className="text-xs mt-2 flex items-center" style={{ color: '#ef4444' }}>
                     <span className="mr-1">⚠️</span>
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
                 {registerErrors.password && (
                   <p className="text-xs mt-2 flex items-center" style={{ color: '#ef4444' }}>
                     <span className="mr-1">⚠️</span>
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
                     <span className="mr-1">⚠️</span>
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

      {/* Fenêtre de configuration */}
      {showConfigWindow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-11/12 h-5/6 max-w-6xl">
            <ConfigWindow 
              onClose={() => setShowConfigWindow(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
