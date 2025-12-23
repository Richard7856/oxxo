'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { closeReport } from '@/app/comercial/actions';

interface CloseReportButtonProps {
    reportId: string;
    currentStatus: string;
}

export default function CloseReportButton({ reportId, currentStatus }: CloseReportButtonProps) {
    const [closing, setClosing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Solo mostrar botón si el reporte está abierto (draft o submitted)
    const canClose = currentStatus === 'draft' || currentStatus === 'submitted';

    if (!canClose) {
        return null;
    }

    async function handleClose() {
        if (!confirm('¿Estás seguro de que deseas cerrar este reporte? Esta acción marcará el reporte como completado.')) {
            return;
        }

        setClosing(true);
        setError(null);

        try {
            const result = await closeReport(reportId);
            
            if (result.error) {
                setError(result.error);
                setClosing(false);
            } else {
                // Redirigir al dashboard para mostrar el cambio
                router.push('/comercial');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'Error al cerrar el reporte');
            setClosing(false);
        }
    }

    return (
        <div className="flex flex-col items-end gap-2">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            )}
            <button
                onClick={handleClose}
                disabled={closing}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {closing ? (
                    <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Cerrando...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Cerrar Reporte
                    </>
                )}
            </button>
        </div>
    );
}

