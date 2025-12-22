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

    // If report is draft and going to chat, mark as submitted and set timeout
    if (report.status === 'draft') {
        const now = new Date();
        const timeoutAt = new Date(now.getTime() + 20 * 60 * 1000); // 20 minutes from now
        
        await supabase
            .from('reportes')
            .update({
                status: 'submitted',
                submitted_at: now.toISOString(),
                timeout_at: timeoutAt.toISOString(),
            })
            .eq('id', id);
        
        // Update report object for this request
        report.status = 'submitted';
        report.submitted_at = now.toISOString();
        report.timeout_at = timeoutAt.toISOString();
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
                    <Link href="/conductor" className="text-gray-700">
                        ← Volver al Inicio
                    </Link>
                    <h1 className="font-semibold text-lg">Soporte ({report.stores?.nombre})</h1>
                    <div className="w-8"></div> {/* Spacer */}
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4">
                <ChatInterface
                    reportId={id}
                    userId={user.id}
                    reportCreatedAt={report.submitted_at || report.created_at}
                    timeoutAt={report.timeout_at}
                    initialMessages={messages || []}
                />
            </main>
        </div>
    );
}
