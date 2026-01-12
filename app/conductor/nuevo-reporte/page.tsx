import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StoreValidationForm from '@/components/conductor/store-validation-form';
import Link from 'next/link';
import CancelReportButton from '@/components/conductor/cancel-report-button';

export default async function NuevoReportePage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Check if user already has active reporte (solo borradores, no enviados)
    const { data: activeReporte } = await supabase
        .from('reportes')
        .select('id, status, created_at, store_nombre')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    return (
        <div className="max-w-2xl mx-auto">
            {/* Active Report Banner */}
            {activeReporte && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-yellow-800 mb-1">
                                Tienes un reporte activo
                            </h3>
                            <p className="text-sm text-yellow-700 mb-3">
                                {activeReporte.store_nombre ? `Tienda: ${activeReporte.store_nombre}` : 'Reporte en progreso'}
                                {' - '}
                                Estado: {activeReporte.status === 'draft' ? 'Borrador' : 'Enviado'}
                            </p>
                            <div className="flex gap-3">
                                <Link
                                    href={`/conductor/nuevo-reporte/${activeReporte.id}`}
                                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
                                >
                                    Continuar con este reporte
                                </Link>
                                <CancelReportButton reportId={activeReporte.id} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Progress Indicator */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-full font-semibold">
                            1
                        </div>
                        <span className="ml-3 font-medium text-gray-900">
                            Validar Tienda
                        </span>
                    </div>
                    <div className="flex-1 mx-4 border-t-2 border-gray-300"></div>
                    <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-300 text-gray-600 rounded-full font-semibold">
                            2
                        </div>
                        <span className="ml-3 font-medium text-gray-800">
                            Tipo de Reporte
                        </span>
                    </div>
                    <div className="flex-1 mx-4 border-t-2 border-gray-300"></div>
                    <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-300 text-gray-600 rounded-full font-semibold">
                            3
                        </div>
                        <span className="ml-3 font-medium text-gray-800">Evidencias</span>
                    </div>
                </div>
            </div>

            {/* Form */}
            <StoreValidationForm userId={user.id} />
        </div>
    );
}
