import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface ActiveReportsListProps {
    userId: string;
}

export default async function ActiveReportsList({ userId }: ActiveReportsListProps) {
    const supabase = await createClient();
    
    // Obtener la zona del comercial
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('zona')
        .eq('id', userId)
        .single();

    if (!profile?.zona) {
        return (
            <div className="text-sm text-gray-600">
                <p>No tienes una zona asignada. Contacta al administrador.</p>
            </div>
        );
    }

    // Obtener reportes activos de la zona del comercial
    const { data: reportes, error } = await supabase
        .from('reportes')
        .select('*')
        .eq('store_zona', profile.zona)
        .in('status', ['draft', 'submitted', 'resolved_by_driver'])
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching reports:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return (
            <div className="text-sm text-red-600">
                <p>Error al cargar los reportes. Intenta recargar la página.</p>
                <p className="text-xs mt-1">Error: {error.message || 'Error desconocido'}</p>
            </div>
        );
    }

    // Obtener información de los conductores por separado si hay reportes
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
                <p>No hay reportes activos en tu zona en este momento.</p>
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
                    draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
                    submitted: { label: 'Enviado', color: 'bg-blue-100 text-blue-800' },
                    resolved_by_driver: { label: 'Resuelto por Conductor', color: 'bg-green-100 text-green-800' },
                };
                const statusInfo = statusLabels[reporte.status] || { label: reporte.status, color: 'bg-gray-100 text-gray-800' };

                return (
                    <div
                        key={reporte.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-gray-900">{storeName}</h4>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                                        {statusInfo.label}
                                    </span>
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
                                    {reporte.store_codigo && (
                                        <p>
                                            <span className="font-medium">Código:</span> {reporte.store_codigo}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="ml-4 flex flex-col gap-2">
                                {reporte.status === 'submitted' && (
                                    <Link
                                        href={`/conductor/chat/${reporte.id}`}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center"
                                    >
                                        Ver Chat
                                    </Link>
                                )}
                                <Link
                                    href={`/conductor/nuevo-reporte/${reporte.id}/flujo`}
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

