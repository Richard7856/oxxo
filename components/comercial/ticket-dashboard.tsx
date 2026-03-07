'use client';

import { ExtractedTicketData, TicketProduct } from '@/lib/ai/extract-ticket-data';

interface TicketDashboardProps {
    ticketData: ExtractedTicketData | null;
    incidentDetails?: any; // Para obtener información de merma si existe
}

export default function TicketDashboard({ ticketData, incidentDetails }: TicketDashboardProps) {
    if (!ticketData || !ticketData.productos || ticketData.productos.length === 0) {
        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <p className="text-yellow-700">
                    No hay datos de ticket disponibles para este reporte.
                </p>
            </div>
        );
    }

    // Calcular totales
    const totalProductos = ticketData.productos.length;
    const totalPesoEntregado = ticketData.productos.reduce((sum, p) => sum + (p.peso || 0), 0);
    const totalCostoEntregado = ticketData.productos.reduce((sum, p) => sum + ((p.costo || 0) * (p.peso || 0)), 0);
    
    // Calcular merma si existe en incidentDetails
    let mermaTotal = 0;
    let mermaCosto = 0;
    const productosConMerma: Array<{ producto: TicketProduct; merma: number }> = [];

    if (incidentDetails && Array.isArray(incidentDetails)) {
        incidentDetails.forEach((incident: any) => {
            if (incident.reason === 'Mal estado' || incident.reason === 'Caducado' || incident.reason === 'Dañado') {
                incident.products?.forEach((incidentProduct: any) => {
                    // Buscar el producto en el ticket por clave o descripción
                    const ticketProduct = ticketData.productos.find(
                        p => p.clave_articulo === incidentProduct.clave || 
                        p.descripcion.toLowerCase().includes(incidentProduct.nombre?.toLowerCase() || '')
                    );
                    
                    if (ticketProduct && incidentProduct.cantidad) {
                        const merma = incidentProduct.cantidad;
                        mermaTotal += merma;
                        mermaCosto += (ticketProduct.costo || 0) * merma;
                        productosConMerma.push({ producto: ticketProduct, merma });
                    }
                });
            }
        });
    }

    // Calcular valores reales (entregado - merma)
    const totalPesoReal = totalPesoEntregado - mermaTotal;
    const totalCostoReal = totalCostoEntregado - mermaCosto;

    return (
        <div className="space-y-6">
            {/* Resumen General */}
            <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium mb-1">Código Tienda</p>
                    <p className="text-xl font-bold text-blue-900">{ticketData.codigo_tienda || 'N/A'}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-green-600 font-medium mb-1">Orden de Compra</p>
                    <p className="text-xl font-bold text-green-900">{ticketData.orden_compra || 'N/A'}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium mb-1">Fecha</p>
                    <p className="text-xl font-bold text-purple-900">{ticketData.fecha || 'N/A'}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <p className="text-sm text-orange-600 font-medium mb-1">Total Productos</p>
                    <p className="text-xl font-bold text-orange-900">{totalProductos}</p>
                </div>
            </div>

            {/* Totales Financieros */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-600 mb-2">Subtotal</p>
                    <p className="text-2xl font-bold text-gray-900">
                        ${ticketData.subtotal?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-600 mb-2">Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                        ${ticketData.total?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-600 mb-2">Confianza de Extracción</p>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${
                                    (ticketData.confidence || 0) >= 0.7 ? 'bg-green-600' : 
                                    (ticketData.confidence || 0) >= 0.5 ? 'bg-yellow-600' : 
                                    'bg-red-600'
                                }`}
                                style={{ width: `${((ticketData.confidence || 0) * 100)}%` }}
                            />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">
                            {((ticketData.confidence || 0) * 100).toFixed(0)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Resumen de Entregas - RECIBIDO */}
            <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-300 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-blue-900">📦 Lo Recibido (Ticket de Entrega)</h3>
                    <span className="px-3 py-1 bg-blue-200 text-blue-900 rounded-full text-xs font-bold">
                        RECIBIDO
                    </span>
                </div>
                <p className="text-sm text-blue-700 mb-4">
                    Cantidad total de productos que se recibieron en la tienda según el ticket de entrega.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <p className="text-sm text-blue-600 mb-1 font-medium">Peso Total Recibido</p>
                        <p className="text-2xl font-bold text-blue-900">
                            {totalPesoEntregado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <p className="text-sm text-blue-600 mb-1 font-medium">Costo Total Recibido</p>
                        <p className="text-2xl font-bold text-blue-900">
                            ${totalCostoEntregado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <p className="text-sm text-blue-600 mb-1 font-medium">Total de Productos</p>
                        <p className="text-2xl font-bold text-blue-900">
                            {totalProductos}
                        </p>
                    </div>
                </div>
            </div>

            {/* Merma - RETIRADO */}
            {mermaTotal > 0 && (
                <div className="bg-red-50 rounded-lg p-6 border-2 border-red-300 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-red-900">🗑️ Lo Retirado/Merma (Ticket de Merma)</h3>
                        <span className="px-3 py-1 bg-red-200 text-red-900 rounded-full text-xs font-bold">
                            MERMA
                        </span>
                    </div>
                    <p className="text-sm text-red-700 mb-4">
                        Cantidad de productos que se retiraron o desperdiciaron por mal estado, caducados o dañados.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white rounded-lg p-4 border border-red-200">
                            <p className="text-sm text-red-600 mb-1 font-medium">Peso Total de Merma</p>
                            <p className="text-2xl font-bold text-red-900">
                                {mermaTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                            </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-red-200">
                            <p className="text-sm text-red-600 mb-1 font-medium">Costo Total de Merma</p>
                            <p className="text-2xl font-bold text-red-900">
                                ${mermaCosto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm font-medium text-red-900 mb-2">Productos con Merma:</p>
                        <div className="space-y-2">
                            {productosConMerma.map((item, index) => (
                                <div key={index} className="bg-white rounded p-3 border border-red-200">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.producto.descripcion}</p>
                                            <p className="text-sm text-gray-600">Clave: {item.producto.clave_articulo}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-red-600">Merma: {item.merma.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg</p>
                                            <p className="text-sm text-gray-600">Costo: ${((item.producto.costo || 0) * item.merma).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Valores Reales (Recibido - Merma) */}
            <div className="bg-green-50 rounded-lg p-6 border-2 border-green-300 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-green-900">✅ Valor Real Final (Recibido - Merma)</h3>
                    <span className="px-3 py-1 bg-green-200 text-green-900 rounded-full text-xs font-bold">
                        NETO
                    </span>
                </div>
                <p className="text-sm text-green-700 mb-4">
                    Cantidad final que quedó en la tienda después de retirar la merma. Es decir: Lo Recibido menos Lo Retirado.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-green-600 mb-1 font-medium">Peso Real Final</p>
                        <p className="text-2xl font-bold text-green-900">
                            {totalPesoReal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                            {totalPesoEntregado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg - {mermaTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-green-600 mb-1 font-medium">Costo Real Final</p>
                        <p className="text-2xl font-bold text-green-900">
                            ${totalCostoReal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                            ${totalCostoEntregado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} - ${mermaCosto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabla de Productos */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Productos Entregados</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                                    Clave
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                                    Descripción
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-800 uppercase tracking-wider">
                                    Peso/Unidades
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-800 uppercase tracking-wider">
                                    Costo Unit.
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-800 uppercase tracking-wider">
                                    Subtotal
                                </th>
                                {mermaTotal > 0 && (
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-800 uppercase tracking-wider">
                                        Merma
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {ticketData.productos.map((producto, index) => {
                                const mermaItem = productosConMerma.find(p => p.producto.clave_articulo === producto.clave_articulo);
                                const pesoReal = (producto.peso || 0) - (mermaItem?.merma || 0);
                                const subtotal = (producto.costo || 0) * (producto.peso || 0);
                                
                                return (
                                    <tr key={index} className={mermaItem ? 'bg-red-50' : ''}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {producto.clave_articulo}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {producto.descripcion}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                                            {producto.peso?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                                            ${(producto.costo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                                            ${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        {mermaTotal > 0 && (
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 text-right">
                                                {mermaItem ? (
                                                    <>
                                                        <span className="font-medium">{mermaItem.merma.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg</span>
                                                        <br />
                                                        <span className="text-xs">(${((producto.costo || 0) * mermaItem.merma).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-800">-</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-gray-50">
                            <tr>
                                <td colSpan={mermaTotal > 0 ? 3 : 2} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                                    Total:
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                                    {totalPesoEntregado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                                    ${totalCostoEntregado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                {mermaTotal > 0 && (
                                    <td className="px-4 py-3 text-sm font-semibold text-red-600 text-right">
                                        {mermaTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                                        <br />
                                        <span className="text-xs">(${mermaCosto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                                    </td>
                                )}
                            </tr>
                            {mermaTotal > 0 && (
                                <tr className="bg-green-50">
                                    <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-green-900 text-right">
                                        Total Real (Entregado - Merma):
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-green-900 text-right">
                                        {totalPesoReal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-green-900 text-right">
                                        ${totalCostoReal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td></td>
                                </tr>
                            )}
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}



