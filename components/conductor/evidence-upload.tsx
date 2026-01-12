'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import CameraCapture from './camera-capture';

interface EvidenceUploadProps {
    title: string;
    description: string;
    stepIndicator?: string;
    onImageSelected: (file: File) => Promise<void>;
    onContinue: () => void;
    loading?: boolean;
    initialImage?: string | null;
}

// Función para comprimir imagen manteniendo calidad para OCR
// Solo comprime si el archivo es muy grande, mantiene calidad original para tickets
async function compressImage(file: File, maxWidth: number = 1920, quality: number = 0.85): Promise<File> {
    // Si el archivo es pequeño (< 2MB), no comprimir para mantener calidad
    const maxSizeWithoutCompression = 2 * 1024 * 1024; // 2MB
    if (file.size < maxSizeWithoutCompression) {
        return file;
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = document.createElement('img');
            
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    // Redimensionar solo si es muy grande (para tickets necesitamos buena calidad)
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        console.warn('No se pudo obtener contexto del canvas, usando archivo original');
                        resolve(file);
                        return;
                    }
                    
                    // Usar mejor calidad para tickets (importante para OCR)
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                // Si falla la compresión, devolver archivo original
                                console.warn('Error al comprimir, usando archivo original');
                                resolve(file);
                                return;
                            }
                            
                            const compressedFile = new File(
                                [blob],
                                file.name.replace(/\.[^/.]+$/, '') + '.jpg', // Cambiar extensión a .jpg
                                { type: 'image/jpeg', lastModified: Date.now() }
                            );
                            resolve(compressedFile);
                        },
                        'image/jpeg',
                        quality
                    );
                } catch (err) {
                    console.warn('Error durante la compresión, usando archivo original:', err);
                    resolve(file);
                }
            };
            
            img.onerror = () => {
                // Si falla, devolver archivo original
                console.warn('Error al cargar imagen, usando archivo original');
                resolve(file);
            };
            
            if (e.target?.result) {
                img.src = e.target.result as string;
            } else {
                console.warn('Error al leer archivo, usando archivo original');
                resolve(file);
            }
        };
        
        reader.onerror = () => {
            // Si falla la lectura, devolver archivo original
            console.warn('Error al leer archivo, usando archivo original');
            resolve(file);
        };
        
        reader.readAsDataURL(file);
    });
}

export default function EvidenceUpload({
    title,
    description,
    stepIndicator,
    onImageSelected,
    onContinue,
    loading = false,
    initialImage = null,
}: EvidenceUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage);
    const [uploading, setUploading] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    // Cleanup: Limpiar object URLs al desmontar o cambiar
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Reset input para poder seleccionar el mismo archivo otra vez
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        
        await processFile(file);
    };

    const processFile = async (file: File) => {
        setProcessing(true);
        setError(null);

        try {
            // Limpiar URL anterior si existe (blob URL)
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }

            // Comprimir imagen manteniendo buena calidad para OCR
            // Para tickets, usamos mayor calidad para no afectar la extracción
            const isTicket = title.toLowerCase().includes('ticket');
            const compressedFile = await compressImage(
                file,
                isTicket ? 2400 : 1920, // Más resolución para tickets
                isTicket ? 0.9 : 0.85 // Mejor calidad para tickets
            );

            // Create local preview
            const objectUrl = URL.createObjectURL(compressedFile);
            setPreviewUrl(objectUrl);
            setUploading(true);

            await onImageSelected(compressedFile);
        } catch (err: any) {
            setError(err.message || 'Error al procesar la imagen. Intenta nuevamente.');
            console.error(err);
        } finally {
            setUploading(false);
            setProcessing(false);
        }
    };

    const handleCameraCapture = async (file: File) => {
        setShowCamera(false);
        await processFile(file);
    };

    const handleSelectFromDevice = () => {
        // Asegurar que la cámara esté cerrada
        setShowCamera(false);
        // Pequeño delay para asegurar que la cámara se cierre primero
        setTimeout(() => {
            fileInputRef.current?.click();
        }, 100);
    };

    return (
        <div className="max-w-md mx-auto">
            {showCamera && (
                <CameraCapture
                    onCapture={handleCameraCapture}
                    onCancel={() => setShowCamera(false)}
                />
            )}

            {stepIndicator && (
                <div className="mb-4 text-sm font-medium text-blue-600">
                    {stepIndicator}
                </div>
            )}

            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600 mb-6">{description}</p>

            {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                {previewUrl ? (
                    <div className="relative aspect-video w-full bg-gray-100 rounded-lg overflow-hidden mb-4">
                        <Image
                            src={previewUrl}
                            alt="Evidencia"
                            fill
                            className="object-contain"
                            priority={false}
                            unoptimized={previewUrl.startsWith('blob:')}
                        />
                        <div className="absolute bottom-2 right-2 flex gap-2">
                            <button
                                onClick={handleSelectFromDevice}
                                disabled={processing || uploading}
                                className="bg-white/90 text-gray-700 px-3 py-1 rounded-full text-xs font-medium shadow hover:bg-white disabled:opacity-50"
                            >
                                Cambiar
                            </button>
                            <button
                                onClick={() => setShowCamera(true)}
                                disabled={processing || uploading}
                                className="bg-white/90 text-gray-700 px-3 py-1 rounded-full text-xs font-medium shadow hover:bg-white disabled:opacity-50"
                            >
                                Retomar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <button
                            onClick={() => setShowCamera(true)}
                            className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-800 hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm font-medium">Tomar foto</span>
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-px bg-gray-300"></div>
                            <span className="text-xs text-gray-800">o</span>
                            <div className="flex-1 h-px bg-gray-300"></div>
                        </div>
                        <button
                            onClick={handleSelectFromDevice}
                            className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Subir desde dispositivo
                        </button>
                    </div>
                )}

                {/* File Input (Hidden) */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            {(processing || uploading) && (
                <div className="mb-4 bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                    <p className="text-sm text-blue-700">
                        {processing ? 'Procesando imagen...' : 'Subiendo imagen...'}
                    </p>
                </div>
            )}

            <button
                onClick={onContinue}
                disabled={!previewUrl || uploading || loading || processing}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                {loading || uploading || processing ? 'Procesando...' : 'Continuar'}
            </button>
        </div>
    );
}
