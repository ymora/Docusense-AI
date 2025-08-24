import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useColors } from '../../hooks/useColors';
import { useAdminService } from '../../hooks/useAdminService';
import { logService } from '../../services/logService';
import { userCache, invalidateCache } from '../../utils/cacheUtils';

import {
  UserIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  FunnelIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface User {
  id: number;
  username: string;
  email: string;
  password?: string;
  role: 'guest' | 'user' | 'admin';
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface EditableUser {
  id?: number;
  username: string;
  email: string;
  password: string;
  role: 'guest' | 'user' | 'admin';
  is_active: boolean;
  isNew?: boolean;
}

const UsersPanel: React.FC = () => {
  const { colors } = useColors();
  const adminService = useAdminService();
  const [users, setUsers] = useState<User[]>([]);
  const [editingUsers, setEditingUsers] = useState<EditableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    roles: ['guest', 'user', 'admin'] as string[], // Tous les rôles par défaut
    status: ['active', 'inactive'] as string[], // Tous les statuts par défaut
    search: '' as string // Recherche textuelle
  });
  
  // États pour les dropdowns
  const [dropdownsOpen, setDropdownsOpen] = useState({
    roles: false,
    status: false
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const users = await adminService.getUsers();
      
      if (Array.isArray(users)) {
        setUsers(users);
        // Initialiser les utilisateurs éditables
        const editableUsers = users.map(user => ({
          id: user.id,
          username: user.username || '',
          email: user.email || '',
          password: '',
          role: user.role || 'user',
          is_active: user.is_active ?? true
        }));
        setEditingUsers(editableUsers);
      } else {
        setError('Format de réponse invalide');
      }
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  }, [adminService]);



  const saveUser = useCallback(async (user: EditableUser, index: number) => {
    try {
      setLoading(true);
      setError(null);

      if (user.isNew) {
        // Créer un nouvel utilisateur
        const newUser = await adminService.createUser({
          username: user.username,
          email: user.email,
          password: user.password || '',
          role: user.role
        });

        if (newUser) {
          // Mettre à jour l'interface immédiatement avec le nouvel utilisateur
          setEditingUsers(prev => prev.map(user => 
            user.isNew && user.username === newUser.username ? 
            { ...newUser, password: '', isNew: false } as any : user
          ));
          setUsers(prev => [...prev, newUser] as any);
          
          // Invalider le cache des utilisateurs
          invalidateCache(userCache, 'admin-users');
          
          setSuccess('Utilisateur créé avec succès');
        } else {
          setError('Erreur lors de la création de l\'utilisateur');
        }
      } else {
        // Mettre à jour un utilisateur existant
        const updateData: any = {
          username: user.username,
          email: user.email,
          role: user.role
        };

        // Inclure le mot de passe seulement s'il a été modifié
        if (user.password) {
          updateData.password = user.password;
        }

        const updatedUser = await adminService.updateUser(user.id!, updateData);

        if (updatedUser) {
          // Mettre à jour l'interface immédiatement
          setEditingUsers(prev => prev.map(user => 
            user.id === updatedUser.id ? 
            { ...user, ...updatedUser, password: '' } as any : user
          ));
          setUsers(prev => prev.map(user => 
            user.id === updatedUser.id ? updatedUser : user
          ) as any);
          
          // Invalider le cache des utilisateurs
          invalidateCache(userCache, 'admin-users');
          
          setSuccess('Utilisateur mis à jour avec succès');
        } else {
          setError('Erreur lors de la mise à jour de l\'utilisateur');
        }
      }
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
      setError('Erreur de connexion au serveur');
      logService.error('Erreur lors de la sauvegarde d\'utilisateur', 'UsersPanel', { error, user });
    } finally {
      setLoading(false);
    }
  }, [adminService]);

  const deleteUser = useCallback(async (userId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Supprimer l'utilisateur du backend
      await adminService.deleteUser(userId);
      
      // OPTIMISATION: Mise à jour locale immédiate et unique
      setEditingUsers(prev => prev.filter(user => user.id !== userId));
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      // Invalider le cache des utilisateurs
      invalidateCache(userCache, 'admin-users');
      
      setSuccess('Utilisateur supprimé avec succès');
      
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
      setError('Erreur lors de la suppression de l\'utilisateur');
      logService.error('Erreur lors de la suppression d\'utilisateur', 'UsersPanel', { error, userId });
    } finally {
      setLoading(false);
    }
  }, [adminService]);

  const toggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      setLoading(true);
      setError(null);
      
      // Mettre à jour le statut dans le backend
      const updatedUser = await adminService.updateUser(userId, {
        is_active: !isActive
      });
      
      if (updatedUser) {
        // OPTIMISATION: Mise à jour locale immédiate et unique
        setEditingUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, is_active: !isActive } : user
        ));
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, is_active: !isActive } : user
        ));
        
        setSuccess('Statut de l\'utilisateur mis à jour');
      } else {
        setError('Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
      setError('Erreur lors de la mise à jour du statut');
      logService.error('Erreur lors de la mise à jour du statut utilisateur', 'UsersPanel', { error, userId });
    } finally {
      setLoading(false);
    }
  };

  const updateEditingUser = (index: number, field: keyof EditableUser, value: any) => {
    setEditingUsers(prev => {
      const updatedUsers = [...prev];
      // S'assurer que l'utilisateur existe et initialiser les valeurs par défaut si nécessaire
      if (!updatedUsers[index]) {
        updatedUsers[index] = {
          id: undefined,
          username: '',
          email: '',
          password: '',
          role: 'user',
          is_active: true,
          isNew: false
        };
      }
      // OPTIMISATION: Mise à jour directe sans recréer l'objet complet
      updatedUsers[index] = { ...updatedUsers[index], [field]: value };
      return updatedUsers;
    });
  };

  const cancelEdit = (index: number) => {
    if (editingUsers[index]?.isNew) {
      // Supprimer l'utilisateur en cours de création
      setEditingUsers(editingUsers.filter((_, i) => i !== index));
    } else {
      // Restaurer les valeurs originales
      const originalUser = users.find(u => u.id === editingUsers[index]?.id);
      if (originalUser) {
        const updatedUsers = [...editingUsers];
        updatedUsers[index] = {
          id: originalUser.id,
          username: originalUser.username || '',
          email: originalUser.email || '',
          password: '',
          role: originalUser.role || 'user',
          is_active: originalUser.is_active ?? true
        };
        setEditingUsers(updatedUsers);
      }
    }
  };

  const togglePasswordVisibility = (userId: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      roles: ['guest', 'user', 'admin'],
      status: ['active', 'inactive'],
      search: ''
    });
  };

  // Fonction pour filtrer les utilisateurs - OPTIMISÉE AVEC useMemo
  const filteredUsers = useMemo(() => {
    return editingUsers.filter(user => {
      // Filtre par rôle
      if (filters.roles.length > 0 && !filters.roles.includes(user.role)) return false;
      
      // Filtre par statut
      const userStatus = user.is_active ? 'active' : 'inactive';
      if (filters.status.length > 0 && !filters.status.includes(userStatus)) return false;
      
      // Filtre par recherche textuelle
      if (filters.search && !user.username.toLowerCase().includes(filters.search.toLowerCase()) && 
          !user.email.toLowerCase().includes(filters.search.toLowerCase())) return false;
      
      return true;
    });
  }, [editingUsers, filters.roles, filters.status, filters.search]);

  // Supprimer l'ancienne fonction getFilteredUsers
  // const getFilteredUsers = () => { ... }

  useEffect(() => {
    // Charger les utilisateurs via API
    fetchUsers();
    
    // Écouter les événements de mise à jour des utilisateurs depuis le stream
    const handleUsersUpdated = (event: CustomEvent) => {
      const users = event.detail;
      if (Array.isArray(users) && users.length > 0) {
        setUsers(users);
        // Initialiser les utilisateurs éditables
        setEditingUsers(users.map(user => ({
          id: user.id,
          username: user.username || '',
          email: user.email || '',
          password: '',
          role: user.role || 'user',
          is_active: user.is_active ?? true
        })));
      }
    };

    const handleUsersRefreshNeeded = () => {
      fetchUsers();
    };

    // Écouter les événements personnalisés
    window.addEventListener('users-updated', handleUsersUpdated as EventListener);
    window.addEventListener('users-refresh-needed', handleUsersRefreshNeeded);
    
    // Vérifier s'il y a des utilisateurs en cache au démarrage
    try {
      const cachedUsers = localStorage.getItem('admin-users-cache');
      if (cachedUsers) {
        const users = JSON.parse(cachedUsers);
        if (Array.isArray(users) && users.length > 0) {
          setUsers(users);
          setEditingUsers(users.map(user => ({
            id: user.id,
            username: user.username || '',
            email: user.email || '',
            password: '',
            role: user.role || 'user',
            is_active: user.is_active ?? true
          })));
        }
      }
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
    }
    
    return () => {
      window.removeEventListener('users-updated', handleUsersUpdated as EventListener);
      window.removeEventListener('users-refresh-needed', handleUsersRefreshNeeded);
    };
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Mettre à jour le compteur dans le cadre parent
  useEffect(() => {
    const usersCountElement = document.getElementById('users-count');
    if (usersCountElement) {
      usersCountElement.textContent = editingUsers.length.toString();
    }
  }, [editingUsers.length]);

  // OPTIMISATION: Throttling des événements de clic pour éviter les mises à jour excessives
  useEffect(() => {
    let timeoutId: number;
    
    const handleClickOutside = (event: MouseEvent) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const target = event.target as Element;
        if (!target.closest('.filter-dropdown')) {
          setDropdownsOpen({
            roles: false,
            status: false
          });
        }
      }, 100); // Délai de 100ms pour éviter les mises à jour excessives
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(timeoutId);
    };
  }, []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return colors.error;
      case 'user':
        return colors.primary;
      case 'guest':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'user':
        return 'Utilisateur';
      case 'guest':
        return 'Invité';
      default:
        return role;
    }
  };

  const isValidUser = (user: EditableUser) => {
    return (user.username?.trim() || '') !== '' && 
           (user.email?.trim() || '') !== '' && 
           (user.isNew ? (user.password?.trim() || '') !== '' : true);
  };

  return (
    <div className="h-full overflow-y-auto p-6" style={{ backgroundColor: colors.background }}>
      <div className="max-w-6xl mx-auto space-y-6">



        {/* Messages d'erreur/succès */}
        {error && (
          <div className="p-4 rounded-lg border flex items-center space-x-2" style={{ backgroundColor: colors.error + '20', borderColor: colors.error }}>
            <ExclamationTriangleIcon className="h-5 w-5" style={{ color: colors.error }} />
            <span style={{ color: colors.error }}>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-lg border flex items-center space-x-2" style={{ backgroundColor: colors.success + '20', borderColor: colors.success }}>
            <CheckCircleIcon className="h-5 w-5" style={{ color: colors.success }} />
            <span style={{ color: colors.success }}>{success}</span>
          </div>
        )}

        {/* Section des filtres */}
        <div className="flex items-center justify-between p-4 rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4" style={{ color: colors.textSecondary }} />
              <span className="text-sm font-medium" style={{ color: colors.text }}>Filtres</span>
            </div>
            
            {/* Filtre par recherche */}
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="px-3 py-1 text-sm rounded border"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />
            </div>

            {/* Filtre par rôle */}
            <div className="relative filter-dropdown">
              <button
                onClick={() => setDropdownsOpen(prev => ({ 
                  status: false, 
                  roles: !prev.roles 
                }))}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-all duration-300 ease-in-out hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.border}`,
                  color: colors.textSecondary
                }}
              >
                <span className="text-xs mr-1">
                  {filters.roles.length === 3 ? 'Tous les rôles' : 
                   filters.roles.length === 0 ? 'Aucun rôle' :
                   filters.roles.map(role => role.charAt(0).toUpperCase() + role.slice(1)).join(', ')}
                </span>
                <ChevronDownIcon className={`w-3 h-3 transition-transform ${dropdownsOpen.roles ? 'rotate-180' : ''}`} />
              </button>
              {dropdownsOpen.roles && (
                <div className="absolute z-10 mt-1 w-48 rounded-md shadow-lg" style={{
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`,
                }}>
                  <div className="py-1">
                    {['guest', 'user', 'admin'].map(role => (
                      <div 
                        key={role} 
                        className="flex items-center px-4 py-2 text-xs cursor-pointer transition-colors"
                        style={{
                          color: colors.text,
                          backgroundColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.hover.surface;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={filters.roles.includes(role)}
                          onChange={(e) => {
                            setFilters(prev => ({
                              ...prev,
                              roles: e.target.checked
                                ? [...prev.roles, role]
                                : prev.roles.filter(r => r !== role)
                            }));
                          }}
                          className="mr-2 h-3 w-3 rounded"
                          style={{
                            accentColor: colors.primary
                          }}
                        />
                        <span className="text-xs font-medium">
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Filtre par statut */}
            <div className="relative filter-dropdown">
              <button
                onClick={() => setDropdownsOpen(prev => ({ 
                  roles: false, 
                  status: !prev.status 
                }))}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-all duration-300 ease-in-out hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.border}`,
                  color: colors.textSecondary
                }}
              >
                <span className="text-xs mr-1">
                  {filters.status.length === 2 ? 'Tous les statuts' : 
                   filters.status.length === 0 ? 'Aucun statut' :
                   filters.status.map(status => status === 'active' ? 'Actif' : 'Inactif').join(', ')}
                </span>
                <ChevronDownIcon className={`w-3 h-3 transition-transform ${dropdownsOpen.status ? 'rotate-180' : ''}`} />
              </button>
              {dropdownsOpen.status && (
                <div className="absolute z-10 mt-1 w-48 rounded-md shadow-lg" style={{
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`,
                }}>
                  <div className="py-1">
                    {['active', 'inactive'].map(status => (
                      <div 
                        key={status} 
                        className="flex items-center px-4 py-2 text-xs cursor-pointer transition-colors"
                        style={{
                          color: colors.text,
                          backgroundColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.hover.surface;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={filters.status.includes(status)}
                          onChange={(e) => {
                            setFilters(prev => ({
                              ...prev,
                              status: e.target.checked
                                ? [...prev.status, status]
                                : prev.status.filter(s => s !== status)
                            }));
                          }}
                          className="mr-2 h-3 w-3 rounded"
                          style={{
                            accentColor: colors.primary
                          }}
                        />
                        <span className="text-xs font-medium">
                          {status === 'active' ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bouton réinitialiser */}
            <div className="filter-dropdown">
              <button
                onClick={resetFilters}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-all duration-300 ease-in-out hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.border}`,
                  color: colors.textSecondary
                }}
              >
                <XMarkIcon className="w-3 h-3 mr-1" />
                Réinitialiser
              </button>
            </div>
          </div>

          {/* Compteur d'utilisateurs filtrés */}
          <div className="text-sm" style={{ color: colors.textSecondary }}>
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Indicateur de chargement */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: colors.primary }}></div>
            <p className="mt-2" style={{ color: colors.textSecondary }}>Chargement des utilisateurs...</p>
          </div>
        )}

        {/* Tableau des utilisateurs - toujours affiché */}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ borderColor: colors.border }}>
              <thead>
                <tr style={{ backgroundColor: colors.surface }}>
                  <th className="p-3 text-left text-xs font-medium border-b" style={{ color: colors.text, borderColor: colors.border }}>
                    Utilisateur
                  </th>
                  <th className="p-3 text-left text-xs font-medium border-b" style={{ color: colors.text, borderColor: colors.border }}>
                    Email
                  </th>
                  <th className="p-3 text-left text-xs font-medium border-b" style={{ color: colors.text, borderColor: colors.border }}>
                    Mot de passe
                  </th>
                  <th className="p-3 text-left text-xs font-medium border-b" style={{ color: colors.text, borderColor: colors.border }}>
                    Rôle
                  </th>
                  <th className="p-3 text-left text-xs font-medium border-b" style={{ color: colors.text, borderColor: colors.border }}>
                    Statut
                  </th>
                  <th className="p-3 text-left text-xs font-medium border-b" style={{ color: colors.text, borderColor: colors.border }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? filteredUsers.map((user, index) => (
                  <tr key={user.id || `new-${index}`} className="border-b" style={{ borderColor: colors.border }}>
                  {/* Colonne Utilisateur */}
                  <td className="p-3">
                    <input
                      type="text"
                      value={user.username || ''}
                      onChange={(e) => updateEditingUser(index, 'username', e.target.value)}
                      placeholder="Nom d'utilisateur"
                      className="w-full px-2 py-1 rounded border text-sm"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    />
                  </td>

                  {/* Colonne Email */}
                  <td className="p-3">
                    <input
                      type="email"
                      value={user.email || ''}
                      onChange={(e) => updateEditingUser(index, 'email', e.target.value)}
                      placeholder="email@exemple.com"
                      className="w-full px-2 py-1 rounded border text-sm"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    />
                  </td>

                  {/* Colonne Mot de passe */}
                  <td className="p-3">
                    <div className="relative">
                      <input
                        type={showPasswords[user.id || 0] ? "text" : "password"}
                        value={user.password || ''}
                        onChange={(e) => updateEditingUser(index, 'password', e.target.value)}
                        placeholder={user.isNew ? "Mot de passe requis" : "Laisser vide pour ne pas changer"}
                        className="w-full px-2 py-1 pr-8 rounded border text-sm"
                        style={{
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          color: colors.text,
                        }}
                      />
                      <button
                        onClick={() => togglePasswordVisibility(user.id || 0)}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 rounded"
                        style={{ color: colors.textSecondary }}
                      >
                        {showPasswords[user.id || 0] ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Colonne Rôle */}
                  <td className="p-3">
                    <select
                      value={user.role || 'user'}
                      onChange={(e) => updateEditingUser(index, 'role', e.target.value)}
                      className="px-2 py-1 rounded border text-sm"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    >
                      <option value="guest">Invité</option>
                      <option value="user">Utilisateur</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </td>

                  {/* Colonne Statut */}
                  <td className="p-3">
                    <button
                      onClick={() => toggleUserStatus(user.id!, user.is_active ?? true)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                        (user.is_active ?? true) ? 'text-white' : ''
                      }`}
                      style={{
                        backgroundColor: (user.is_active ?? true) ? colors.success : 'transparent',
                        color: (user.is_active ?? true) ? colors.background : colors.textSecondary,
                        border: `1px solid ${(user.is_active ?? true) ? colors.success : colors.border}`,
                      }}
                      title={(user.is_active ?? true) ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
                    >
                      {(user.is_active ?? true) ? '✅ Actif' : '❌ Inactif'}
                    </button>
                  </td>

                  {/* Colonne Actions */}
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      {user.isNew ? (
                        // Actions pour nouvel utilisateur
                        <>
                          <button
                            onClick={() => saveUser(user, index)}
                            disabled={loading || !isValidUser(user)}
                            className="p-1 rounded transition-colors disabled:opacity-50"
                            style={{ color: colors.primary }}
                            title="Sauvegarder"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => cancelEdit(index)}
                            disabled={loading}
                            className="p-1 rounded transition-colors disabled:opacity-50"
                            style={{ color: colors.textSecondary }}
                            title="Annuler"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        // Actions pour utilisateur existant
                        <>
                          <button
                            onClick={() => saveUser(user, index)}
                            disabled={loading || !isValidUser(user)}
                            className="p-1 rounded transition-colors disabled:opacity-50"
                            style={{ color: colors.primary }}
                            title="Sauvegarder"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => cancelEdit(index)}
                            disabled={loading}
                            className="p-1 rounded transition-colors disabled:opacity-50"
                            style={{ color: colors.textSecondary }}
                            title="Annuler"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleUserStatus(user.id!, user.is_active ?? true)}
                            disabled={loading}
                            className="p-1 rounded transition-colors disabled:opacity-50"
                            style={{ color: (user.is_active ?? true) ? colors.warning : colors.success }}
                            title={(user.is_active ?? true) ? 'Désactiver' : 'Activer'}
                          >
                            {(user.is_active ?? true) ? (
                              <XMarkIcon className="h-4 w-4" />
                            ) : (
                              <CheckCircleIcon className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => deleteUser(user.id!)}
                            disabled={loading}
                            className="p-1 rounded transition-colors disabled:opacity-50"
                            style={{ color: colors.error }}
                            title="Supprimer"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <UserIcon className="h-12 w-12 mx-auto mb-4" style={{ color: colors.textSecondary }} />
                      <p style={{ color: colors.textSecondary }}>
                        {editingUsers.length === 0 ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur ne correspond aux filtres'}
                      </p>
                      {editingUsers.length > 0 && (
                        <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                          Essayez de modifier vos filtres ou de réinitialiser la recherche
                        </p>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPanel;
