'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function closeReport(reportId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Verificar que el usuario sea comercial o administrador
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, zona')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'comercial' && profile?.role !== 'administrador') {
        return { error: 'Solo los comerciales y administradores pueden cerrar reportes' };
    }

    // Verificar que el reporte existe
    const { data: report } = await supabase
        .from('reportes')
        .select('status, store_zona')
        .eq('id', reportId)
        .single();

    if (!report) {
        return { error: 'Reporte no encontrado' };
    }

    // Si es comercial, verificar que el reporte pertenece a su zona
    // Si es administrador, puede cerrar cualquier reporte
    if (profile.role === 'comercial' && report.store_zona !== profile.zona) {
        return { error: 'No tienes permiso para cerrar este reporte' };
    }

    // Solo se pueden cerrar reportes que estén en draft, submitted o resolved_by_driver
    // Los administradores pueden cerrar cualquier reporte (excepto completed)
    if (profile.role === 'administrador') {
        // Admin puede cerrar cualquier reporte excepto los ya completados
        if (report.status === 'completed' || report.status === 'archived') {
            return { error: 'No se puede cerrar un reporte que ya está completado o archivado' };
        }
    } else {
        // Comercial solo puede cerrar reportes enviados o resueltos
        if (report.status !== 'submitted' && report.status !== 'resolved_by_driver') {
            return { error: 'Solo se pueden cerrar reportes en estado "Enviado" o "Resuelto por Conductor"' };
        }
    }

    // Actualizar el estado a completed
    const { error: updateError } = await supabase
        .from('reportes')
        .update({
            status: 'completed',
            resolved_at: new Date().toISOString(),
        })
        .eq('id', reportId);

    if (updateError) {
        console.error('Error closing report:', updateError);
        return { error: 'Error al cerrar el reporte' };
    }

    // Revalidar según el rol del usuario
    if (profile.role === 'administrador') {
        revalidatePath(`/admin/reporte/${reportId}`);
        revalidatePath('/admin');
    } else {
        revalidatePath(`/comercial/reporte/${reportId}`);
        revalidatePath('/comercial');
    }
    return { success: true };
}

