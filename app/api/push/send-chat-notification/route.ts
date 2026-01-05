import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';
import { NextRequest, NextResponse } from 'next/server';

// Configurar VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@oxxo.com';

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { reportId, action } = body;

        if (!reportId || action !== 'chat_started') {
            return NextResponse.json(
                { error: 'Datos incompletos' },
                { status: 400 }
            );
        }

        // Obtener información del reporte
        const { data: report } = await supabase
            .from('reportes')
            .select('*')
            .eq('id', reportId)
            .single();

        if (!report) {
            return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
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

        // Obtener todos los comerciales y admins (sin filtrar por zona)
        const { data: usuarios } = await supabase
            .from('user_profiles')
            .select('id, role, metadata')
            .in('role', ['comercial', 'administrador']);
        
        // Filtrar usuarios que tengan notificaciones desactivadas
        const usuariosConNotificaciones = usuarios?.filter(u => {
            const metadata = (u.metadata as Record<string, any>) || {};
            // Comerciales: notificaciones activadas por defecto
            // Admins: solo si tienen notifications_enabled = true explícitamente
            if (u.role === 'comercial') {
                return metadata.notifications_enabled !== false;
            } else if (u.role === 'administrador') {
                return metadata.notifications_enabled === true;
            }
            return false;
        }) || [];

        if (!usuariosConNotificaciones || usuariosConNotificaciones.length === 0) {
            return NextResponse.json({ success: true, noSubscribers: true });
        }

        // Obtener suscripciones push de los usuarios
        const userIds = usuariosConNotificaciones.map((u) => u.id);
        const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('*')
            .in('user_id', userIds);

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ success: true, noSubscriptions: true });
        }

        // Preparar payload de notificación con tiempo restante
        const storeName = report.store_nombre || 'Tienda';
        const notificationPayload = JSON.stringify({
            title: `🚨 Atención requerida - ${storeName}`,
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
                    return { success: true, subscriptionId: subscription.id };
                } catch (error: any) {
                    // Si la suscripción es inválida, eliminarla
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        await supabase
                            .from('push_subscriptions')
                            .delete()
                            .eq('id', subscription.id);
                    }
                    return { success: false, error: error.message };
                }
            })
        );

        const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;

        return NextResponse.json({
            success: true,
            sent: successful,
            failed,
            total: subscriptions.length,
            timeRemaining,
        });
    } catch (error) {
        console.error('Error sending chat notification:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}




