'use client';

import { useState } from 'react';
import { UserRole } from '@/lib/types/database.types';
import { updateUserRoleAndZona, toggleUserActive } from '@/app/admin/usuarios/actions';

interface User {
    id: string;
    email: string;
    display_name: string;
    role: UserRole;
    zona: string | null;
    is_active: boolean;
    created_at: string;
}

interface UsersTableProps {
    initialUsers: User[];
    zonas: string[];
}

export default function UsersTable({ initialUsers, zonas }: UsersTableProps) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [saving, setSaving] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Record<string, { role: UserRole; zona: string | null }>>({});

    const handleEditStart = (userId: string) => {
        const user = users.find((u) => u.id === userId);
        if (user) {
            setEditValues({
                ...editValues,
                [userId]: { role: user.role, zona: user.zona },
            });
            setEditingUserId(userId);
        }
    };

    const handleEditCancel = (userId: string) => {
        const newEditValues = { ...editValues };
        delete newEditValues[userId];
        setEditValues(newEditValues);
        setEditingUserId(null);
    };

    const handleSave = async (userId: string) => {
        const editValue = editValues[userId];
        if (!editValue) return;

        const { role: newRole, zona: newZona } = editValue;

        // Validate comercial zona
        if (newRole === 'comercial' && !newZona) {
            alert('Los comerciales deben tener una zona asignada');
            return;
        }

        setSaving(userId);
        try {
            const result = await updateUserRoleAndZona(userId, newRole, newZona);
            if (result.error) {
                alert(result.error);
                return;
            }

            // Update local state
            setUsers((prev) =>
                prev.map((user) =>
                    user.id === userId ? { ...user, role: newRole, zona: newZona } : user
                )
            );
            
            // Clear edit values
            const newEditValues = { ...editValues };
            delete newEditValues[userId];
            setEditValues(newEditValues);
            setEditingUserId(null);
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error al guardar cambios');
        } finally {
            setSaving(null);
        }
    };

    const handleToggleActive = async (userId: string, currentActive: boolean) => {
        try {
            const result = await toggleUserActive(userId, !currentActive);
            if (result.error) {
                alert(result.error);
                return;
            }

            // Update local state
            setUsers((prev) =>
                prev.map((user) => (user.id === userId ? { ...user, is_active: !currentActive } : user))
            );
        } catch (error) {
            console.error('Error toggling user active:', error);
            alert('Error al actualizar el estado del usuario');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case 'administrador':
                return 'bg-purple-100 text-purple-800';
            case 'comercial':
                return 'bg-blue-100 text-blue-800';
            case 'conductor':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                    Usuarios ({users.length})
                </h2>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Usuario
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rol
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Zona
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha de Creación
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => {
                            const isEditing = editingUserId === user.id;
                            const isSaving = saving === user.id;

                            return (
                                <tr key={user.id} className={!user.is_active ? 'opacity-60' : ''}>
                                    {/* User Info */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {user.display_name}
                                            </div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </td>

                                    {/* Role */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {isEditing ? (
                                            <select
                                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900 text-sm"
                                                value={editValues[user.id]?.role || user.role}
                                                onChange={(e) =>
                                                    setEditValues({
                                                        ...editValues,
                                                        [user.id]: {
                                                            ...editValues[user.id],
                                                            role: e.target.value as UserRole,
                                                        },
                                                    })
                                                }
                                            >
                                                <option value="conductor">Conductor</option>
                                                <option value="comercial">Comercial</option>
                                                <option value="administrador">Administrador</option>
                                            </select>
                                        ) : (
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}
                                            >
                                                {user.role === 'administrador'
                                                    ? 'Administrador'
                                                    : user.role === 'comercial'
                                                    ? 'Comercial'
                                                    : 'Conductor'}
                                            </span>
                                        )}
                                    </td>

                                    {/* Zona */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {isEditing ? (
                                            <div>
                                                <select
                                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900 text-sm"
                                                    value={editValues[user.id]?.zona || user.zona || ''}
                                                    onChange={(e) =>
                                                        setEditValues({
                                                            ...editValues,
                                                            [user.id]: {
                                                                ...editValues[user.id],
                                                                zona: e.target.value || null,
                                                            },
                                                        })
                                                    }
                                                >
                                                    <option value="">Sin zona</option>
                                                    {zonas.map((zona) => (
                                                        <option key={zona} value={zona}>
                                                            {zona}
                                                        </option>
                                                    ))}
                                                </select>
                                                {editValues[user.id]?.role === 'comercial' && (
                                                    <p className="mt-1 text-xs text-red-600">
                                                        * Requerido para comerciales
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-900">
                                                {user.zona || (
                                                    <span className="text-gray-400">Sin zona</span>
                                                )}
                                            </span>
                                        )}
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleToggleActive(user.id, user.is_active)}
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                user.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            } hover:opacity-80 transition-opacity`}
                                        >
                                            {user.is_active ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </td>

                                    {/* Created At */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(user.created_at)}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {isEditing ? (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditCancel(user.id)}
                                                    className="text-gray-600 hover:text-gray-900"
                                                    disabled={isSaving}
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={() => handleSave(user.id)}
                                                    disabled={isSaving}
                                                    className="text-red-600 hover:text-red-900 font-semibold disabled:opacity-50"
                                                >
                                                    {isSaving ? 'Guardando...' : 'Guardar'}
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleEditStart(user.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Editar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {users.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <p>No hay usuarios registrados</p>
                </div>
            )}
        </div>
    );
}

