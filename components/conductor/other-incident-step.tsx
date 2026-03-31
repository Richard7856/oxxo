'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import CameraCapture from './camera-capture';
import { saveOtherIncident } from '@/app/conductor/actions';

interface OtherIncidentStepProps {
    reportId: string;
    onContinue: () => void;
    stepIndicator?: string;
}

export default function OtherIncidentStep({
    reportId,
    onContinue,
    stepIndicator,
}: OtherIncidentStepProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [description, setDescription] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const processFile = (file: File) => {
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setPreviewFile(file);
        setError(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleCameraCapture = (file: File) => {
        setShowCamera(false);
        processFile(file);
    };

    const removePhoto = () => {
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setPreviewFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async () => {
        if (!description.trim()) {
            setError('Por favor, describe la incidencia');
            return;
        }

        setError(null);
        setSaving(true);

        try {
            const result = await saveOtherIncident(
                reportId,
                description,
                previewFile || undefined
            );
            if (result.error) {
                setError(result.error);
                setSaving(false);
            } else {
                onContinue();
            }
        } catch (err: any) {
            setError(err.message || 'Error al guardar');
            setSaving(false);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            {stepIndicator && (
                <div className="text-sm text-gray-500 mb-4 text-center">{stepIndicator}</div>
            )}

            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Otra Incidencia</h2>
                <p className="text-gray-600 mb-6">
                    Describe la incidencia adicional que encontraste.
                </p>

                {error && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Descripción */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe la incidencia..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                </div>

                {/* Foto Opcional */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Foto <span className="text-gray-400 text-xs">(Opcional)</span>
                    </label>

                    {previewUrl ? (
                        <div className="mb-4">
                            <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300">
                                <Image
                                    src={previewUrl}
                                    alt="Foto de la incidencia"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <button
                                onClick={removePhoto}
                                className="mt-2 text-sm text-red-600 hover:text-red-800"
                            >
                                Eliminar foto
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={saving}
                                className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                                Seleccionar desde Galería
                            </button>
                            <button
                                onClick={() => setShowCamera(true)}
                                disabled={saving}
                                className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
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

                {/* Botón Continuar */}
                <button
                    onClick={handleSubmit}
                    disabled={saving || !description.trim()}
                    className="w-full bg-[#1D6B2A] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#155120] transition-colors disabled:opacity-50"
                >
                    {saving ? 'Guardando...' : 'Continuar'}
                </button>

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
