import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ChatInterface from '@/components/conductor/chat-interface';
import Link from 'next/link';

export default async function ChatPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get report info
    const { data: report } = await supabase
        .from('reportes')
        .select('*, stores(nombre)')
        .eq('id', id)
        .single();

    if (!report) {
        redirect('/conductor');
    }

    // Get messages
    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('reporte_id', id)
        .order('created_at', { ascending: true });

    return (
        <div className="bg-white min-h-screen">
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href={`/conductor/nuevo-reporte/${id}/flujo`} className="text-gray-600">
                        ← Volver al Reporte
                    </Link>
                    <h1 className="font-semibold text-lg">Soporte ({report.stores?.nombre})</h1>
                    <div className="w-8"></div> {/* Spacer */}
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center">
                    <p className="text-blue-800 font-medium">Tiempo de espera estimado</p>
                    <div className="text-3xl font-bold text-blue-900 my-2">20:00</div>
                    <p className="text-sm text-blue-600">Un agente te atenderá pronto.</p>
                </div>

                <ChatInterface
                    reportId={id}
                    initialMessages={messages || []}
                />
            </main>
        </div>
    );
}
