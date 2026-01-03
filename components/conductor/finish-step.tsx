'use client';

import { useState } from 'react';
import { submitReport } from '@/app/conductor/actions';

interface FinishStepProps {
    reportId: string;
    onComplete: () => void;
}

export default function FinishStep({ reportId, onComplete }: FinishStepProps) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);

        try {
            const result = await submitReport(reportId);
            if (result.error) {
                setError(result.error);
                setSubmitting(false);
            } else {
                // Redirigir después de enviar
                onComplete();
            }
        } catch (err: any) {
            setError(err.message || 'Error al enviar el reporte');
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Reporte Completado!</h2>
            <p className="text-gray-600 mb-8">Tu reporte está listo para ser enviado.</p>
            
            {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-green-600 text-white px-8 py-3 rounded-lg w-full hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
                {submitting ? 'Enviando...' : 'Enviar Reporte'}
            </button>
        </div>
    );
}

