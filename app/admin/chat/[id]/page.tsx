import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CommercialChatInterface from '@/components/comercial/commercial-chat-interface';

export default async function AdminChatPage({
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

    // Verificar que el usuario sea administrador
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'administrador') {
        redirect('/');
    }

    // Get report info (sin restricción de zona para admin)
    const { data: report } = await supabase
        .from('reportes')
        .select('*')
        .eq('id', id)
        .single();

    if (!report) {
        redirect('/admin');
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
                    <Link href="/admin" className="text-gray-600">
                        ← Volver al Panel
                    </Link>
                    <h1 className="font-semibold text-lg">
                        Chat - {report.store_nombre} ({report.store_codigo}) - {report.store_zona}
                    </h1>
                    <div className="w-8"></div> {/* Spacer */}
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4">
                <CommercialChatInterface
                    reportId={id}
                    userId={user.id}
                    report={report}
                    initialMessages={messages || []}
                />
            </main>
        </div>
    );
}




