import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ReportTypeSelector from '@/components/conductor/report-type-selector';
import CancelReportButton from '@/components/conductor/cancel-report-button';

export default async function ReporteTipoPage({
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

    // Get reporte
    const { data: reporte } = await supabase
        .from('reportes')
        .select('*')
        .eq('id', id)
        .single();

    if (!reporte) {
        redirect('/conductor');
    }

    // Verify ownership
    if (reporte.user_id !== user.id) {
        redirect('/conductor');
    }

    // Si ya tiene tipo seleccionado, redirigir directamente al flujo
    if (reporte.tipo_reporte) {
        redirect(`/conductor/nuevo-reporte/${id}/flujo`);
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Progress Indicator */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center opacity-50">
                        <div className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full font-semibold">
                            ✓
                        </div>
                        <span className="ml-3 font-medium text-gray-600">Tienda Validada</span>
                    </div>
                    <div className="flex-1 mx-4 border-t-2 border-green-600"></div>
                    <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-full font-semibold">
                            2
                        </div>
                        <span className="ml-3 font-medium text-gray-900">Tipo de Reporte</span>
                    </div>
                    <div className="flex-1 mx-4 border-t-2 border-gray-300"></div>
                    <div className="flex items-center opacity-50">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-300 text-gray-600 rounded-full font-semibold">
                            3
                        </div>
                        <span className="ml-3 font-medium text-gray-800">Evidencias</span>
                    </div>
                </div>
            </div>

            {/* Store Info Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-sm font-medium text-gray-800 mb-2">Tienda Seleccionada</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-lg font-semibold text-gray-900">
                            {reporte.store_nombre}
                        </p>
                        <p className="text-sm text-gray-600">
                            Código: {reporte.store_codigo} | Zona: {reporte.store_zona}
                        </p>
                    </div>
                    <CancelReportButton reportId={id} />
                </div>
            </div>

            {/* Selector */}
            <div className="bg-white rounded-lg shadow p-8">
                <ReportTypeSelector reporteId={id} />
            </div>
        </div>
    );
}
