import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import UsersTable from '@/components/admin/users-table';

export default async function AdminUsersPage() {
    const supabase = await createClient();

    // Note: Acceso abierto como solicitado - en producción deberías agregar verificación de rol

    // Get all users with their profiles
    const { data: users } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

    // Zonas fijas: CDMX, Pachuca y Cuernavaca
    const zonas = ['CDMX', 'Pachuca', 'Cuernavaca'];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Administración de Usuarios</h1>
                            <p className="text-gray-600 mt-1">Gestiona roles y zonas de los usuarios</p>
                        </div>
                        <Link
                            href="/admin"
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            ← Volver al Admin
                        </Link>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <UsersTable initialUsers={users || []} zonas={zonas} />
            </div>
        </div>
    );
}

