'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Cerrar/resolver el chat desde el lado del comercial/admin
 * Cambia el estado del reporte a 'resolved_by_driver' o 'completed' según corresponda
 */
export async function closeChat(reportId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Verificar que el usuario sea comercial o administrador
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || (profile.role !== 'comercial' && profile.role !== 'administrador')) {
        return { error: 'No tienes permiso para cerrar este chat' };
    }

    // Obtener el reporte
    const { data: report, error: fetchError } = await supabase
        .from('reportes')
        .select('status, tipo_reporte')
        .eq('id', reportId)
        .single();

    if (fetchError || !report) {
        return { error: 'Reporte no encontrado' };
    }

    // Solo se puede cerrar si está en estado 'submitted' o 'resolved_by_driver'
    if (report.status !== 'submitted' && report.status !== 'resolved_by_driver') {
        return { error: `No se puede cerrar un reporte con estado: ${report.status}` };
    }

    // Si ya está resuelto por el conductor, marcarlo como completado
    // Si está en submitted, marcarlo como resuelto por el comercial (pero cambiamos a completed directamente)
    const newStatus = report.status === 'resolved_by_driver' ? 'completed' : 'completed';

    // Actualizar el estado del reporte
    const { error: updateError } = await supabase
        .from('reportes')
        .update({
            status: newStatus,
            resolved_at: new Date().toISOString(),
        })
        .eq('id', reportId);

    if (updateError) {
        console.error('Error closing chat:', updateError);
        return { error: 'Error al cerrar el chat' };
    }

    revalidatePath(`/comercial/chat/${reportId}`);
    revalidatePath(`/admin/chat/${reportId}`);
    revalidatePath('/comercial');
    revalidatePath('/admin');

    return { success: true };
}
