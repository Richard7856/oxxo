'use client';

import { useState } from 'react';
import ReportTimeline from './report-timeline';
import TicketSummary from './ticket-summary';
import ComercialChat from './comercial-chat';

interface ReportDetailTabsProps {
    report: any;
    messages: any[];
    userId: string;
}

export default function ReportDetailTabs({ report, messages, userId }: ReportDetailTabsProps) {
    const [activeTab, setActiveTab] = useState<'details' | 'summary' | 'chat'>('details');

    return (
        <>
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'details'
                                ? 'border-red-600 text-red-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Detalles y Fotos
                    </button>
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'summary'
                                ? 'border-red-600 text-red-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Resumen de Entrega
                    </button>
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'chat'
                                ? 'border-red-600 text-red-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Chat Público
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'details' && <ReportTimeline report={report} />}
                {activeTab === 'summary' && (
                    <TicketSummary
                        ticketData={report.ticket_data}
                        ticketImageUrl={report.ticket_image_url}
                        returnTicketData={report.return_ticket_data}
                        returnTicketImageUrl={report.return_ticket_image_url}
                    />
                )}
                {activeTab === 'chat' && (
                    <ComercialChat reportId={report.id} userId={userId} initialMessages={messages} />
                )}
            </div>
        </>
    );
}
