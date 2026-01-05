import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminCompletedReportsList() {
    const supabase = await createClient();
    
    // Obtener TODOS los reportes completados (sin filtro de zona para admin)
    const { data: reportes, error } = await supabase
        .from('reportes')
        .select('*')
        .in('status', ['completed', 'timed_out', 'archived'])
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching completed reports:', error);
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
                <p>No hay reportes cerrados.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {reportes.map((reporte) => {
                const storeName = reporte.store_nombre || 'Tienda desconocida';
                const conductorInfoData = conductorInfo[reporte.user_id] || {};
                const conductorName = conductorInfoData.full_name || conductorInfoData.display_name || reporte.conductor_nombre || 'Conductor';
                const statusLabels: Record<string, { label: string; color: string }> = {
                    completed: { label: 'Completado', color: 'bg-green-100 text-green-800' },
                    timed_out: { label: 'Tiempo Agotado', color: 'bg-red-100 text-red-800' },
                    archived: { label: 'Archivado', color: 'bg-gray-100 text-gray-800' },
                };
                const statusInfo = statusLabels[reporte.status] || { label: reporte.status, color: 'bg-gray-100 text-gray-800' };

                return (
                    <div
                        key={reporte.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <h4 className="font-semibold text-gray-900">{storeName}</h4>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                                        {statusInfo.label}
                                    </span>
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                        {reporte.store_zona}
                                    </span>
                                    {reporte.ticket_data && (
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800" title="Tiene datos de ticket procesados">
                                            ✓ Ticket
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p>
                                        <span className="font-medium">Conductor:</span> {conductorName}
                                    </p>
                                    <p>
                                        <span className="font-medium">Tipo:</span> {reporte.tipo_reporte || 'No especificado'}
                                    </p>
                                    <p>
                                        <span className="font-medium">Creado:</span>{' '}
                                        {new Date(reporte.created_at).toLocaleString('es-MX')}
                                    </p>
                                    {reporte.resolved_at && (
                                        <p>
                                            <span className="font-medium">Resuelto:</span>{' '}
                                            {new Date(reporte.resolved_at).toLocaleString('es-MX')}
                                        </p>
                                    )}
                                    {reporte.store_codigo && (
                                        <p>
                                            <span className="font-medium">Código:</span> {reporte.store_codigo}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="ml-4 flex flex-col gap-2">
                                <Link
                                    href={`/admin/chat/${reporte.id}`}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center"
                                >
                                    Ver Chat
                                </Link>
                                <Link
                                    href={`/admin/reporte/${reporte.id}`}
                                    className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors text-center"
                                >
                                    Ver Detalles
                                </Link>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}


