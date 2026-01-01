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

    // Determine the step to use: URL param > saved step > default
    function getDefaultStep(type: string) {
        if (type === 'entrega') return '4a';
        if (type === 'tienda_cerrada') return '4b';
        if (type === 'bascula') return '4c';
        return 'unknown';
    }

    // Si el paso guardado es 'chat' o 'chat_redirect' y el reporte está en 'submitted',
    // redirigir directamente al chat en lugar del flujo
    const savedStep = report.current_step as string | null;
    if (!step && (savedStep === 'chat' || savedStep === 'chat_redirect') && report.status === 'submitted') {
        redirect(`/conductor/chat/${id}`);
    }

    // Si el paso guardado no es válido o es un paso de chat pero el reporte no está submitted,
    // usar el paso por defecto
    const defaultStep = getDefaultStep(report.tipo_reporte || 'entrega');
    let initialStep = step || savedStep || defaultStep;
    
    // Validar que el paso inicial sea válido para el tipo de reporte
    if (initialStep === 'chat' || initialStep === 'chat_redirect') {
        // Si es un paso de chat pero no debería estar aquí, usar el default
        initialStep = defaultStep;
    }

    return (
        <div className="bg-white min-h-screen pb-20">
            <div className="max-w-4xl mx-auto p-4">
                <FlowClient
                    reportId={id}
                    reportType={report.tipo_reporte || 'entrega'}
                    initialEvidence={(report.evidence as Record<string, string>) || {}}
                    initialStep={initialStep}
                />
            </div>
        </div>
    );
}
