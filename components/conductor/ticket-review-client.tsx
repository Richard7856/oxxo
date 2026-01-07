'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TicketReview from './ticket-review';
import { ExtractedTicketData } from '@/lib/ai/extract-ticket-data';
import { saveTicketData, submitReport } from '@/app/conductor/actions';

interface TicketReviewClientProps {
    reportId: string;
    ticketImageUrl: string | null;
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
        // Si hay datos iniciales, no intentar extraer
        if (initialTicketData) {
            setLoading(false);
            return;
        }

        // Si no hay URL de ticket, no intentar extraer
        if (!ticketImageUrl) {
            console.log('No hay URL de ticket disponible');
            setLoading(false);
            return;
        }

        // Intentar extraer datos del ticket
        console.log('Iniciando extracción de datos del ticket', { ticketImageUrl });
        extractTicketData();
    }, []);

    const extractTicketData = async () => {
        if (!ticketImageUrl) {
            setError('No hay imagen de ticket disponible');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // La URL debe ser una URL pública de Supabase
            let imageUrl = ticketImageUrl;
            
            console.log('URL original del ticket:', ticketImageUrl);
            
            // Si es una URL de blob o local, intentar obtener la URL pública desde el reporte
            if (ticketImageUrl.startsWith('blob:') || !ticketImageUrl.startsWith('http')) {
                console.log('URL no es pública, obteniendo desde el reporte...');
                // Obtener la URL pública desde el reporte
                const reportResponse = await fetch(`/api/reportes/${reportId}`);
                if (reportResponse.ok) {
                    const reportData = await reportResponse.json();
                    const evidence = reportData.reporte?.evidence || reportData.evidence || {};
                    console.log('Evidence del reporte:', evidence);
                    imageUrl = evidence['ticket_recibido'] || evidence['ticket'] || ticketImageUrl;
                    console.log('URL obtenida del reporte:', imageUrl);
                } else {
                    throw new Error('No se pudo obtener la información del reporte');
                }
            }

            // Asegurarse de que la URL sea accesible públicamente
            if (!imageUrl.startsWith('http')) {
                throw new Error(`La imagen debe ser una URL pública. URL recibida: ${imageUrl}`);
            }

            // Verificar que la URL sea accesible (hacer un HEAD request)
            console.log('Verificando accesibilidad de la imagen:', imageUrl);
            try {
                const testResponse = await fetch(imageUrl, { method: 'HEAD', mode: 'no-cors' });
                console.log('Imagen accesible (verificación completa)');
            } catch (testError) {
                console.warn('Advertencia: No se pudo verificar accesibilidad de la imagen, continuando de todas formas');
            }

            console.log('Enviando solicitud de extracción con URL:', imageUrl);

            const response = await fetch('/api/tickets/extract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageUrl }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `Error HTTP ${response.status}: ${response.statusText}`;
                console.error('Error en la respuesta del servidor:', errorMessage);
                
                // Si es error de límite, mostrar mensaje específico
                if (response.status === 429 || errorData.quotaExceeded || errorMessage.includes('CUOTA_EXCEDIDA') || errorMessage.includes('RATE_LIMIT') || errorMessage.includes('LÍMITE_EXCEDIDO')) {
                    if (errorMessage.includes('RATE_LIMIT')) {
                        // Rate limiting - sugerir esperar
                        setError('⚠️ Demasiadas solicitudes en poco tiempo. Por favor espera unos minutos antes de intentar de nuevo. La extracción automática estará disponible en breve.');
                    } else if (errorMessage.includes('CUOTA_EXCEDIDA') || errorMessage.includes('LÍMITE_EXCEDIDO')) {
                        // Cuota de saldo o límite
                        setError('⚠️ Se excedió el límite de la API de Gemini. Por favor, espera unos minutos o verifica tu cuenta en https://aistudio.google.com/app/apikey. La extracción automática no está disponible en este momento.');
                    } else if (errorMessage.includes('API_KEY_INVALIDA')) {
                        // API key inválida
                        setError('⚠️ La clave de API de Gemini no es válida. Por favor, verifica la configuración del servidor.');
                    } else {
                        // Error 429 genérico
                        setError(`⚠️ ${errorMessage}. La extracción automática no está disponible en este momento. Puedes ingresar los datos manualmente.`);
                    }
                    setLoading(false);
                    return;
                }
                
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('Respuesta completa del servidor:', result);
            console.log('Datos extraídos recibidos:', JSON.stringify(result.data, null, 2));
            
            if (!result.data) {
                throw new Error('No se recibieron datos del servidor. La respuesta fue: ' + JSON.stringify(result));
            }

            // Verificar que los datos no estén vacíos
            const data = result.data;
            
            // Verificar si hay un error en la respuesta raw
            if (data.rawResponse && typeof data.rawResponse === 'string') {
                if (data.rawResponse.includes('429') || data.rawResponse.includes('rate_limit') || data.rawResponse.includes('rate limit')) {
                    setError('⚠️ Demasiadas solicitudes en poco tiempo. Por favor espera unos minutos antes de intentar de nuevo. La extracción automática estará disponible en breve.');
                    setLoading(false);
                    return;
                } else if (data.rawResponse.includes('quota') || data.rawResponse.includes('exceeded') || data.rawResponse.includes('insufficient_quota') || data.rawResponse.includes('RESOURCE_EXHAUSTED')) {
                    setError('⚠️ Se excedió el límite de la API de Gemini. Por favor, espera unos minutos o verifica tu cuenta en https://aistudio.google.com/app/apikey. La extracción automática no está disponible en este momento.');
                    setLoading(false);
                    return;
                }
            }
            
            if (!data.productos || data.productos.length === 0) {
                console.warn('No se extrajeron productos del ticket');
            }
            if (!data.codigo_tienda && !data.tienda && !data.orden_compra) {
                console.warn('No se extrajeron datos básicos del ticket');
            }

            setExtractedData(data);
            console.log('Datos extraídos establecidos correctamente:', {
                codigo_tienda: data.codigo_tienda,
                tienda: data.tienda,
                fecha: data.fecha,
                orden_compra: data.orden_compra,
                productos: data.productos?.length || 0,
                subtotal: data.subtotal,
                total: data.total,
                confidence: data.confidence
            });
        } catch (err: any) {
            const errorMessage = err.message || 'Error al procesar el ticket';
            console.error('Error extracting ticket:', err);
            setError(errorMessage);
            // Mantener el estado de loading en false para mostrar el error
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: ExtractedTicketData) => {
        // Primero guardar los datos del ticket de recibido
        const saveResult = await saveTicketData(reportId, data);
        if (saveResult.error) {
            throw new Error(saveResult.error);
        }
        
        // Verificar si hay merma en el metadata del reporte
        const reportResponse = await fetch(`/api/reportes/${reportId}`);
        if (reportResponse.ok) {
            const reportData = await reportResponse.json();
            const metadata = reportData.metadata || {};
            const hasMerma = metadata.has_merma;
            
            // Si no hay merma, ir directamente a finish
            if (hasMerma === false) {
                router.push(`/conductor/nuevo-reporte/${reportId}/flujo?step=finish`);
                return;
            }
        }
        
        // Si hay merma o no se pudo verificar, preguntar por ticket de merma
        router.push(`/conductor/nuevo-reporte/${reportId}/flujo?step=8c`);
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
                            Extrayendo datos del ticket con Gemini. Esto puede tomar unos segundos. Por favor espera.
                        </p>
                </div>
            </div>
        );
    }

    if (error && !extractedData) {
        // Si es error de límite o cuota, permitir ingresar datos manualmente
        const isQuotaError = error.includes('cuota') || error.includes('quota') || error.includes('CUOTA_EXCEDIDA') || error.includes('exceeded') || error.includes('RATE_LIMIT') || error.includes('LÍMITE_EXCEDIDO');
        const isRateLimitError = error.includes('RATE_LIMIT') || error.includes('Demasiadas solicitudes');
        
        return (
            <div className="max-w-4xl mx-auto p-4">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className={`border-l-4 p-4 mb-4 ${isQuotaError ? (isRateLimitError ? 'bg-blue-50 border-blue-400' : 'bg-yellow-50 border-yellow-400') : 'bg-red-50 border-red-400'}`}>
                        <h3 className={`text-lg font-semibold mb-2 ${isQuotaError ? (isRateLimitError ? 'text-blue-800' : 'text-yellow-800') : 'text-red-800'}`}>
                            {isRateLimitError ? '⏱️ Demasiadas Solicitudes' : isQuotaError ? '⚠️ Cuota de API Excedida' : 'Error al extraer datos'}
                        </h3>
                        <p className={isQuotaError ? (isRateLimitError ? 'text-blue-700' : 'text-yellow-700') : 'text-red-700'}>{error}</p>
                        {isQuotaError && (
                            <div className={`mt-3 text-sm ${isRateLimitError ? 'text-blue-600' : 'text-yellow-600'}`}>
                                <p>{isRateLimitError ? 'Espera unos minutos y vuelve a intentar, o puedes ingresar los datos manualmente.' : 'Puedes ingresar los datos del ticket manualmente usando el botón abajo.'}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleBack}
                            className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                        >
                            Volver
                        </button>
                        {isQuotaError ? (
                            <button
                                onClick={() => {
                                    // Permitir ingresar datos manualmente estableciendo datos vacíos
                                    setExtractedData({
                                        codigo_tienda: null,
                                        tienda: null,
                                        fecha: null,
                                        orden_compra: null,
                                        productos: [],
                                        subtotal: null,
                                        total: null,
                                        confidence: 0,
                                        rawResponse: 'Manual entry due to quota exceeded',
                                    });
                                    setError(null);
                                }}
                                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                                Ingresar Datos Manualmente
                            </button>
                        ) : (
                            <button
                                onClick={extractTicketData}
                                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                                Reintentar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (!extractedData) {
        if (!ticketImageUrl) {
            return (
                <div className="max-w-4xl mx-auto p-4">
                    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                        <p className="text-gray-600 mb-4">No hay ticket de recibido para procesar.</p>
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
        
        // Si hay error o no se pudieron extraer datos
        if (error) {
            return (
                <div className="max-w-4xl mx-auto p-4">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                            <h3 className="text-lg font-semibold text-red-800 mb-2">Error al extraer datos</h3>
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
                                Reintentar Extracción
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        
        // Si está cargando, ya se mostró arriba, pero por si acaso
        return null;
    }

    if (!ticketImageUrl) {
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

