import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { store_id, user_id, conductor_nombre } = await request.json();

        if (!store_id || !user_id) {
            return Response.json(
                { error: 'store_id y user_id son requeridos' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Verify user exists and get their profile
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('display_name')
            .eq('id', user_id)
            .single();

        const finalConductorNombre = conductor_nombre || profile?.display_name || 'Conductor';

        // Call atomic function to create reporte
        // tipo_reporte will be NULL initially and set when user selects type
        const { data, error } = await supabase.rpc('create_reporte_atomic', {
            p_user_id: user_id,
            p_store_id: store_id,
            p_conductor_nombre: finalConductorNombre,
            p_tipo_reporte: null, // NULL initially, will be set in next step
        });

        if (error) {
            console.error('Error creating reporte:', error);
            return Response.json(
                { error: 'Error al crear el reporte' },
                { status: 500 }
            );
        }

        return Response.json({ reporte_id: data });
    } catch (error: any) {
        console.error('Create reporte error:', error);
        return Response.json(
            { error: error.message || 'Error al crear el reporte' },
            { status: 500 }
        );
    }
}
