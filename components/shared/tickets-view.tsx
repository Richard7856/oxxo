'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ExtractedTicketData } from '@/lib/ai/extract-ticket-data';

interface TicketsViewProps {
    ticketData: ExtractedTicketData | null;
    evidence: Record<string, string>;
    incidentDetails?: any;
}

export default function TicketsView({ ticketData, evidence, incidentDetails }: TicketsViewProps) {
    const [selectedTicket, setSelectedTicket] = useState<'entrega' | 'merma' | null>(null);

    // Obtener URLs de tickets - buscar todas las posibles claves
    const ticketEntregaUrl = evidence['ticket_recibido'] || evidence['ticket'] || evidence['ticket_entrega'] || null;
    const ticketMermaUrl = evidence['ticket_merma'] || evidence['return_ticket'] || null;

    if (!ticketData && !ticketEntregaUrl && !ticketMermaUrl) {
        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <p className="text-yellow-700">
                    No hay tickets disponibles para este reporte.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Información inicial */}
            {!ticketEntregaUrl && !ticketMermaUrl && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <p className="text-yellow-700">
                        No hay tickets disponibles para este reporte. Los tickets se muestran aquí cuando el conductor los captura durante el proceso.
                    </p>
                </div>
            )}

            {/* Selector de tickets */}
            <div className="flex gap-3 flex-wrap">
                {ticketEntregaUrl ? (
                    <button
                        onClick={() => setSelectedTicket(selectedTicket === 'entrega' ? null : 'entrega')}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                            selectedTicket === 'entrega'
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                    >
                        📄 Ticket de Entrega (Recibido)
                    </button>
                ) : (
                    <div className="px-6 py-3 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed">
                        📄 Ticket de Entrega (No disponible)
                    </div>
                )}
                {ticketMermaUrl ? (
                    <button
                        onClick={() => setSelectedTicket(selectedTicket === 'merma' ? null : 'merma')}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                            selectedTicket === 'merma'
                                ? 'bg-red-600 text-white'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                    >
                        📄 Ticket de Merma (Retirado)
                    </button>
                ) : (
                    <div className="px-6 py-3 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed">
                        📄 Ticket de Merma (No disponible)
                    </div>
                )}
            </div>

            {/* Vista de ticket de entrega */}
            {selectedTicket === 'entrega' && ticketEntregaUrl && (
                <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-blue-900">Ticket de Entrega (Recibido)</h3>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            Lo que se recibió
                        </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="relative aspect-[3/4] w-full bg-gray-100">
                                <Image
                                    src={ticketEntregaUrl}
                                    alt="Ticket de Entrega"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </div>
                        {ticketData && (
                            <div className="space-y-4">
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <h4 className="font-semibold text-blue-900 mb-2">Información del Ticket</h4>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="text-blue-600 font-medium">Código Tienda:</span>
                                            <span className="ml-2 text-gray-900">{ticketData.codigo_tienda || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-blue-600 font-medium">Orden de Compra:</span>
                                            <span className="ml-2 text-gray-900">{ticketData.orden_compra || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-blue-600 font-medium">Fecha:</span>
                                            <span className="ml-2 text-gray-900">{ticketData.fecha || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-blue-600 font-medium">Subtotal:</span>
                                            <span className="ml-2 text-gray-900">
                                                ${ticketData.subtotal?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-blue-600 font-medium">Total:</span>
                                            <span className="ml-2 text-gray-900">
                                                ${ticketData.total?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <h4 className="font-semibold text-green-900 mb-2">Total Recibido</h4>
                                    <p className="text-2xl font-bold text-green-900">
                                        ${ticketData.total?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                                    </p>
                                    <p className="text-sm text-green-700 mt-1">
                                        {ticketData.productos?.length || 0} productos
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Vista de ticket de merma */}
            {selectedTicket === 'merma' && ticketMermaUrl && (
                <div className="bg-white rounded-lg border-2 border-red-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-red-900">Ticket de Merma (Retirado)</h3>
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                            Lo que se retiró/desperdició
                        </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="relative aspect-[3/4] w-full bg-gray-100">
                                <Image
                                    src={ticketMermaUrl}
                                    alt="Ticket de Merma"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </div>
                        {incidentDetails && (
                            <div className="space-y-4">
                                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                    <h4 className="font-semibold text-red-900 mb-2">Productos con Merma</h4>
                                    <div className="space-y-2">
                                        {Array.isArray(incidentDetails) && incidentDetails
                                            .filter((inc: any) => 
                                                inc.reason === 'Mal estado' || 
                                                inc.reason === 'Caducado' || 
                                                inc.reason === 'Dañado'
                                            )
                                            .map((incident: any, idx: number) => (
                                                <div key={idx} className="bg-white rounded p-3 border border-red-200">
                                                    {incident.products?.map((product: any, pIdx: number) => (
                                                        <div key={pIdx} className="mb-2 last:mb-0">
                                                            <p className="font-medium text-gray-900">{product.nombre}</p>
                                                            <p className="text-sm text-red-600">
                                                                Cantidad: {product.cantidad} | 
                                                                Razón: {incident.reason}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mensaje cuando no hay ticket seleccionado */}
            {selectedTicket === null && (ticketEntregaUrl || ticketMermaUrl) && (
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <p className="text-blue-800 text-center font-medium">
                        👆 Selecciona un ticket arriba para ver los detalles y la información extraída
                    </p>
                    {ticketEntregaUrl && ticketMermaUrl && (
                        <p className="text-blue-600 text-center text-sm mt-2">
                            Puedes alternar entre ambos tickets para comparar
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
