import Link from "next/link";
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AllReportsList from '@/components/admin/all-reports-list';
import UsersList from '@/components/admin/users-list';
import PWAInstallButton from '@/components/pwa-install-button';
import PushNotificationManager from '@/components/push-notification-manager';
import AdminActiveReportsList from '@/components/admin/admin-active-reports-list';
import AdminCompletedReportsList from '@/components/admin/admin-completed-reports-list';

export default async function AdminPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Verificar que el usuario sea administrador
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'administrador') {
        redirect('/');
    }

    // Obtener estadísticas
    const { count: totalReports } = await supabase
        .from('reportes')
        .select('*', { count: 'exact', head: true });

    const { count: activeReports } = await supabase
        .from('reportes')
        .select('*', { count: 'exact', head: true })
        .in('status', ['draft', 'submitted', 'resolved_by_driver']);

    const { count: completedReports } = await supabase
        .from('reportes')
        .select('*', { count: 'exact', head: true })
        .in('status', ['completed']);

    const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

    // Obtener zonas únicas
    const { data: zonasData } = await supabase
        .from('reportes')
        .select('store_zona')
        .not('store_zona', 'is', null);

    const zonasUnicas = [...new Set(zonasData?.map(r => r.store_zona) || [])];

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Panel de Administrador</h1>
                            <p className="text-gray-600 mt-2">Gestión completa del sistema - Acceso a todas las zonas</p>
                        </div>
                        <Link
                            href="/"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                        >
                            ← Volver al inicio
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Reportes</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{totalReports || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Reportes Activos</p>
                                <p className="text-3xl font-bold text-blue-600 mt-2">{activeReports || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Reportes Completados</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">{completedReports || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Usuarios</p>
                                <p className="text-3xl font-bold text-purple-600 mt-2">{totalUsers || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PWA and Notifications */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <PWAInstallButton />
                    <PushNotificationManager userId={user.id} />
                </div>

                {/* Zonas */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Zonas Activas</h2>
                    <div className="flex flex-wrap gap-2">
                        {zonasUnicas.length > 0 ? (
                            zonasUnicas.map((zona) => (
                                <span
                                    key={zona}
                                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                                >
                                    {zona}
                                </span>
                            ))
                        ) : (
                            <p className="text-sm text-gray-600">No hay zonas registradas</p>
                        )}
                    </div>
                </div>

                {/* Reportes Activos - Vista Detallada */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg
                                className="w-6 h-6 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Reportes Activos (Todas las Zonas)
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Incluye reportes enviados y en proceso (borradores)
                            </p>
                        </div>
                    </div>
                    <AdminActiveReportsList />
                </div>

                {/* Reportes Completados - Vista Detallada */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg
                                className="w-6 h-6 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h3 className="ml-3 text-lg font-semibold text-gray-900">
                            Reportes Completados (Todas las Zonas)
                        </h3>
                    </div>
                    <AdminCompletedReportsList />
                </div>

                {/* Usuarios */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-purple-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="ml-3 text-lg font-semibold text-gray-900">
                            Todos los Usuarios
                            </h3>
                    </div>
                    <UsersList />
                </div>
            </div>
        </div>
    );
}
