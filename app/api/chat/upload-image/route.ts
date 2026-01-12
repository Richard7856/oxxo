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

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const reportId = formData.get('reportId') as string;

        if (!file) {
            return NextResponse.json({ error: 'No se proporcionó un archivo' }, { status: 400 });
        }

        if (!reportId) {
            return NextResponse.json({ error: 'No se proporcionó el ID del reporte' }, { status: 400 });
        }

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 });
        }

        // Validar tamaño (máximo 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'La imagen es demasiado grande (máximo 10MB)' }, { status: 400 });
        }

        // Generar nombre único para el archivo
        const fileExt = file.name.split('.').pop();
        const fileName = `${reportId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `chat-images/${fileName}`;

        // Subir archivo a Supabase Storage
        // Supabase Storage puede trabajar directamente con File/Blob
        const { error: uploadError } = await supabase.storage
            .from('reportes')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type,
            });

        if (uploadError) {
            console.error('Upload Error:', uploadError);
            return NextResponse.json({ error: 'Error al subir la imagen: ' + uploadError.message }, { status: 500 });
        }

        // Obtener URL pública
        const { data: urlData } = supabase.storage
            .from('reportes')
            .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
            return NextResponse.json({ error: 'Error al obtener la URL de la imagen' }, { status: 500 });
        }

        return NextResponse.json({ success: true, url: urlData.publicUrl });
    } catch (error: any) {
        console.error('Error uploading chat image:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
