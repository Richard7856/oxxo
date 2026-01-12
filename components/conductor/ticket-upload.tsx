'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import CameraCapture from './camera-capture';

interface TicketUploadProps {
    title: string;
    description: string;
    stepIndicator?: string;
    onTicketUploaded: (imageUrl: string) => Promise<void>;
    onContinue: () => void;
    initialImage?: string | null;
    loading?: boolean;
}

export default function TicketUpload({
    title,
    description,
    stepIndicator,
    onTicketUploaded,
    onContinue,
    initialImage = null,
    loading = false,
}: TicketUploadProps) {
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
            await onTicketUploaded(objectUrl);
        } catch (err: any) {
            setError('Error al subir el ticket. Intenta nuevamente.');
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
            {stepIndicator && (
                <div className="text-sm text-gray-800 mb-4 text-center">{stepIndicator}</div>
            )}
            
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
                <p className="text-gray-600 mb-6">{description}</p>

                {error && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Preview */}
                {previewUrl && (
                    <div className="mb-6">
                        <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300">
                            <Image
                                src={previewUrl}
                                alt="Preview del ticket"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <p className="text-sm text-gray-600 mt-2 text-center">
                            Ticket capturado correctamente
                        </p>
                    </div>
                )}

                {/* Upload Options */}
                {!previewUrl && (
                    <div className="space-y-3 mb-6">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? 'Subiendo...' : 'Seleccionar desde Galería'}
                        </button>

                        <button
                            onClick={() => setShowCamera(true)}
                            disabled={uploading}
                            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Tomar Foto
                        </button>
                    </div>
                )}

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {/* Continue Button */}
                {previewUrl && (
                    <button
                        onClick={onContinue}
                        disabled={loading || uploading}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Procesando...' : 'Continuar'}
                    </button>
                )}

                {/* Camera Modal */}
                {showCamera && (
                    <CameraCapture
                        onCapture={handleCameraCapture}
                        onCancel={() => setShowCamera(false)}
                    />
                )}
            </div>
        </div>
    );
}



