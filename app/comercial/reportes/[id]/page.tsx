import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ReportDetailTabs from '@/components/comercial/report-detail-tabs';
import CloseReportButton from '@/components/comercial/close-report-button';
import { Suspense } from 'react';

// Status badge component
function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { label: string; className: string }> = {
        draft: { label: 'Borrador', className: 'bg-gray-100 text-gray-800' },
        submitted: { label: 'En Proceso', className: 'bg-blue-100 text-blue-800' },
        resolved_by_driver: { label: 'Resuelto por Conductor', className: 'bg-green-100 text-green-800' },
        timed_out: { label: 'Tiempo Agotado', className: 'bg-red-100 text-red-800' },
        completed: { label: 'Completado', className: 'bg-green-100 text-green-800' },
        archived: { label: 'Archivado', className: 'bg-gray-100 text-gray-800' },
        iniciado: { label: 'Iniciado', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
            {config.label}
        </span>
    );
}

export default async function ReportDetailPage({
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

    // Get user profile to verify comercial role
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, zona')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'comercial') {
        redirect('/');
    }

    // Get report with all details (usando datos desnormalizados para evitar problemas RLS)
    const { data: report, error: reportError } = await supabase
        .from('reportes')
        .select('*')
        .eq('id', id)
        .single();

    if (reportError || !report) {
        console.error('Error fetching report:', reportError);
        redirect('/comercial');
    }

    // Verify comercial has access to this report's zona (usando mapeo flexible)
    if (profile.zona) {
        // Mapeo de zonas: CDMX puede incluir Coyoacan, etc
        const zonaMap: Record<string, string[]> = {
            'CDMX': ['CDMX', 'Coyoacan', 'COYOACAN', 'Coyoacán'],
            'Pachuca': ['Pachuca', '10PCK PACHUCA', 'PACHUCA', '10PCK'],
            'Cuernavaca': ['Cuernavaca', 'CUERNAVACA', 'Morelos'],
        };
        
        const zonasToMatch = zonaMap[profile.zona] || [profile.zona];
        
        // Verificar si la zona del reporte coincide con alguna de las zonas permitidas
        if (!zonasToMatch.includes(report.store_zona)) {
            redirect('/comercial');
        }
    }

    // Get messages
    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('reporte_id', id)
        .order('created_at', { ascending: true });

    // Get ticket ID from metadata if exists
    const metadata = (report.metadata as Record<string, any>) || {};
    const ticketId = metadata.ticket_id || null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Link
                        href="/comercial"
                        className="text-gray-600 hover:text-gray-900 mb-4 inline-block transition-colors"
                    >
                        ← Volver a Tickets
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Reporte en {report.store_nombre}
                            </h1>
                            <div className="mt-2 space-x-4 text-sm text-gray-600">
                                <span>
                                    <strong>ID de Reporte:</strong> {report.id}
                                </span>
                                {ticketId && (
                                    <span>
                                        <strong>ID de Ticket:</strong> {ticketId}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <StatusBadge status={report.status} />
                            <CloseReportButton reportId={report.id} currentStatus={report.status} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <Suspense fallback={<div className="text-center py-8">Cargando...</div>}>
                    <ReportDetailTabs report={report} messages={messages || []} userId={user.id} />
                </Suspense>
            </div>
        </div>
    );
}
