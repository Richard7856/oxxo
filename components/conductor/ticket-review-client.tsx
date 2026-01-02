'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TicketReview from './ticket-review';
import { ExtractedTicketData } from '@/lib/ai/extract-ticket-data';
import { saveTicketData } from '@/app/conductor/actions';

interface TicketReviewClientProps {
    reportId: string;
    ticketImageUrl: string;
    mermaImageUrl: string | null;
    initialTicketData: any;
}

export default function TicketReviewClient({
    reportId,
    ticketImageUrl,
    mermaImageUrl,
    initialTicketData,
}: TicketReviewClientProps) {
    const router = useRouter();
    const [extractedData, setExtractedData] = useState<ExtractedTicketData | null>(initialTicketData);
    const [loading, setLoading] = useState(!initialTicketData);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Si no hay datos iniciales, extraer del ticket
        if (!initialTicketData && ticketImageUrl) {
            extractTicketData();
        }
    }, []);

    const extractTicketData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Convertir la URL local a una URL pública si es necesario
            // Si es una URL de Supabase, usarla directamente
            const imageUrl = ticketImageUrl.startsWith('http') 
                ? ticketImageUrl 
                : ticketImageUrl;

            const response = await fetch('/api/tickets/extract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageUrl }),
            });

            if (!response.ok) {
                throw new Error('Error al extraer datos del ticket');
            }

            const result = await response.json();
            setExtractedData(result.data);
        } catch (err: any) {
            setError(err.message || 'Error al procesar el ticket');
            console.error('Error extracting ticket:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: ExtractedTicketData) => {
        const result = await saveTicketData(reportId, data);
        if (result.error) {
            throw new Error(result.error);
        }
        // Redirigir al siguiente paso
        router.push(`/conductor/nuevo-reporte/${reportId}/flujo?step=return_check`);
    };

    const handleBack = () => {
        router.push(`/conductor/nuevo-reporte/${reportId}/flujo?step=8`);
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-4">
                <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Extrayendo datos del ticket...
                    </h2>
                    <p className="text-gray-600">
                        Esto puede tomar unos segundos. Por favor espera.
                    </p>
                </div>
            </div>
        );
    }

    if (error && !extractedData) {
        return (
            <div className="max-w-4xl mx-auto p-4">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                        <p className="text-red-700">{error}</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleBack}
                            className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                        >
                            Volver
                        </button>
                        <button
                            onClick={extractTicketData}
                            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!extractedData) {
        return null;
    }

    return (
        <TicketReview
            reportId={reportId}
            ticketImageUrl={ticketImageUrl}
            mermaImageUrl={mermaImageUrl}
            extractedData={extractedData}
            onSave={handleSave}
            onBack={handleBack}
        />
    );
}

