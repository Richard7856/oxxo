'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { sendMessage, resolveReport, initializeChat, uploadChatImage, saveTiendaAbiertaStatus } from '@/app/conductor/actions';
import { MessageSender } from '@/lib/types/database.types';

interface Message {
    id: string;
    text: string | null;
    image_url: string | null;
    sender: MessageSender;
    sender_user_id: string | null;
    created_at: string;
}

interface ChatInterfaceProps {
    reportId: string;
    userId: string; // Added userId prop
    reportCreatedAt: string; // New prop for persistent timer
    initialMessages: Message[];
    timeoutAt?: string | null; // Timeout timestamp
    reportType?: string | null; // Tipo de reporte para manejar timeout automático
}

function usePersistentTimer(timeoutAt: string | null | undefined) {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!timeoutAt) {
            setIsExpired(false);
            setTimeLeft(0);
            return;
        }

        const calculateTimeLeft = () => {
            const end = new Date(timeoutAt).getTime();
            const now = new Date().getTime();
            const remaining = Math.max(0, Math.floor((end - now) / 1000));

            setTimeLeft(remaining);
            setIsExpired(remaining === 0);
        };

        calculateTimeLeft(); // Initial calc

        const interval = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, [timeoutAt]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return { formatted, isExpired, timeLeft };
}

export default function ChatInterface({ reportId, userId, reportCreatedAt, initialMessages, timeoutAt: initialTimeoutAt, reportType }: ChatInterfaceProps) {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [resolving, setResolving] = useState(false);
    const [timeoutAt, setTimeoutAt] = useState<string | null>(initialTimeoutAt || null);
    const [initialized, setInitialized] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Inicializar el chat cuando se monta el componente
    useEffect(() => {
        if (!initialized) {
            initializeChat(reportId).then((result) => {
                if (result?.success && result?.timeoutAt) {
                    setTimeoutAt(result.timeoutAt);
                }
                setInitialized(true);
            }).catch((error) => {
                console.error('Error initializing chat:', error);
                setInitialized(true);
            });
        }
    }, [reportId, initialized]);

    const { formatted: timeFormatted, isExpired } = usePersistentTimer(timeoutAt);
    const [hasAutoClosed, setHasAutoClosed] = useState(false);

    // Auto-cerrar reporte de tienda_cerrada si expira el timeout
    useEffect(() => {
        if (isExpired && reportType === 'tienda_cerrada' && !hasAutoClosed) {
            setHasAutoClosed(true);
            // Cerrar automáticamente el reporte (como si el usuario hubiera dicho "No se abrió")
            saveTiendaAbiertaStatus(reportId, false).then((result) => {
                if (result.success && result.flowUrl) {
                    router.push(result.flowUrl);
                }
            }).catch((err) => {
                console.error('Error auto-closing tienda cerrada report:', err);
            });
        }
    }, [isExpired, reportType, reportId, hasAutoClosed, router]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Scroll to bottom on new message
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel('chat_messages') // Changed channel name
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `reporte_id=eq.${reportId}`, // Changed filter field
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages((prev) => [...prev, newMsg]);
                    scrollToBottom();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [reportId, supabase]); // Added supabase to dependency

    async function handleSend(e?: React.FormEvent) {
        e?.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || sending || isExpired || uploadingImage) return;

        setSending(true);
        let imageUrl: string | null = null;

        try {
            // Si hay imagen seleccionada, subirla primero
            if (selectedImage) {
                setUploadingImage(true);
                const formData = new FormData();
                formData.append('file', selectedImage);
                
                const uploadResult = await uploadChatImage(reportId, formData);
                if (uploadResult.error) {
                    alert(uploadResult.error);
                    setSending(false);
                    setUploadingImage(false);
                    return;
                }
                imageUrl = uploadResult.url || null;
                setUploadingImage(false);
            }

            // Enviar mensaje con texto e imagen
            const result = await sendMessage(reportId, newMessage || '', imageUrl);
            if (result?.error) {
                alert(result.error);
                return;
            }
            
            // El mensaje se agregará automáticamente via realtime subscription
            // Solo limpiamos el input
            setNewMessage('');
            setSelectedImage(null);
            setImagePreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error al enviar mensaje. Por favor intenta de nuevo.');
        } finally {
            setSending(false);
            setUploadingImage(false);
        }
    }

    function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona una imagen');
            return;
        }

        // Validar tamaño (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('La imagen es demasiado grande (máximo 10MB)');
            return;
        }

        setSelectedImage(file);
        
        // Crear preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }

    function removeSelectedImage() {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    async function handleResolve() {
        if (resolving) return;
        setResolving(true);
        try {
            const result = await resolveReport(reportId);
            if (result?.error) {
                alert(result.error);
                setResolving(false);
            } else if (result?.success && result?.flowUrl) {
                // Redirigir al siguiente paso del flujo
                router.push(result.flowUrl);
            }
        } catch (error: any) {
            // Ignorar errores de redirect de Next.js
            if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.message?.includes('NEXT_REDIRECT')) {
                // El redirect se está procesando, no hacer nada
                return;
            }
            console.error('Error resolving report:', error);
            alert('Error al resolver reporte');
            setResolving(false);
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)]"> {/* Fixed height container */}
            {/* Header info / Timer */}
            <div className={`p-6 rounded-lg text-center mb-6 border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                <h2 className={`${isExpired ? 'text-red-800' : 'text-blue-800'} font-semibold mb-2`}>
                    {isExpired ? 'Tiempo de espera finalizado' : 'Tiempo de espera estimado'}
                </h2>
                <div className={`text-4xl font-bold my-4 ${isExpired ? 'text-red-900' : 'text-blue-900'}`}>
                    {timeFormatted}
                </div>
                <p className={`${isExpired ? 'text-red-600' : 'text-blue-600'} text-sm`}>
                    {isExpired ? 'El chat se ha cerrado. Por favor continúa con el proceso.' : 'Un agente te atenderá pronto.'}
                </p>
            </div>

            {/* Resolve Button - No visible para tienda_cerrada (solo comercial puede cerrar) */}
            {reportType !== 'tienda_cerrada' && (
                <div className="mb-4">
                    <button
                        onClick={handleResolve}
                        disabled={resolving}
                        className="w-full bg-green-600 text-white font-bold py-3 rounded-lg shadow hover:bg-green-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {resolving ? 'Procesando...' : (
                            <>
                                <span>✅ Problema Resuelto / Continuar</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-800">
                        <p>No hay mensajes aún.</p>
                        <p className="text-sm">Describe tu problema para recibir ayuda.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg) => {
                            // Check if message is from me. Prioritize sender_user_id, fallback to sender enum
                            const isMe = (msg.sender_user_id && msg.sender_user_id === userId) || msg.sender === 'user';
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-lg p-3 ${isMe
                                                ? 'bg-blue-600 text-white rounded-br-none'
                                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                            }`}
                                    >
                                        {msg.image_url && (
                                            <div className="mb-2 rounded-lg overflow-hidden">
                                                <img
                                                    src={msg.image_url}
                                                    alt="Imagen del chat"
                                                    className="max-w-full h-auto rounded-lg cursor-pointer"
                                                    onClick={() => window.open(msg.image_url!, '_blank')}
                                                />
                                            </div>
                                        )}
                                        {msg.text && <p className="text-sm">{msg.text}</p>}
                                        <span className={`text-xs block mt-1 ${isMe ? 'text-blue-100' : 'text-gray-700'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Image Preview */}
            {imagePreview && (
                <div className="mb-2 relative inline-block">
                    <div className="relative rounded-lg overflow-hidden border-2 border-blue-500">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-w-xs max-h-48 object-contain"
                        />
                        <button
                            type="button"
                            onClick={removeSelectedImage}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSend} className="flex gap-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={isExpired || sending || uploadingImage}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExpired || sending || uploadingImage}
                    className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors flex items-center justify-center"
                    title="Subir foto"
                >
                    📷
                </button>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isExpired ? "Chat cerrado" : "Escribe un mensaje..."}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-700 bg-white disabled:bg-gray-100 disabled:text-gray-700"
                    disabled={isExpired || sending || uploadingImage}
                />
                <button
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedImage) || sending || isExpired || uploadingImage}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {uploadingImage ? 'Subiendo...' : 'Enviar'}
                </button>
            </form>
        </div>
    );
}
