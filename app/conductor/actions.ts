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

export async function saveNoTicketReason(reportId: string, reason: string, imageFile?: File) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Verificar que el reporte pertenece al usuario
    const { data: report } = await supabase
        .from('reportes')
        .select('id, metadata')
        .eq('id', reportId)
        .eq('user_id', user.id)
        .single();

    if (!report) {
        return { error: 'Reporte no encontrado' };
    }

    // Guardar la razón en metadata
    const currentMetadata = (report.metadata as Record<string, any>) || {};
    const updatedMetadata: Record<string, any> = {
        ...currentMetadata,
        no_ticket_reason: reason,
    };

    // Si hay imagen, guardarla primero
    let imageUrl: string | undefined;
    if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadResult = await uploadEvidence(reportId, 'no_ticket_reason_photo', formData);
        if (uploadResult.error) {
            return { error: uploadResult.error };
        }
        imageUrl = uploadResult.url;
        updatedMetadata.no_ticket_reason_photo = imageUrl;
    }

    // Actualizar metadata
    const { error: updateError } = await supabase
        .from('reportes')
        .update({ metadata: updatedMetadata })
        .eq('id', reportId);

    if (updateError) {
        console.error('Error saving no ticket reason:', updateError);
        return { error: 'Error al guardar la razón' };
    }

    revalidatePath(`/conductor/nuevo-reporte/${reportId}/flujo`);
    return { success: true };
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
}

export async function saveTiendaAbiertaStatus(reportId: string, tiendaAbierta: boolean) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Verificar que el reporte pertenece al usuario
    const { data: report } = await supabase
        .from('reportes')
        .select('id, tipo_reporte, evidence')
        .eq('id', reportId)
        .eq('user_id', user.id)
        .single();

    if (!report) {
        return { error: 'Reporte no encontrado' };
    }

    if (!['tienda_cerrada', 'bascula'].includes(report.tipo_reporte as string)) {
        return { error: 'Esta función solo aplica para reportes de tienda cerrada o báscula' };
    }

    if (tiendaAbierta) {
        // Si se abrió, cambiar el tipo de reporte a 'entrega' y mover la evidencia de facade a arrival_exhibit
        const evidence = (report.evidence as Record<string, string>) || {};
        const facadeImage = evidence['facade'];
        
        const updatedEvidence: Record<string, string> = {
            ...evidence,
        };
        
        // Mover facade a arrival_exhibit para continuar con el flujo de entrega
        if (facadeImage) {
            updatedEvidence['arrival_exhibit'] = facadeImage;
        }

        // Actualizar el reporte: cambiar tipo a 'entrega', actualizar evidencia, y establecer paso a '4a'
        const { error: updateError } = await supabase
            .from('reportes')
            .update({
                tipo_reporte: 'entrega',
                evidence: updatedEvidence,
                current_step: '4a',
            })
            .eq('id', reportId)
            .eq('user_id', user.id);

        if (updateError) {
            console.error('Error updating report for tienda abierta:', updateError);
            return { error: 'Error al actualizar el reporte' };
        }

        revalidatePath(`/conductor/nuevo-reporte/${reportId}/flujo`);
        return { success: true, nextStep: '4a', flowUrl: `/conductor/nuevo-reporte/${reportId}/flujo?step=4a` };
    } else {
        // Si no se abrió, ir a finish para cerrar el reporte
        const { error: updateError } = await supabase
            .from('reportes')
            .update({
                current_step: 'finish',
            })
            .eq('id', reportId)
            .eq('user_id', user.id);

        if (updateError) {
            console.error('Error updating report for tienda cerrada:', updateError);
            return { error: 'Error al actualizar el reporte' };
        }

        revalidatePath(`/conductor/nuevo-reporte/${reportId}/flujo`);
        return { success: true, nextStep: 'finish', flowUrl: `/conductor/nuevo-reporte/${reportId}/flujo?step=finish` };
    }
}

export async function saveMermaStatus(reportId: string, hasMerma: boolean) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Verificar que el reporte pertenece al usuario
    const { data: report } = await supabase
        .from('reportes')
        .select('id, metadata')
        .eq('id', reportId)
        .eq('user_id', user.id)
        .single();

    if (!report) {
        return { error: 'Reporte no encontrado' };
    }

    // Guardar el estado de merma en metadata
    const currentMetadata = (report.metadata as Record<string, any>) || {};
    const updatedMetadata: Record<string, any> = {
        ...currentMetadata,
        has_merma: hasMerma,
    };

    const { error: updateError } = await supabase
        .from('reportes')
        .update({ metadata: updatedMetadata })
        .eq('id', reportId);

    if (updateError) {
        console.error('Error saving merma status:', updateError);
        return { error: 'Error al guardar el estado de merma' };
    }

    revalidatePath(`/conductor/nuevo-reporte/${reportId}/flujo`);
    return { success: true };
}

// Nueva función para inicializar el chat y enviar notificación
export async function initializeChat(reportId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Obtener el reporte — campos mínimos necesarios para inicializar el chat
    const { data: report } = await supabase
        .from('reportes')
        .select('status, tipo_reporte, timeout_at, submitted_at, evidence, store_nombre, store_codigo, store_zona, conductor_nombre')
        .eq('id', reportId)
        .eq('user_id', user.id)
        .single();

    if (!report) {
        return { error: 'Reporte no encontrado' };
    }

    // Si el reporte está en draft o no tiene timeout_at, inicializar el timer
    const now = new Date();
    const timeoutAt = new Date(now.getTime() + 20 * 60 * 1000); // 20 minutos desde ahora

    const updateData: any = {};
    
    // Si está en draft, cambiar a submitted y establecer timestamps
    if (report.status === 'draft') {
        updateData.status = 'submitted';
        updateData.submitted_at = now.toISOString();
        updateData.timeout_at = timeoutAt.toISOString();
    } else if (!report.timeout_at || new Date(report.timeout_at) < now) {
        // Si no tiene timeout_at o ya expiró, establecer uno nuevo
        updateData.timeout_at = timeoutAt.toISOString();
        if (!report.submitted_at) {
            updateData.submitted_at = now.toISOString();
        }
    }

    // Actualizar el reporte si hay cambios
    if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
            .from('reportes')
            .update(updateData)
            .eq('id', reportId)
            .eq('user_id', user.id);

        if (updateError) {
            console.error('Error initializing chat:', updateError);
            return { error: 'Error al inicializar el chat' };
        }
    }

    // Verificar si ya existe un mensaje de resumen del reporte
    const { data: existingMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('reporte_id', reportId)
        .eq('sender', 'system')
        .limit(1);

    // Si no hay mensaje de resumen, crear uno automáticamente
    if (!existingMessages || existingMessages.length === 0) {
        await createReportSummaryMessage(reportId, report, supabase);
    }

    // Enviar notificación push al comercial
    try {
        const { sendChatNotification } = await import('@/lib/push/send-chat-notification');
        const result = await sendChatNotification(reportId);
        if (result.error) {
            console.error('[Chat Notification] Error:', result.error);
        }
    } catch (err) {
        console.error('[Chat Notification] Error enviando notificación:', err);
    }

    revalidatePath(`/conductor/chat/${reportId}`);
    return { 
        success: true, 
        timeoutAt: updateData.timeout_at || report.timeout_at,
        submittedAt: updateData.submitted_at || report.submitted_at 
    };
}

// Función para crear mensaje de resumen del reporte
async function createReportSummaryMessage(reportId: string, report: any, supabase: any) {
    try {
        const tipoReporteLabels: Record<string, string> = {
            rechazo_completo: 'Rechazo Completo',
            rechazo_parcial: 'Rechazo Parcial',
            devolucion: 'Devolución',
            faltante: 'Faltante',
            sobrante: 'Sobrante',
            entrega: 'Entrega Normal',
            tienda_cerrada: 'Tienda Cerrada',
            bascula: 'Bascula',
        };

        const tipoReporteLabel = report.tipo_reporte 
            ? tipoReporteLabels[report.tipo_reporte] || report.tipo_reporte 
            : 'Reporte';

        let summaryText = `📋 Resumen del Reporte: ${tipoReporteLabel}\n\n`;
        summaryText += `📍 Tienda: ${report.store_nombre} (${report.store_codigo})\n`;
        
        // Mostrar productos y motivo según el tipo de reporte
        if (report.rechazo_details && typeof report.rechazo_details === 'object') {
            const detalles = report.rechazo_details as any;
            
            // Productos rechazados (para rechazo_completo, rechazo_parcial)
            if (detalles.productos && Array.isArray(detalles.productos) && detalles.productos.length > 0) {
                const tipoProd = report.tipo_reporte === 'faltante' ? 'Productos faltantes' :
                                report.tipo_reporte === 'sobrante' ? 'Productos sobrantes' :
                                'Productos rechazados';
                summaryText += `\n🛒 ${tipoProd}:\n`;
                detalles.productos.forEach((prod: string) => {
                    summaryText += `  • ${prod}\n`;
                });
            }
            
            // Observaciones
            if (detalles.observaciones) {
                summaryText += `\n💬 Observaciones: ${detalles.observaciones}\n`;
            }
        }
        
        // Motivo (se muestra para todos los tipos si existe)
        if (report.motivo) {
            summaryText += `\n📝 Motivo: ${report.motivo}\n`;
        }

        // Agregar información del ticket si existe
        if (report.ticket_data && typeof report.ticket_data === 'object') {
            const ticket = report.ticket_data as any;
            summaryText += `\n🎫 Información del Ticket:\n`;
            if (ticket.numero) summaryText += `  • Número: ${ticket.numero}\n`;
            if (ticket.fecha) summaryText += `  • Fecha: ${ticket.fecha}\n`;
            if (ticket.total) summaryText += `  • Total: $${ticket.total}\n`;
        }

        // Insertar mensaje de resumen
        const { error: messageError } = await supabase.from('messages').insert({
            reporte_id: reportId,
            sender: 'system',
            sender_user_id: null,
            text: summaryText,
            image_url: null,
        });

        if (messageError) {
            console.error('Error creating report summary message:', messageError);
        }

        // Insertar imágenes de evidencia como mensajes separados si existen
        if (report.evidence && typeof report.evidence === 'object') {
            const evidence = report.evidence as Record<string, string>;
            // Incluir facade para tienda_cerrada
            const evidenceKeys = ['ticket_recibido', 'ticket', 'ticket_merma', 'incident_photo', 'facade'];
            
            for (const key of evidenceKeys) {
                if (evidence[key]) {
                    const keyLabels: Record<string, string> = {
                        ticket_recibido: 'Ticket Recibido',
                        ticket: 'Ticket',
                        ticket_merma: 'Ticket Merma',
                        incident_photo: 'Foto de Incidencia',
                        facade: 'Foto de Fachada',
                    };
                    const label = keyLabels[key] || key.replace('_', ' ').toUpperCase();
                    
                    await supabase.from('messages').insert({
                        reporte_id: reportId,
                        sender: 'system',
                        sender_user_id: null,
                        text: `📷 ${label}`,
                        image_url: evidence[key],
                    }).catch((err: any) => {
                        console.error(`Error inserting evidence image ${key}:`, err);
                    });
                }
            }
        }

        // También incluir ticket_image_url si existe
        if (report.ticket_image_url) {
            await supabase.from('messages').insert({
                reporte_id: reportId,
                sender: 'system',
                sender_user_id: null,
                text: '📷 Imagen del Ticket',
                image_url: report.ticket_image_url,
            }).catch((err: any) => {
                console.error('Error inserting ticket image:', err);
            });
        }
    } catch (error) {
        console.error('Error creating report summary:', error);
    }
}

export async function sendMessage(reportId: string, text: string, imageUrl?: string | null) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Validar que al menos hay texto o imagen
    if (!text?.trim() && !imageUrl) {
        return { error: 'El mensaje debe tener texto o una imagen' };
    }

    const { error } = await supabase.from('messages').insert({
        reporte_id: reportId,
        sender: 'user',
        sender_user_id: user.id,
        text: text || null,
        image_url: imageUrl || null,
    });

    if (error) {
        console.error('Message Error:', error);
        return { error: 'Error al enviar mensaje' };
    }

    // Enviar notificación push a comerciales (en segundo plano, no bloquea)
    // Nota: Las notificaciones push se envían cuando se inicia el chat, no por cada mensaje
    // Este código puede ser removido o se puede implementar si se desea notificar por cada mensaje

    revalidatePath(`/conductor/chat/${reportId}`);
    return { success: true };
}

export async function uploadChatImage(reportId: string, formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    const file = formData.get('file') as File;
    if (!file) {
        return { error: 'No se proporcionó un archivo' };
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
        return { error: 'El archivo debe ser una imagen' };
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        return { error: 'La imagen es demasiado grande (máximo 10MB)' };
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${reportId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `chat-images/${fileName}`;

    // Subir archivo a Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (uploadError) {
        console.error('Upload Error:', uploadError);
        return { error: 'Error al subir la imagen' };
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
        .from('evidence')
        .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
        return { error: 'Error al obtener la URL de la imagen' };
    }

    return { success: true, url: urlData.publicUrl };
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
        .select('*, user_profiles(*)')
        .eq('id', reportId)
        .single();

    if (!report) return { error: 'Reporte no encontrado' };

    const payload = {
        reportId,
        reportType: report.tipo_reporte,
        store: report.store_nombre,
        storeCodigo: report.store_codigo,
        conductor: report.user_profiles?.full_name || report.conductor_nombre,
        conductorId: user.id,
        incidents,
        timestamp: new Date().toISOString(),
    };

    const n8nTemplateUrl = process.env.N8N_TEMPLATE_URL;
    if (!n8nTemplateUrl) {
        console.warn('N8N_TEMPLATE_URL no está configurada, omitiendo webhook de incidencias');
    } else {
        try {
            const response = await fetch(n8nTemplateUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                console.error('Webhook failed:', response.status, await response.text());
            }
        } catch (error) {
            console.error('Webhook error:', error);
        }
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

    // Retornar éxito en lugar de redirect para evitar el error en el cliente
    revalidatePath(`/conductor/chat/${reportId}`);
    return { success: true, chatUrl: `/conductor/chat/${reportId}` };
}

export async function resolveReport(reportId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Verificar que el reporte pertenece al usuario y obtener su estado y tipo
    const { data: report, error: fetchError } = await supabase
        .from('reportes')
        .select('status, tipo_reporte, evidence')
        .eq('id', reportId)
        .eq('user_id', user.id)
        .single();

    if (fetchError || !report) {
        console.error('Error fetching report for resolution:', fetchError);
        return { error: 'Reporte no encontrado o no autorizado' };
    }

    if (report.status === 'completed' || report.status === 'archived') {
        return { error: 'El reporte ya está completado o archivado.' };
    }

    // Actualizar el estado del reporte
    const { error: updateStatusError } = await supabase
        .from('reportes')
        .update({
            status: 'resolved_by_driver',
            resolved_at: new Date().toISOString(),
        })
        .eq('id', reportId)
        .eq('user_id', user.id);

    if (updateStatusError) {
        console.error('Error resolving report status:', updateStatusError);
        return { error: 'Error al resolver reporte' };
    }

    // No calculamos el siguiente paso aquí.
    // El chat-interface mostrará el ResolutionTypeStep inline después de esta llamada.
    // ResolutionTypeStep llama saveResolutionType() y luego navega al paso correcto.
    revalidatePath(`/conductor/chat/${reportId}`);
    return { success: true };
}

export async function saveTicketData(reportId: string, ticketData: any) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Verificar que el reporte pertenece al usuario
    const { data: report } = await supabase
        .from('reportes')
        .select('id, status, evidence')
        .eq('id', reportId)
        .eq('user_id', user.id)
        .single();

    if (!report) {
        return { error: 'Reporte no encontrado' };
    }

    // Guardar los datos del ticket
    const { error: updateError } = await supabase
        .from('reportes')
        .update({
            ticket_data: ticketData,
            ticket_extraction_confirmed: true,
        })
        .eq('id', reportId);

    if (updateError) {
        console.error('Error saving ticket data:', updateError);
        return { error: 'Error al guardar los datos del ticket' };
    }

    revalidatePath(`/conductor/nuevo-reporte/${reportId}/ticket-review`);
    revalidatePath(`/conductor/nuevo-reporte/${reportId}/flujo`);
    return { success: true };
}

export async function saveTicketMermaData(reportId: string, ticketData: any) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Verificar que el reporte pertenece al usuario
    const { data: report } = await supabase
        .from('reportes')
        .select('id')
        .eq('id', reportId)
        .eq('user_id', user.id)
        .single();

    if (!report) {
        return { error: 'Reporte no encontrado' };
    }

    // Guardar los datos del ticket de merma en return_ticket_data
    const { error: updateError } = await supabase
        .from('reportes')
        .update({
            return_ticket_data: ticketData,
            return_ticket_extraction_confirmed: true,
        })
        .eq('id', reportId);

    if (updateError) {
        console.error('Error saving ticket merma data:', updateError);
        return { error: 'Error al guardar los datos del ticket de merma' };
    }

    revalidatePath(`/conductor/nuevo-reporte/${reportId}/ticket-merma-review`);
    revalidatePath(`/conductor/nuevo-reporte/${reportId}/flujo`);
    return { success: true };
}

export async function saveResolutionType(
    reportId: string,
    resolutionType: 'completa' | 'parcial' | 'sin_entrega' | 'timed_out',
    partialFailureItems?: string[]
) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    const updateData: Record<string, any> = {
        resolution_type: resolutionType,
    };

    if (resolutionType === 'parcial' && partialFailureItems) {
        updateData.partial_failure_items = partialFailureItems;
    }

    // Para timed_out: también avanzar el current_step a '6' para que el flujo continúe
    if (resolutionType === 'timed_out') {
        updateData.current_step = '6';
    } else if (resolutionType === 'sin_entrega') {
        updateData.current_step = 'finish';
    } else {
        // completa o parcial → continuar con el acomodado del producto
        updateData.current_step = '6';
    }

    const { error } = await supabase
        .from('reportes')
        .update(updateData)
        .eq('id', reportId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error saving resolution type:', error);
        return { error: 'Error al guardar tipo de resolución' };
    }

    revalidatePath(`/conductor/chat/${reportId}`);
    revalidatePath(`/conductor/nuevo-reporte/${reportId}/flujo`);
    return { success: true, nextStep: updateData.current_step as string };
}

export async function saveOtherIncident(
    reportId: string,
    description: string,
    imageFile?: File
) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    const { data: report } = await supabase
        .from('reportes')
        .select('id, metadata')
        .eq('id', reportId)
        .eq('user_id', user.id)
        .single();

    if (!report) return { error: 'Reporte no encontrado' };

    const currentMetadata = (report.metadata as Record<string, any>) || {};
    const updatedMetadata: Record<string, any> = {
        ...currentMetadata,
        other_incident_description: description,
    };

    if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadResult = await uploadEvidence(reportId, 'other_incident_photo', formData);
        if (uploadResult.error) return { error: uploadResult.error };
        updatedMetadata.other_incident_photo = uploadResult.url;
    }

    const { error: updateError } = await supabase
        .from('reportes')
        .update({ metadata: updatedMetadata })
        .eq('id', reportId);

    if (updateError) {
        console.error('Error saving other incident:', updateError);
        return { error: 'Error al guardar incidencia adicional' };
    }

    revalidatePath(`/conductor/nuevo-reporte/${reportId}/flujo`);
    return { success: true };
}

export async function submitReport(reportId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Verificar que el reporte pertenece al usuario
    const { data: report } = await supabase
        .from('reportes')
        .select('id, status, ticket_data, ticket_extraction_confirmed, tipo_reporte, store_zona, store_nombre, store_codigo, metadata, evidence, conductor_nombre, rechazo_details, ticket_image_url')
        .eq('id', reportId)
        .eq('user_id', user.id)
        .single();

    if (!report) {
        return { error: 'Reporte no encontrado' };
    }

    // Solo permitir enviar reportes en draft
    if (report.status !== 'draft') {
        return { error: 'El reporte ya fue enviado' };
    }

    // Verificar que el ticket fue procesado o hay una razón de no ticket (para reportes de entrega)
    if (report.tipo_reporte === 'entrega') {
        const metadata = (report.metadata as Record<string, any>) || {};
        const hasNoTicketReason = metadata.no_ticket_reason;
        const hasTicketConfirmed = report.ticket_extraction_confirmed;
        
        // Debe tener o ticket confirmado o razón de no ticket
        if (!hasTicketConfirmed && !hasNoTicketReason) {
            return { error: 'Debes procesar el ticket o indicar la razón de no tener ticket antes de enviar el reporte' };
        }
    }

    // Cambiar el estado a submitted
    const now = new Date().toISOString();
    const timeoutAt = new Date(Date.now() + 20 * 60 * 1000).toISOString(); // 20 minutos

    const { error: updateError } = await supabase
        .from('reportes')
        .update({
            status: 'submitted',
            submitted_at: now,
            timeout_at: timeoutAt,
            current_step: 'submitted', // Marcar como completado
        })
        .eq('id', reportId);

    if (updateError) {
        console.error('Error submitting report:', updateError);
        return { error: 'Error al enviar el reporte' };
    }

    // Inicializar el chat y enviar notificaciones usando la función compartida
    try {
        const { sendChatNotification } = await import('@/lib/push/send-chat-notification');
        const notificationResult = await sendChatNotification(reportId);
        if (notificationResult.error) {
            console.error('[Submit Report] Error enviando notificación:', notificationResult.error);
        }

        // Crear mensaje de resumen del reporte en el chat
        await createReportSummaryMessage(reportId, report, supabase);
    } catch (err) {
        console.error('[Submit Report] Error inicializando chat/notificaciones:', err);
        // Continuar aunque falle la notificación
    }

    revalidatePath(`/conductor/nuevo-reporte/${reportId}/flujo`);
    revalidatePath('/conductor');
    return { success: true };
}
