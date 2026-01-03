import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TicketReviewClient from '@/components/conductor/ticket-review-client';

export default async function TicketReviewPage({
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

    // Get report
    const { data: report } = await supabase
        .from('reportes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (!report) {
        redirect('/conductor');
    }

    // Get ticket images
    const evidence = (report.evidence as Record<string, string>) || {};
    const ticketImageUrl = evidence['ticket_recibido'] || null; // Solo usar ticket_recibido, no ticket
    const mermaImageUrl = evidence['ticket_merma'] || null;
    const metadata = (report.metadata as Record<string, any>) || {};
    const noTicketReason = metadata['no_ticket_reason'] || null;

    // Si no hay ticket de recibido y no hay razón, redirigir al flujo
    if (!ticketImageUrl && !noTicketReason) {
        redirect(`/conductor/nuevo-reporte/${id}/flujo?step=8`);
    }

    // Si no hay ticket pero hay razón, redirigir directamente a return_check (no hay ticket para procesar)
    if (!ticketImageUrl && noTicketReason) {
        redirect(`/conductor/nuevo-reporte/${id}/flujo?step=return_check`);
    }

    // Get existing ticket data if available
    const ticketData = (report.ticket_data as any) || null;

    return (
        <TicketReviewClient
            reportId={id}
            ticketImageUrl={ticketImageUrl}
            mermaImageUrl={mermaImageUrl}
            initialTicketData={ticketData}
        />
    );
}

