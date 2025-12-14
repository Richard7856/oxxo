import Link from "next/link";

export default function ComercialPage() {
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

                {/* Status Card */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-6 w-6 text-yellow-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                                Dashboard en Desarrollo
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>
                                    El dashboard de comerciales está en construcción. Próximamente podrás:
                                </p>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Ver reportes filtrados por tu zona asignada</li>
                                    <li>Acceder al chat con conductores</li>
                                    <li>Ver estadísticas de entregas</li>
                                    <li>Exportar reportes históricos</li>
                                    <li>Recibir notificaciones en tiempo real</li>
                                </ul>
                            </div>
                        </div>
                    </div>
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
                        <p className="text-gray-600 text-sm mb-4">
                            Lista de reportes pendientes de resolución en tu zona geográfica.
                        </p>
                        <button
                            disabled
                            className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed"
                        >
                            Próximamente
                        </button>
                    </div>

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
                                Historial
                            </h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            Consulta reportes resueltos y exporta datos para análisis.
                        </p>
                        <button
                            disabled
                            className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed"
                        >
                            Próximamente
                        </button>
                    </div>
                </div>

                {/* RLS Info */}
                <div className="mt-6 bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">
                        Seguridad Row Level Security (RLS)
                    </h3>
                    <div className="text-sm text-blue-800 space-y-2">
                        <p>
                            <strong>✅ Implementado:</strong> Los comerciales solo pueden ver reportes
                            de su zona asignada.
                        </p>
                        <p className="mt-2">
                            <strong>Política de acceso:</strong>
                        </p>
                        <code className="block bg-blue-100 p-3 rounded mt-2 text-xs overflow-x-auto">
                            WHERE EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role
                            = 'comercial' AND zona = reportes.store_zona)
                        </code>
                    </div>
                </div>
            </div>
        </div>
    );
}
