import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractTicketData } from '@/lib/ai/extract-ticket-data';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { imageUrl } = await request.json();

        if (!imageUrl) {
            return NextResponse.json({ error: 'URL de imagen requerida' }, { status: 400 });
        }

        console.log('Extrayendo datos del ticket con URL:', imageUrl);

        // Verificar que la API key esté configurada
        if (!process.env.OPENAI_API_KEY) {
            console.error('OPENAI_API_KEY no está configurada');
            return NextResponse.json(
                { error: 'Configuración del servidor incompleta' },
                { status: 500 }
            );
        }

        // Extract ticket data using AI
        const extractedData = await extractTicketData(imageUrl);

        console.log('Datos extraídos:', extractedData);

        if (!extractedData || extractedData.confidence === 0) {
            console.warn('Extracción con confianza 0 o datos vacíos');
        }

        return NextResponse.json({ data: extractedData });
    } catch (error: any) {
        console.error('Error extracting ticket data:', error);
        const errorMessage = error?.message || 'Error al extraer datos del ticket';
        
        // Si es error de cuota, devolver status 429
        if (errorMessage.includes('CUOTA_EXCEDIDA') || errorMessage.includes('quota') || errorMessage.includes('429')) {
            return NextResponse.json(
                { 
                    error: errorMessage,
                    quotaExceeded: true
                },
                { status: 429 }
            );
        }
        
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}


