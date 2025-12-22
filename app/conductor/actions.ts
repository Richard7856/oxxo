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

    // Delete the draft report
    const { error } = await supabase
        .from('reportes')
        .delete()
        .eq('id', reportId)
        .eq('user_id', user.id)
        .eq('status', 'draft');

    if (error) {
        console.error('Error cancelling report:', error);
        return { error: 'Error al cancelar el reporte' };
    }

    revalidatePath('/conductor');
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

    revalidatePath(`/conductor/chat/${reportId}`);
    return { success: true };
}

export async function submitIncidentReport(reportId: string, incidents: any[]) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Get complete report details with all related data
    const { data: report } = await supabase
        .from('reportes')
        .select('*, stores(*), user_profiles(*)')
        .eq('id', reportId)
        .single();

    if (!report) return { error: 'Reporte no encontrado' };

    // Save the step where we're coming from (step 5 = incidents)
    // This will be used to return to step 6 after chat resolves
    const currentMetadata = (report.metadata as Record<string, any>) || {};
    await supabase
        .from('reportes')
        .update({
            metadata: {
                ...currentMetadata,
                last_step_before_chat: '5', // Coming from incidents form
                should_return_to_step: '6', // Should go to product_arranged after chat
            },
        })
        .eq('id', reportId);

    // Build comprehensive payload with all data
    const payload = {
        // Metadata
        timestamp: new Date().toISOString(),
        webhook_type: 'incident_report',
        
        // Reporte completo
        reporte: {
            id: report.id,
            status: report.status,
            tipo_reporte: report.tipo_reporte,
            store_id: report.store_id,
            user_id: report.user_id,
            // Store snapshot (denormalized)
            store_codigo: report.store_codigo,
            store_nombre: report.store_nombre,
            store_zona: report.store_zona,
            conductor_nombre: report.conductor_nombre,
            // Type-specific data
            motivo: report.motivo,
            rechazo_details: report.rechazo_details,
            // Ticket data
            ticket_data: report.ticket_data,
            ticket_image_url: report.ticket_image_url,
            ticket_extraction_confirmed: report.ticket_extraction_confirmed,
            // Return ticket data
            return_ticket_data: report.return_ticket_data,
            return_ticket_image_url: report.return_ticket_image_url,
            return_ticket_extraction_confirmed: report.return_ticket_extraction_confirmed,
            // Evidence and incidents
            evidence: report.evidence,
            incident_details: incidents, // Current incidents being submitted
            // Timestamps
            created_at: report.created_at,
            updated_at: report.updated_at,
            submitted_at: report.submitted_at,
            resolved_at: report.resolved_at,
            timeout_at: report.timeout_at,
            metadata: report.metadata,
        },
        
        // Tienda completa (from stores table)
        tienda: report.stores ? {
            id: report.stores.id,
            codigo_tienda: report.stores.codigo_tienda,
            nombre: report.stores.nombre,
            zona: report.stores.zona,
            direccion: report.stores.direccion,
            ciudad: report.stores.ciudad,
            estado: report.stores.estado,
            metadata: report.stores.metadata,
            created_at: report.stores.created_at,
            updated_at: report.stores.updated_at,
        } : null,
        
        // Conductor completo (from user_profiles table)
        conductor: report.user_profiles ? {
            id: report.user_profiles.id,
            email: report.user_profiles.email,
            display_name: report.user_profiles.display_name,
            role: report.user_profiles.role,
            zona: report.user_profiles.zona,
            avatar_url: report.user_profiles.avatar_url,
            is_active: report.user_profiles.is_active,
            metadata: report.user_profiles.metadata,
            created_at: report.user_profiles.created_at,
            updated_at: report.user_profiles.updated_at,
        } : null,
        
        // Incidencias enviadas (nuevas)
        incidencias: incidents,
    };

    // Save incidents to DB first (critical operation)
    const { error: updateError } = await supabase
        .from('reportes')
        .update({
            incident_details: incidents,
        })
        .eq('id', reportId);

    if (updateError) {
        console.error('Error saving incidents to DB:', updateError);
        // This is a critical error, but we'll still redirect to chat
        // The user can see the error in console but won't be blocked
    }

    // Send webhook (non-blocking, fire-and-forget)
    // Don't await or show errors to user - this is async notification
    fetch('https://n8n.srv925698.hstgr.cloud/webhook/template', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    }).catch((error) => {
        // Silently log webhook errors - don't block user flow
        console.error('Webhook error (non-blocking):', error);
    });

    // Redirect to chat - this always succeeds
    redirect(`/conductor/chat/${reportId}`);
}

export async function resolveReport(reportId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Get report to check metadata for last step
    const { data: report } = await supabase
        .from('reportes')
        .select('metadata, tipo_reporte')
        .eq('id', reportId)
        .single();

    if (!report) return { error: 'Reporte no encontrado' };

    // Update status
    const { error } = await supabase
        .from('reportes')
        .update({
            status: 'resolved_by_driver',
            resolved_at: new Date().toISOString(),
        })
        .eq('id', reportId);

    if (error) {
        return { error: 'Error al resolver reporte' };
    }

    // Determine next step based on metadata and report type
    const metadata = (report.metadata as Record<string, any>) || {};
    let nextStep = '6'; // Default: producto acomodado (step 6)

    if (metadata.should_return_to_step) {
        // Return to the step saved before going to chat
        nextStep = metadata.should_return_to_step;
    } else if (report.tipo_reporte === 'tienda_cerrada') {
        // For closed store, after resolving from chat, finish the report
        redirect(`/conductor/nuevo-reporte/${reportId}/flujo?step=finish`);
        return;
    } else if (report.tipo_reporte === 'entrega') {
        // For delivery, continue from product arranged (step 6)
        nextStep = '6';
    }

    // Redirect to the correct step
    redirect(`/conductor/nuevo-reporte/${reportId}/flujo?step=${nextStep}`);
}
