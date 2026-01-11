import { NextResponse } from 'next/server';

export async function GET() {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    
    // Log para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
        console.log('[VAPID] Clave encontrada:', vapidPublicKey ? 'Sí' : 'No');
        console.log('[VAPID] Longitud:', vapidPublicKey.length);
    }
    
    if (!vapidPublicKey) {
        console.error('[VAPID] ERROR: NEXT_PUBLIC_VAPID_PUBLIC_KEY no está configurada');
        return NextResponse.json(
            { 
                error: 'VAPID public key not configured',
                message: 'La variable de entorno NEXT_PUBLIC_VAPID_PUBLIC_KEY no está configurada. Por favor, asegúrate de que esté en tu archivo .env.local y reinicia el servidor.'
            },
            { status: 500 }
        );
    }

    return NextResponse.json({ publicKey: vapidPublicKey });
}





