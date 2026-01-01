import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { user_id, store_data } = await request.json();

        if (!user_id || !store_data) {
            return Response.json(
                { error: 'user_id y store_data son requeridos' },
                { status: 400 }
            );
        }

        if (!store_data.codigo_tienda || !store_data.nombre || !store_data.zona) {
            return Response.json(
                { error: 'store_data debe contener codigo_tienda, nombre y zona' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Verify user exists and get their profile
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('display_name, full_name')
            .eq('id', user_id)
            .single();

        const conductorNombre = profile?.full_name || profile?.display_name || 'Conductor';

        // Crear reporte directamente con los datos de la tienda
        // No necesitamos store_id, solo guardamos los datos denormalizados
        const { data: reporte, error } = await supabase
            .from('reportes')
            .insert({
                user_id: user_id,
                store_id: null, // Ya no se usa, los datos están denormalizados
                store_codigo: store_data.codigo_tienda,
                store_nombre: store_data.nombre,
                store_zona: store_data.zona,
                conductor_nombre: conductorNombre,
                status: 'draft',
                tipo_reporte: null, // Se seleccionará en el siguiente paso
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
