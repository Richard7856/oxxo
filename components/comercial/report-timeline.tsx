'use client';

import Image from 'next/image';
import { Json } from '@/lib/types/database.types';

interface TimelineEvent {
    id: string;
    type: 'report' | 'photo' | 'action' | 'ticket' | 'chat';
    title: string;
    description: string;
    timestamp: string;
    imageUrl?: string;
    icon?: React.ReactNode;
}

interface ReportTimelineProps {
    report: {
        created_at: string;
        submitted_at: string | null;
        resolved_at: string | null;
        evidence: Json;
        ticket_image_url: string | null;
        return_ticket_image_url: string | null;
        tipo_reporte: string | null;
        store_nombre: string;
        store_codigo: string;
    };
}

// Icon components
const TruckIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
    </svg>
);

const CameraIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
        />
    </svg>
);

const QuestionIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
    </svg>
);

const TicketIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
        />
    </svg>
);

const ChatIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
    </svg>
);

// Evidence key mappings to friendly names
const evidenceKeyMap: Record<string, { title: string; description: string }> = {
    arrival_exhibit: {
        title: 'Foto de Llegada',
        description: 'Evidencia del exhibidor al llegar.',
    },
    product_arranged: {
        title: 'Foto de Acomodo',
        description: 'Foto del producto ya acomodado en el exhibidor.',
    },
    waste_evidence: {
        title: 'Evidencia de Merma',
        description: 'Foto del producto retirado (merma).',
    },
    remission: {
        title: 'Remisión',
        description: 'Foto de la remisión firmada.',
    },
    ticket: {
        title: 'Ticket de Entrega',
        description: 'Foto del ticket de entrega impreso.',
    },
    return_ticket: {
        title: 'Ticket de Devolución',
        description: 'Foto del ticket de devolución.',
    },
    facade: {
        title: 'Evidencia Fachada',
        description: 'Foto de la tienda cerrada (fachada).',
    },
};

export default function ReportTimeline({ report }: ReportTimelineProps) {
    const events: TimelineEvent[] = [];
    const evidence = (report.evidence as Record<string, string>) || {};

    // Report initiated
    events.push({
        id: 'report-initiated',
        type: 'report',
        title: 'Reporte Iniciado',
        description: `Se validó la tienda ${report.store_nombre}`,
        timestamp: report.created_at,
        icon: <TruckIcon />,
    });

    // Submitted event (if exists)
    if (report.submitted_at) {
        events.push({
            id: 'report-submitted',
            type: 'action',
            title: 'Reporte Enviado',
            description: 'El conductor envió el reporte para revisión.',
            timestamp: report.submitted_at,
            icon: <QuestionIcon />,
        });
    }

    // Evidence photos (sorted by key order for consistency)
    const evidenceKeys = Object.keys(evidenceKeyMap);
    evidenceKeys.forEach((key) => {
        const url = evidence[key];
        if (url) {
            const info = evidenceKeyMap[key];
            events.push({
                id: `evidence-${key}`,
                type: 'photo',
                title: info.title,
                description: info.description,
                timestamp: report.created_at, // We don't have individual timestamps, use report creation
                imageUrl: url,
                icon: <CameraIcon />,
            });
        }
    });

    // Ticket images (if separate from evidence)
    if (report.ticket_image_url && !evidence.ticket) {
        events.push({
            id: 'ticket-image',
            type: 'ticket',
            title: 'Ticket de Entrega',
            description: 'Foto del ticket de entrega.',
            timestamp: report.submitted_at || report.created_at,
            imageUrl: report.ticket_image_url,
            icon: <TicketIcon />,
        });
    }

    if (report.return_ticket_image_url && !evidence.return_ticket) {
        events.push({
            id: 'return-ticket-image',
            type: 'ticket',
            title: 'Ticket de Devolución',
            description: 'Foto del ticket de devolución.',
            timestamp: report.resolved_at || report.submitted_at || report.created_at,
            imageUrl: report.return_ticket_image_url,
            icon: <TicketIcon />,
        });
    }

    // Resolved event (if exists)
    if (report.resolved_at) {
        events.push({
            id: 'report-resolved',
            type: 'action',
            title: 'Reporte Resuelto',
            description: 'El reporte fue marcado como resuelto.',
            timestamp: report.resolved_at,
            icon: <QuestionIcon />,
        });
    }

    // Sort events by timestamp
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    };

    return (
        <div className="space-y-6">
            {events.map((event, index) => (
                <div key={event.id} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                event.type === 'photo'
                                    ? 'bg-blue-100 text-blue-600'
                                    : event.type === 'ticket'
                                    ? 'bg-purple-100 text-purple-600'
                                    : event.type === 'action'
                                    ? 'bg-yellow-100 text-yellow-600'
                                    : 'bg-green-100 text-green-600'
                            }`}
                        >
                            {event.icon}
                        </div>
                        {index < events.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 mt-2" />
                        )}
                    </div>

                    {/* Event content */}
                    <div className="flex-1 pb-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-gray-900">{event.title}</h3>
                                <span className="text-sm text-gray-500">{formatTime(event.timestamp)}</span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">{event.description}</p>

                            {/* Image preview */}
                            {event.imageUrl && (
                                <div className="mt-3">
                                    <a
                                        href={event.imageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block relative w-full max-w-xs h-48 rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
                                    >
                                        <Image
                                            src={event.imageUrl}
                                            alt={event.title}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 400px) 100vw, 400px"
                                        />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {events.length === 0 && (
                <div className="text-center py-8 text-gray-600">
                    <p>No hay eventos registrados en este reporte</p>
                </div>
            )}
        </div>
    );
}

