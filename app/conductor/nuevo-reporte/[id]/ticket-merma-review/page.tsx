import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TicketMermaReviewClient from '@/components/conductor/ticket-merma-review-client';

export default async function TicketMermaReviewPage({
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

    // Get ticket merma image
    const evidence = (report.evidence as Record<string, string>) || {};
    const ticketMermaImageUrl = evidence['ticket_merma'] || null;

    if (!ticketMermaImageUrl) {
        redirect(`/conductor/nuevo-reporte/${id}/flujo?step=8c`);
    }

    // Get existing ticket merma data if available
    const ticketMermaData = (report.return_ticket_data as any) || null;

    return (
        <TicketMermaReviewClient
            reportId={id}
            ticketMermaImageUrl={ticketMermaImageUrl}
            initialTicketMermaData={ticketMermaData}
        />
    );
}

