'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Message {
    id: string;
    text: string | null;
    sender: string;
    created_at: string;
}

interface ReportTimelineProps {
    report: {
        id: string;
        status: string;
        tipo_reporte: string | null;
        created_at: string;
        submitted_at: string | null;
        resolved_at: string | null;
        timeout_at: string | null;
        updated_at: string;
    };
    messages: Message[];
    evidence: Record<string, string>;
}

// Mapeo de claves de evidencia a nombres descriptivos y orden
const EVIDENCE_LABELS: Record<string, { label: string; step: number; icon: string }> = {
    arrival_exhibit: { label: 'Foto de Llegada - Primera', step: 1, icon: '📸' },
    arrival_exhibit_2: { label: 'Foto de Llegada - Segunda', step: 1, icon: '📸' },
    product_arranged: { label: 'Foto de Acomodo - Primera', step: 2, icon: '📦' },
    product_arranged_2: { label: 'Foto de Acomodo - Segunda', step: 2, icon: '📦' },
    waste_evidence: { label: 'Evidencia de Merma', step: 3, icon: '🗑️' },
    remission: { label: 'Remisión Firmada', step: 3, icon: '📄' },
    ticket: { label: 'Ticket de Entrega', step: 4, icon: '🎫' },
    return_ticket: { label: 'Ticket de Devolución', step: 5, icon: '🔄' },
};

// Obtener el nombre de una evidencia, incluyendo fotos de incidencias
function getEvidenceLabel(key: string): { label: string; icon: string } {
    if (EVIDENCE_LABELS[key]) {
        return { label: EVIDENCE_LABELS[key].label, icon: EVIDENCE_LABELS[key].icon };
    }
    if (key.startsWith('incident_photo_')) {
        return { label: 'Foto de Incidencia', icon: '📷' };
    }
    return { label: key, icon: '📎' };
}

export default function ReportTimeline({ report, messages, evidence }: ReportTimelineProps) {
    const [expandedImage, setExpandedImage] = useState<string | null>(null);

    // Construir eventos de la línea de tiempo
    const timelineEvents: Array<{
        type: 'creation' | 'submission' | 'message' | 'resolution' | 'timeout' | 'evidence';
        title: string;
        description: string;
        timestamp: string;
        icon: string;
        color: string;
        images?: string[];
    }> = [];

    // Evento: Creación
    timelineEvents.push({
        type: 'creation',
        title: 'Reporte Creado',
        description: 'El conductor inició el reporte',
        timestamp: report.created_at,
        icon: '📝',
        color: 'bg-blue-500',
    });

    // Eventos: Evidencias (fotos) - ordenadas por paso
    const evidenceEntries = Object.entries(evidence).filter(([_, url]) => url);
    
    // Agrupar evidencias por paso
    const evidenceByStep: Record<number, Array<{ key: string; url: string; label: string; icon: string }>> = {};
    
    evidenceEntries.forEach(([key, url]) => {
        const { label, icon } = getEvidenceLabel(key);
        const step = EVIDENCE_LABELS[key]?.step || 99; // Evidencias sin paso definido van al final
        
        if (!evidenceByStep[step]) {
            evidenceByStep[step] = [];
        }
        evidenceByStep[step].push({ key, url, label, icon });
    });

    // Agregar eventos de evidencias agrupadas por paso
    Object.keys(evidenceByStep)
        .sort((a, b) => Number(a) - Number(b))
        .forEach((step) => {
            const evidences = evidenceByStep[Number(step)];
            if (evidences.length > 0) {
                // Si hay múltiples evidencias del mismo paso, agruparlas
                const firstEvidence = evidences[0];
                const allImages = evidences.map(e => e.url);
                
                timelineEvents.push({
                    type: 'evidence',
                    title: evidences.length === 1 
                        ? firstEvidence.label 
                        : `${firstEvidence.label.split(' - ')[0]} (${evidences.length} fotos)`,
                    description: evidences.length === 1 
                        ? 'Evidencia subida' 
                        : `${evidences.length} evidencias subidas en este paso`,
                    timestamp: report.updated_at, // Usar updated_at como aproximación, ya que no tenemos timestamp individual
                    icon: firstEvidence.icon,
                    color: 'bg-purple-500',
                    images: allImages,
                });
            }
        });


    // Evento: Resolución
    if (report.resolved_at) {
        timelineEvents.push({
            type: 'resolution',
            title: 'Reporte Resuelto',
            description: 'El reporte fue marcado como resuelto',
            timestamp: report.resolved_at,
            icon: '✅',
            color: 'bg-green-600',
        });
    }

    // Evento: Timeout (si existe y ya pasó)
    if (report.timeout_at) {
        const timeoutDate = new Date(report.timeout_at);
        const now = new Date();
        if (timeoutDate < now && report.status !== 'completed') {
            timelineEvents.push({
                type: 'timeout',
                title: 'Tiempo Agotado',
                description: 'El tiempo de espera del chat expiró',
                timestamp: report.timeout_at,
                icon: '⏰',
                color: 'bg-red-500',
            });
        }
    }

    // Ordenar eventos por timestamp
    timelineEvents.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return (
        <div className="relative">
            {/* Línea vertical */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>

            {/* Eventos */}
            <div className="space-y-6">
                {timelineEvents.map((event, index) => (
                    <div key={`${event.type}-${event.timestamp}-${index}`} className="relative flex items-start">
                        {/* Icono */}
                        <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${event.color} text-white text-sm`}>
                            {event.icon}
                        </div>

                        {/* Contenido */}
                        <div className="ml-4 flex-1 pb-6">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold text-gray-900">{event.title}</h3>
                                    <span className="text-xs text-gray-500">
                                        {new Date(event.timestamp).toLocaleString('es-MX', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                                
                                {/* Mostrar imágenes si es evidencia */}
                                {event.type === 'evidence' && event.images && event.images.length > 0 && (
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        {event.images.map((imageUrl, imgIndex) => (
                                            <div 
                                                key={imgIndex} 
                                                className="border border-gray-200 rounded-lg overflow-hidden bg-white cursor-pointer hover:border-blue-400 transition-colors"
                                                onClick={() => setExpandedImage(imageUrl)}
                                            >
                                                <div className="relative aspect-square w-full bg-gray-100">
                                                    <Image
                                                        src={imageUrl}
                                                        alt={`Evidencia ${imgIndex + 1}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {event.type === 'message' && event.description.length > 100 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {event.description.substring(0, 100)}...
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {timelineEvents.length === 0 && (
                <p className="text-gray-500 text-sm">No hay eventos en la línea de tiempo</p>
            )}

            {/* Modal para expandir imagen */}
            {expandedImage && (
                <div 
                    className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
                    onClick={() => setExpandedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
                        <button
                            onClick={() => setExpandedImage(null)}
                            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-colors z-10"
                            aria-label="Cerrar"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                            <Image
                                src={expandedImage}
                                alt="Imagen expandida"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

