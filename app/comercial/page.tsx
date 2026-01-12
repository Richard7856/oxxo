import Link from "next/link";
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PWAInstallButton from '@/components/pwa-install-button';
import PushNotificationManager from '@/components/push-notification-manager';
import ActiveReportsList from '@/components/comercial/active-reports-list';
import CompletedReportsList from '@/components/comercial/completed-reports-list';

export default async function ComercialPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Verificar que el usuario sea comercial
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'comercial') {
        redirect('/');
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Panel de Comercial</h1>
                            <p className="text-gray-600 mt-2">Monitorea reportes de tu zona</p>
                        </div>
                        <Link
                            href="/"
                            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition-colors"
                        >
                            ← Volver al inicio
                        </Link>
                    </div>
                </div>

                {/* PWA Install Button (flotante) */}
                <PWAInstallButton />

                {/* Push Notifications */}
                <div className="mb-6">
                    <PushNotificationManager userId={user.id} />
                </div>

                {/* Status Card */}
                <div className="bg-green-50 border-l-4 border-green-400 p-6 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-6 w-6 text-green-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">
                                Notificaciones Push Activadas
                            </h3>
                            <div className="mt-2 text-sm text-green-700">
                                <p>
                                    Ahora puedes recibir notificaciones cuando los conductores envíen mensajes en el chat.
                                </p>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Instala la aplicación como PWA para mejor experiencia</li>
                                    <li>Activa las notificaciones push arriba</li>
                                    <li>Recibirás alertas cuando haya nuevos mensajes</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reportes Activos */}
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
                        <h3 className="ml-3 text-lg font-semibold text-gray-900">
                            Reportes Activos
                        </h3>
                    </div>

                    <ActiveReportsList userId={user.id} />
                </div>

                {/* Feature Cards */}
                <div className="grid md:grid-cols-2 gap-6">

                    <div className="bg-white rounded-lg shadow p-6">
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
                                Reportes Cerrados
                            </h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            Consulta reportes resueltos y completados de tu zona.
                        </p>
                        <CompletedReportsList userId={user.id} />
                    </div>
                </div>

            </div>
        </div>
    );
}
