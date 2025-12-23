import Link from "next/link";

export default function AdminPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Panel de Administrador
                            </h1>
                            <p className="text-gray-600 mt-2">Gestión completa del sistema</p>
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
                                Panel Administrativo en Desarrollo
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>El panel de administración está en construcción. Próximamente podrás:</p>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Gestionar usuarios (conductores, comerciales, admins)</li>
                                    <li>Asignar zonas geográficas a comerciales</li>
                                    <li>Ver estadísticas globales del sistema</li>
                                    <li>Exportar tickets procesados</li>
                                    <li>Configurar integraciones (n8n, OpenAI)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature Cards Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-6">
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
                            <h3 className="ml-3 text-lg font-semibold text-gray-900">Usuarios</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            Crear y gestionar usuarios del sistema con roles específicos.
                        </p>
                        <Link
                            href="/admin/usuarios"
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors text-center block"
                        >
                            Gestionar Usuarios
                        </Link>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-indigo-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="ml-3 text-lg font-semibold text-gray-900">Zonas</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            Gestionar zonas geográficas y asignar comerciales.
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
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <h3 className="ml-3 text-lg font-semibold text-gray-900">
                                Tickets Procesados
                            </h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            Exportar y analizar tickets procesados históricamente.
                        </p>
                        <button
                            disabled
                            className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed"
                        >
                            Próximamente
                        </button>
                    </div>
                </div>

                {/* Database Schema Info */}
                <div className="bg-purple-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4">
                        Esquema de Base de Datos Implementado
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white rounded p-4">
                            <h4 className="font-semibold text-purple-800 mb-2">Tablas Principales:</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                                <li>✅ <code className="bg-gray-100 px-1">user_profiles</code> - Usuarios y roles</li>
                                <li>✅ <code className="bg-gray-100 px-1">stores</code> - Tiendas OXXO</li>
                                <li>✅ <code className="bg-gray-100 px-1">reportes</code> - Reportes de entrega</li>
                                <li>✅ <code className="bg-gray-100 px-1">messages</code> - Chat en tiempo real</li>
                                <li>✅ <code className="bg-gray-100 px-1">processed_tickets</code> - Archivo histórico</li>
                            </ul>
                        </div>
                        <div className="bg-white rounded p-4">
                            <h4 className="font-semibold text-purple-800 mb-2">Características:</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                                <li>✅ 14 migraciones SQL aplicables</li>
                                <li>✅ RLS policies por rol (conductor/comercial/admin)</li>
                                <li>✅ Triggers automáticos para timestamps</li>
                                <li>✅ Función atómica para crear reportes</li>
                                <li>✅ Índices optimizados para queries</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-4 bg-white rounded p-4">
                        <h4 className="font-semibold text-purple-800 mb-2">Estado del Sistema:</h4>
                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span>Arquitectura: Completa</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span>UI: En desarrollo</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span>Integraciones: Pendiente</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
