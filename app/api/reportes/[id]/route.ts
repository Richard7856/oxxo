import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data: reporte, error } = await supabase
            .from('reportes')
            .select('*, user_profiles(*)')
            .eq('id', id)
            .single();

        if (error || !reporte) {
            return Response.json({ error: 'Reporte no encontrado' }, { status: 404 });
        }

        // Asegurar que evidence esté disponible en la respuesta
        return Response.json({ 
            reporte,
            evidence: (reporte.evidence as Record<string, string>) || {}
        });
    } catch (error: any) {
        return Response.json(
            { error: error.message || 'Error al obtener el reporte' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const supabase = await createClient();

        const { data: reporte, error } = await supabase
            .from('reportes')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating reporte:', error);
            return Response.json(
                { error: 'Error al actualizar el reporte' },
                { status: 500 }
            );
        }

        return Response.json({ reporte });
    } catch (error: any) {
        return Response.json(
            { error: error.message || 'Error al actualizar el reporte' },
            { status: 500 }
        );
    }
}
