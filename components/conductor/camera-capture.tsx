'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onCancel: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null); // Use Ref for stream management
    const [_, setStreamState] = useState<MediaStream | null>(null); // Just for re-render if needed, or remove if not used for rendering
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [capturedFile, setCapturedFile] = useState<File | null>(null);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            setStreamState(null);
        }
    }, []);

    const startCamera = useCallback(async () => {
        try {
            // Stop any existing stream first
            stopCamera();
            setLoading(true);
            // Try environment first, fall back to any if needed? 
            // Actually 'facingMode: environment' is usually enough hint.
            // But for desktop debug (where user might be strictly using 'user' cam), 
            // sometimes explicit 'environment' fails if not available.
            // Let's try a more generic approach or detailed constraints.

            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
            };

            let mediaStream: MediaStream;
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (envError) {
                console.warn('Environment camera not found, trying fallback...', envError);
                // Fallback to any video device (e.g. laptop webcam)
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });
            }

            streamRef.current = mediaStream;
            setStreamState(mediaStream); // Trigger render
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setLoading(false);
        } catch (err: any) {
            console.error('Error accessing camera:', err);
            setError(
                'No se pudo acceder a la cámara. Verifica permisos.'
            );
            setLoading(false);
        }
    }, [stopCamera]);

    useEffect(() => {
        if (!capturedImage) {
            startCamera();
        }
        return () => {
            stopCamera();
        };
    }, [startCamera, stopCamera, capturedImage]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const file = new File([blob], `capture_${Date.now()}.jpg`, {
                                type: 'image/jpeg',
                            });
                            const url = URL.createObjectURL(blob);
                            setCapturedImage(url);
                            setCapturedFile(file);
                            stopCamera(); // Stop stream to save battery/resources while reviewing
                        }
                    },
                    'image/jpeg',
                    0.8
                );
            }
        }
    };

    const handleRetake = () => {
        if (capturedImage) {
            URL.revokeObjectURL(capturedImage);
        }
        setCapturedImage(null);
        setCapturedFile(null);
        // Effect will restart camera
    };

    const handleConfirm = () => {
        if (capturedFile) {
            onCapture(capturedFile);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header / Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
                <button
                    onClick={onCancel}
                    className="text-white bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full"
                >
                    Cancelar
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="absolute top-1/2 left-0 right-0 px-8 text-center text-white">
                    <p className="bg-red-600/80 p-4 rounded-lg">{error}</p>
                    <button
                        onClick={onCancel}
                        className="mt-4 bg-white text-black px-6 py-2 rounded-lg"
                    >
                        Cerrar
                    </button>
                </div>
            )}

            {/* Main View Area */}
            <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
                {capturedImage ? (
                    // Review Mode
                    <img
                        src={capturedImage}
                        alt="Preview"
                        className="w-full h-full object-contain"
                    />
                ) : (
                    // Camera Mode
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        onLoadedMetadata={() => videoRef.current?.play()}
                    />
                )}
            </div>

            {/* Hidden Canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Bottom Controls */}
            <div className="bg-black/80 p-8 pb-12 flex justify-center items-center gap-8">
                {capturedImage ? (
                    <>
                        <button
                            onClick={handleRetake}
                            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium"
                        >
                            Retomar
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="bg-red-600 text-white px-8 py-3 rounded-lg font-bold"
                        >
                            Confirmar
                        </button>
                    </>
                ) : (
                    <button
                        onClick={handleCapture}
                        disabled={loading || !!error}
                        className="w-20 h-20 rounded-full border-4 border-white bg-transparent flex items-center justify-center hover:bg-white/10 active:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="w-16 h-16 rounded-full bg-white"></div>
                    </button>
                )}
            </div>
        </div>
    );
}
