import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StoreValidationForm from '@/components/conductor/store-validation-form';

export default async function NuevoReportePage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Check if user already has active reporte
    const { data: activeReporte } = await supabase
        .from('reportes')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['draft', 'submitted'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    // If has active, redirect to it
    if (activeReporte) {
        redirect(`/conductor/nuevo-reporte/${activeReporte.id}`);
    }

    return (
        <div className="max-w-2xl mx-auto">
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
                        <span className="ml-3 font-medium text-gray-400">
                            Tipo de Reporte
                        </span>
                    </div>
                    <div className="flex-1 mx-4 border-t-2 border-gray-300"></div>
                    <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-300 text-gray-600 rounded-full font-semibold">
                            3
                        </div>
                        <span className="ml-3 font-medium text-gray-400">Evidencias</span>
                    </div>
                </div>
            </div>

            {/* Form */}
            <StoreValidationForm userId={user.id} />
        </div>
    );
}
