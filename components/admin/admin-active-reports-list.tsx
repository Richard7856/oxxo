import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface AdminActiveReportsListProps {
    limit?: number;
}

export default async function AdminActiveReportsList({ limit = 10 }: AdminActiveReportsListProps) {
    const supabase = await createClient();
    
    // Obtener TODOS los reportes activos (sin filtro de zona para admin)
    const { data: reportes, error } = await supabase
        .from('reportes')
        .select('*')
        .in('status', ['draft', 'submitted', 'resolved_by_driver'])
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching reports:', error);
        return (
            <div className="text-sm text-red-600">
                <p>Error al cargar los reportes. Intenta recargar la página.</p>
            </div>
        );
    }

    // Obtener información de los conductores
    let conductorInfo: Record<string, { display_name?: string; full_name?: string }> = {};
    if (reportes && reportes.length > 0) {
        const userIds = [...new Set(reportes.map(r => r.user_id))];
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, display_name, full_name')
            .in('id', userIds);
        
        if (profiles) {
            profiles.forEach(profile => {
                conductorInfo[profile.id] = {
                    display_name: profile.display_name || undefined,
                    full_name: profile.full_name || undefined,
                };
            });
        }
    }

    if (!reportes || reportes.length === 0) {
        return (
            <div className="text-sm text-gray-600">
                <p>No hay reportes activos en este momento.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {reportes.map((reporte) => {
                const storeName = reporte.store_nombre || 'Tienda desconocida';
                const conductorInfoData = conductorInfo[reporte.user_id] || {};
                const conductorName = conductorInfoData.full_name || conductorInfoData.display_name || reporte.conductor_nombre || 'Conductor';
                const statusLabels: Record<string, { label: string; color: string }> = {
                    draft: { label: 'Borrador', color: 'bg-yellow-100 text-yellow-800' },
                    submitted: { label: 'Enviado', color: 'bg-blue-100 text-blue-800' },
                    resolved_by_driver: { label: 'Resuelto por Conductor', color: 'bg-green-100 text-green-800' },
                };
                const statusInfo = statusLabels[reporte.status] || { label: reporte.status, color: 'bg-gray-100 text-gray-800' };

                return (
                    <div
                        key={reporte.id}
                        className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <h4 className="font-semibold text-gray-900 text-sm truncate">{storeName}</h4>
                                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusInfo.color} flex-shrink-0`}>
                                        {statusInfo.label}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 flex-shrink-0">
                                        {reporte.store_zona}
                                    </span>
                                    {reporte.ticket_data && (
                                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 flex-shrink-0" title="Tiene datos de ticket procesados">
                                            ✓ Ticket
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-600 space-y-0.5">
                                    <p className="truncate">
                                        <span className="font-medium">Conductor:</span> <span className="truncate">{conductorName}</span>
                                    </p>
                                    <p>
                                        <span className="font-medium">Tipo:</span> {reporte.tipo_reporte || 'No especificado'}
                                    </p>
                                    <p>
                                        <span className="font-medium">Creado:</span>{' '}
                                        {new Date(reporte.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                                    </p>
                                    {reporte.store_codigo && (
                                        <p>
                                            <span className="font-medium">Código:</span> {reporte.store_codigo}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 flex-shrink-0">
                                {(reporte.status === 'submitted' || reporte.status === 'resolved_by_driver') && (
                                    <Link
                                        href={`/admin/chat/${reporte.id}`}
                                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors text-center whitespace-nowrap"
                                    >
                                        Chat
                                    </Link>
                                )}
                                <Link
                                    href={`/admin/reporte/${reporte.id}`}
                                    className="bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-700 transition-colors text-center whitespace-nowrap"
                                >
                                    Detalles
                                </Link>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}



