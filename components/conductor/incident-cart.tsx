'use client';

import { useState, useRef } from 'react';
import { submitIncidentReport } from '@/app/conductor/actions';
import { uploadEvidence } from '@/app/conductor/actions';
import Image from 'next/image';
import CameraCapture from './camera-capture';

interface IncidentCartProps {
    reportId: string;
}

interface IncidentItem {
    id: string;
    productName: string;
    quantity: string;
    reason: string;
    note: string;
    imageUrl?: string | null;
}

const PRODUCTS = [
    'Todos los productos',
    'Aguacate Hass Premium',
    'Ajo  Kg',
    'Apio',
    'Cebolla Blanca',
    'Chayote',
    'Chile poblano',
    'Chile Serrano',
    'Cilantro',
    'Durazno',
    'Elote',
    'Fresa',
    'Guayaba',
    'Jicama',
    'Jitomate Saladette',
    'Lechuga Romana',
    'Limón con Semilla',
    'Mandarina',
    'Mango Ataulfo',
    'Manzana Golden',
    'Manzana Roja',
    'Melon',
    'Naranja Nacional',
    'Nopal',
    'Papa',
    'Papaya',
    'Pepino',
    'Pera',
    'Perejil',
    'pimiento morron',
    'PIña',
    'Plátano Tabasco',
    'Sandia',
    'Tomate Verde kg',
    'Toronja',
    'Uva verde',
    'Zanahoria',
];

export default function IncidentCart({ reportId }: IncidentCartProps) {
    const [items, setItems] = useState<IncidentItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [productName, setProductName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('Mal estado');
    const [note, setNote] = useState('');
    const [productImage, setProductImage] = useState<File | null>(null);
    const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check if "Todos los productos" is already in the list
    const hasTodosLosProductos = items.some(item => item.productName === 'Todos los productos');
    
    // Disable product selection if "Todos los productos" is in list
    const productSelectDisabled = hasTodosLosProductos;

    // Check if current reason allows photos
    const allowsPhoto = reason === 'Mal estado' || reason === 'Otro';

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona una imagen');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            alert('La imagen es muy grande. Máximo 10MB');
            return;
        }
        
        setProductImage(file);
        const preview = URL.createObjectURL(file);
        setProductImagePreview(preview);
    };

    const handleCameraCapture = async (file: File) => {
        setShowCamera(false);
        setProductImage(file);
        const preview = URL.createObjectURL(file);
        setProductImagePreview(preview);
    };

    const removeImage = () => {
        setProductImage(null);
        if (productImagePreview) {
            URL.revokeObjectURL(productImagePreview);
            setProductImagePreview(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleAddItem = async () => {
        if (!productName || !quantity) return;

        let imageUrl: string | null = null;

        // Upload image if provided and reason allows it
        if (productImage && allowsPhoto) {
            setUploadingImage(true);
            try {
                const formData = new FormData();
                formData.append('file', productImage);
                const key = `incident_${productName.replace(/\s+/g, '_')}_${Date.now()}`;
                const result = await uploadEvidence(reportId, key, formData);
                if (result.error) {
                    alert('Error al subir la imagen: ' + result.error);
                    setUploadingImage(false);
                    return;
                }
                imageUrl = result.url || null;
            } catch (error) {
                console.error('Error uploading image:', error);
                alert('Error al subir la imagen');
                setUploadingImage(false);
                return;
            } finally {
                setUploadingImage(false);
            }
        }

        const newItem: IncidentItem = {
            id: Date.now().toString(),
            productName,
            quantity,
            reason,
            note,
            imageUrl,
        };

        setItems((prev) => [...prev, newItem]);

        // Reset form
        setProductName('');
        setQuantity('');
        setReason('Mal estado');
        setNote('');
        setProductImage(null);
        if (productImagePreview) {
            URL.revokeObjectURL(productImagePreview);
            setProductImagePreview(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveItem = (id: string) => {
        setItems((prev) => {
            const item = prev.find(i => i.id === id);
            if (item?.productName === 'Todos los productos') {
                // When removing "Todos los productos", re-enable selection
            }
            return prev.filter((item) => item.id !== id);
        });
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
                <p className="text-gray-800">Añade los productos con incidencias, uno por uno.</p>
            </div>

            {/* Add Item Form */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2 text-gray-900">Añadir Producto</h3>

                {/* Product Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                    <select
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        disabled={productSelectDisabled}
                        className={`w-full border-2 rounded-lg px-4 py-3 text-gray-900 bg-white 
                            ${productSelectDisabled 
                                ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60' 
                                : 'border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-20'
                            }
                            appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>')] bg-no-repeat bg-right pr-10 bg-[length:20px]`}
                    >
                        <option value="">Seleccionar...</option>
                        {PRODUCTS.map((p) => (
                            <option key={p} value={p} className="text-gray-900">
                                {p}
                            </option>
                        ))}
                    </select>
                    {productSelectDisabled && (
                        <p className="mt-1 text-sm text-amber-600">
                            ⚠️ "Todos los productos" ya está en la lista. Elimínalo para añadir productos individuales.
                        </p>
                    )}
                </div>

                {/* Quantity */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad (Kg)</label>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-20"
                        placeholder="Ej. 1.5 kg"
                        disabled={productSelectDisabled && productName !== 'Todos los productos'}
                    />
                </div>

                {/* Reason */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Motivo</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['Mal estado', 'Faltante', 'Rechazado', 'Otro'].map((r) => (
                            <label 
                                key={r} 
                                className={`flex items-center space-x-2 border-2 rounded-lg p-3 cursor-pointer transition-all ${
                                    reason === r 
                                        ? 'border-red-500 bg-red-50' 
                                        : 'border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="reason"
                                    value={r}
                                    checked={reason === r}
                                    onChange={(e) => {
                                        setReason(e.target.value);
                                        // Clear image if reason doesn't allow photos
                                        if (e.target.value !== 'Mal estado' && e.target.value !== 'Otro') {
                                            setProductImage(null);
                                            if (productImagePreview) {
                                                URL.revokeObjectURL(productImagePreview);
                                                setProductImagePreview(null);
                                            }
                                        }
                                    }}
                                    className="text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm font-medium text-gray-900">{r}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Photo (only for "Mal estado" and "Otro") */}
                {allowsPhoto && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Foto (Opcional)
                        </label>
                        {productImagePreview ? (
                            <div className="relative w-full rounded-lg overflow-hidden border-2 border-gray-300">
                                <div className="relative aspect-video w-full bg-gray-100">
                                    <Image
                                        src={productImagePreview}
                                        alt="Vista previa"
                                        fill
                                        className="object-contain"
                                        unoptimized
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 text-sm shadow-lg"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                    id="incident-image-input"
                                />
                                <label
                                    htmlFor="incident-image-input"
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg cursor-pointer transition-colors border-2 border-dashed border-gray-300 text-center"
                                >
                                    <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm">Seleccionar foto</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowCamera(true)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg transition-colors border-2 border-dashed border-gray-300"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Note */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nota (Opcional)</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-20"
                        rows={2}
                        placeholder="Detalles adicionales..."
                    />
                </div>

                <button
                    onClick={handleAddItem}
                    disabled={!productName || !quantity || uploadingImage || (productSelectDisabled && productName !== 'Todos los productos')}
                    className="w-full bg-blue-100 text-blue-700 font-medium py-2 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {uploadingImage ? 'Subiendo imagen...' : '+ Añadir a la Lista'}
                </button>
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <CameraCapture
                    onCapture={handleCameraCapture}
                    onCancel={() => setShowCamera(false)}
                />
            )}

            {/* Cart List */}
            {items.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-lg mb-4 text-gray-900">Productos en Lista ({items.length})</h3>
                    <div className="space-y-3">
                        {items.map((item) => (
                            <div key={item.id} className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">{item.quantity} kg - {item.productName}</p>
                                        <p className="text-sm text-red-600 font-medium">{item.reason}</p>
                                        {item.note && <p className="text-sm text-gray-700 mt-1">"{item.note}"</p>}
                                        {item.imageUrl && (
                                            <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                                                <Image
                                                    src={item.imageUrl}
                                                    alt={`${item.productName} - ${item.reason}`}
                                                    width={200}
                                                    height={150}
                                                    className="w-full h-auto max-h-32 object-cover"
                                                    unoptimized
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Eliminar"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={items.length === 0 || loading}
                className="w-full bg-red-600 text-white font-bold py-4 rounded-lg shadow-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {loading ? 'Enviando...' : 'Crear Reporte y Chatear'}
            </button>
        </div>
    );
}
