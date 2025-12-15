'use client';

import { useState } from 'react';
import { submitIncidentReport } from '@/app/conductor/actions';

interface IncidentCartProps {
    reportId: string;
}

interface IncidentItem {
    id: string;
    productName: string;
    quantity: string;
    reason: string;
    note: string;
}

const COMMON_PRODUCTS = [
    'Tomate',
    'Cebolla',
    'Lechuga',
    'Zanahoria',
    'Papa',
    'Manzana',
    'Plátano',
    'Fresa',
    // Add more common products as needed
];

export default function IncidentCart({ reportId }: IncidentCartProps) {
    const [items, setItems] = useState<IncidentItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [productName, setProductName] = useState(''); // Can be free text or selection
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('Mal estado');
    const [note, setNote] = useState('');
    const [customProduct, setCustomProduct] = useState(false);

    const handleAddItem = () => {
        if (!productName || !quantity) return;

        const newItem: IncidentItem = {
            id: Date.now().toString(),
            productName,
            quantity,
            reason,
            note,
        };

        setItems((prev) => [...prev, newItem]);

        // Reset form
        setProductName('');
        setQuantity('');
        setReason('Mal estado');
        setNote('');
        setCustomProduct(false);
    };

    const handleRemoveItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await submitIncidentReport(reportId, items);
        } catch (error) {
            console.error(error);
            setLoading(false);
            alert('Error al enviar reporte');
        }
    };

    return (
        <div className="max-w-md mx-auto space-y-8 pb-10">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Reportar Incidencias</h2>
                <p className="text-gray-600">Añade los productos con incidencias, uno por uno.</p>
            </div>

            {/* Add Item Form */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Añadir Producto</h3>

                {/* Product Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                    {customProduct ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                className="w-full border p-2 rounded"
                                placeholder="Escribe el nombre..."
                            />
                            <button onClick={() => setCustomProduct(false)} className="text-blue-600 text-sm whitespace-nowrap">
                                Ver lista
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <select
                                value={productName}
                                onChange={(e) => {
                                    if (e.target.value === 'OTRO') {
                                        setCustomProduct(true);
                                        setProductName('');
                                    } else {
                                        setProductName(e.target.value);
                                    }
                                }}
                                className="w-full border p-2 rounded"
                            >
                                <option value="">Seleccionar...</option>
                                {COMMON_PRODUCTS.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                                <option value="OTRO">Otro...</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Quantity */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad (Kg/Unidades)</label>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full border p-2 rounded"
                        placeholder="Ej. 1.5 o 3 cajas"
                    />
                </div>

                {/* Reason */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Motivo</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['Mal estado', 'Faltante', 'Rechazado', 'Otro'].map((r) => (
                            <label key={r} className="flex items-center space-x-2 border p-2 rounded cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="reason"
                                    value={r}
                                    checked={reason === r}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">{r}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Note */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nota (Opcional)</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full border p-2 rounded"
                        rows={2}
                        placeholder="Detalles adicionales..."
                    />
                </div>

                <button
                    onClick={handleAddItem}
                    disabled={!productName || !quantity}
                    className="w-full bg-blue-100 text-blue-700 font-medium py-2 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                    + Añadir a la Lista
                </button>
            </div>

            {/* Cart List */}
            {items.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-lg mb-4 text-gray-800">Productos en Lista ({items.length})</h3>
                    <div className="space-y-3">
                        {items.map((item) => (
                            <div key={item.id} className="bg-white p-3 rounded shadow-sm border border-gray-100 flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-900">{item.quantity} - {item.productName}</p>
                                    <p className="text-sm text-red-600 font-medium">{item.reason}</p>
                                    {item.note && <p className="text-sm text-gray-500 mt-1">"{item.note}"</p>}
                                </div>
                                <button
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={items.length === 0 || loading}
                className="w-full bg-red-600 text-white font-bold py-4 rounded-lg shadow-lg hover:bg-red-700 transition-transformation transform active:scale-95 disabled:bg-gray-400 disabled:transform-none"
            >
                {loading ? 'Enviando...' : 'Crear Reporte y Chatear'}
            </button>
        </div>
    );
}
