import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function UsersList() {
    const supabase = await createClient();
    
    // Obtener TODOS los usuarios
    const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching users:', error);
        return (
            <div className="text-sm text-red-600">
                <p>Error al cargar los usuarios. Intenta recargar la página.</p>
            </div>
        );
    }

    if (!users || users.length === 0) {
        return (
            <div className="text-sm text-gray-600">
                <p>No hay usuarios registrados.</p>
            </div>
        );
    }

    const roleLabels: Record<string, { label: string; color: string }> = {
        conductor: { label: 'Conductor', color: 'bg-blue-100 text-blue-800' },
        comercial: { label: 'Comercial', color: 'bg-green-100 text-green-800' },
        administrador: { label: 'Administrador', color: 'bg-purple-100 text-purple-800' },
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                            Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                            Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                            Rol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                            Zona
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                            Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                            Creado
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => {
                        const roleInfo = roleLabels[user.role] || { label: user.role, color: 'bg-gray-100 text-gray-800' };
                        return (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {user.full_name || user.display_name || 'Sin nombre'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-600">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${roleInfo.color}`}>
                                        {roleInfo.label}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-600">{user.zona || 'N/A'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {user.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                    {new Date(user.created_at).toLocaleDateString('es-MX')}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}





