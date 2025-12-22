import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

interface N8nStoreResponse {
    row_number: number;
    Codigo: string;
    Nombre: string;
    Plaza: string;
    'Responsable\n comercial': string;
    Celular: string;
    'Encargado Ejecucion\nComercial': string;
    Móvil: string;
    Zona: string;
}

export async function POST(request: NextRequest) {
    try {
        const { codigo_tienda } = await request.json();

        if (!codigo_tienda) {
            return Response.json(
                { error: 'Código de tienda requerido' },
                { status: 400 }
            );
        }

        // Validate format: 50CUE (2 numbers + 3 uppercase letters)
        const storeCodeRegex = /^\d{2}[A-Z]{3}$/;
        if (!storeCodeRegex.test(codigo_tienda)) {
            return Response.json(
                { error: 'Formato de código inválido. Use formato 50CUE' },
                { status: 400 }
            );
        }

        const n8nUrl = process.env.N8N_VALIDATE_STORE_URL || 'https://n8n.srv925698.hstgr.cloud/webhook/tiendas';

        console.log('Validating store with n8n:', codigo_tienda);

        // Call n8n webhook
        const n8nResponse = await fetch(n8nUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ codigo: codigo_tienda }),
        });

        if (!n8nResponse.ok) {
            console.error('n8n validation failed:', n8nResponse.status, n8nResponse.statusText);
            return Response.json(
                { error: `Tienda con código ${codigo_tienda} no encontrada en el sistema` },
                { status: 404 }
            );
        }

        const responseData: N8nStoreResponse[] = await n8nResponse.json();

        // n8n returns an array, get first item
        if (!responseData || responseData.length === 0) {
            return Response.json(
                { error: 'Tienda no encontrada' },
                { status: 404 }
            );
        }

        const storeData = responseData[0];

        console.log('Store found:', storeData);

        // Upsert store in database
        const supabase = await createClient();

        // First try to find existing store
        const { data: existingStore } = await supabase
            .from('stores')
            .select('id')
            .eq('codigo_tienda', storeData.Codigo)
            .maybeSingle();

        let store;
        let error;

        if (existingStore) {
            // Update existing store (trigger will handle updated_at automatically)
            const result = await supabase
                .from('stores')
                .update({
                    nombre: storeData.Nombre,
                    zona: storeData.Zona,
                    direccion: storeData.Plaza,
                })
                .eq('id', existingStore.id)
                .select()
                .single();
            store = result.data;
            error = result.error;
        } else {
            // Insert new store (default values will handle created_at and updated_at)
            const result = await supabase
                .from('stores')
                .insert({
                    codigo_tienda: storeData.Codigo,
                    nombre: storeData.Nombre,
                    zona: storeData.Zona,
                    direccion: storeData.Plaza,
                })
                .select()
                .single();
            store = result.data;
            error = result.error;
        }

        if (error) {
            console.error('Error upserting store:', error);
            return Response.json(
                { error: 'Error al guardar la tienda en la base de datos' },
                { status: 500 }
            );
        }

        return Response.json({
            store,
            details: {
                responsable_comercial: storeData['Responsable\n comercial'],
                celular: storeData.Celular,
                encargado_ejecucion: storeData['Encargado Ejecucion\nComercial'],
                movil: storeData.Móvil,
            }
        });
    } catch (error: any) {
        console.error('Store validation error:', error);
        return Response.json(
            { error: error.message || 'Error al validar la tienda' },
            { status: 500 }
        );
    }
}
