import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// Status badges
function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { label: string; className: string }> = {
        draft: { label: 'Borrador', className: 'bg-gray-100 text-gray-800' },
        submitted: { label: 'En Proceso', className: 'bg-blue-100 text-blue-800' },
        resolved_by_driver: { label: 'Resuelto por Conductor', className: 'bg-green-100 text-green-800' },
        timed_out: { label: 'Tiempo Agotado', className: 'bg-red-100 text-red-800' },
        completed: { label: 'Completado', className: 'bg-green-100 text-green-800' },
        archived: { label: 'Archivado', className: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
            {config.label}
        </span>
    );
}

// Report card component
function ReportCard({ report }: { report: any }) {
    const reportDate = new Date(report.created_at).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <Link
            href={`/comercial/reportes/${report.id}`}
            className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 p-4"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{report.store_nombre}</h3>
                        <StatusBadge status={report.status} />
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                        <p>
                            <span className="font-medium">Conductor:</span> {report.conductor_nombre}
                        </p>
                        <p>
                            <span className="font-medium">Código:</span> {report.store_codigo} |{' '}
                            <span className="font-medium">Zona:</span> {report.store_zona}
                        </p>
                        <p>
                            <span className="font-medium">Tipo:</span>{' '}
                            {report.tipo_reporte || 'Sin tipo'}
                        </p>
                        <p className="text-gray-500">{reportDate}</p>
                    </div>
                </div>
                <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </div>
        </Link>
    );
}

export default async function ComercialPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get user profile to check role and zona
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, zona')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'comercial') {
        redirect('/');
    }

    // Si el comercial no tiene zona asignada, redirigir a la pantalla principal
    if (!profile.zona) {
        redirect('/');
    }

    // Get open reports (submitted, draft) for comercial's zona
    // Note: Zonas pueden tener diferentes formatos (CDMX vs Coyoacan, etc)
    // Necesitamos hacer un match más flexible usando filtro ILIKE
    let openReports;
    
    if (profile.zona) {
        // Mapeo de zonas: CDMX puede incluir Coyoacan, etc
        const zonaMap: Record<string, string[]> = {
            'CDMX': ['CDMX', 'Coyoacan', 'COYOACAN', 'Coyoacán'],
            'Pachuca': ['Pachuca', '10PCK PACHUCA', 'PACHUCA', '10PCK'],
            'Cuernavaca': ['Cuernavaca', 'CUERNAVACA', 'Morelos'],
        };
        
        const zonasToMatch = zonaMap[profile.zona] || [profile.zona];
        
        // Buscar usando múltiples condiciones OR
        // Usamos in para buscar en el array de zonas posibles
        const { data, error } = await supabase
            .from('reportes')
            .select('*')
            .in('status', ['draft', 'submitted'])
            .in('store_zona', zonasToMatch)
            .order('created_at', { ascending: false });
        
        openReports = data;
        
        if (error) {
            console.error('Error fetching open reports:', error);
            openReports = [];
        }
    } else {
        // Si no tiene zona, mostrar todos
        const { data, error } = await supabase
            .from('reportes')
            .select('*')
            .in('status', ['draft', 'submitted'])
            .order('created_at', { ascending: false });
        
        openReports = data;
        
        if (error) {
            console.error('Error fetching open reports:', error);
            openReports = [];
        }
    }

    // Get closed reports (completed, resolved_by_driver, timed_out, archived) for comercial's zona
    let closedReports;
    
    if (profile.zona) {
        // Mapeo de zonas: CDMX puede incluir Coyoacan, etc
        const zonaMap: Record<string, string[]> = {
            'CDMX': ['CDMX', 'Coyoacan', 'COYOACAN', 'Coyoacán'],
            'Pachuca': ['Pachuca', '10PCK PACHUCA', 'PACHUCA', '10PCK'],
            'Cuernavaca': ['Cuernavaca', 'CUERNAVACA', 'Morelos'],
        };
        
        const zonasToMatch = zonaMap[profile.zona] || [profile.zona];
        
        // Buscar usando múltiples condiciones OR
        const { data, error } = await supabase
            .from('reportes')
            .select('*')
            .in('status', ['completed', 'resolved_by_driver', 'timed_out', 'archived'])
            .in('store_zona', zonasToMatch)
            .order('created_at', { ascending: false })
            .limit(50);
        
        closedReports = data;
        
        if (error) {
            console.error('Error fetching closed reports:', error);
            closedReports = [];
        }
    } else {
        // Si no tiene zona, mostrar todos
        const { data, error } = await supabase
            .from('reportes')
            .select('*')
            .in('status', ['completed', 'resolved_by_driver', 'timed_out', 'archived'])
            .order('created_at', { ascending: false })
            .limit(50);
        
        closedReports = data;
        
        if (error) {
            console.error('Error fetching closed reports:', error);
            closedReports = [];
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Panel de Comercial</h1>
                            <p className="text-gray-600 mt-1">
                                {profile.zona ? `Zona: ${profile.zona}` : 'Todas las zonas'}
                            </p>
                        </div>
                        <Link
                            href="/"
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            ← Volver al inicio
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Open Reports Section */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold text-gray-900">
                            Tickets Abiertos ({openReports?.length || 0})
                        </h2>
                </div>

                    {openReports && openReports.length > 0 ? (
                        <div className="grid gap-4">
                            {openReports.map((report) => (
                                <ReportCard key={report.id} report={report} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                            <p className="text-gray-600">No hay tickets abiertos en este momento</p>
                        </div>
                    )}
                </section>

                {/* Closed Reports Section */}
                <section>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        Historial ({closedReports?.length || 0})
                    </h2>

                    {closedReports && closedReports.length > 0 ? (
                        <div className="grid gap-4">
                            {closedReports.map((report) => (
                                <ReportCard key={report.id} report={report} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                            <p className="text-gray-600">No hay tickets cerrados</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
