'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import CameraCapture from './camera-capture';

interface DoubleEvidenceUploadProps {
    title: string;
    description: string;
    stepIndicator?: string;
    onImageSelected: (key: string, file: File) => Promise<void>;
    onContinue: () => void;
    loading?: boolean;
    initialImages?: {
        first?: string | null;
        second?: string | null;
    };
    firstLabel: string;
    secondLabel: string;
    secondOptional?: boolean;
}

// Compress images >2MB before upload — same threshold/settings as evidence-upload.tsx
async function compressImage(file: File): Promise<File> {
    const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
    const MAX_WIDTH = 1920;
    const QUALITY = 0.85;

    if (file.size <= MAX_SIZE_BYTES) return file;

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(file); return; }
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (!blob) { resolve(file); return; }
                        resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                    },
                    'image/jpeg',
                    QUALITY
                );
            };
            img.onerror = () => resolve(file);
            img.src = e.target?.result as string;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
}

export default function DoubleEvidenceUpload({
    title,
    description,
    stepIndicator,
    onImageSelected,
    onContinue,
    loading = false,
    initialImages = {},
    firstLabel,
    secondLabel,
    secondOptional = true,
}: DoubleEvidenceUploadProps) {
    const [previewUrls, setPreviewUrls] = useState<{
        first: string | null;
        second: string | null;
    }>({
        first: initialImages.first || null,
        second: initialImages.second || null,
    });
    const [uploading, setUploading] = useState<{
        first: boolean;
        second: boolean;
    }>({
        first: false,
        second: false,
    });
    const [showCamera, setShowCamera] = useState<'first' | 'second' | null>(null);
    const [error, setError] = useState<string | null>(null);

    const processFile = async (key: 'first' | 'second', file: File) => {
        const compressed = await compressImage(file);
        const objectUrl = URL.createObjectURL(compressed);
        // Revoke previous blob URL before replacing to avoid memory leak
        setPreviewUrls(prev => {
            const old = prev[key];
            if (old && old.startsWith('blob:')) URL.revokeObjectURL(old);
            return { ...prev, [key]: objectUrl };
        });
        setUploading(prev => ({ ...prev, [key]: true }));
        setError(null);

        try {
            await onImageSelected(key, compressed);
        } catch (err: any) {
            setError('Error al subir la imagen. Intenta nuevamente.');
            console.error(err);
        } finally {
            setUploading(prev => ({ ...prev, [key]: false }));
        }
    };

    // Cleanup all blob URLs on unmount
    useEffect(() => {
        return () => {
            if (previewUrls.first && previewUrls.first.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrls.first);
            }
            if (previewUrls.second && previewUrls.second.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrls.second);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCameraCapture = async (file: File) => {
        if (showCamera) {
            await processFile(showCamera, file);
        }
        setShowCamera(null);
    };

    const canContinue = previewUrls.first !== null && !uploading.first && !uploading.second;

    return (
        <div className="max-w-md mx-auto">
            {showCamera && (
                <CameraCapture
                    onCapture={handleCameraCapture}
                    onCancel={() => setShowCamera(null)}
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

            {/* Primera Foto - Obligatoria */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {firstLabel} <span className="text-red-600">*</span>
                </label>
                {previewUrls.first ? (
                    <div className="relative aspect-video w-full bg-gray-100 rounded-lg overflow-hidden mb-2">
                        <Image
                            src={previewUrls.first}
                            alt="Primera foto"
                            fill
                            className="object-contain"
                        />
                        <button
                            onClick={() => setShowCamera('first')}
                            disabled={uploading.first}
                            className="absolute bottom-2 right-2 bg-white/90 text-gray-700 px-3 py-1 rounded-full text-xs font-medium shadow hover:bg-white disabled:opacity-50"
                        >
                            {uploading.first ? 'Subiendo...' : 'Retomar'}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowCamera('first')}
                        disabled={uploading.first}
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

            {/* Segunda Foto - Opcional */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {secondLabel} {secondOptional && <span className="text-gray-800 text-xs">(Opcional)</span>}
                </label>
                {previewUrls.second ? (
                    <div className="relative aspect-video w-full bg-gray-100 rounded-lg overflow-hidden mb-2">
                        <Image
                            src={previewUrls.second}
                            alt="Segunda foto"
                            fill
                            className="object-contain"
                        />
                        <button
                            onClick={() => setShowCamera('second')}
                            disabled={uploading.second}
                            className="absolute bottom-2 right-2 bg-white/90 text-gray-700 px-3 py-1 rounded-full text-xs font-medium shadow hover:bg-white disabled:opacity-50"
                        >
                            {uploading.second ? 'Subiendo...' : 'Retomar'}
                        </button>
                        <button
                            onClick={() => {
                                URL.revokeObjectURL(previewUrls.second!);
                                setPreviewUrls(prev => ({ ...prev, second: null }));
                            }}
                            className="absolute top-2 right-2 bg-red-500/90 text-white px-2 py-1 rounded-full text-xs font-medium shadow hover:bg-red-600"
                        >
                            Eliminar
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowCamera('second')}
                        disabled={uploading.second}
                        className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm font-medium">Tocar para tomar foto (Opcional)</span>
                    </button>
                )}
            </div>

            <button
                onClick={onContinue}
                disabled={!previewUrls.first || uploading.first || uploading.second || loading}
                className="w-full bg-[#1D6B2A] hover:bg-[#155120] text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                {loading || uploading.first || uploading.second ? 'Procesando...' : 'Continuar'}
            </button>
        </div>
    );
}

