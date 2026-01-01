'use client';

import { useState, useRef } from 'react';
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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await processFile(file);
    };

    const processFile = async (file: File) => {
        // Create local preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setUploading(true);
        setError(null);

        try {
            await onImageSelected(file);
        } catch (err: any) {
            setError('Error al subir la imagen. Intenta nuevamente.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleCameraCapture = async (file: File) => {
        setShowCamera(false);
        await processFile(file);
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
                        />
                        <button
                            onClick={() => setShowCamera(true)}
                            className="absolute bottom-2 right-2 bg-white/90 text-gray-700 px-3 py-1 rounded-full text-xs font-medium shadow hover:bg-white"
                        >
                            Retomar
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowCamera(true)}
                        className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors mb-4"
                    >
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm font-medium">Tocar para tomar foto</span>
                    </button>
                )}

                {/* Fallback File Input (Hidden but accessible if camera fails?) 
                    Actually, let's keep it but only trigger via a secondary button if needed.
                    For now, the main button opens the Custom Camera.
                */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            <button
                onClick={onContinue}
                disabled={!previewUrl || uploading || loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                {loading || uploading ? 'Procesando...' : 'Continuar'}
            </button>
        </div>
    );
}
