'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ExtractedTicketData, TicketProduct } from '@/lib/ai/extract-ticket-data';

interface TicketReviewProps {
    reportId: string;
    ticketImageUrl: string;
    mermaImageUrl: string | null;
    extractedData: ExtractedTicketData;
    onSave: (data: ExtractedTicketData) => Promise<void>;
    onBack: () => void;
    title?: string;
}

export default function TicketReview({
    reportId,
    ticketImageUrl,
    mermaImageUrl,
    extractedData: initialData,
    onSave,
    onBack,
    title = 'Revisar Datos del Ticket',
}: TicketReviewProps) {
    const [data, setData] = useState<ExtractedTicketData>(initialData);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleProductChange = (index: number, field: keyof TicketProduct, value: string | number) => {
        const updatedProducts = [...data.productos];
        updatedProducts[index] = {
            ...updatedProducts[index],
            [field]: value,
        };
        setData({ ...data, productos: updatedProducts });
    };

    const handleAddProduct = () => {
        setData({
            ...data,
            productos: [
                ...data.productos,
                {
                    clave_articulo: '',
                    descripcion: '',
                    costo: 0,
                    peso: 0,
                },
            ],
        });
    };

    const handleRemoveProduct = (index: number) => {
        const updatedProducts = data.productos.filter((_, i) => i !== index);
        setData({ ...data, productos: updatedProducts });
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            await onSave(data);
        } catch (err: any) {
            setError(err.message || 'Error al guardar los datos');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
                <p className="text-gray-600 mb-6">
                    Por favor, revisa y corrige la información extraída del ticket. Asegúrate de que todos los datos sean correctos.
                </p>

                {error && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Images */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Ticket de Recibido</h3>
                        <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300">
                            <Image
                                src={ticketImageUrl}
                                alt="Ticket de recibido"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>
                    {mermaImageUrl && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Ticket de Merma</h3>
                            <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300">
                                <Image
                                    src={mermaImageUrl}
                                    alt="Ticket de merma"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Código Tienda
                        </label>
                        <input
                            type="text"
                            value={data.codigo_tienda || ''}
                            onChange={(e) => setData({ ...data, codigo_tienda: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tienda
                        </label>
                        <input
                            type="text"
                            value={data.tienda || ''}
                            onChange={(e) => setData({ ...data, tienda: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha
                        </label>
                        <input
                            type="text"
                            value={data.fecha || ''}
                            onChange={(e) => setData({ ...data, fecha: e.target.value })}
                            placeholder="DD/MM/YYYY"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Orden de Compra
                        </label>
                        <input
                            type="text"
                            value={data.orden_compra || ''}
                            onChange={(e) => setData({ ...data, orden_compra: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {/* Products */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Productos</h3>
                        <button
                            onClick={handleAddProduct}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            + Agregar Producto
                        </button>
                    </div>
                    <div className="space-y-4">
                        {data.productos.map((producto, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <h4 className="font-medium text-gray-900">Producto {index + 1}</h4>
                                    <button
                                        onClick={() => handleRemoveProduct(index)}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Clave Artículo
                                        </label>
                                        <input
                                            type="text"
                                            value={producto.clave_articulo}
                                            onChange={(e) => handleProductChange(index, 'clave_articulo', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Descripción
                                        </label>
                                        <input
                                            type="text"
                                            value={producto.descripcion}
                                            onChange={(e) => handleProductChange(index, 'descripcion', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Costo
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={producto.costo}
                                            onChange={(e) => handleProductChange(index, 'costo', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Peso/Unidades
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={producto.peso}
                                            onChange={(e) => handleProductChange(index, 'peso', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Totals */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subtotal
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={data.subtotal || ''}
                            onChange={(e) => setData({ ...data, subtotal: parseFloat(e.target.value) || null })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={data.total || ''}
                            onChange={(e) => setData({ ...data, total: parseFloat(e.target.value) || null })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {/* Confidence Indicator */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Confianza de Extracción</span>
                        <span className={`text-sm font-semibold ${
                            data.confidence >= 0.7 ? 'text-green-600' : 
                            data.confidence >= 0.5 ? 'text-yellow-600' : 
                            'text-red-600'
                        }`}>
                            {(data.confidence * 100).toFixed(0)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full ${
                                data.confidence >= 0.7 ? 'bg-green-600' : 
                                data.confidence >= 0.5 ? 'bg-yellow-600' : 
                                'bg-red-600'
                            }`}
                            style={{ width: `${data.confidence * 100}%` }}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        onClick={onBack}
                        className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    >
                        Volver
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Guardando...' : 'Guardar y Continuar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

