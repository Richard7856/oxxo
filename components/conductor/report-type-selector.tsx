'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type ReporteType = 'entrega' | 'tienda_cerrada' | 'bascula';

interface ReportTypeOption {
    value: ReporteType;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

const REPORT_TYPES: ReportTypeOption[] = [
    {
        value: 'entrega',
        label: 'Entrega',
        description: 'Entrega de producto (completa o con incidencias)',
        color: 'blue',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
            </svg>
        ),
    },
    {
        value: 'tienda_cerrada',
        label: 'Tienda Cerrada',
        description: 'No es posible entregar porque la tienda está cerrada',
        color: 'red',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
            </svg>
        ),
    },
    {
        value: 'bascula',
        label: 'Báscula',
        description: 'Problemas o validación de báscula',
        color: 'purple',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                />
            </svg>
        ),
    },
];

export default function ReportTypeSelector({
    reporteId,
}: {
    reporteId: string;
}) {
    const router = useRouter();
    const [selectedType, setSelectedType] = useState<ReporteType | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleContinue() {
        if (!selectedType) {
            setError('Por favor selecciona un tipo de reporte');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Update reporte type
            const response = await fetch(`/api/reportes/${reporteId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo_reporte: selectedType,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al actualizar el reporte');
            }

            // Redirect to flow controller
            router.push(`/conductor/nuevo-reporte/${reporteId}/flujo`);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    }

    const getColorClasses = (color: string, isSelected: boolean) => {
        const colors = {
            red: {
                border: isSelected ? 'border-red-500' : 'border-gray-200',
                bg: isSelected ? 'bg-red-50' : 'bg-white',
                iconBg: 'bg-red-100',
                iconText: 'text-red-600',
            },
            orange: {
                border: isSelected ? 'border-orange-500' : 'border-gray-200',
                bg: isSelected ? 'bg-orange-50' : 'bg-white',
                iconBg: 'bg-orange-100',
                iconText: 'text-orange-600',
            },
            blue: {
                border: isSelected ? 'border-blue-500' : 'border-gray-200',
                bg: isSelected ? 'bg-blue-50' : 'bg-white',
                iconBg: 'bg-blue-100',
                iconText: 'text-blue-600',
            },
            purple: {
                border: isSelected ? 'border-purple-500' : 'border-gray-200',
                bg: isSelected ? 'bg-purple-50' : 'bg-white',
                iconBg: 'bg-purple-100',
                iconText: 'text-purple-600',
            },
        };
        return colors[color as keyof typeof colors];
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Selecciona el Tipo de Reporte
                </h2>
                <p className="text-gray-800">
                    Elige la opción que mejor describa la situación en la tienda
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Report Type Cards */}
            <div className="grid md:grid-cols-2 gap-4">
                {REPORT_TYPES.map((type) => {
                    const isSelected = selectedType === type.value;
                    const colors = getColorClasses(type.color, isSelected);

                    return (
                        <button
                            key={type.value}
                            onClick={() => setSelectedType(type.value)}
                            className={`border-2 ${colors.border} ${colors.bg} rounded-lg p-6 text-left transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${type.color}-500`}
                        >
                            <div className="flex items-start">
                                <div
                                    className={`flex-shrink-0 ${colors.iconBg} ${colors.iconText} rounded-lg p-3`}
                                >
                                    {type.icon}
                                </div>
                                <div className="ml-4 flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {type.label}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-800">{type.description}</p>
                                </div>
                                {isSelected && (
                                    <div className="flex-shrink-0 ml-2">
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
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Continue Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleContinue}
                    disabled={!selectedType || loading}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {loading ? 'Guardando...' : 'Continuar'}
                </button>
            </div>
        </div>
    );
}
