'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function uploadChatImageAsAgent(reportId: string, file: File) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Verify user is comercial
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'comercial') {
        return { error: 'Solo comerciales pueden subir imágenes' };
    }

    // Unique filename for chat images
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${reportId}/chat_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
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

    return { success: true, url: publicUrl };
}

export async function sendMessageAsAgent(reportId: string, text: string, imageUrl?: string | null) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Verify user is comercial
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'comercial') {
        return { error: 'Solo comerciales pueden enviar mensajes' };
    }

    // Validate that message has content
    if (!text?.trim() && !imageUrl) {
        return { error: 'El mensaje debe tener texto o imagen' };
    }

    const { error } = await supabase.from('messages').insert({
        reporte_id: reportId,
        sender: 'agent',
        sender_user_id: user.id,
        text: text?.trim() || null,
        image_url: imageUrl || null,
    });

    if (error) {
        console.error('Message Error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return { error: `Error al enviar mensaje: ${error.message || error.code || 'Error desconocido'}` };
    }

    revalidatePath(`/comercial/reportes/${reportId}`);
    return { success: true };
}

export async function closeReport(reportId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Verify user is comercial
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, zona')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'comercial') {
        return { error: 'Solo comerciales pueden cerrar reportes' };
    }

    // Verify comercial has access to this report (check zona)
    const { data: report } = await supabase
        .from('reportes')
        .select('store_zona')
        .eq('id', reportId)
        .single();

    if (!report) {
        return { error: 'Reporte no encontrado' };
    }

    // Verificar zona con mapeo flexible
    if (profile.zona) {
        const zonaMap: Record<string, string[]> = {
            'CDMX': ['CDMX', 'Coyoacan', 'COYOACAN', 'Coyoacán'],
            'Pachuca': ['Pachuca', '10PCK PACHUCA', 'PACHUCA', '10PCK'],
            'Cuernavaca': ['Cuernavaca', 'CUERNAVACA', 'Morelos'],
        };
        
        const zonasToMatch = zonaMap[profile.zona] || [profile.zona];
        
        if (!zonasToMatch.includes(report.store_zona)) {
            return { error: 'No tienes acceso a este reporte' };
        }
    }

    // Update report status to completed
    const { error } = await supabase
        .from('reportes')
        .update({
            status: 'completed',
            resolved_at: new Date().toISOString(),
        })
        .eq('id', reportId);

    if (error) {
        console.error('Error closing report:', error);
        return { error: 'Error al cerrar el reporte' };
    }

    revalidatePath('/comercial');
    revalidatePath(`/comercial/reportes/${reportId}`);
    return { success: true };
}

