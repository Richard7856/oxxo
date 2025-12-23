'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendMessageAsAgent, uploadChatImageAsAgent } from '@/app/comercial/actions';
import { MessageSender } from '@/lib/types/database.types';
import { formatMessageTime } from '@/lib/utils/date-format';
import Image from 'next/image';

interface Message {
    id: string;
    text: string | null;
    image_url: string | null;
    sender: MessageSender;
    sender_user_id: string | null;
    created_at: string;
}

interface ComercialChatProps {
    reportId: string;
    userId: string;
    initialMessages: Message[];
}

export default function ComercialChat({ reportId, userId, initialMessages }: ComercialChatProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabaseRef = useRef(createClient());

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Scroll to bottom on new message or when initial messages load
    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    // Realtime subscription - improved with better error handling and reconnection
    useEffect(() => {
        const supabase = supabaseRef.current;
        let channel: any = null;
        let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

        const setupSubscription = () => {
            console.log('🔧 Configurando suscripción para reporte:', reportId);
            // Remove existing channel if any
            if (channel) {
                console.log('🗑️ Eliminando canal existente');
                supabase.removeChannel(channel);
            }

            channel = supabase
                .channel(`chat_messages_${reportId}_${Date.now()}`, {
                    config: {
                        broadcast: { self: false },
                    },
                })
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `reporte_id=eq.${reportId}`,
                    },
                    async (payload) => {
                        console.log('📨 Nuevo mensaje recibido (INSERT):', payload);
                        const newMsg = payload.new as Message;
                        
                        // Double check it's for this report
                        if (newMsg.sender_user_id || newMsg.sender) {
                            console.log('✅ Mensaje válido recibido:', {
                                id: newMsg.id,
                                text: newMsg.text,
                                sender: newMsg.sender,
                                reporte_id: reportId
                            });
                            
                            // Avoid duplicates by checking if message already exists
                            setMessages((prev) => {
                                const exists = prev.some((m) => m.id === newMsg.id);
                                if (exists) {
                                    console.log('⚠️ Mensaje duplicado ignorado:', newMsg.id);
                                    return prev;
                                }
                                console.log('✅ Añadiendo mensaje a la lista:', newMsg.id);
                                const updated = [...prev, newMsg];
                                console.log('📊 Total de mensajes ahora:', updated.length);
                                return updated;
                            });
                            
                            // Scroll after state update
                            setTimeout(() => {
                                scrollToBottom();
                            }, 100);
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'messages',
                        filter: `reporte_id=eq.${reportId}`,
                    },
                    (payload) => {
                        console.log('🔄 Mensaje actualizado:', payload);
                        const updatedMsg = payload.new as Message;
                        setMessages((prev) => {
                            const index = prev.findIndex((m) => m.id === updatedMsg.id);
                            if (index >= 0) {
                                const updated = [...prev];
                                updated[index] = updatedMsg;
                                return updated;
                            }
                            return prev;
                        });
                    }
                )
                .subscribe((status, err) => {
                    console.log('📡 Estado de suscripción:', status, err);
                    if (status === 'SUBSCRIBED') {
                        console.log('✅ Suscrito exitosamente a mensajes en tiempo real para reporte:', reportId);
                        // Clear any pending reconnect
                        if (reconnectTimeout) {
                            clearTimeout(reconnectTimeout);
                            reconnectTimeout = null;
                        }
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('❌ Error en la suscripción:', err);
                        // Attempt to reconnect after 3 seconds
                        if (!reconnectTimeout) {
                            reconnectTimeout = setTimeout(() => {
                                console.log('🔄 Intentando reconectar...');
                                reconnectTimeout = null;
                                setupSubscription();
                            }, 3000);
                        }
                    } else if (status === 'TIMED_OUT') {
                        console.warn('⏱️ Suscripción expirada, reconectando...');
                        if (!reconnectTimeout) {
                            reconnectTimeout = setTimeout(() => {
                                reconnectTimeout = null;
                                setupSubscription();
                            }, 1000);
                        }
                    } else if (status === 'CLOSED') {
                        console.log('🔌 Canal cerrado');
                    } else {
                        console.log('📡 Estado desconocido:', status);
                    }
                });
        };

        // Initial setup
        setupSubscription();

        return () => {
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = null;
            }
            if (channel) {
                console.log('🧹 Limpiando suscripción...');
                supabase.removeChannel(channel);
                channel = null;
            }
        };
    }, [reportId]);

    async function handleSend(e?: React.FormEvent) {
        e?.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || sending || uploadingImage) return;

        setSending(true);
        
        let imageUrl: string | null = null;
        
        // Upload image first if there is one
        if (selectedImage) {
            setUploadingImage(true);
            try {
                const uploadResult = await uploadChatImageAsAgent(reportId, selectedImage);
                if (uploadResult.error) {
                    alert('Error al subir imagen: ' + uploadResult.error);
                    setSending(false);
                    setUploadingImage(false);
                    return;
                }
                imageUrl = uploadResult.url || null;
            } catch (error) {
                console.error('Error uploading image:', error);
                alert('Error al subir imagen');
                setSending(false);
                setUploadingImage(false);
                return;
            } finally {
                setUploadingImage(false);
            }
        }
        
        // Optimistic update - add message immediately to UI
        const optimisticMessage: Message = {
            id: `temp-${Date.now()}`,
            text: newMessage.trim() || null,
            image_url: imageUrl,
            sender: 'agent',
            sender_user_id: userId,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimisticMessage]);
        const messageToSend = newMessage;
        setNewMessage('');
        setSelectedImage(null);
        setImagePreview(null);

        try {
            const result = await sendMessageAsAgent(reportId, messageToSend, imageUrl);
            if (result?.error) {
                // Remove optimistic message on error
                setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
                alert('Error al enviar mensaje: ' + result.error);
                setNewMessage(messageToSend); // Restore message
            }
        } catch (error) {
            console.error('Error sending message:', error);
            // Remove optimistic message on error
            setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
            alert('Error al enviar mensaje');
            setNewMessage(messageToSend); // Restore message
        } finally {
            setSending(false);
        }
    }

    function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona una imagen');
            return;
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('La imagen es muy grande. Máximo 10MB');
            return;
        }
        
        setSelectedImage(file);
        const preview = URL.createObjectURL(file);
        setImagePreview(preview);
    }

    function removeImage() {
        setSelectedImage(null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
            setImagePreview(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-16rem)]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600">
                        <p>No hay mensajes aún.</p>
                        <p className="text-sm">Inicia la conversación con el conductor.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg) => {
                            // Agent messages (comercial) on right, user messages (conductor) on left
                            const isAgent = msg.sender === 'agent';
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-lg p-3 ${isAgent
                                                ? 'bg-blue-600 text-white rounded-br-none'
                                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                            }`}
                                    >
                                        {msg.image_url && (
                                            <div className="mb-2 rounded-lg overflow-hidden">
                                                <Image
                                                    src={msg.image_url}
                                                    alt="Imagen adjunta"
                                                    width={400}
                                                    height={400}
                                                    className="w-full h-auto max-h-64 object-contain rounded-lg"
                                                    unoptimized
                                                />
                                            </div>
                                        )}
                                        {msg.text && <p className="text-sm">{msg.text}</p>}
                                        <span className={`text-xs block mt-1 ${isAgent ? 'text-blue-100' : 'text-gray-600'}`}>
                                            {formatMessageTime(msg.created_at)}
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
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-blue-500">
                        <Image
                            src={imagePreview}
                            alt="Vista previa"
                            fill
                            className="object-cover"
                            unoptimized
                        />
                        <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-xs"
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
                    id="image-input-comercial"
                    disabled={sending || uploadingImage}
                />
                <label
                    htmlFor="image-input-comercial"
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    title="Adjuntar imagen"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </label>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white disabled:bg-gray-100 disabled:text-gray-600"
                    disabled={sending || uploadingImage}
                />
                <button
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedImage) || sending || uploadingImage}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {uploadingImage ? 'Subiendo...' : sending ? 'Enviando...' : 'Enviar'}
                </button>
            </form>
        </div>
    );
}

