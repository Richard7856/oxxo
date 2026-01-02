import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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
        const { endpoint, keys } = body;

        if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
            return NextResponse.json(
                { error: 'Datos de suscripción inválidos' },
                { status: 400 }
            );
        }

        // Guardar o actualizar la suscripción
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert(
                {
                    user_id: user.id,
                    endpoint,
                    p256dh: keys.p256dh,
                    auth: keys.auth,
                    user_agent: request.headers.get('user-agent') || null,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'user_id,endpoint',
                }
            );

        if (error) {
            console.error('Error saving subscription:', error);
            return NextResponse.json(
                { error: 'Error al guardar la suscripción' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in push subscribe:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}



