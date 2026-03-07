'use client';

import { useState } from 'react';
import { saveResolutionType } from '@/app/conductor/actions';
import type { IncidentItem } from '@/components/conductor/chat-interface';

interface ResolutionTypeStepProps {
    reportId: string;
    incidentDetails: IncidentItem[];
    onComplete: (nextStep: string) => void;
}

type ResolutionType = 'completa' | 'parcial' | 'sin_entrega';

const RESOLUTION_OPTIONS: { value: ResolutionType; label: string; description: string; icon: string }[] = [
    {
        value: 'completa',
        label: 'Entrega Completa',
        description: 'Se entregó todo el producto sin problema',
        icon: '✅',
    },
    {
        value: 'parcial',
        label: 'Entrega Parcial',
        description: 'Se entregó parte del producto, hubo artículos que no pudieron entregarse',
        icon: '⚠️',
    },
    {
        value: 'sin_entrega',
        label: 'Sin Entrega',
        description: 'No se pudo entregar ningún producto',
        icon: '❌',
    },
];

export default function ResolutionTypeStep({
    reportId,
    incidentDetails,
    onComplete,
}: ResolutionTypeStepProps) {
    const [selected, setSelected] = useState<ResolutionType | null>(null);
    const [failedItems, setFailedItems] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleConfirm() {
        if (!selected) return;
        if (selected === 'parcial' && failedItems.length === 0) {
            setError('Selecciona al menos un artículo que no se pudo entregar');
            return;
        }

        setSaving(true);
        setError(null);

        const result = await saveResolutionType(
            reportId,
            selected,
            selected === 'parcial' ? failedItems : undefined
        );

        if (result && 'error' in result && result.error) {
            setError(result.error);
            setSaving(false);
            return;
        }

        // Navegar al paso correcto
        if (selected === 'sin_entrega') {
            onComplete('finish');
        } else {
            onComplete('6');
        }
    }

    function toggleFailedItem(id: string) {
        setFailedItems((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    }

    return (
        <div className="bg-white rounded-xl border-2 border-green-200 p-5 mb-4 shadow-sm space-y-4">
            <div>
                <h3 className="font-bold text-gray-900 text-lg">Tipo de Resolución</h3>
                <p className="text-gray-500 text-sm">¿Cómo quedó la entrega?</p>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Opciones */}
            <div className="space-y-2">
                {RESOLUTION_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => {
                            setSelected(option.value);
                            setFailedItems([]);
                            setError(null);
                        }}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            selected === option.value
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-xl mt-0.5">{option.icon}</span>
                            <div>
                                <p
                                    className={`font-semibold text-sm ${
                                        selected === option.value ? 'text-green-800' : 'text-gray-800'
                                    }`}
                                >
                                    {option.label}
                                </p>
                                <p className="text-gray-500 text-xs mt-0.5">{option.description}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Checklist de artículos fallidos — solo para entrega parcial */}
            {selected === 'parcial' && incidentDetails.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-700">
                        Selecciona los artículos que <strong>NO</strong> se pudieron entregar:
                    </p>
                    {incidentDetails.map((item) => (
                        <label
                            key={item.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                failedItems.includes(item.id)
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={failedItems.includes(item.id)}
                                onChange={() => toggleFailedItem(item.id)}
                                className="w-4 h-4 text-red-600 rounded"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                    {item.productName}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Qty: {item.quantity} · {item.reason}
                                </p>
                            </div>
                        </label>
                    ))}
                </div>
            )}

            {selected === 'parcial' && incidentDetails.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                    No hay artículos de incidencia registrados para seleccionar.
                </p>
            )}

            {/* Botón confirmar */}
            {selected && (
                <button
                    onClick={handleConfirm}
                    disabled={saving || (selected === 'parcial' && incidentDetails.length > 0 && failedItems.length === 0)}
                    className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                    {saving ? 'Guardando...' : 'Confirmar y Continuar →'}
                </button>
            )}
        </div>
    );
}
