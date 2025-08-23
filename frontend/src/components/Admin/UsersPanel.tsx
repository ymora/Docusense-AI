import React, { useState, useEffect } from 'react';
import { useColors } from '../../hooks/useColors';
import { useAdminService } from '../../hooks/useAdminService';
import { logService } from '../../services/logService';

import {
  UserIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getUsers();
      if (response.success) {
        setUsers(response.data);
        // Initialiser les utilisateurs éditables
        setEditingUsers(response.data.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          password: '',
          role: user.role,
          is_active: user.is_active
        })));
      } else {
        setError('Erreur lors de la récupération des utilisateurs');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
      logService.error('Erreur lors de la récupération des utilisateurs', 'UsersPanel', { error });
    } finally {
      setLoading(false);
    }
  };

  const addNewUser = () => {
    const newUser: EditableUser = {
      username: '',
      email: '',
      password: '',
      role: 'user',
      is_active: true,
      isNew: true
    };
    setEditingUsers([...editingUsers, newUser]);
  };

  const saveUser = async (user: EditableUser, index: number) => {
    try {
      setLoading(true);
      setError(null);

      if (user.isNew) {
        // Créer un nouvel utilisateur
        const response = await adminService.createUser({
          username: user.username,
          email: user.email,
          password: user.password || '',
          role: user.role,
          is_active: user.is_active
        });

        if (response.success) {
          setSuccess('Utilisateur créé avec succès');
          await fetchUsers(); // Recharger la liste
        } else {
          setError('Erreur lors de la création de l\'utilisateur');
        }
      } else {
        // Mettre à jour un utilisateur existant
        const updateData: any = {
          username: user.username,
          email: user.email,
          role: user.role,
          is_active: user.is_active
        };

        // Inclure le mot de passe seulement s'il a été modifié
        if (user.password) {
          updateData.password = user.password;
        }

        const response = await adminService.updateUser(user.id!, updateData);

        if (response.success) {
          setSuccess('Utilisateur mis à jour avec succès');
          await fetchUsers(); // Recharger la liste
        } else {
          setError('Erreur lors de la mise à jour de l\'utilisateur');
        }
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
      logService.error('Erreur lors de la sauvegarde d\'utilisateur', 'UsersPanel', { error, user });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.deleteUser(userId);
      if (response.success) {
        setSuccess('Utilisateur supprimé avec succès');
        await fetchUsers(); // Recharger la liste
      } else {
        setError('Erreur lors de la suppression de l\'utilisateur');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
      logService.error('Erreur lors de la suppression d\'utilisateur', 'UsersPanel', { error, userId });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.updateUser(userId, {
        is_active: !isActive
      });
      if (response.success) {
        setSuccess('Statut de l\'utilisateur mis à jour');
        await fetchUsers(); // Recharger la liste
      } else {
        setError('Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
      logService.error('Erreur lors de la mise à jour du statut utilisateur', 'UsersPanel', { error, userId });
    } finally {
      setLoading(false);
    }
  };

  const updateEditingUser = (index: number, field: keyof EditableUser, value: any) => {
    const updatedUsers = [...editingUsers];
    updatedUsers[index] = { ...updatedUsers[index], [field]: value };
    setEditingUsers(updatedUsers);
  };

  const cancelEdit = (index: number) => {
    if (editingUsers[index].isNew) {
      // Supprimer l'utilisateur en cours de création
      setEditingUsers(editingUsers.filter((_, i) => i !== index));
    } else {
      // Restaurer les valeurs originales
      const originalUser = users.find(u => u.id === editingUsers[index].id);
      if (originalUser) {
        const updatedUsers = [...editingUsers];
        updatedUsers[index] = {
          id: originalUser.id,
          username: originalUser.username,
          email: originalUser.email,
          password: '',
          role: originalUser.role,
          is_active: originalUser.is_active
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

  useEffect(() => {
    fetchUsers();
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
    return user.username.trim() !== '' && 
           user.email.trim() !== '' && 
           (user.isNew ? user.password.trim() !== '' : true);
  };

  return (
    <div className="h-full overflow-y-auto p-6" style={{ backgroundColor: colors.background }}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* En-tête */}
        <div className="flex justify-end">
          <button
            onClick={addNewUser}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
            style={{
              backgroundColor: colors.primary,
              color: colors.background,
            }}
          >
            <PlusIcon className="h-4 w-4" />
            <span>Ajouter</span>
          </button>
        </div>

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

        {/* Tableau des utilisateurs */}
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
              {editingUsers.map((user, index) => (
                <tr key={user.id || `new-${index}`} className="border-b" style={{ borderColor: colors.border }}>
                  {/* Colonne Utilisateur */}
                  <td className="p-3">
                    <input
                      type="text"
                      value={user.username}
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
                      value={user.email}
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
                        value={user.password}
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
                      value={user.role}
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
                      onClick={() => updateEditingUser(index, 'is_active', !user.is_active)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        user.is_active ? 'text-white' : ''
                      }`}
                      style={{
                        backgroundColor: user.is_active ? colors.success : 'transparent',
                        color: user.is_active ? colors.background : colors.textSecondary,
                        border: `1px solid ${user.is_active ? colors.success : colors.border}`,
                      }}
                    >
                      {user.is_active ? 'Actif' : 'Inactif'}
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
                            onClick={() => toggleUserStatus(user.id!, user.is_active)}
                            disabled={loading}
                            className="p-1 rounded transition-colors disabled:opacity-50"
                            style={{ color: user.is_active ? colors.warning : colors.success }}
                            title={user.is_active ? 'Désactiver' : 'Activer'}
                          >
                            {user.is_active ? (
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Message si aucun utilisateur */}
        {editingUsers.length === 0 && !loading && (
          <div className="text-center py-8">
            <UserIcon className="h-12 w-12 mx-auto mb-4" style={{ color: colors.textSecondary }} />
            <p style={{ color: colors.textSecondary }}>Aucun utilisateur trouvé</p>
            <button
              onClick={addNewUser}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: colors.primary,
                color: colors.background,
              }}
            >
              Ajouter le premier utilisateur
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPanel;
