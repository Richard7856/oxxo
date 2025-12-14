import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FlowClient from './flow-client';

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

    return (
        <div className="bg-white min-h-screen pb-20">
            <div className="max-w-4xl mx-auto p-4">
                <FlowClient
                    reportId={id}
                    reportType={report.tipo_reporte || 'entrega'}
                    initialEvidence={(report.evidence as Record<string, string>) || {}}
                />
            </div>
        </div>
    );
}
