import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ReportTypeSelector from '@/components/conductor/report-type-selector';
import CancelReportButton from '@/components/conductor/cancel-report-button';
import { getNextStepForReport } from '@/lib/flow-helpers';

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

    // Get reporte - usar datos desnormalizados del reporte para evitar problemas con RLS en joins
    const { data: reporte, error: reporteError } = await supabase
        .from('reportes')
        .select('*')
        .eq('id', id)
        .single();

    if (reporteError) {
        console.error('Error fetching reporte:', reporteError);
        redirect('/conductor');
    }

    if (!reporte) {
        redirect('/conductor');
    }

    // Verify ownership
    if (reporte.user_id !== user.id) {
        redirect('/conductor');
    }

    // Usar datos desnormalizados del reporte (store_nombre, store_codigo, store_zona)
    // para evitar problemas con RLS en la relación con stores
    const storeInfo = {
        nombre: reporte.store_nombre,
        codigo_tienda: reporte.store_codigo,
        zona: reporte.store_zona,
    };

    // Si ya tiene tipo de reporte seleccionado (y es un tipo válido con flujo), redirigir al flujo
    // Tipos válidos con flujo: entrega, tienda_cerrada, bascula
    const tiposValidosConFlujo = ['entrega', 'tienda_cerrada', 'bascula'];
    if (reporte.tipo_reporte && tiposValidosConFlujo.includes(reporte.tipo_reporte)) {
        // Si current_step es 'chat' o hay metadata indicando chat, redirigir al chat
        const metadata = (reporte.metadata as Record<string, any>) || {};
        if (reporte.current_step === 'chat' || (metadata.last_step_before_chat && reporte.status === 'submitted')) {
            redirect(`/conductor/chat/${id}`);
            return;
        }
        
        // Si tiene current_step, usarlo; sino calcularlo
        if (reporte.current_step && reporte.current_step !== 'chat') {
            redirect(`/conductor/nuevo-reporte/${id}/flujo?step=${reporte.current_step}`);
        } else {
            // Calcular paso inicial basado en tipo
            let initialStep: string;
            if (reporte.tipo_reporte === 'entrega') {
                initialStep = '4a';
            } else if (reporte.tipo_reporte === 'tienda_cerrada') {
                initialStep = '4b';
            } else if (reporte.tipo_reporte === 'bascula') {
                initialStep = '4c';
            } else {
                // Default fallback
                initialStep = '4a';
            }
            
            // Guardar el paso inicial
            await supabase
                .from('reportes')
                .update({ current_step: initialStep })
                .eq('id', id);
            
            redirect(`/conductor/nuevo-reporte/${id}/flujo?step=${initialStep}`);
        }
    }
    
    // Si tiene tipo_reporte pero no es válido (ej: 'rechazo_completo'), mostrar selector para cambiar

    return (
        <div className="max-w-4xl mx-auto">
            {/* Progress Indicator */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center opacity-50">
                        <div className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full font-semibold">
                            ✓
                        </div>
                        <span className="ml-3 font-medium text-gray-800">Tienda Validada</span>
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
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-300 text-gray-800 rounded-full font-semibold">
                            3
                        </div>
                        <span className="ml-3 font-medium text-gray-700">Evidencias</span>
                    </div>
                </div>
            </div>

            {/* Store Info Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Tienda Seleccionada</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-lg font-semibold text-gray-900">
                            {storeInfo.nombre}
                        </p>
                        <p className="text-sm text-gray-800">
                            Código: {storeInfo.codigo_tienda} | Zona: {storeInfo.zona}
                        </p>
                    </div>
                    <CancelReportButton reportId={id} />
                </div>
            </div>

            {/* Selector */}
            <div className="bg-white rounded-lg shadow p-8">
                <ReportTypeSelector reporteId={id} existingType={reporte.tipo_reporte} />
            </div>
        </div>
    );
}
