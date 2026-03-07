import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { ReporteState } from '@/lib/state-machines/reporte-state';

// Fields that clients are allowed to update via PATCH
const ALLOWED_FIELDS = new Set([
    'tipo_reporte',
    'motivo',
    'rechazo_details',
    'ticket_data',
    'ticket_image_url',
    'ticket_extraction_confirmed',
    'return_ticket_data',
    'return_ticket_image_url',
    'return_ticket_extraction_confirmed',
    'evidence',
    'incident_details',
    'current_step',
]);

// Valid state transitions that can be triggered via API
const ALLOWED_STATUS_TRANSITIONS: Record<ReporteState, ReporteState[]> = {
    draft: ['submitted'],
    submitted: ['resolved_by_driver', 'timed_out'],
    resolved_by_driver: ['completed'],
    timed_out: ['completed'],
    completed: ['archived'],
    archived: [],
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { data: reporte, error } = await supabase
            .from('reportes')
            .select('*, user_profiles(*)')
            .eq('id', id)
            .single();

        if (error || !reporte) {
            return Response.json({ error: 'Reporte no encontrado' }, { status: 404 });
        }

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
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();

        // Filter to only allowed fields
        const sanitized: Record<string, unknown> = {};
        for (const key of Object.keys(body)) {
            if (ALLOWED_FIELDS.has(key)) {
                sanitized[key] = body[key];
            }
        }

        // If status is being changed, validate the transition
        if (body.status !== undefined) {
            const { data: current } = await supabase
                .from('reportes')
                .select('status')
                .eq('id', id)
                .single();

            if (!current) {
                return Response.json({ error: 'Reporte no encontrado' }, { status: 404 });
            }

            const currentStatus = current.status as ReporteState;
            const newStatus = body.status as ReporteState;
            const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

            if (!allowed.includes(newStatus)) {
                return Response.json(
                    { error: `Transición de estado inválida: ${currentStatus} → ${newStatus}` },
                    { status: 400 }
                );
            }

            sanitized.status = newStatus;
        }

        if (Object.keys(sanitized).length === 0) {
            return Response.json({ error: 'No hay campos válidos para actualizar' }, { status: 400 });
        }

        const { data: reporte, error } = await supabase
            .from('reportes')
            .update(sanitized)
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
