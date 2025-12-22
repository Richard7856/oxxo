'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StoreValidationForm({ userId }: { userId: string }) {
    const router = useRouter();
    const [codigoTienda, setCodigoTienda] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [storeData, setStoreData] = useState<any>(null);

    // Regex for store code format: 50CUE (2 numbers + 3 uppercase letters)
    const STORE_CODE_REGEX = /^\d{2}[A-Z]{3}$/;

    async function handleValidate() {
        const code = codigoTienda.trim().toUpperCase();

        if (!code) {
            setError('Por favor ingresa un código de tienda');
            return;
        }

        if (!STORE_CODE_REGEX.test(code)) {
            setError('El código debe tener el formato 50CUE (2 números y 3 letras mayúsculas)');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Call validation API
            const response = await fetch('/api/stores/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo_tienda: code }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al validar la tienda');
            }

            setStoreData(data.store);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleConfirm() {
        setLoading(true);
        setError(null);

        try {
            // Create reporte
            const response = await fetch('/api/reportes/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    store_id: storeData.id,
                    user_id: userId,
                    conductor_nombre: 'Conductor', // We'll get this from profile later
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al crear el reporte');
            }

            // Redirect to next step
            router.push(`/conductor/nuevo-reporte/${data.reporte_id}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (storeData) {
        // Confirmation view
        return (
            <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Confirmar Tienda
                </h2>

                {/* Store Details */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-6 w-6 text-green-600"
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
                        <div className="ml-3 flex-1">
                            <h3 className="text-lg font-semibold text-green-900 mb-3">
                                Tienda Validada
                            </h3>
                            <dl className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <dt className="font-medium text-green-800">Código:</dt>
                                    <dd className="text-green-900">{storeData.codigo_tienda}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-green-800">Zona:</dt>
                                    <dd className="text-green-900">{storeData.zona}</dd>
                                </div>
                                <div className="col-span-2">
                                    <dt className="font-medium text-green-800">Nombre:</dt>
                                    <dd className="text-green-900">{storeData.nombre}</dd>
                                </div>
                                {storeData.direccion && (
                                    <div className="col-span-2">
                                        <dt className="font-medium text-green-800">Dirección:</dt>
                                        <dd className="text-green-900">{storeData.direccion}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            setStoreData(null);
                            setCodigoTienda('');
                        }}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                        Cambiar Tienda
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400"
                    >
                        {loading ? 'Creando reporte...' : 'Confirmar y Continuar'}
                    </button>
                </div>
            </div>
        );
    }

    // Input view
    return (
        <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Validar Código de Tienda
            </h2>
            <p className="text-gray-600 mb-6">
                Ingresa el código de la tienda OXXO para comenzar el reporte
            </p>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-5 w-5 text-red-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label
                        htmlFor="codigo"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Código de Tienda
                    </label>
                    <input
                        id="codigo"
                        type="text"
                        value={codigoTienda}
                        onChange={(e) => setCodigoTienda(e.target.value.toUpperCase())}
                        onKeyPress={(e) => e.key === 'Enter' && handleValidate()}
                        placeholder="Ej: 50CUE"
                        maxLength={5}
                        autoCapitalize="characters"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-lg font-mono uppercase text-gray-900 placeholder-gray-600"
                        disabled={loading}
                    />
                    <p className="mt-2 text-sm text-gray-700">
                        Formato: 2 números + 3 letras (Ej: 50CUE)
                    </p>
                </div>

                <button
                    onClick={handleValidate}
                    disabled={loading || !codigoTienda.trim()}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {loading ? 'Validando...' : 'Validar Tienda'}
                </button>
            </div>

            {/* Info */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    💡 El código de tienda debe estar registrado en el sistema. Si la
                    tienda no existe, contacta al administrador.
                </p>
            </div>
        </div>
    );
}
