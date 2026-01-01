import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';
import { NextRequest, NextResponse } from 'next/server';

// Configurar VAPID keys (deben estar en variables de entorno)
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
        const { reportId, messageText, sender } = body;

        if (!reportId || !messageText) {
            return NextResponse.json(
                { error: 'Datos incompletos' },
                { status: 400 }
            );
        }

        // Obtener información del reporte
        const { data: report } = await supabase
            .from('reportes')
            .select('*, stores(nombre)')
            .eq('id', reportId)
            .single();

        if (!report) {
            return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
        }

        // Solo enviar notificaciones si el mensaje es del conductor (user)
        // Los comerciales deben recibir notificaciones cuando el conductor envía mensajes
        if (sender !== 'user') {
            return NextResponse.json({ success: true, skipped: true });
        }

        // Obtener comerciales de la misma zona
        const { data: comerciales } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('role', 'comercial')
            .eq('zona', report.store_zona);

        if (!comerciales || comerciales.length === 0) {
            return NextResponse.json({ success: true, noSubscribers: true });
        }

        // Obtener suscripciones push de los comerciales
        const userIds = comerciales.map((c) => c.id);
        const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('*')
            .in('user_id', userIds);

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ success: true, noSubscriptions: true });
        }

        // Preparar payload de notificación
        const storeName = report.stores?.nombre || 'Tienda';
        const notificationPayload = JSON.stringify({
            title: `Nuevo mensaje - ${storeName}`,
            body: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: `report-${reportId}`,
            data: {
                url: `/comercial/chat/${reportId}`,
                reportId,
            },
            requireInteraction: true,
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
        });
    } catch (error) {
        console.error('Error sending push notification:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

