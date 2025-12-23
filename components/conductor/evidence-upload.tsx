'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import CameraCapture from './camera-capture';

interface EvidenceUploadProps {
    title: string;
    description: string;
    stepIndicator?: string;
    onImageSelected: (file: File) => Promise<void>;
    onContinue: () => void | Promise<void>;
    loading?: boolean;
    initialImage?: string | null;
    allowSecondImage?: boolean;
    onSecondImageSelected?: (file: File) => Promise<void>;
    initialSecondImage?: string | null;
}

export default function EvidenceUpload({
    title,
    description,
    stepIndicator,
    onImageSelected,
    onContinue,
    loading = false,
    initialImage = null,
    allowSecondImage = false,
    onSecondImageSelected,
    initialSecondImage = null,
}: EvidenceUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const secondFileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage);
    const [secondPreviewUrl, setSecondPreviewUrl] = useState<string | null>(initialSecondImage);
    const [uploading, setUploading] = useState(false);
    const [uploadingSecond, setUploadingSecond] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [showSecondCamera, setShowSecondCamera] = useState(false);
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

    const handleSecondFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onSecondImageSelected) return;
        await processSecondFile(file);
    };

    const processSecondFile = async (file: File) => {
        const objectUrl = URL.createObjectURL(file);
        setSecondPreviewUrl(objectUrl);
        setUploadingSecond(true);
        setError(null);

        try {
            await onSecondImageSelected(file);
        } catch (err: any) {
            setError('Error al subir la segunda imagen. Intenta nuevamente.');
            console.error(err);
        } finally {
            setUploadingSecond(false);
        }
    };

    const handleSecondCameraCapture = async (file: File) => {
        setShowSecondCamera(false);
        await processSecondFile(file);
    };

    return (
        <div className="max-w-md mx-auto">
            {showCamera && (
                <CameraCapture
                    onCapture={handleCameraCapture}
                    onCancel={() => setShowCamera(false)}
                />
            )}
            {showSecondCamera && (
                <CameraCapture
                    onCapture={handleSecondCameraCapture}
                    onCancel={() => setShowSecondCamera(false)}
                />
            )}

            {stepIndicator && (
                <div className="mb-4 text-sm font-medium text-blue-600">
                    {stepIndicator}
                </div>
            )}

            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-800 mb-6">{description}</p>

            {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                {/* Primera imagen (requerida) */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Foto principal *</label>
                    {previewUrl ? (
                        <div className="relative aspect-video w-full bg-gray-100 rounded-lg overflow-hidden">
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
                            className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm font-medium">Tocar para tomar foto</span>
                        </button>
                    )}
                </div>

                {/* Segunda imagen (opcional) */}
                {allowSecondImage && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Segunda foto (opcional)
                        </label>
                        {secondPreviewUrl ? (
                            <div className="relative aspect-video w-full bg-gray-100 rounded-lg overflow-hidden">
                                <Image
                                    src={secondPreviewUrl}
                                    alt="Segunda evidencia"
                                    fill
                                    className="object-contain"
                                />
                                <button
                                    onClick={() => setShowSecondCamera(true)}
                                    className="absolute bottom-2 right-2 bg-white/90 text-gray-700 px-3 py-1 rounded-full text-xs font-medium shadow hover:bg-white"
                                >
                                    Retomar
                                </button>
                                <button
                                    onClick={() => {
                                        setSecondPreviewUrl(null);
                                        if (secondFileInputRef.current) {
                                            secondFileInputRef.current.value = '';
                                        }
                                    }}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-xs"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowSecondCamera(true)}
                                className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-sm font-medium">Agregar segunda foto</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Fallback File Inputs */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                />
                {allowSecondImage && (
                    <input
                        ref={secondFileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleSecondFileChange}
                    />
                )}
            </div>

            <button
                onClick={onContinue}
                disabled={!previewUrl || uploading || uploadingSecond || loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                {loading || uploading || uploadingSecond ? 'Procesando...' : 'Continuar'}
            </button>
        </div>
    );
}
