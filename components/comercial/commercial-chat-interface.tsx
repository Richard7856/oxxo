'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSender } from '@/lib/types/database.types';

interface Message {
    id: string;
    text: string | null;
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
        if (!newMessage.trim() || sending) return;

        setSending(true);

        try {
            const { error } = await supabase.from('messages').insert({
                reporte_id: reportId,
                sender: 'agent', // 'agent' es el tipo correcto según MessageSender
                sender_user_id: userId,
                text: newMessage,
            });

            if (error) {
                console.error('Error sending message:', error);
                alert('Error al enviar mensaje');
            } else {
                setNewMessage('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error al enviar mensaje');
        } finally {
            setSending(false);
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

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)]">
            {/* Report Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="font-semibold text-gray-900">{report.store_nombre}</h2>
                        <p className="text-sm text-gray-600">Código: {report.store_codigo}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                    </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Conductor:</span> {report.conductor_nombre}</p>
                    <p><span className="font-medium">Tipo:</span> {report.tipo_reporte || 'N/A'}</p>
                    <p><span className="font-medium">Creado:</span> {new Date(report.created_at).toLocaleString('es-MX')}</p>
                </div>
            </div>

            {/* Timer */}
            {report.timeout_at && (
                <div className={`p-4 rounded-lg text-center mb-4 border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                    <h3 className={`${isExpired ? 'text-red-800' : 'text-blue-800'} font-semibold mb-1 text-sm`}>
                        {isExpired ? 'Tiempo de espera finalizado' : 'Tiempo restante'}
                    </h3>
                    <div className={`text-2xl font-bold ${isExpired ? 'text-red-900' : 'text-blue-900'}`}>
                        {timeFormatted}
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
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
                                        <p className="text-sm">{msg.text}</p>
                                        <span className={`text-xs block mt-1 ${isMe ? 'text-green-100' : 'text-gray-400'}`}>
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

            {/* Input Area */}
            <form onSubmit={handleSend} className="flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isExpired ? "Chat cerrado" : "Escribe un mensaje..."}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                    disabled={isExpired || sending}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim() || sending || isExpired}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                    Enviar
                </button>
            </form>
        </div>
    );
}

