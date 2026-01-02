'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { closeReport } from '@/app/comercial/actions';

interface CloseReportButtonProps {
    reportId: string;
}

export default function CloseReportButton({ reportId }: CloseReportButtonProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleClose = async () => {
        if (!confirm('¿Estás seguro de que deseas cerrar este reporte? Esta acción no se puede deshacer.')) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await closeReport(reportId);
            if (result.error) {
                setError(result.error);
            } else {
                // Recargar la página para mostrar el nuevo estado
                router.refresh();
            }
        } catch (err: any) {
            setError('Error al cerrar el reporte');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {error && (
                <div className="mb-2 bg-red-50 border-l-4 border-red-400 p-2 rounded">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}
            <button
                onClick={handleClose}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Cerrando...' : 'Cerrar Reporte'}
            </button>
        </div>
    );
}

