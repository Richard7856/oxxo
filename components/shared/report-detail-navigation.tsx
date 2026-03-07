'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ReportDetailNavigationProps {
    reportId: string;
    hasTicketData: boolean;
    hasTimeline: boolean;
    hasChat: boolean;
    chatUrl: string;
}

type ActiveTab = 'overview' | 'timeline' | 'tickets' | 'chat';

export default function ReportDetailNavigation({
    reportId,
    hasTicketData,
    hasTimeline,
    hasChat,
    chatUrl,
}: ReportDetailNavigationProps) {
    const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

    return (
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
                {hasTicketData && (
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
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap bg-green-600 text-white hover:bg-green-700"
                    >
                        Chat
                    </Link>
                )}
            </div>
        </div>
    );
}
