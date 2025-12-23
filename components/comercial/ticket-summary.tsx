'use client';

import Image from 'next/image';
import { Json } from '@/lib/types/database.types';

interface TicketSummaryProps {
    ticketData: Json | null;
    ticketImageUrl: string | null;
    returnTicketData: Json | null;
    returnTicketImageUrl: string | null;
}

export default function TicketSummary({
    ticketData,
    ticketImageUrl,
    returnTicketData,
    returnTicketImageUrl,
}: TicketSummaryProps) {
    // Type guard for ticket data structure
    const isTicketData = (data: any): data is {
        numero?: string;
        fecha?: string;
        total?: number;
        items?: Array<{ descripcion: string; cantidad: number; precio: number }>;
    } => {
        return data && typeof data === 'object';
    };

    return (
        <div className="space-y-8">
            {/* Main Ticket */}
            {ticketData && isTicketData(ticketData) && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Ticket de Entrega</h3>

                    {/* Ticket Image */}
                    {ticketImageUrl && (
                        <div className="mb-6">
                            <a
                                href={ticketImageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block relative w-full max-w-md h-96 rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
                            >
                                <Image
                                    src={ticketImageUrl}
                                    alt="Ticket de entrega"
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 600px) 100vw, 600px"
                                />
                            </a>
                        </div>
                    )}

                    {/* Ticket Data */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {ticketData.numero && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Número de Ticket</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {ticketData.numero}
                                    </p>
                                </div>
                            )}
                            {ticketData.fecha && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Fecha</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {new Date(ticketData.fecha).toLocaleDateString('es-MX', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                            )}
                            {ticketData.total !== undefined && (
                                <div className="col-span-2">
                                    <p className="text-sm font-medium text-gray-500">Total</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        ${ticketData.total.toLocaleString('es-MX', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Items List */}
                        {ticketData.items && Array.isArray(ticketData.items) && ticketData.items.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-3">Productos</p>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Descripción
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Cantidad
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Precio
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Subtotal
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {ticketData.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {item.descripcion || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                        {item.cantidad || 0}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                        ${(item.precio || 0).toLocaleString('es-MX', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                                        ${((item.cantidad || 0) * (item.precio || 0)).toLocaleString('es-MX', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Return Ticket */}
            {returnTicketData && isTicketData(returnTicketData) && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Ticket de Devolución</h3>

                    {/* Return Ticket Image */}
                    {returnTicketImageUrl && (
                        <div className="mb-6">
                            <a
                                href={returnTicketImageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block relative w-full max-w-md h-96 rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
                            >
                                <Image
                                    src={returnTicketImageUrl}
                                    alt="Ticket de devolución"
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 600px) 100vw, 600px"
                                />
                            </a>
                        </div>
                    )}

                    {/* Return Ticket Data */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {returnTicketData.numero && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Número de Ticket</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {returnTicketData.numero}
                                    </p>
                                </div>
                            )}
                            {returnTicketData.fecha && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Fecha</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {new Date(returnTicketData.fecha).toLocaleDateString('es-MX', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                            )}
                            {returnTicketData.total !== undefined && (
                                <div className="col-span-2">
                                    <p className="text-sm font-medium text-gray-500">Total</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        ${returnTicketData.total.toLocaleString('es-MX', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Return Items List */}
                        {returnTicketData.items &&
                            Array.isArray(returnTicketData.items) &&
                            returnTicketData.items.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-3">Productos</p>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Descripción
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Cantidad
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Precio
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Subtotal
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {returnTicketData.items.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                            {item.descripcion || 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                            {item.cantidad || 0}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                            ${(item.precio || 0).toLocaleString('es-MX', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                                            ${((item.cantidad || 0) * (item.precio || 0)).toLocaleString('es-MX', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            )}

            {/* No ticket data message */}
            {!ticketData && !returnTicketData && (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <p className="text-gray-600">No hay datos de ticket disponibles para este reporte</p>
                </div>
            )}
        </div>
    );
}

