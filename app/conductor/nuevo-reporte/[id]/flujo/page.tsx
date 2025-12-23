import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FlowClient from './flow-client';

function getDefaultStep(type: string): string {
    if (type === 'entrega') return '4a';
    if (type === 'tienda_cerrada') return '4b';
    if (type === 'bascula') return '4c';
    return '4a';
}

export default async function FlujoPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ step?: string }>;
}) {
    const { id } = await params;
    const { step } = await searchParams; // Next.js 15 requires awaiting searchParams too

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get report
    const { data: report } = await supabase
        .from('reportes')
        .select('*')
        .eq('id', id)
        .single();

    if (!report) {
        redirect('/conductor');
    }

    if (report.user_id !== user.id) {
        redirect('/conductor');
    }

    // Validate tipo_reporte - must be a valid type with flow
    const tiposValidosConFlujo = ['entrega', 'tienda_cerrada', 'bascula'];
    if (!report.tipo_reporte || !tiposValidosConFlujo.includes(report.tipo_reporte)) {
        redirect(`/conductor/nuevo-reporte/${id}`);
    }

    // If current_step is 'chat', redirect to chat
    if (report.current_step === 'chat' && report.status === 'submitted') {
        redirect(`/conductor/chat/${id}`);
    }

    // Determine step to use: URL param > current_step > default for tipo
    let stepToUse = step || report.current_step || getDefaultStep(report.tipo_reporte);
    
    // If no step in URL but current_step exists, redirect to that step to keep URL in sync
    if (!step && report.current_step && report.current_step !== 'chat') {
        redirect(`/conductor/nuevo-reporte/${id}/flujo?step=${report.current_step}`);
    }

    // Ensure current_step is saved if it doesn't exist or doesn't match URL
    if (step && (!report.current_step || report.current_step !== step)) {
        await supabase
            .from('reportes')
            .update({ current_step: step })
            .eq('id', id);
    } else if (!report.current_step && stepToUse) {
        await supabase
            .from('reportes')
            .update({ current_step: stepToUse })
            .eq('id', id);
    }

    return (
        <div className="bg-white min-h-screen pb-20">
            <div className="max-w-4xl mx-auto p-4">
                <FlowClient
                    reportId={id}
                    reportType={report.tipo_reporte || 'entrega'}
                    initialEvidence={(report.evidence as Record<string, string>) || {}}
                    ticketData={report.ticket_data || null}
                    returnTicketData={report.return_ticket_data || null}
                />
            </div>
        </div>
    );
}
