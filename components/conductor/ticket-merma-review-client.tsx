'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TicketReview from './ticket-review';
import { ExtractedTicketData } from '@/lib/ai/extract-ticket-data';
import { saveTicketMermaData } from '@/app/conductor/actions';

interface TicketMermaReviewClientProps {
    reportId: string;
    ticketMermaImageUrl: string | null;
    initialTicketMermaData: any;
}

export default function TicketMermaReviewClient({
    reportId,
    ticketMermaImageUrl,
    initialTicketMermaData,
}: TicketMermaReviewClientProps) {
    const router = useRouter();
    const [extractedData, setExtractedData] = useState<ExtractedTicketData | null>(initialTicketMermaData);
    const [loading, setLoading] = useState(!initialTicketMermaData);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Si no hay datos iniciales y hay URL de ticket, extraer del ticket
        if (!initialTicketMermaData && ticketMermaImageUrl && typeof ticketMermaImageUrl === 'string' && ticketMermaImageUrl.startsWith('http')) {
            extractTicketData();
        } else if (!ticketMermaImageUrl) {
            // Si no hay ticket, no intentar extraer
            setLoading(false);
        }
    }, []);

    const extractTicketData = async () => {
        if (!ticketMermaImageUrl) {
            setError('No hay imagen de ticket disponible');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let imageUrl = ticketMermaImageUrl;
            
            // Si es una URL de blob o local, intentar obtener la URL pública desde el reporte
            if (ticketMermaImageUrl.startsWith('blob:') || !ticketMermaImageUrl.startsWith('http')) {
                const response = await fetch(`/api/reportes/${reportId}`);
                if (response.ok) {
                    const reportData = await response.json();
                    const evidence = reportData.evidence || {};
                    imageUrl = evidence['ticket_merma'] || ticketMermaImageUrl;
                }
            }

            // Asegurarse de que la URL sea accesible públicamente
            if (!imageUrl.startsWith('http')) {
                throw new Error('La imagen debe ser una URL pública');
            }

            const response = await fetch('/api/tickets/extract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageUrl }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Error al extraer datos del ticket');
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
        const result = await saveTicketMermaData(reportId, data);
        if (result.error) {
            throw new Error(result.error);
        }
        
        // Redirigir al paso final
        router.push(`/conductor/nuevo-reporte/${reportId}/flujo?step=finish`);
    };

    const handleBack = () => {
        router.push(`/conductor/nuevo-reporte/${reportId}/flujo?step=8c`);
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-4">
                <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Extrayendo datos del ticket de merma...
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
        if (!ticketMermaImageUrl) {
            return (
                <div className="max-w-4xl mx-auto p-4">
                    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                        <p className="text-gray-600 mb-4">No hay ticket de merma para procesar.</p>
                        <button
                            onClick={handleBack}
                            className="bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                        >
                            Volver
                        </button>
                    </div>
                </div>
            );
        }
        return null;
    }

    if (!ticketMermaImageUrl) {
        return null;
    }

    return (
        <TicketReview
            reportId={reportId}
            ticketImageUrl={ticketMermaImageUrl}
            mermaImageUrl={null}
            extractedData={extractedData}
            onSave={handleSave}
            onBack={handleBack}
            title="Revisar Datos del Ticket de Merma"
        />
    );
}

