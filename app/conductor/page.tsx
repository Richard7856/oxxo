import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import CancelReportButton from '@/components/conductor/cancel-report-button';

export default async function ConductorPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Ensure user has a profile (create if missing)
    const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (!profile && !profileError) {
        // Create profile if it doesn't exist
        await supabase
            .from('user_profiles')
            .insert({
                id: user.id,
                email: user.email!,
                role: 'conductor',
                display_name: user.email!.split('@')[0],
            });
    }



    // Check for active reporte (solo borradores, no enviados)
    const { data: activeReporte } = await supabase
        .from('reportes')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    return (
        <div className="max-w-2xl mx-auto">
            {/* Active Reporte Alert - Replaces Auto Redirect */}
            {activeReporte && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded shadow-sm">
                    <div className="flex justify-between items-center">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    Tienes un reporte pendiente en <strong>{activeReporte.store_nombre || 'Tienda'}</strong>
                                </p>
                                <p className="text-xs text-yellow-600 mt-1">
                                    Creado: {new Date(activeReporte.created_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Link
                                href={`/conductor/nuevo-reporte/${activeReporte.id}`}
                                className="bg-yellow-100 text-yellow-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-yellow-200"
                            >
                                Continuar
                            </Link>
                            <CancelReportButton reportId={activeReporte.id} />
                        </div>
                    </div>
                </div>
            )}

            {/* Welcome Card */}
            <div className="bg-white rounded-lg shadow p-8 text-center mb-8">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                        className="w-10 h-10 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    ¡Bienvenido, Conductor!
                </h2>
                <p className="text-gray-600 mb-6">
                    Crea un nuevo reporte de entrega siguiendo los pasos del asistente
                </p>
                <Link
                    href="/conductor/nuevo-reporte"
                    className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                    Crear Nuevo Reporte
                </Link>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg
                                className="w-6 h-6 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24  24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                            </svg>
                        </div>
                        <h3 className="ml-3 text-lg font-semibold text-gray-900">
                            Proceso Guiado
                        </h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                        Sigue un proceso paso a paso para crear tus reportes de entrega con
                        validación automática.
                    </p>
                </div>

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
                                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                        </div>
                        <h3 className="ml-3 text-lg font-semibold text-gray-900">
                            Captura de Evidencias
                        </h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                        Toma fotos de tickets y evidencias directamente desde tu dispositivo
                        con extracción automática de datos.
                    </p>
                </div>
            </div>

            {/* Info */}
            <div className="mt-8 bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    Tipos de Reporte Disponibles
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start">
                        <svg
                            className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        <span>
                            <strong>Rechazo Completo:</strong> Cuando la tienda rechaza toda
                            la mercancía
                        </span>
                    </li>
                    <li className="flex items-start">
                        <svg
                            className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        <span>
                            <strong>Rechazo Parcial:</strong> Cuando solo rechazan algunos
                            productos
                        </span>
                    </li>
                    <li className="flex items-start">
                        <svg
                            className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        <span>
                            <strong>Devolución:</strong> Recoges producto de la tienda
                        </span>
                    </li>
                    <li className="flex items-start">
                        <svg
                            className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        <span>
                            <strong>Faltante/Sobrante:</strong> Discrepancias en inventario
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
