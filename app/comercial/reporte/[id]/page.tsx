import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import CloseReportButton from '@/components/comercial/close-report-button';
import ReportTimeline from '@/components/comercial/report-timeline';

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

    // Verificar que el usuario sea comercial
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, zona')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'comercial') {
        redirect('/');
    }

    // Get report info
    const { data: report } = await supabase
        .from('reportes')
        .select('*')
        .eq('id', id)
        .single();

    if (!report) {
        redirect('/comercial');
    }

    // Verificar que el reporte pertenece a la zona del comercial
    if (report.store_zona !== profile.zona) {
        redirect('/comercial');
    }

    // Get conductor info
    const { data: conductorProfile } = await supabase
        .from('user_profiles')
        .select('display_name, full_name')
        .eq('id', report.user_id)
        .single();

    const conductorName = conductorProfile?.full_name || conductorProfile?.display_name || report.conductor_nombre;

    // Get messages for timeline
    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('reporte_id', id)
        .order('created_at', { ascending: true });

    const statusLabels: Record<string, { label: string; color: string }> = {
        draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
        submitted: { label: 'Enviado', color: 'bg-blue-100 text-blue-800' },
        resolved_by_driver: { label: 'Resuelto por Conductor', color: 'bg-green-100 text-green-800' },
        completed: { label: 'Completado', color: 'bg-green-100 text-green-800' },
        timed_out: { label: 'Tiempo Agotado', color: 'bg-red-100 text-red-800' },
        archived: { label: 'Archivado', color: 'bg-gray-100 text-gray-800' },
    };
    const statusInfo = statusLabels[report.status] || { label: report.status, color: 'bg-gray-100 text-gray-800' };

    const evidence = (report.evidence as Record<string, string>) || {};

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Detalles del Reporte</h1>
                            <p className="text-gray-600 mt-1">ID: {id.substring(0, 8)}...</p>
                        </div>
                        <Link
                            href="/comercial"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                        >
                            ← Volver al Panel
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                        </span>
                        {(report.status === 'submitted' || report.status === 'resolved_by_driver') && (
                            <>
                                <Link
                                    href={`/comercial/chat/${id}`}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                    Ir al Chat
                                </Link>
                                <CloseReportButton reportId={id} />
                            </>
                        )}
                        {report.status === 'completed' && (
                            <span className="text-sm text-gray-600">
                                Reporte cerrado
                            </span>
                        )}
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Línea de Tiempo</h2>
                    <ReportTimeline 
                        report={{
                            id: report.id,
                            status: report.status,
                            tipo_reporte: report.tipo_reporte,
                            created_at: report.created_at,
                            submitted_at: report.submitted_at,
                            resolved_at: report.resolved_at,
                            timeout_at: report.timeout_at,
                            updated_at: report.updated_at,
                        }}
                        messages={messages || []}
                        evidence={evidence}
                    />
                </div>

                {/* Report Info */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Información del Reporte</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Tienda</p>
                            <p className="font-semibold text-gray-900">{report.store_nombre}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Código de Tienda</p>
                            <p className="font-semibold text-gray-900">{report.store_codigo}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Zona</p>
                            <p className="font-semibold text-gray-900">{report.store_zona}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Conductor</p>
                            <p className="font-semibold text-gray-900">{conductorName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Tipo de Reporte</p>
                            <p className="font-semibold text-gray-900">{report.tipo_reporte || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Fecha de Creación</p>
                            <p className="font-semibold text-gray-900">
                                {new Date(report.created_at).toLocaleString('es-MX')}
                            </p>
                        </div>
                        {report.submitted_at && (
                            <div>
                                <p className="text-sm text-gray-600">Fecha de Envío</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(report.submitted_at).toLocaleString('es-MX')}
                                </p>
                            </div>
                        )}
                        {report.resolved_at && (
                            <div>
                                <p className="text-sm text-gray-600">Fecha de Resolución</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(report.resolved_at).toLocaleString('es-MX')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Evidence */}
                {Object.keys(evidence).length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Evidencias</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {Object.entries(evidence).map(([key, url]) => (
                                <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="relative aspect-video w-full bg-gray-100">
                                        <Image
                                            src={url}
                                            alt={key}
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                    <p className="p-2 text-sm text-gray-600 text-center">{key}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Incident Details */}
                {report.incident_details && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles de Incidencias</h2>
                        <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                            {JSON.stringify(report.incident_details, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}

