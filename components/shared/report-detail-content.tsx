'use client';

import { useState } from 'react';
import Link from 'next/link';
import TicketDashboard from '@/components/comercial/ticket-dashboard';
import ReportTimeline from '@/components/comercial/report-timeline';
import TicketsView from './tickets-view';
import { ExtractedTicketData } from '@/lib/ai/extract-ticket-data';

interface Message {
    id: string;
    text: string | null;
    sender: string;
    created_at: string;
}

interface ReportDetailContentProps {
    reportId: string;
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
    ticketData: ExtractedTicketData | null;
    incidentDetails?: any;
    messages: Message[];
    evidence: Record<string, string>;
    chatUrl: string;
    hasChat: boolean;
}

type ActiveTab = 'overview' | 'timeline' | 'tickets';

export default function ReportDetailContent({
    reportId,
    report,
    ticketData,
    incidentDetails,
    messages,
    evidence,
    chatUrl,
    hasChat,
}: ReportDetailContentProps) {
    const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

    const hasTicketData = !!ticketData;
    const hasTimeline = true; // Siempre hay timeline
    const hasTicketImages = !!(evidence['ticket'] || evidence['ticket_entrega'] || evidence['ticket_merma'] || evidence['return_ticket']);

    return (
        <>
            {/* Navegación con Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="flex items-center gap-2 p-2 border-b border-gray-200 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                            activeTab === 'overview'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Resumen
                    </button>
                    {hasTimeline && (
                        <button
                            onClick={() => setActiveTab('timeline')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                                activeTab === 'timeline'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Línea de Tiempo
                        </button>
                    )}
                    {hasTicketImages && (
                        <button
                            onClick={() => setActiveTab('tickets')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                                activeTab === 'tickets'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Tickets (Entrega y Merma)
                        </button>
                    )}
                    {hasChat && (
                        <Link
                            href={chatUrl}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap bg-green-600 text-white hover:bg-green-700 ml-auto"
                        >
                            💬 Chat
                        </Link>
                    )}
                </div>
            </div>

            {/* Contenido según tab activo */}
            {activeTab === 'overview' && (
                <>
                    {/* Ticket Dashboard - Resumen */}
                    {ticketData && (
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Dashboard de Ticket</h2>
                            <TicketDashboard 
                                ticketData={ticketData}
                                incidentDetails={incidentDetails}
                            />
                        </div>
                    )}

                    {/* Información del Reporte */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Información del Reporte</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Tipo de Reporte</p>
                                <p className="font-semibold text-gray-900">{report.tipo_reporte || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Fecha de Creación</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(report.created_at).toLocaleString('es-MX')}
                                </p>
                            </div>
                            {report.submitted_at && (
                                <div>
                                    <p className="text-sm text-gray-600">Fecha de Envío</p>
                                    <p className="font-semibold text-gray-900">
                                        {new Date(report.submitted_at).toLocaleString('es-MX')}
                                    </p>
                                </div>
                            )}
                            {report.resolved_at && (
                                <div>
                                    <p className="text-sm text-gray-600">Fecha de Resolución</p>
                                    <p className="font-semibold text-gray-900">
                                        {new Date(report.resolved_at).toLocaleString('es-MX')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Evidencias */}
                    {Object.keys(evidence).length > 0 && (
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Evidencias</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                {Object.entries(evidence)
                                    .filter(([key]) => !key.includes('ticket')) // Excluir tickets, se muestran en tab separado
                                    .map(([key, url]) => (
                                        <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="relative aspect-video w-full bg-gray-100">
                                                <img
                                                    src={url}
                                                    alt={key}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <p className="p-2 text-sm text-gray-600 text-center">{key}</p>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'timeline' && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Línea de Tiempo</h2>
                    <ReportTimeline 
                        report={report}
                        messages={messages}
                        evidence={evidence}
                    />
                </div>
            )}

            {activeTab === 'tickets' && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Tickets de Entrega y Merma</h2>
                    <TicketsView 
                        ticketData={ticketData}
                        evidence={evidence}
                        incidentDetails={incidentDetails}
                    />
                </div>
            )}
        </>
    );
}
