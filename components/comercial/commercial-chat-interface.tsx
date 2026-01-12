'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSender } from '@/lib/types/database.types';
import { closeChat } from '@/app/comercial/actions';

interface Message {
    id: string;
    text: string | null;
    image_url: string | null;
    sender: MessageSender;
    sender_user_id: string | null;
    created_at: string;
}

interface CommercialChatInterfaceProps {
    reportId: string;
    userId: string;
    report: {
        id: string;
        store_nombre: string;
        store_codigo: string;
        status: string;
        tipo_reporte: string | null;
        conductor_nombre: string;
        created_at: string;
        timeout_at: string | null;
        motivo: string | null;
        rechazo_details: any;
        ticket_data: any;
        ticket_image_url: string | null;
    };
    initialMessages: Message[];
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

        calculateTimeLeft();

        const interval = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, [timeoutAt]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return { formatted, isExpired, timeLeft };
}

export default function CommercialChatInterface({ 
    reportId, 
    userId, 
    report, 
    initialMessages 
}: CommercialChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [closing, setClosing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    const { formatted: timeFormatted, isExpired } = usePersistentTimer(report.timeout_at);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel('chat_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `reporte_id=eq.${reportId}`,
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
    }, [reportId, supabase]);

    async function handleSend(e?: React.FormEvent) {
        e?.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || sending || uploadingImage) return;

        setSending(true);
        let imageUrl: string | null = null;

        try {
            // Si hay imagen seleccionada, subirla primero
            if (selectedImage) {
                setUploadingImage(true);
                const formData = new FormData();
                formData.append('file', selectedImage);
                formData.append('reportId', reportId);
                
                const response = await fetch('/api/chat/upload-image', {
                    method: 'POST',
                    body: formData,
                });

                const uploadResult = await response.json();
                
                if (!response.ok || uploadResult.error) {
                    console.error('Error uploading image:', uploadResult.error);
                    alert(`Error al subir la imagen: ${uploadResult.error || 'Error desconocido'}`);
                    setSending(false);
                    setUploadingImage(false);
                    return;
                }
                imageUrl = uploadResult.url || null;
                setUploadingImage(false);
            }

            // Enviar mensaje con texto e imagen
            const { error } = await supabase.from('messages').insert({
                reporte_id: reportId,
                sender: 'agent',
                sender_user_id: userId,
                text: newMessage || null,
                image_url: imageUrl,
            });

            if (error) {
                console.error('Error sending message:', error);
                alert(`Error al enviar mensaje: ${error.message || 'Error desconocido'}`);
            } else {
                setNewMessage('');
                setSelectedImage(null);
                setImagePreview(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        } catch (error: any) {
            console.error('Error sending message:', error);
            const errorMessage = error?.message || 'Error desconocido al enviar el mensaje';
            alert(`Error al enviar mensaje: ${errorMessage}`);
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

    async function handleCloseChat() {
        if (closing) return;
        
        const confirmed = confirm('¿Estás seguro de que deseas cerrar este chat? El reporte se marcará como completado.');
        if (!confirmed) return;

        setClosing(true);
        try {
            const result = await closeChat(reportId);
            if (result?.error) {
                alert(result.error);
            } else {
                // Recargar la página para actualizar el estado
                window.location.reload();
            }
        } catch (error) {
            console.error('Error closing chat:', error);
            alert('Error al cerrar el chat');
        } finally {
            setClosing(false);
        }
    }

    const statusLabels: Record<string, { label: string; color: string }> = {
        draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
        submitted: { label: 'Enviado', color: 'bg-blue-100 text-blue-800' },
        resolved_by_driver: { label: 'Resuelto por Conductor', color: 'bg-green-100 text-green-800' },
        completed: { label: 'Completado', color: 'bg-green-100 text-green-800' },
        timed_out: { label: 'Tiempo Agotado', color: 'bg-red-100 text-red-800' },
    };
    const statusInfo = statusLabels[report.status] || { label: report.status, color: 'bg-gray-100 text-gray-800' };

    const tipoReporteLabels: Record<string, string> = {
        rechazo_completo: 'Rechazo Completo',
        rechazo_parcial: 'Rechazo Parcial',
        devolucion: 'Devolución',
        faltante: 'Faltante',
        sobrante: 'Sobrante',
        entrega: 'Entrega Normal',
        tienda_cerrada: 'Tienda Cerrada',
        bascula: 'Bascula',
    };

    const tipoReporteLabel = report.tipo_reporte ? tipoReporteLabels[report.tipo_reporte] || report.tipo_reporte : 'No especificado';

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)]">
            {/* Report Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="font-semibold text-gray-900">{report.store_nombre}</h2>
                        <p className="text-sm text-gray-600">Código: {report.store_codigo}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                    </span>
                </div>
                
                {/* Tipo de Reporte destacado */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                        📋 Tipo de Reporte: {tipoReporteLabel}
                    </p>
                    {report.motivo && (
                        <p className="text-sm text-blue-800 mt-1">
                            <span className="font-medium">Motivo:</span> {report.motivo}
                        </p>
                    )}
                </div>

                {/* Detalles de rechazo si aplica */}
                {report.rechazo_details && typeof report.rechazo_details === 'object' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                        <p className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Detalles del Rechazo:</p>
                        {report.rechazo_details.productos && Array.isArray(report.rechazo_details.productos) && report.rechazo_details.productos.length > 0 && (
                            <div className="mb-2">
                                <p className="text-xs font-medium text-yellow-800 mb-1">Productos rechazados:</p>
                                <ul className="list-disc list-inside text-xs text-yellow-700">
                                    {report.rechazo_details.productos.map((prod: string, idx: number) => (
                                        <li key={idx}>{prod}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {report.rechazo_details.observaciones && (
                            <p className="text-xs text-yellow-800">
                                <span className="font-medium">Observaciones:</span> {report.rechazo_details.observaciones}
                            </p>
                        )}
                    </div>
                )}

                {/* Información del ticket si existe */}
                {report.ticket_data && typeof report.ticket_data === 'object' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <p className="text-sm font-semibold text-green-900 mb-2">🎫 Información del Ticket:</p>
                        <div className="text-xs text-green-800 space-y-1">
                            {report.ticket_data.numero && (
                                <p><span className="font-medium">Número:</span> {report.ticket_data.numero}</p>
                            )}
                            {report.ticket_data.fecha && (
                                <p><span className="font-medium">Fecha:</span> {report.ticket_data.fecha}</p>
                            )}
                            {report.ticket_data.total && (
                                <p><span className="font-medium">Total:</span> ${report.ticket_data.total}</p>
                            )}
                        </div>
                        {report.ticket_image_url && (
                            <a 
                                href={report.ticket_image_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-green-700 underline mt-2 inline-block"
                            >
                                Ver imagen del ticket →
                            </a>
                        )}
                    </div>
                )}

                <div className="text-sm text-gray-600 space-y-1 border-t pt-3 mt-3">
                    <p><span className="font-medium">Conductor:</span> {report.conductor_nombre}</p>
                    <p><span className="font-medium">Creado:</span> {new Date(report.created_at).toLocaleString('es-MX')}</p>
                </div>
            </div>

            {/* Timer y Botón de Cerrar */}
            <div className="mb-4 space-y-2">
                {report.timeout_at && (
                    <div className={`p-4 rounded-lg text-center border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                        <h3 className={`${isExpired ? 'text-red-800' : 'text-blue-800'} font-semibold mb-1 text-sm`}>
                            {isExpired ? 'Tiempo de espera finalizado' : 'Tiempo restante'}
                        </h3>
                        <div className={`text-2xl font-bold ${isExpired ? 'text-red-900' : 'text-blue-900'}`}>
                            {timeFormatted}
                        </div>
                    </div>
                )}
                
                {/* Botón para cerrar el chat (solo si no está completado) */}
                {(report.status === 'submitted' || report.status === 'resolved_by_driver') && (
                    <button
                        onClick={handleCloseChat}
                        disabled={closing}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {closing ? 'Cerrando...' : '✅ Cerrar Chat'}
                    </button>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-800">
                        <p>No hay mensajes aún.</p>
                        <p className="text-sm">El conductor aún no ha enviado mensajes.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg) => {
                            const isMe = (msg.sender_user_id && msg.sender_user_id === userId) || msg.sender === 'agent';
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-lg p-3 ${
                                            isMe
                                                ? 'bg-green-600 text-white rounded-br-none'
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
                                        <span className={`text-xs block mt-1 ${isMe ? 'text-green-100' : 'text-gray-700'}`}>
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
                    <div className="relative rounded-lg overflow-hidden border-2 border-green-500">
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
                    disabled={(report.status === 'completed' || isExpired) || sending || uploadingImage}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={(report.status === 'completed' || isExpired) || sending || uploadingImage}
                    className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors flex items-center justify-center"
                    title="Subir foto"
                >
                    📷
                </button>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={(report.status === 'completed' || isExpired) ? "Chat cerrado" : "Escribe un mensaje..."}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-700 bg-white disabled:bg-gray-100 disabled:text-gray-700"
                    disabled={(report.status === 'completed' || isExpired) || sending || uploadingImage}
                />
                <button
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedImage) || sending || (report.status === 'completed' || isExpired) || uploadingImage}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                    {uploadingImage ? 'Subiendo...' : 'Enviar'}
                </button>
            </form>
        </div>
    );
}

