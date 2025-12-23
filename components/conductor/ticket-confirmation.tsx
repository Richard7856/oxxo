'use client';

import { useState } from 'react';
import { ExtractedTicketData, TicketItem } from '@/lib/ai/extract-ticket-data';

interface TicketConfirmationProps {
    reportId: string;
    ticketData: ExtractedTicketData;
    ticketType?: 'ticket' | 'return_ticket';
    ticketImageUrl?: string | null;
    onConfirm: (data: ExtractedTicketData) => Promise<void>;
    onCancel?: () => void;
    loading?: boolean;
}

export default function TicketConfirmation({
    reportId,
    ticketData,
    ticketType = 'ticket',
    ticketImageUrl,
    onConfirm,
    onCancel,
    loading = false,
}: TicketConfirmationProps) {
    const [editedData, setEditedData] = useState<ExtractedTicketData>(ticketData);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleUpdateItem = (index: number, field: keyof TicketItem, value: any) => {
        setEditedData((prev) => {
            const newItems = [...prev.items];
            newItems[index] = {
                ...newItems[index],
                [field]: value,
            };
            return {
                ...prev,
                items: newItems,
            };
        });
        // Clear error for this field
        const errorKey = `item_${index}_${field}`;
        if (errors[errorKey]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[errorKey];
                return newErrors;
            });
        }
    };

    const handleUpdateField = (field: keyof ExtractedTicketData, value: any) => {
        setEditedData((prev) => ({
            ...prev,
            [field]: value,
        }));
        // Clear error for this field
        if (errors[field as string]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field as string];
                return newErrors;
            });
        }
    };

    const validateData = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!editedData.codigo_tienda?.trim()) {
            newErrors.codigo_tienda = 'Código de tienda requerido';
        }
        if (!editedData.tienda?.trim()) {
            newErrors.tienda = 'Nombre de tienda requerido';
        }
        if (!editedData.fecha?.trim()) {
            newErrors.fecha = 'Fecha requerida';
        }
        if (!editedData.orden_compra?.trim()) {
            newErrors.orden_compra = 'Orden de compra requerida';
        }
        if (!editedData.subtotal || editedData.subtotal <= 0) {
            newErrors.subtotal = 'Subtotal inválido';
        }
        if (!editedData.total || editedData.total <= 0) {
            newErrors.total = 'Total inválido';
        }

        editedData.items.forEach((item, index) => {
            if (!item.clave_articulo?.trim()) {
                newErrors[`item_${index}_clave_articulo`] = 'Clave requerida';
            }
            if (!item.descripcion?.trim()) {
                newErrors[`item_${index}_descripcion`] = 'Descripción requerida';
            }
            if (item.costo === null || item.costo < 0) {
                newErrors[`item_${index}_costo`] = 'Costo inválido';
            }
            if (item.peso === null || item.peso <= 0) {
                newErrors[`item_${index}_peso`] = 'Peso inválido';
            }
            if (item.cantidad <= 0) {
                newErrors[`item_${index}_cantidad`] = 'Cantidad inválida';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleConfirm = async () => {
        if (!validateData()) {
            return;
        }

        setSaving(true);
        try {
            await onConfirm(editedData);
        } catch (error) {
            console.error('Error confirming ticket:', error);
            alert('Error al confirmar el ticket');
        } finally {
            setSaving(false);
        }
    };

    const title = ticketType === 'return_ticket' ? 'Ticket de Devolución' : 'Ticket de Entrega';

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Confirmar {title}
                </h2>
                <p className="text-gray-800">
                    Revisa y modifica los datos extraídos del ticket antes de confirmar.
                </p>
                {ticketData.confidence < 0.7 && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 text-sm">
                            ⚠️ Confianza en la extracción: {(ticketData.confidence * 100).toFixed(0)}% - 
                            Por favor revisa cuidadosamente los datos.
                        </p>
                    </div>
                )}
            </div>

            {/* Ticket Image */}
            {ticketImageUrl && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Imagen del Ticket</h3>
                    <img
                        src={ticketImageUrl}
                        alt="Ticket"
                        className="w-full max-w-md mx-auto rounded-lg border border-gray-300"
                    />
                </div>
            )}

            {/* General Information */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Información General
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Código Tienda *
                        </label>
                        <input
                            type="text"
                            value={editedData.codigo_tienda || ''}
                            onChange={(e) => handleUpdateField('codigo_tienda', e.target.value)}
                            className={`w-full border-2 rounded-lg px-4 py-2 text-gray-900 ${
                                errors.codigo_tienda ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.codigo_tienda && (
                            <p className="text-red-600 text-sm mt-1">{errors.codigo_tienda}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tienda *
                        </label>
                        <input
                            type="text"
                            value={editedData.tienda || ''}
                            onChange={(e) => handleUpdateField('tienda', e.target.value)}
                            className={`w-full border-2 rounded-lg px-4 py-2 text-gray-900 ${
                                errors.tienda ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.tienda && (
                            <p className="text-red-600 text-sm mt-1">{errors.tienda}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha (YYYY-MM-DD) *
                        </label>
                        <input
                            type="text"
                            value={editedData.fecha || ''}
                            onChange={(e) => handleUpdateField('fecha', e.target.value)}
                            placeholder="2025-10-13"
                            className={`w-full border-2 rounded-lg px-4 py-2 text-gray-900 ${
                                errors.fecha ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.fecha && (
                            <p className="text-red-600 text-sm mt-1">{errors.fecha}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Orden de Compra *
                        </label>
                        <input
                            type="text"
                            value={editedData.orden_compra || ''}
                            onChange={(e) => handleUpdateField('orden_compra', e.target.value)}
                            className={`w-full border-2 rounded-lg px-4 py-2 text-gray-900 ${
                                errors.orden_compra ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.orden_compra && (
                            <p className="text-red-600 text-sm mt-1">{errors.orden_compra}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sub Total *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={editedData.subtotal || ''}
                            onChange={(e) => handleUpdateField('subtotal', parseFloat(e.target.value) || 0)}
                            className={`w-full border-2 rounded-lg px-4 py-2 text-gray-900 ${
                                errors.subtotal ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.subtotal && (
                            <p className="text-red-600 text-sm mt-1">{errors.subtotal}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={editedData.total || ''}
                            onChange={(e) => handleUpdateField('total', parseFloat(e.target.value) || 0)}
                            className={`w-full border-2 rounded-lg px-4 py-2 text-gray-900 ${
                                errors.total ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.total && (
                            <p className="text-red-600 text-sm mt-1">{errors.total}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                    Productos ({editedData.items.length})
                </h3>
                <div className="space-y-4">
                    {editedData.items.map((item, index) => (
                        <div
                            key={index}
                            className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Clave Artículo *
                                    </label>
                                    <input
                                        type="text"
                                        value={item.clave_articulo || ''}
                                        onChange={(e) => handleUpdateItem(index, 'clave_articulo', e.target.value)}
                                        className={`w-full border-2 rounded-lg px-3 py-2 text-gray-900 text-sm ${
                                            errors[`item_${index}_clave_articulo`] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors[`item_${index}_clave_articulo`] && (
                                        <p className="text-red-600 text-xs mt-1">
                                            {errors[`item_${index}_clave_articulo`]}
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Descripción *
                                    </label>
                                    <input
                                        type="text"
                                        value={item.descripcion || ''}
                                        onChange={(e) => handleUpdateItem(index, 'descripcion', e.target.value)}
                                        className={`w-full border-2 rounded-lg px-3 py-2 text-gray-900 text-sm ${
                                            errors[`item_${index}_descripcion`] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors[`item_${index}_descripcion`] && (
                                        <p className="text-red-600 text-xs mt-1">
                                            {errors[`item_${index}_descripcion`]}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Costo *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.costo ?? ''}
                                        onChange={(e) => handleUpdateItem(index, 'costo', parseFloat(e.target.value) || 0)}
                                        className={`w-full border-2 rounded-lg px-3 py-2 text-gray-900 text-sm ${
                                            errors[`item_${index}_costo`] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors[`item_${index}_costo`] && (
                                        <p className="text-red-600 text-xs mt-1">
                                            {errors[`item_${index}_costo`]}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Peso *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.peso ?? ''}
                                        onChange={(e) => handleUpdateItem(index, 'peso', parseFloat(e.target.value) || 0)}
                                        className={`w-full border-2 rounded-lg px-3 py-2 text-gray-900 text-sm ${
                                            errors[`item_${index}_peso`] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors[`item_${index}_peso`] && (
                                        <p className="text-red-600 text-xs mt-1">
                                            {errors[`item_${index}_peso`]}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cantidad *
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={item.cantidad || ''}
                                        onChange={(e) => handleUpdateItem(index, 'cantidad', parseInt(e.target.value) || 0)}
                                        className={`w-full border-2 rounded-lg px-3 py-2 text-gray-900 text-sm ${
                                            errors[`item_${index}_cantidad`] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors[`item_${index}_cantidad`] && (
                                        <p className="text-red-600 text-xs mt-1">
                                            {errors[`item_${index}_cantidad`]}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Subtotal
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.subtotal || ''}
                                        onChange={(e) => handleUpdateItem(index, 'subtotal', parseFloat(e.target.value) || 0)}
                                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
                {onCancel && (
                    <button
                        onClick={onCancel}
                        disabled={saving || loading}
                        className="flex-1 bg-gray-200 text-gray-800 font-medium py-3 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    onClick={handleConfirm}
                    disabled={saving || loading}
                    className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                    {saving || loading ? 'Confirmando...' : 'Confirmar y Continuar'}
                </button>
            </div>
        </div>
    );
}

