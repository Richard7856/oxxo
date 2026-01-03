'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import CameraCapture from './camera-capture';
import { saveNoTicketReason } from '@/app/conductor/actions';

interface ReasonUploadProps {
    title: string;
    description: string;
    stepIndicator?: string;
    reportId: string;
    onContinue: () => void;
    initialReason?: string | null;
    initialImage?: string | null;
    loading?: boolean;
}

export default function ReasonUpload({
    title,
    description,
    stepIndicator,
    reportId,
    onContinue,
    initialReason = null,
    initialImage = null,
    loading = false,
}: ReasonUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [reason, setReason] = useState(initialReason || '');
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await processFile(file);
    };

    const processFile = async (file: File) => {
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setPreviewFile(file);
        setError(null);
    };

    const handleCameraCapture = async (file: File) => {
        setShowCamera(false);
        await processFile(file);
    };

    const handleSubmit = async () => {
        if (!reason.trim()) {
            setError('Por favor, ingresa la razón');
            return;
        }

        setError(null);
        setUploading(true);

        try {
            const result = await saveNoTicketReason(reportId, reason, previewFile || undefined);
            if (result.error) {
                setError(result.error);
                setUploading(false);
            } else {
                onContinue();
            }
        } catch (err: any) {
            setError(err.message || 'Error al guardar');
            setUploading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            {stepIndicator && (
                <div className="text-sm text-gray-500 mb-4 text-center">{stepIndicator}</div>
            )}
            
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
                <p className="text-gray-600 mb-6">{description}</p>

                {error && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Reason Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Razón por la que no hay ticket
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Describe la razón..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                </div>

                {/* Photo Upload (Optional) */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Foto (Opcional)
                    </label>
                    
                    {previewUrl && (
                        <div className="mb-4">
                            <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300">
                                <Image
                                    src={previewUrl}
                                    alt="Preview"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <button
                                onClick={() => setPreviewUrl(null)}
                                className="mt-2 text-sm text-red-600 hover:text-red-800"
                            >
                                Eliminar foto
                            </button>
                        </div>
                    )}

                    {!previewUrl && (
                        <div className="space-y-3">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                {/* Continue Button */}
                <button
                    onClick={handleSubmit}
                    disabled={loading || uploading || !reason.trim()}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading || uploading ? 'Guardando...' : 'Continuar'}
                </button>

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

