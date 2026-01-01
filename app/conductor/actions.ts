'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function cancelReport(reportId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Verificar que el reporte pertenece al usuario
    const { data: report } = await supabase
        .from('reportes')
        .select('status')
        .eq('id', reportId)
        .eq('user_id', user.id)
        .single();

    if (!report) {
        return { error: 'Reporte no encontrado' };
    }

    // Solo permitir cancelar reportes en draft o submitted
    // Los reportes completados no se pueden cancelar
    if (report.status !== 'draft' && report.status !== 'submitted') {
        return { error: 'No se puede cancelar un reporte que ya está completado' };
    }

    // Delete the report (draft o submitted)
    const { error } = await supabase
        .from('reportes')
        .delete()
        .eq('id', reportId)
        .eq('user_id', user.id)
        .in('status', ['draft', 'submitted']);

    if (error) {
        console.error('Error cancelling report:', error);
        return { error: 'Error al cancelar el reporte' };
    }

    revalidatePath('/conductor');
    revalidatePath('/conductor/nuevo-reporte');
    redirect('/conductor');
}

export async function uploadEvidence(
    reportId: string,
    evidenceKey: string,
    formData: FormData
) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    const file = formData.get('file') as File;
    if (!file) return { error: 'No se recibió ningún archivo' };

    // Unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${reportId}/${evidenceKey}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to 'evidence' bucket
    const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Upload Error:', uploadError);
        return { error: 'Error al subir la imagen' };
    }

    // Get Public URL
    const {
        data: { publicUrl },
    } = supabase.storage.from('evidence').getPublicUrl(filePath);

    // Update report evidence JSONB
    // First get current evidence
    const { data: currentReport } = await supabase
        .from('reportes')
        .select('evidence')
        .eq('id', reportId)
        .single();

    const currentEvidence = (currentReport?.evidence as Record<string, string>) || {};
    const updatedEvidence = {
        ...currentEvidence,
        [evidenceKey]: publicUrl,
    };

    const { error: updateError } = await supabase
        .from('reportes')
        .update({
            evidence: updatedEvidence,
        })
        .eq('id', reportId);

    if (updateError) {
        console.error('Update Error:', updateError);
        return { error: 'Error al actualizar el reporte' };
    }

    revalidatePath(`/conductor/nuevo-reporte/${reportId}/flujo`);
    return { success: true, url: publicUrl };
}

export async function sendMessage(reportId: string, text: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    const { error } = await supabase.from('messages').insert({
        reporte_id: reportId,
        sender: 'user',
        sender_user_id: user.id,
        text: text,
    });

    if (error) {
        console.error('Message Error:', error);
        return { error: 'Error al enviar mensaje' };
    }

    // Enviar notificación push a comerciales (en segundo plano, no bloquea)
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        
        fetch(`${baseUrl}/api/push/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                reportId,
                messageText: text,
                sender: 'user',
            }),
        }).catch((err) => {
            // Silenciar errores de notificaciones para no bloquear el envío del mensaje
            console.error('Error sending push notification:', err);
        });
    } catch (err) {
        // Ignorar errores de notificaciones
        console.error('Error in push notification:', err);
    }

    revalidatePath(`/conductor/chat/${reportId}`);
    return { success: true };
}

export async function submitIncidentReport(reportId: string, incidents: any[]) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Get report details for context
    const { data: report } = await supabase
        .from('reportes')
        .select('*, stores(*), user_profiles(*)')
        .eq('id', reportId)
        .single();

    if (!report) return { error: 'Reporte no encontrado' };

    const payload = {
        reportId,
        reportType: report.tipo_reporte,
        store: report.stores?.nombre,
        storeId: report.store_id,
        conductor: report.user_profiles?.full_name,
        conductorId: user.id,
        incidents,
        timestamp: new Date().toISOString(),
    };

    try {
        const response = await fetch('https://n8n.srv925698.hstgr.cloud/webhook/template', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error('Webhook failed:', response.status, await response.text());
            // We continue anyway as per instructions "no se espera respuesta" implies fire & forget or at least don't block
            // But usually we want to know if it failed. instructions say "no se espera respuesta en este se abre el primer chat"
            // which means we treat it as success and go to chat.
        }
    } catch (error) {
        console.error('Webhook error:', error);
        // Continue to chat even on error? Probably yes to not block user.
    }

    // Save incidents to DB as well for record
    const { error: updateError } = await supabase
        .from('reportes')
        .update({
            incident_details: incidents,
        })
        .eq('id', reportId);

    if (updateError) {
        console.error('Error saving incidents to DB:', updateError);
    }

    // Create a system message in chat to indicate report was sent? 
    // Or just redirect.

    redirect(`/conductor/chat/${reportId}`);
}

export async function resolveReport(reportId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Verificar que el reporte pertenece al usuario
    const { data: report } = await supabase
        .from('reportes')
        .select('status, tipo_reporte, evidence')
        .eq('id', reportId)
        .eq('user_id', user.id)
        .single();

    if (!report) {
        return { error: 'Reporte no encontrado' };
    }

    // Determinar el siguiente paso basado en el tipo de reporte y evidencia
    let nextStep = '4a'; // Default para entrega
    if (report.tipo_reporte === 'tienda_cerrada') {
        nextStep = '4b';
    } else if (report.tipo_reporte === 'bascula') {
        nextStep = '4c';
    } else if (report.tipo_reporte === 'entrega') {
        // Para entrega, verificar qué evidencia ya se tiene para determinar el siguiente paso
        const evidence = (report.evidence as Record<string, string>) || {};
        if (evidence['arrival_exhibit']) {
            nextStep = 'incident_check';
        } else {
            nextStep = '4a';
        }
    }

    // Actualizar el estado del reporte y el paso actual
    const { error } = await supabase
        .from('reportes')
        .update({
            status: 'resolved_by_driver',
            resolved_at: new Date().toISOString(),
            current_step: nextStep, // Actualizar el paso para continuar desde donde corresponde
        })
        .eq('id', reportId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error resolving report:', error);
        return { error: 'Error al resolver reporte' };
    }

    // Redirigir al flujo del reporte para continuar con los siguientes pasos
    redirect(`/conductor/nuevo-reporte/${reportId}/flujo?step=${nextStep}`);
}

export async function updateCurrentStep(reportId: string, step: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    const { error } = await supabase
        .from('reportes')
        .update({
            current_step: step,
        })
        .eq('id', reportId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating current step:', error);
        return { error: 'Error al actualizar el paso' };
    }

    revalidatePath(`/conductor/nuevo-reporte/${reportId}/flujo`);
    return { success: true };
}
