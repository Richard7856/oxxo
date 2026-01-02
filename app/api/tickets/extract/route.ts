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

        // Extract ticket data using AI
        const extractedData = await extractTicketData(imageUrl);

        return NextResponse.json({ data: extractedData });
    } catch (error) {
        console.error('Error extracting ticket data:', error);
        return NextResponse.json(
            { error: 'Error al extraer datos del ticket' },
            { status: 500 }
        );
    }
}

