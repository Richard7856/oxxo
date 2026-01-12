/**
 * Función compartida para enviar notificaciones push cuando se inicia un chat
 * Puede ser llamada desde server actions o API routes
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import webpush from 'web-push';

// Configurar VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@oxxo.com';

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function sendChatNotification(reportId: string) {
    try {
        // Usar service role client para evitar restricciones de RLS
        // Esto permite acceder a todas las suscripciones y perfiles
        const supabase = createServiceRoleClient();
        
        // Obtener información del reporte
        const { data: report } = await supabase
            .from('reportes')
            .select('*')
            .eq('id', reportId)
            .single();

        if (!report) {
            console.error('[Push Notification] Reporte no encontrado:', reportId);
            return { error: 'Reporte no encontrado' };
        }

        // Calcular tiempo restante
        const now = new Date();
        const timeoutAt = report.timeout_at ? new Date(report.timeout_at) : null;
        let timeRemaining = '';
        
        if (timeoutAt && timeoutAt > now) {
            const minutes = Math.floor((timeoutAt.getTime() - now.getTime()) / (1000 * 60));
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            
            if (hours > 0) {
                timeRemaining = `${hours}h ${mins}m`;
            } else {
                timeRemaining = `${mins}m`;
            }
        } else {
            timeRemaining = '20m'; // Default si no hay timeout_at
        }

        // Obtener TODOS los comerciales y administradores (SIN filtrar por zona)
        const { data: usuarios } = await supabase
            .from('user_profiles')
            .select('id, role, metadata')
            .in('role', ['comercial', 'administrador']);
        
        console.log('[Push Notification] Total usuarios comerciales y admins encontrados:', usuarios?.length || 0);
        
        // Filtrar usuarios que tengan notificaciones activadas
        const usuariosConNotificaciones = usuarios?.filter(u => {
            const metadata = (u.metadata as Record<string, any>) || {};
            if (u.role === 'comercial') {
                return metadata.notifications_enabled !== false;
            } else if (u.role === 'administrador') {
                return metadata.notifications_enabled === true;
            }
            return false;
        }) || [];

        console.log('[Push Notification] Usuarios con notificaciones activadas:', {
            total: usuariosConNotificaciones.length,
            comerciales: usuariosConNotificaciones.filter(u => u.role === 'comercial').length,
            administradores: usuariosConNotificaciones.filter(u => u.role === 'administrador').length,
        });

        if (!usuariosConNotificaciones || usuariosConNotificaciones.length === 0) {
            console.log('[Push Notification] No hay usuarios con notificaciones activadas');
            return { success: true, noSubscribers: true };
        }

        // Obtener suscripciones push de los usuarios
        const userIds = usuariosConNotificaciones.map((u) => u.id);
        const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('*')
            .in('user_id', userIds);

        if (!subscriptions || subscriptions.length === 0) {
            console.log('[Push Notification] No hay suscripciones push');
            return { success: true, noSubscriptions: true };
        }

        // Preparar payload de notificación con información del reporte
        const storeName = report.store_nombre || 'Tienda';
        const tipoReporteLabels: Record<string, string> = {
            rechazo_completo: 'Rechazo Completo',
            rechazo_parcial: 'Rechazo Parcial',
            devolucion: 'Devolución',
            faltante: 'Faltante',
            sobrante: 'Sobrante',
            entrega: 'Entrega',
            tienda_cerrada: 'Tienda Cerrada',
            bascula: 'Bascula',
        };
        const tipoReporteLabel = report.tipo_reporte 
            ? tipoReporteLabels[report.tipo_reporte] || report.tipo_reporte 
            : 'Reporte';
        
        const notificationPayload = JSON.stringify({
            title: `🚨 ${tipoReporteLabel} - ${storeName}`,
            body: `Conductor necesita ayuda. Tiempo restante: ${timeRemaining}`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: `report-${reportId}`,
            data: {
                url: `/comercial/chat/${reportId}`,
                reportId,
            },
            requireInteraction: true,
            urgency: 'high',
        });

        console.log('[Push Notification] Enviando notificaciones a TODOS los comerciales y admins:', {
            totalSubscriptions: subscriptions.length,
            totalUsuarios: usuariosConNotificaciones.length,
            reportId,
            storeName,
            tipoReporte: tipoReporteLabel,
            nota: 'Se envían a TODOS sin filtro de zona',
        });

        // Enviar notificaciones a todas las suscripciones
        const results = await Promise.allSettled(
            subscriptions.map(async (subscription) => {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: subscription.endpoint,
                            keys: {
                                p256dh: subscription.p256dh,
                                auth: subscription.auth,
                            },
                        },
                        notificationPayload
                    );
                    console.log('[Push Notification] Enviada exitosamente a:', subscription.id);
                    return { success: true, subscriptionId: subscription.id };
                } catch (error: any) {
                    console.error('[Push Notification] Error enviando a suscripción:', subscription.id, error?.statusCode, error?.message);
                    // Si la suscripción es inválida, eliminarla
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        console.log('[Push Notification] Eliminando suscripción inválida:', subscription.id);
                        await supabase
                            .from('push_subscriptions')
                            .delete()
                            .eq('id', subscription.id);
                    }
                    return { success: false, error: error.message, statusCode: error.statusCode };
                }
            })
        );

        const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;

        console.log('[Push Notification] Resultados:', {
            successful,
            failed,
            total: subscriptions.length,
        });

        return {
            success: true,
            sent: successful,
            failed,
            total: subscriptions.length,
            timeRemaining,
        };
    } catch (error: any) {
        console.error('[Push Notification] Error:', error);
        return { error: error.message || 'Error interno' };
    }
}
