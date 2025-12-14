'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendMessage } from '@/app/conductor/actions';
import { MessageSender } from '@/lib/types/database.types';

interface Message {
    id: string;
    text: string | null;
    sender: MessageSender;
    created_at: string;
}

interface ChatInterfaceProps {
    reportId: string;
    initialMessages: Message[];
}

export default function ChatInterface({ reportId, initialMessages }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel('chat_room')
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
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [reportId, supabase]);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const text = newMessage;
        setNewMessage(''); // Optimistic clear
        setSending(true);

        // Optimistic update? Maybe safer to wait for subscription or action result.
        // We'll rely on subscription for now or add it locally if needed, but action redirects/revalidates too.
        // Actually, since we use revalidatePath in action, server rendering might refresh page, but client state via subscription is smoother.

        const result = await sendMessage(reportId, text);
        setSending(false);
        if (result.error) {
            // Restore text or show error
            alert('Error al enviar mensaje');
            setNewMessage(text);
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-200px)]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg mb-4 text-black">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-10">
                        <p>No hay mensajes aún.</p>
                        <p className="text-sm">Describe tu problema para recibir ayuda.</p>
                    </div>
                )}
                {messages.map((msg) => {
                    const isMe = msg.sender === 'user';
                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-3 ${isMe
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white border text-gray-800 rounded-bl-none shadow-sm'
                                    }`}
                            >
                                <p>{msg.text}</p>
                                <span className={`text-xs block mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    disabled={sending}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                >
                    Enviar
                </button>
            </form>
        </div>
    );
}
