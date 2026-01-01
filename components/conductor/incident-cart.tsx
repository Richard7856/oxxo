'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { submitIncidentReport } from '@/app/conductor/actions';
import CameraCapture from './camera-capture';
import { uploadEvidence } from '@/app/conductor/actions';

interface IncidentCartProps {
    reportId: string;
}

interface IncidentItem {
    id: string;
    productName: string;
    quantity: string;
    reason: string;
    note: string;
    photoUrl?: string | null;
}

// Productos con sus unidades
const PRODUCTS_WITH_UNITS: Record<string, 'kg' | 'pz'> = {
    'Aguacate Hass Premium': 'pz',
    'Ajo Kg': 'kg',
    'Apio': 'pz',
    'Cebolla Blanca': 'kg',
    'Chayote': 'pz',
    'Chile poblano': 'kg',
    'Chile Serrano': 'kg',
    'Cilantro': 'pz',
    'Durazno': 'pz',
    'Elote': 'pz',
    'Fresa': 'kg',
    'Guayaba': 'pz',
    'Jicama': 'kg',
    'Jitomate Saladette': 'kg',
    'Lechuga Romana': 'pz',
    'Limón con Semilla': 'kg',
    'Mandarina': 'pz',
    'Mango Ataulfo': 'pz',
    'Manzana Golden': 'pz',
    'Manzana Roja': 'pz',
    'Melon': 'pz',
    'Naranja Nacional': 'pz',
    'Nopal': 'kg',
    'Papa': 'kg',
    'Papaya': 'pz',
    'Pepino': 'pz',
    'Pera': 'pz',
    'Perejil': 'pz',
    'Pimiento morron': 'kg',
    'Piña': 'pz',
    'Plátano Tabasco': 'pz',
    'Sandia': 'pz',
    'Tomate Verde kg': 'kg',
    'Toronja': 'pz',
    'Uva verde': 'pz',
    'Zanahoria': 'kg',
};

const COMMON_PRODUCTS = Object.keys(PRODUCTS_WITH_UNITS);

export default function IncidentCart({ reportId }: IncidentCartProps) {
    const router = useRouter();
    const [items, setItems] = useState<IncidentItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [productName, setProductName] = useState(''); // Only from predefined list
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('Mal estado');
    const [note, setNote] = useState('');
    const [showCamera, setShowCamera] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [allProducts, setAllProducts] = useState(false); // Si se seleccionó "Todos los productos"

    const handleCameraCapture = async (file: File) => {
        setShowCamera(false);
        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const result = await uploadEvidence(reportId, `incident_photo_${Date.now()}`, formData);
            if (result.error) throw new Error(result.error);
            // Guardar la URL del servidor, no el objeto local
            if (result.url) {
                setPhotoPreview(result.url);
            } else {
                // Fallback: usar objeto local si no hay URL del servidor
                const objectUrl = URL.createObjectURL(file);
                setPhotoPreview(objectUrl);
            }
        } catch (err) {
            console.error('Error uploading photo:', err);
            alert('Error al subir la foto');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleAddItem = () => {
        if (!productName || !quantity) return;

        // Si se seleccionó "Todos los productos", agregar todos
        if (allProducts) {
            const newItems: IncidentItem[] = COMMON_PRODUCTS.map((product) => ({
                id: `${Date.now()}_${product}`,
                productName: product,
                quantity: quantity, // Misma cantidad para todos
                reason,
                note,
                photoUrl: null, // No se puede agregar foto a todos
            }));

            setItems((prev) => [...prev, ...newItems]);

            // Reset form
            setProductName('');
            setQuantity('');
            setReason('Mal estado');
            setNote('');
            setAllProducts(false);
            setPhotoPreview(null);
            return;
        }

        // Verificar que el producto esté en la lista predefinida
        if (!COMMON_PRODUCTS.includes(productName)) {
            alert('Por favor selecciona un producto de la lista');
            return;
        }

        const newItem: IncidentItem = {
            id: Date.now().toString(),
            productName,
            quantity,
            reason,
            note,
            photoUrl: photoPreview || null,
        };

        setItems((prev) => [...prev, newItem]);

        // Reset form
        setProductName('');
        setQuantity('');
        setReason('Mal estado');
        setNote('');
        setPhotoPreview(null);
    };

    const needsPhoto = reason === 'Mal estado' || reason === 'Otro';

    const handleRemoveItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const result = await submitIncidentReport(reportId, items);
            
            // Si la acción fue exitosa, redirigir al chat
            if (result?.success && result?.chatUrl) {
                router.push(result.chatUrl);
            } else if (result?.error) {
                // Si hay un error real, mostrarlo
                setLoading(false);
                alert(result.error || 'Error al enviar reporte. Por favor intenta nuevamente.');
            } else {
                // Fallback: redirigir al chat de todas formas
                router.push(`/conductor/chat/${reportId}`);
            }
        } catch (error: any) {
            // Manejar errores inesperados
            console.error('Error al enviar reporte:', error);
            setLoading(false);
            alert('Error al enviar reporte. Por favor intenta nuevamente.');
        }
    };

    return (
        <div className="max-w-md mx-auto space-y-8 pb-10">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Reportar Incidencias</h2>
                <p className="text-gray-600">Añade los productos con incidencias, uno por uno.</p>
            </div>

            {showCamera && (
                <CameraCapture
                    onCapture={handleCameraCapture}
                    onCancel={() => setShowCamera(false)}
                />
            )}

            {/* Add Item Form */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                <h3 className="font-semibold text-lg text-gray-900 border-b border-gray-300 pb-2">Añadir Producto</h3>

                {/* Product Name */}
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Nombre del Producto</label>
                    <select
                        value={productName}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value === 'TODOS') {
                                setAllProducts(true);
                                setProductName('TODOS');
                            } else {
                                setAllProducts(false);
                                setProductName(value);
                            }
                        }}
                        className="w-full border-2 border-gray-300 p-2.5 rounded-lg text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    >
                        <option value="">Seleccionar...</option>
                        <option value="TODOS" className="font-bold">📦 Todos los productos</option>
                        {COMMON_PRODUCTS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>

                {/* Quantity */}
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                        Cantidad {productName && productName !== 'TODOS' && PRODUCTS_WITH_UNITS[productName] 
                            ? `(${PRODUCTS_WITH_UNITS[productName]})` 
                            : allProducts 
                                ? '(aplicará a todos)' 
                                : '(Kg/Pz)'}
                    </label>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full border-2 border-gray-300 p-2.5 rounded-lg text-gray-900 placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        placeholder={allProducts ? "Cantidad para todos los productos" : productName && PRODUCTS_WITH_UNITS[productName] 
                            ? `Ej. 1.5 ${PRODUCTS_WITH_UNITS[productName]}` 
                            : "Ej. 1.5 kg o 3 pz"}
                    />
                </div>

                {/* Reason */}
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Motivo</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['Mal estado', 'Faltante', 'Rechazado', 'Otro'].map((r) => (
                            <label key={r} className="flex items-center space-x-2 border-2 border-gray-300 p-2.5 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-red-300">
                                <input
                                    type="radio"
                                    name="reason"
                                    value={r}
                                    checked={reason === r}
                                    onChange={(e) => {
                                        setReason(e.target.value);
                                        if (e.target.value !== 'Mal estado' && e.target.value !== 'Otro') {
                                            setPhotoPreview(null);
                                        }
                                    }}
                                    className="text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm font-medium text-gray-900">{r}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Photo - Solo para Mal estado y Otro, y NO para "Todos los productos" */}
                {needsPhoto && !allProducts && (
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Foto (Opcional)
                        </label>
                        {photoPreview ? (
                            <div className="relative aspect-video w-full bg-gray-100 rounded-lg overflow-hidden mb-2">
                                <Image
                                    src={photoPreview}
                                    alt="Foto del producto"
                                    fill
                                    className="object-contain"
                                />
                                <button
                                    onClick={() => setShowCamera(true)}
                                    disabled={uploadingPhoto}
                                    className="absolute bottom-2 right-2 bg-white/90 text-gray-700 px-3 py-1 rounded-full text-xs font-medium shadow hover:bg-white disabled:opacity-50"
                                >
                                    {uploadingPhoto ? 'Subiendo...' : 'Cambiar'}
                                </button>
                                <button
                                    onClick={() => {
                                        URL.revokeObjectURL(photoPreview);
                                        setPhotoPreview(null);
                                    }}
                                    className="absolute top-2 right-2 bg-red-500/90 text-white px-2 py-1 rounded-full text-xs font-medium shadow hover:bg-red-600"
                                >
                                    Eliminar
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowCamera(true)}
                                disabled={uploadingPhoto}
                                className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-sm font-medium">Tocar para tomar foto</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Note */}
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Nota (Opcional)</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full border-2 border-gray-300 p-2.5 rounded-lg text-gray-900 placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        rows={2}
                        placeholder="Detalles adicionales..."
                    />
                </div>

                <button
                    onClick={handleAddItem}
                    disabled={!productName || !quantity}
                    className="w-full bg-blue-100 text-blue-700 font-medium py-2 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                    {allProducts ? '+ Añadir Todos los Productos' : '+ Añadir a la Lista'}
                </button>
            </div>

            {/* Cart List */}
            {items.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-lg mb-4 text-gray-800">Productos en Lista ({items.length})</h3>
                    <div className="space-y-3">
                        {items.map((item) => {
                            const unit = PRODUCTS_WITH_UNITS[item.productName] || '';
                            return (
                            <div key={item.id} className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">
                                            {item.quantity} {unit} - {item.productName}
                                        </p>
                                        <p className="text-sm text-red-600 font-medium">{item.reason}</p>
                                        {item.note && <p className="text-sm text-gray-500 mt-1">"{item.note}"</p>}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="text-gray-400 hover:text-red-500 ml-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                {item.photoUrl && (
                                    <div className="relative aspect-video w-full bg-gray-100 rounded-lg overflow-hidden mt-2">
                                        <Image
                                            src={item.photoUrl}
                                            alt="Foto del producto"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                )}
                            </div>
                            );
                        })}
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
