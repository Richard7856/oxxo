import Link from "next/link";
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PWAInstallButton from '@/components/pwa-install-button';
import PushNotificationManager from '@/components/push-notification-manager';
import AdminActiveReportsList from '@/components/admin/admin-active-reports-list';
import AdminCompletedReportsList from '@/components/admin/admin-completed-reports-list';
import NotificationToggle from '@/components/admin/notification-toggle';
import ReportsLimitSelect from '@/components/shared/reports-limit-select';

const clampLimit = (n: number) => Math.min(50, Math.max(10, n));

export default async function AdminPage({
    searchParams,
}: {
    searchParams: Promise<{ limitActive?: string; limitCompleted?: string }>;
}) {
    const params = await searchParams;
    const limitActive = clampLimit(Number(params?.limitActive) || 10);
    const limitCompleted = clampLimit(Number(params?.limitCompleted) || 10);
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

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Panel de Administrador</h1>
                            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Gestión completa del sistema - Acceso a todas las zonas</p>
                        </div>
                        <Link
                            href="/"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm sm:text-base whitespace-nowrap self-start sm:self-auto"
                        >
                            ← Volver al inicio
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
                    <div className="bg-white rounded-lg shadow p-4 sm:p-5 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex-1">
                                <p className="text-xs sm:text-sm text-gray-600">Total Reportes</p>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{totalReports || 0}</p>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4 sm:p-5 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex-1">
                                <p className="text-xs sm:text-sm text-gray-600">Reportes Activos</p>
                                <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1 sm:mt-2">{activeReports || 0}</p>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4 sm:p-5 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex-1">
                                <p className="text-xs sm:text-sm text-gray-600">Reportes Completados</p>
                                <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1 sm:mt-2">{completedReports || 0}</p>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PWA Install Button (flotante) */}
                <PWAInstallButton />

                {/* Push Notifications con Toggle integrado */}
                <div className="mb-6">
                    <div className="bg-white rounded-lg shadow p-4">
                        <h3 className="font-semibold text-lg mb-2 text-gray-800">Notificaciones Push</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Recibe notificaciones cuando haya nuevos mensajes en el chat
                        </p>
                        <div className="mb-4">
                            <NotificationToggle userId={user.id} />
                        </div>
                        <PushNotificationManager userId={user.id} />
                    </div>
                </div>

                {/* Reportes Activos */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">Reportes Activos (Todas las Zonas)</h3>
                            <p className="text-sm text-gray-600 mt-1">Incluye reportes enviados y en proceso (borradores)</p>
                        </div>
                    </div>
                    <Suspense fallback={<div className="text-sm text-gray-500">Cargando...</div>}>
                        <ReportsLimitSelect listType="active" currentLimit={limitActive} />
                    </Suspense>
                    <AdminActiveReportsList limit={limitActive} />
                </div>

                {/* Reportes Completados */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="ml-3 text-lg font-semibold text-gray-900">Reportes Completados (Todas las Zonas)</h3>
                    </div>
                    <Suspense fallback={<div className="text-sm text-gray-500">Cargando...</div>}>
                        <ReportsLimitSelect listType="completed" currentLimit={limitCompleted} />
                    </Suspense>
                    <AdminCompletedReportsList limit={limitCompleted} />
                </div>
            </div>
        </div>
    );
}
