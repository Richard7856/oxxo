import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify authentication from session, NOT from request body
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { store_data } = await request.json();

        if (!store_data) {
            return Response.json(
                { error: 'store_data es requerido' },
                { status: 400 }
            );
        }

        if (!store_data.codigo_tienda || !store_data.nombre || !store_data.zona) {
            return Response.json(
                { error: 'store_data debe contener codigo_tienda, nombre y zona' },
                { status: 400 }
            );
        }

        // Get profile for conductor name
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('display_name, full_name')
            .eq('id', user.id)
            .single();

        const conductorNombre = profile?.full_name || profile?.display_name || 'Conductor';

        const { data: reporte, error } = await supabase
            .from('reportes')
            .insert({
                user_id: user.id, // Always use auth session user id
                store_id: null,
                store_codigo: store_data.codigo_tienda,
                store_nombre: store_data.nombre,
                store_zona: store_data.zona,
                conductor_nombre: conductorNombre,
                status: 'draft',
                tipo_reporte: null,
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error creating reporte:', error);
            return Response.json(
                { error: 'Error al crear el reporte' },
                { status: 500 }
            );
        }

        return Response.json({ reporte_id: reporte.id });
    } catch (error: any) {
        console.error('Create reporte error:', error);
        return Response.json(
            { error: error.message || 'Error al crear el reporte' },
            { status: 500 }
        );
    }
}
